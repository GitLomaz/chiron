import { specialQuestion, matchAttempt, SpecialQuestion } from '../question-types/special';
import { MatchProgress } from '../question-types/matching';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ReportModeratedGameScoreDto, SubmitModeratedAnswerDto } from './dto/moderated-session.dto';

type SessionQuestion = { id: string; text: string; itemType: 'question' | 'game'; gameType: string | null; options: string[]; correctAnswer: string; timerSeconds: number | null; special?: SpecialQuestion | null };
type MatchingGame = { credits: number; cards: string[]; matchedCards: Set<number>; openCards: number[] };
type Participant = { id: string; clientId: string; name: string; questions: SessionQuestion[]; answers: Map<string, string>; matchProgress: Map<string, MatchProgress>; gameScores: Map<string, number>; matching: MatchingGame | null; betweenQuestions: boolean; joinedAt: Date; currentQuestionIndex: number; currentQuestionOpenedAt: Date | null; autoAdvanceTimer: NodeJS.Timeout | null; completedAt: Date | null };
type ModeratedSession = {
  id: string;
  pin: string;
  facilitatorToken: string;
  mode: 'classic' | 'facilitated' | 'matching';
  endless: boolean;
  currentRoundIndex: number;
  randomizeQuestionOrder: boolean;
  quiz: { title: string; description: string | null; theme: string; questions: SessionQuestion[] };
  phase: 'lobby' | 'question' | 'complete';
  endedByTeacher: boolean;
  expired: boolean;
  durationSeconds: number;
  endsAt: Date | null;
  lobbyLocked: boolean;
  participants: Map<string, Participant>;
  bannedClientIds: Set<string>;
  createdAt: Date;
};

@Injectable()
export class ModeratedService {
  private readonly sessions = new Map<string, ModeratedSession>();
  private readonly sessionsByPin = new Map<string, ModeratedSession>();

  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return [...this.sessions.values()].filter((session) => {
      this.expire(session);
      return session.phase !== 'complete';
    }).map((session) => ({
      sessionId: session.id, title: session.quiz.title, pin: session.pin,
      mode: session.mode, phase: session.phase, participantCount: session.participants.size,
      createdAt: session.createdAt.toISOString(), endsAt: session.endsAt?.toISOString() ?? null,
    }));
  }

  async create(quizId: number, mode: ModeratedSession['mode'] = 'classic', durationSeconds: number, endless = false) {
    if (endless && mode === 'facilitated') throw new BadRequestException('Endless mode is not available for facilitated tests');
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { where: { isEnabled: true, OR: [{ itemType: 'question' }, { itemType: 'game', gameType: { in: ['coin_catch', 'match_pairs', 'tower_stack'] } }] }, orderBy: { position: 'asc' } } },
    });
    if (!quiz) throw new NotFoundException(`Quiz ${quizId} was not found`);
    if (!quiz.questions.length) throw new BadRequestException('Enable at least one question before creating a moderated test');

    const id = randomUUID();
    const facilitatorToken = randomUUID();
    const pin = this.createPin();
    const authoredQuestions = quiz.questions.filter((question) => mode !== 'matching' || question.itemType === 'question').map((question) => {
      if (question.itemType === 'game') return { id: String(question.id), text: question.text, itemType: 'game' as const, gameType: question.gameType, correctAnswer: '', options: [], timerSeconds: question.gameDurationSeconds ?? 20 };
      const special = specialQuestion(question.options);
      const options = Array.isArray(question.options) ? question.options.filter((value): value is string => typeof value === 'string') : [];
      const wrongAnswers = [...new Set(options.filter((option) => option !== question.correctAnswer))];
      const count = Math.min(question.answerCount ?? wrongAnswers.length + 1, wrongAnswers.length + 1);
      // Every participant sees the same frozen options, and the correct option
      // is always included even when a question draws only part of an answer pool.
      return {
        id: String(question.id), text: question.text, special,
        itemType: 'question' as const, gameType: null,
        correctAnswer: question.correctAnswer,
        timerSeconds: this.effectiveTimer(question.timerSeconds, quiz.defaultTimerSeconds),
        options: special?.kind === 'true_false' ? ['True', 'False'] : special?.kind === 'matching' ? [] : this.shuffle([question.correctAnswer, ...this.shuffle(wrongAnswers, `${id}-${question.id}-wrong`).slice(0, count - 1)], `${id}-${question.id}`),
      };
    });
    if (!authoredQuestions.length) throw new BadRequestException('Enable at least one question before creating this test');
    if (endless && !authoredQuestions.some((item) => item.itemType === 'question')) throw new BadRequestException('Enable at least one question for endless mode');
    const session = {
      id, pin, facilitatorToken, mode, endless, currentRoundIndex: -1, randomizeQuestionOrder: quiz.randomizeQuestionOrder,
      quiz: { title: quiz.title, description: quiz.description, theme: quiz.theme, questions: authoredQuestions },
      phase: 'lobby', endedByTeacher: false, expired: false, durationSeconds, endsAt: null, lobbyLocked: false, participants: new Map(), bannedClientIds: new Set(), createdAt: new Date(),
    } satisfies ModeratedSession;
    this.sessions.set(id, session);
    this.sessionsByPin.set(pin, session);
    return { sessionId: id, facilitatorToken, pin, phase: 'lobby' as const };
  }

  studentState(pin: string, participantId?: string, clientId?: string) {
    const session = this.getByPin(pin);
    const participant = participantId ? session.participants.get(participantId) : undefined;
    const question = session.phase === 'question' && participant && !participant.completedAt ? participant.questions[participant.currentQuestionIndex] : undefined;
    const answer = question && participant ? participant.answers.get(question.id) : undefined;
    return {
      pin: session.pin,
      mode: session.mode,
      endless: session.endless,
      title: session.quiz.title,
      description: session.quiz.description,
      theme: session.quiz.theme,
      phase: participant?.completedAt ? 'complete' : session.phase,
      endedByTeacher: session.endedByTeacher,
      expired: session.expired,
      endsAt: session.endsAt?.toISOString() ?? null,
      removed: Boolean(clientId && session.bannedClientIds.has(clientId)),
      participant: participant ? { id: participant.id, name: participant.name } : null,
      score: participant ? this.score(session, participant) : null,
      matching: participant?.matching ? this.matchingState(participant.matching) : null,
      betweenQuestions: participant?.betweenQuestions ?? false,
      currentQuestion: question ? {
        ...this.publicQuestion(question),
        matchProgress: participant?.matchProgress.get(question.id) ?? null,
        number: participant!.currentQuestionIndex + 1,
        total: session.quiz.questions.length,
        answered: answer !== undefined,
        gameScore: question.itemType === 'game' && participant ? participant.gameScores.get(question.id) ?? 0 : null,
        result: answer === undefined ? null : { answer, correctAnswer: question.correctAnswer, isCorrect: answer === question.correctAnswer },
        timedOut: answer === undefined && this.hasTimedOut(participant!, question),
        timerEndsAt: answer === undefined ? this.timerEndsAt(participant!, question)?.toISOString() ?? null : null,
      } : null,
    };
  }

  facilitatorState(sessionId: string, token: string) {
    const session = this.authorize(sessionId, token);
    const participants = [...session.participants.values()];
    return {
      sessionId: session.id, pin: session.pin, title: session.quiz.title, description: session.quiz.description, phase: session.phase, endedByTeacher: session.endedByTeacher, expired: session.expired, endsAt: session.endsAt?.toISOString() ?? null, durationSeconds: session.durationSeconds, lobbyLocked: session.lobbyLocked, mode: session.mode, endless: session.endless, currentRound: session.currentRoundIndex + 1,
      questionCount: session.quiz.questions.length,
      completedCount: participants.filter((participant) => participant.completedAt !== null).length,
      participants: participants.map((participant) => ({
        id: participant.id,
        name: participant.name,
        completed: participant.completedAt !== null,
        completedItems: Math.max(0, participant.currentQuestionIndex),
        currentItemType: participant.completedAt || participant.currentQuestionIndex < 0 ? null : participant.questions[participant.currentQuestionIndex].itemType,
        currentAnswered: participant.currentQuestionIndex >= 0 && participant.currentQuestionIndex < participant.questions.length && participant.answers.has(participant.questions[participant.currentQuestionIndex].id),
        score: this.score(session, participant),
      })),
      gameLeaderboard: participants
        .filter((participant) => participant.gameScores.size > 0 || (!participant.completedAt && participant.currentQuestionIndex >= 0 && participant.questions[participant.currentQuestionIndex]?.itemType === 'game'))
        .map((participant) => ({ id: participant.id, name: participant.name, score: [...participant.gameScores.values()].reduce((sum, score) => sum + score, 0) }))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)),
    };
  }

  start(sessionId: string, token: string) {
    const session = this.authorize(sessionId, token);
    if (session.phase !== 'lobby') throw new BadRequestException('This test has already started');
    session.phase = 'question';
    session.endsAt = new Date(Date.now() + session.durationSeconds * 1000);
    session.currentRoundIndex = 0;
    for (const participant of session.participants.values()) this.openParticipantQuestion(session, participant);
    return this.facilitatorState(sessionId, token);
  }

  end(sessionId: string, token: string) {
    const session = this.authorize(sessionId, token);
    if (session.phase !== 'complete') {
      session.phase = 'complete';
      session.endedByTeacher = true;
      for (const participant of session.participants.values()) this.clearParticipantTimer(participant);
    }
    return this.facilitatorState(sessionId, token);
  }

  next(sessionId: string, token: string) {
    const session = this.authorize(sessionId, token);
    if (session.mode !== 'facilitated' || session.phase !== 'question') throw new BadRequestException('There is no facilitated round to advance');
    session.currentRoundIndex += 1;
    for (const participant of session.participants.values()) this.openParticipantQuestion(session, participant);
    if (session.currentRoundIndex >= session.quiz.questions.length) session.phase = 'complete';
    return this.facilitatorState(sessionId, token);
  }

  updateLobbyLock(sessionId: string, token: string, lobbyLocked: boolean) {
    const session = this.authorize(sessionId, token);
    session.lobbyLocked = lobbyLocked;
    return this.facilitatorState(sessionId, token);
  }

  removeParticipant(sessionId: string, token: string, participantId: string) {
    const session = this.authorize(sessionId, token);
    const participant = session.participants.get(participantId);
    if (!participant) throw new NotFoundException('That participant is no longer in this test');
    session.bannedClientIds.add(participant.clientId);
    this.clearParticipantTimer(participant);
    session.participants.delete(participantId);
    this.completeSessionIfFinished(session);
    return this.facilitatorState(sessionId, token);
  }

  join(pin: string, name: string, clientId: string) {
    const session = this.getByPin(pin);
    const cleanName = name.trim();
    if (!cleanName) throw new BadRequestException('Enter your name to join');
    if (session.phase === 'complete') throw new BadRequestException('This moderated test has ended');
    if (session.lobbyLocked) throw new BadRequestException('The facilitator has locked this lobby');
    if (session.bannedClientIds.has(clientId)) throw new ForbiddenException('You have been removed from this live test');
    const participant: Participant = { id: randomUUID(), clientId, name: cleanName, questions: session.randomizeQuestionOrder ? this.shuffleQuestionsInPlace(session.quiz.questions, session.participants.values()) : [...session.quiz.questions], answers: new Map<string, string>(), matchProgress: new Map<string, MatchProgress>(), gameScores: new Map<string, number>(), matching: session.mode === 'matching' ? { credits: 0, cards: this.shuffle(['🍎', '🍌', '🍇', '🍓', '🍍', '🍉', '🍎', '🍌', '🍇', '🍓', '🍍', '🍉'], randomUUID()), matchedCards: new Set<number>(), openCards: [] } : null, betweenQuestions: false, joinedAt: new Date(), currentQuestionIndex: -1, currentQuestionOpenedAt: null, autoAdvanceTimer: null, completedAt: null };
    session.participants.set(participant.id, participant);
    if (session.phase === 'question') {
      if (session.mode === 'facilitated') participant.currentQuestionIndex = session.currentRoundIndex - 1;
      this.openParticipantQuestion(session, participant);
    }
    return { participantId: participant.id, name: participant.name };
  }

  submitAnswer(pin: string, body: SubmitModeratedAnswerDto) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(body.participantId);
    if (!participant) throw new NotFoundException('Your participant session could not be found. Please join again.');
    if (session.phase !== 'question' || participant.completedAt) throw new BadRequestException('There is no active question');
    const question = participant.questions[participant.currentQuestionIndex];
    if (question.itemType !== 'question') throw new BadRequestException('This round is a game, not a question');
    if (body.questionId !== question.id) throw new BadRequestException('That question is no longer active');
    if (this.hasTimedOut(participant, question)) throw new BadRequestException('Time has expired for this question');
    if (question.special?.kind === 'matching') {
      if (participant.answers.has(question.id)) throw new BadRequestException('You have already answered this question');
      const progress = matchAttempt(question.special.pairs, participant.matchProgress.get(question.id), body.answer);
      if (!progress) throw new BadRequestException('Choose one item from each column');
      participant.matchProgress.set(question.id, progress);
      if (progress.mistakes < 3 && progress.matched.length < question.special.pairs.length) return { answered: false, matchProgress: progress };
      body.answer = progress.matched.length === question.special.pairs.length ? 'Matched' : 'Not matched';
    } else if (!question.options.includes(body.answer)) throw new BadRequestException('Choose one of the available answers');
    if (participant.answers.has(question.id)) throw new BadRequestException('You have already answered this question');
    participant.answers.set(question.id, body.answer);
    if (participant.matching) {
      const correct = this.score(session, participant).correct;
      if (body.answer === question.correctAnswer && (correct === 1 || correct % 3 === 0)) participant.matching.credits += 1;
      participant.betweenQuestions = true;
      this.clearParticipantTimer(participant);
    } else if (session.mode !== 'facilitated') {
      this.clearParticipantTimer(participant);
      const questionIndex = participant.currentQuestionIndex;
      participant.autoAdvanceTimer = setTimeout(() => {
        this.expire(session);
        if (session.phase === 'question' && session.participants.get(participant.id) === participant && participant.currentQuestionIndex === questionIndex) {
          this.openParticipantQuestion(session, participant);
        }
      }, 5000);
    }
    return { answered: true };
  }

  flipMatchingCard(pin: string, participantId: string, card: number) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    if (session.phase !== 'question' || !participant?.matching || !participant.betweenQuestions) throw new BadRequestException('Matching is available between questions');
    const matching = participant.matching;
    if (matching.credits < 1) throw new BadRequestException('Earn a credit by answering a question correctly');
    if (matching.openCards.length === 2) matching.openCards = [];
    if (matching.matchedCards.has(card) || matching.openCards.includes(card)) throw new BadRequestException('Choose a different card');
    matching.openCards.push(card);
    if (matching.openCards.length === 2) {
      const [first, second] = matching.openCards;
      if (matching.cards[first] === matching.cards[second]) {
        matching.matchedCards.add(first); matching.matchedCards.add(second); matching.openCards = [];
      } else matching.credits -= 1;
    }
    return this.matchingState(matching);
  }

  nextMatchingQuestion(pin: string, participantId: string) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    if (session.phase !== 'question' || session.mode !== 'matching' || !participant || !participant.betweenQuestions) throw new BadRequestException('There is no next question to start');
    participant.betweenQuestions = false;
    this.openParticipantQuestion(session, participant);
    return { advanced: true };
  }

  private matchingState(matching: MatchingGame) {
    return { credits: matching.credits, cards: matching.cards.map((symbol, index) => ({ symbol: matching.matchedCards.has(index) || matching.openCards.includes(index) ? symbol : null, matched: matching.matchedCards.has(index) })) };
  }

  reportGameScore(pin: string, body: ReportModeratedGameScoreDto) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(body.participantId);
    if (!participant) throw new NotFoundException('Your participant session could not be found. Please join again.');
    if (session.phase !== 'question' || participant.completedAt) throw new BadRequestException('There is no active game');
    const question = participant.questions[participant.currentQuestionIndex];
    if (question.itemType !== 'game' || question.gameType !== 'coin_catch' || body.questionId !== question.id) throw new BadRequestException('That game is no longer active');
    if (this.hasTimedOut(participant, question)) throw new BadRequestException('Time has expired for this game');
    participant.gameScores.set(question.id, body.score);
    return { score: body.score };
  }

  private get(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new NotFoundException('That moderated test is no longer available');
    this.expire(session);
    return session;
  }

  private getByPin(pin: string) {
    const session = this.sessionsByPin.get(pin);
    if (!session) throw new NotFoundException('That moderated test is no longer available');
    this.expire(session);
    return session;
  }

  private expire(session: ModeratedSession) {
    if (session.phase === 'question' && session.endsAt && Date.now() >= session.endsAt.getTime()) {
      session.phase = 'complete';
      session.expired = true;
      for (const participant of session.participants.values()) this.clearParticipantTimer(participant);
    }
  }

  private createPin() {
    for (let attempts = 0; attempts < 100; attempts += 1) {
      const pin = String(randomInt(1_000_000)).padStart(6, '0');
      if (!this.sessionsByPin.has(pin)) return pin;
    }
    throw new BadRequestException('Could not create a unique join PIN. Please try again.');
  }

  private authorize(sessionId: string, token: string) {
    const session = this.get(sessionId);
    if (!token || session.facilitatorToken !== token) throw new ForbiddenException('That facilitator code is not valid');
    return session;
  }

  private effectiveTimer(questionTimerSeconds: number | null, defaultTimerSeconds: number) {
    const value = questionTimerSeconds ?? defaultTimerSeconds;
    return value === -1 || value === null ? null : value;
  }

  private publicQuestion(question: SessionQuestion) {
    return { id: question.id, text: question.text, itemType: question.itemType, gameType: question.gameType, options: question.options, special: question.special, timerSeconds: question.timerSeconds };
  }

  private score(session: ModeratedSession, participant: Participant) {
    let correct = 0;
    let answered = 0;
    for (const question of participant.questions) {
      const answer = participant.answers.get(question.id);
      if (answer === undefined) continue;
      answered += 1;
      if (answer === question.correctAnswer) correct += 1;
    }
    return { correct, answered };
  }

  private timerEndsAt(participant: Participant, question: SessionQuestion) {
    if (question.timerSeconds === null || !participant.currentQuestionOpenedAt) return null;
    return new Date(participant.currentQuestionOpenedAt.getTime() + (question.timerSeconds * 1000));
  }

  private hasTimedOut(participant: Participant, question: SessionQuestion) {
    const endsAt = this.timerEndsAt(participant, question);
    return endsAt !== null && endsAt.getTime() <= Date.now();
  }

  private openParticipantQuestion(session: ModeratedSession, participant: Participant) {
    this.clearParticipantTimer(participant);
    participant.currentQuestionIndex += 1;
    if (participant.currentQuestionIndex >= participant.questions.length) {
      if (session.endless) {
        const questions = session.quiz.questions.filter((item) => item.itemType === 'question');
        participant.questions.push(...this.shuffle(questions, randomUUID()).map((question) => ({ ...question, id: randomUUID() })));
      } else {
      participant.completedAt = new Date();
      participant.currentQuestionOpenedAt = null;
      this.completeSessionIfFinished(session);
      return;
      }
    }

    participant.currentQuestionOpenedAt = new Date();
    const question = participant.questions[participant.currentQuestionIndex];
    const endsAt = this.timerEndsAt(participant, question);
    if (!endsAt || session.mode === 'facilitated') return;
    const questionIndex = participant.currentQuestionIndex;
    const run = () => {
      this.expire(session);
      if (session.phase !== 'question' || session.participants.get(participant.id) !== participant || participant.currentQuestionIndex !== questionIndex) return;
      if (!this.hasTimedOut(participant, question)) {
        participant.autoAdvanceTimer = setTimeout(run, Math.max(0, endsAt.getTime() - Date.now()) + 10);
        return;
      }
      if (session.mode === 'matching') participant.betweenQuestions = true;
      else this.openParticipantQuestion(session, participant);
    };
    participant.autoAdvanceTimer = setTimeout(run, Math.max(0, endsAt.getTime() - Date.now()) + 10);
  }

  private clearParticipantTimer(participant: Participant) {
    if (!participant.autoAdvanceTimer) return;
    clearTimeout(participant.autoAdvanceTimer);
    participant.autoAdvanceTimer = null;
  }

  private completeSessionIfFinished(session: ModeratedSession) {
    if (session.mode !== 'facilitated' && session.phase === 'question' && session.participants.size > 0
      && [...session.participants.values()].every((participant) => participant.completedAt !== null)) {
      session.phase = 'complete';
    }
  }

  private shuffleQuestionsInPlace(items: SessionQuestion[], participants: Iterable<Participant>) {
    const questions = items.filter((item) => item.itemType === 'question');
    for (let index = questions.length - 1; index > 0; index -= 1) {
      const randomIndex = randomInt(index + 1);
      [questions[index], questions[randomIndex]] = [questions[randomIndex], questions[index]];
    }
    const orderKey = (order: SessionQuestion[]) => order.filter((item) => item.itemType === 'question').map((item) => item.id).join(',');
    const usedOrders = new Set([...participants].map((participant) => orderKey(participant.questions)));
    // Prefer an unused permutation while one exists, including for short quizzes.
    for (let attempt = 0; attempt < usedOrders.size && usedOrders.has(orderKey(questions)); attempt += 1) {
      let pivot = questions.length - 2;
      while (pivot >= 0 && questions[pivot].id >= questions[pivot + 1].id) pivot -= 1;
      if (pivot < 0) {
        questions.reverse();
      } else {
        let successor = questions.length - 1;
        while (questions[successor].id <= questions[pivot].id) successor -= 1;
        [questions[pivot], questions[successor]] = [questions[successor], questions[pivot]];
        const suffix = questions.splice(pivot + 1).reverse();
        questions.push(...suffix);
      }
    }
    let questionIndex = 0;
    return items.map((item) => item.itemType === 'question' ? questions[questionIndex++] : item);
  }

  private shuffle<T>(items: T[], seed: string) {
    let value = [...seed].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 0) || 1;
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      value = (value * 1664525 + 1013904223) >>> 0;
      const next = value % (index + 1);
      [result[index], result[next]] = [result[next], result[index]];
    }
    return result;
  }
}
