import { specialQuestion, matchAttempt, SpecialQuestion } from '../question-types/special';
import { MatchProgress } from '../question-types/matching';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ReportModeratedGameScoreDto, SubmitModeratedAnswerDto } from './dto/moderated-session.dto';

type SessionQuestion = { id: string; text: string; itemType: 'question' | 'game'; gameType: string | null; options: string[]; correctAnswer: string; timerSeconds: number | null; special?: SpecialQuestion | null };
// Credits and a first selection are personal; the board itself is shared by
// everyone in a live matching session.
type MatchingGame = { credits: number; selectedCard: number | null };
type SharedMatchingAttempt = { id: string; participantId: string; cards: [number, number]; startedAt: Date; isMatch: boolean };
type SharedMatchingGame = { cards: string[]; columns: number; rows: number; matchedCards: Set<number>; attempt: SharedMatchingAttempt | null };
const MATCHING_SYMBOLS = ['🍎', '🍌', '🍇', '🍓', '🍍', '🍉', '🍒', '🥝', '🍑', '🍐', '🍋', '🍊', '🍈', '🥭', '🍅', '🥕', '🌽', '🥑', '🥦', '🥥', '🍄', '🌶️', '🫐', '🍓‍❄️', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄', '🐝', '🦋', '🐢', '🐬', '🐳', '🦉', '🦜', '🦖', '🌈', '⭐'];
type PointScore = { points: number; streak: number; maxStreak: number; lastAward: { base: number; streak: number; speed: number; total: number } | null };
type Participant = { id: string; clientId: string; name: string; questions: SessionQuestion[]; answers: Map<string, string>; matchProgress: Map<string, MatchProgress>; gameScores: Map<string, number>; pointScore: PointScore; matching: MatchingGame | null; betweenQuestions: boolean; joinedAt: Date; currentQuestionIndex: number; currentQuestionOpenedAt: Date | null; autoAdvanceTimer: NodeJS.Timeout | null; completedAt: Date | null };
type ModeratedSession = {
  id: string;
  pin: string;
  facilitatorToken: string;
  mode: 'classic' | 'facilitated' | 'matching';
  endless: boolean;
  scoringEnabled: boolean;
  currentRoundIndex: number;
  randomizeQuestionOrder: boolean;
  quiz: { title: string; description: string | null; theme: string; matchingPairCount: number; questions: SessionQuestion[] };
  phase: 'lobby' | 'question' | 'complete';
  endedByTeacher: boolean;
  expired: boolean;
  durationSeconds: number;
  endsAt: Date | null;
  lobbyLocked: boolean;
  presentationMode: 'scores' | 'matching';
  matching: SharedMatchingGame | null;
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

  async create(quizId: number, mode: ModeratedSession['mode'] = 'classic', durationSeconds: number, endless = false, scoringEnabled = true) {
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
    const authoredQuestions = quiz.questions.map((question) => {
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
    const activeQuestions = this.questionsForMode(authoredQuestions, mode);
    if (!activeQuestions.length) throw new BadRequestException('Enable at least one question before creating this test');
    if (endless && !activeQuestions.some((item) => item.itemType === 'question')) throw new BadRequestException('Enable at least one question for endless mode');
    const matchingPairCount = quiz.matchingPairCount ?? 6;
    const [matchingColumns, matchingRows] = this.matchingGridDimensions(matchingPairCount);
    const session = {
      id, pin, facilitatorToken, mode, endless, scoringEnabled, currentRoundIndex: -1, randomizeQuestionOrder: quiz.randomizeQuestionOrder,
      quiz: { title: quiz.title, description: quiz.description, theme: quiz.theme, matchingPairCount, questions: authoredQuestions },
      phase: 'lobby', endedByTeacher: false, expired: false, durationSeconds, endsAt: null, lobbyLocked: false, presentationMode: mode === 'matching' ? 'matching' : 'scores',
      matching: mode === 'matching' ? { cards: this.shuffle([...MATCHING_SYMBOLS.slice(0, matchingPairCount), ...MATCHING_SYMBOLS.slice(0, matchingPairCount)], id), columns: matchingColumns, rows: matchingRows, matchedCards: new Set<number>(), attempt: null } : null,
      participants: new Map(), bannedClientIds: new Set(), createdAt: new Date(),
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
      scoringEnabled: session.scoringEnabled,
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
      matching: session.matching && participant?.matching ? this.matchingState(session.matching, participant.matching, participant.id) : null,
      betweenQuestions: participant?.betweenQuestions ?? false,
      currentQuestion: question ? {
        ...this.publicQuestion(question),
        matchProgress: participant?.matchProgress.get(question.id) ?? null,
        number: participant!.currentQuestionIndex + 1,
        total: this.activeQuestions(session).length,
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
      sessionId: session.id, pin: session.pin, title: session.quiz.title, description: session.quiz.description, phase: session.phase, endedByTeacher: session.endedByTeacher, expired: session.expired, endsAt: session.endsAt?.toISOString() ?? null, durationSeconds: session.durationSeconds, lobbyLocked: session.lobbyLocked, presentationMode: session.presentationMode, mode: session.mode, endless: session.endless, scoringEnabled: session.scoringEnabled, currentRound: session.currentRoundIndex + 1,
      questionCount: this.activeQuestions(session).length,
      matching: session.matching ? this.matchingState(session.matching) : null,
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
      scoreLeaderboard: participants
        .map((participant) => {
          const score = this.score(session, participant);
          return { id: participant.id, name: participant.name, score: participant.pointScore.points, correct: score.correct, answered: score.answered, longestStreak: participant.pointScore.maxStreak };
        })
        .sort((a, b) => (session.scoringEnabled ? b.score - a.score : b.correct - a.correct) || a.name.localeCompare(b.name)),
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

  restart(sessionId: string, token: string, mode: ModeratedSession['mode']) {
    const session = this.authorize(sessionId, token);
    if (session.phase !== 'complete') throw new BadRequestException('End the quiz before launching it again');
    const questions = this.questionsForMode(session.quiz.questions, mode);
    if (!questions.length) throw new BadRequestException('There are no available quiz items for this mode');

    session.mode = mode;
    // Facilitated rounds do not support endless play. Other modes retain the
    // session preference from the just-completed quiz.
    session.endless = mode === 'facilitated' ? false : session.endless;
    session.phase = 'question';
    session.endedByTeacher = false;
    session.expired = false;
    session.endsAt = new Date(Date.now() + session.durationSeconds * 1000);
    session.currentRoundIndex = 0;
    session.presentationMode = mode === 'matching' ? 'matching' : 'scores';
    session.matching = mode === 'matching' ? this.newMatchingGame(session.quiz.matchingPairCount, randomUUID()) : null;

    for (const participant of session.participants.values()) {
      this.clearParticipantTimer(participant);
      participant.questions = session.randomizeQuestionOrder ? this.shuffleQuestionsInPlace(questions, []) : [...questions];
      participant.answers = new Map();
      participant.matchProgress = new Map();
      participant.gameScores = new Map();
      participant.pointScore = this.newPointScore();
      participant.matching = mode === 'matching' ? { credits: 0, selectedCard: null } : null;
      participant.betweenQuestions = false;
      participant.currentQuestionIndex = -1;
      participant.currentQuestionOpenedAt = null;
      participant.completedAt = null;
      this.openParticipantQuestion(session, participant);
    }
    return this.facilitatorState(sessionId, token);
  }

  next(sessionId: string, token: string) {
    const session = this.authorize(sessionId, token);
    if (session.mode !== 'facilitated' || session.phase !== 'question') throw new BadRequestException('There is no facilitated round to advance');
    session.currentRoundIndex += 1;
    for (const participant of session.participants.values()) this.openParticipantQuestion(session, participant);
    if (session.currentRoundIndex >= this.activeQuestions(session).length) session.phase = 'complete';
    return this.facilitatorState(sessionId, token);
  }

  updateLobbyLock(sessionId: string, token: string, lobbyLocked: boolean) {
    const session = this.authorize(sessionId, token);
    session.lobbyLocked = lobbyLocked;
    return this.facilitatorState(sessionId, token);
  }

  updatePresentationMode(sessionId: string, token: string, presentationMode: ModeratedSession['presentationMode']) {
    const session = this.authorize(sessionId, token);
    if (presentationMode === 'matching' && !session.matching) throw new BadRequestException('The matching board is only available in Matching mode');
    session.presentationMode = presentationMode;
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
    const questions = this.activeQuestions(session);
    const participant: Participant = { id: randomUUID(), clientId, name: cleanName, questions: session.randomizeQuestionOrder ? this.shuffleQuestionsInPlace(questions, session.participants.values()) : [...questions], answers: new Map<string, string>(), matchProgress: new Map<string, MatchProgress>(), gameScores: new Map<string, number>(), pointScore: this.newPointScore(), matching: session.mode === 'matching' ? { credits: 0, selectedCard: null } : null, betweenQuestions: false, joinedAt: new Date(), currentQuestionIndex: -1, currentQuestionOpenedAt: null, autoAdvanceTimer: null, completedAt: null };
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
    this.awardPoints(session, participant, question, body.answer === question.correctAnswer);
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
    const player = participant.matching;
    const matching = session.matching;
    if (!matching) throw new BadRequestException('The shared matching board is not available');
    this.syncSharedMatching(session);
    if (!Number.isInteger(card) || card < 0 || card >= matching.cards.length) throw new BadRequestException('Choose a card on the board');
    if (matching.attempt) throw new BadRequestException('Wait for the current pair to finish flipping');
    if (matching.matchedCards.has(card)) throw new BadRequestException('That pair has already been matched');
    if (player.selectedCard === null) {
      if (player.credits < 1) throw new BadRequestException('Earn a credit by answering a question correctly');
      player.selectedCard = card;
      return this.matchingState(matching, player);
    }
    if (player.selectedCard === card) throw new BadRequestException('Choose a different card');
    const cards: [number, number] = [player.selectedCard, card];
    const isMatch = matching.cards[cards[0]] === matching.cards[cards[1]];
    matching.attempt = { id: randomUUID(), participantId: participant.id, cards, startedAt: new Date(), isMatch };
    if (!isMatch) player.credits -= 1;
    for (const current of session.participants.values()) if (current.matching) current.matching.selectedCard = null;
    return this.matchingState(matching, player, participant.id);
  }

  nextMatchingQuestion(pin: string, participantId: string) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    if (session.phase !== 'question' || session.mode !== 'matching' || !participant || !participant.betweenQuestions) throw new BadRequestException('There is no next question to start');
    return this.advanceParticipant(session, participant);
  }

  nextQuestion(pin: string, participantId: string) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    if (session.phase !== 'question' || session.mode === 'facilitated' || !participant || participant.completedAt) throw new BadRequestException('There is no next question to start');
    const question = participant.questions[participant.currentQuestionIndex];
    if (!question || (!participant.answers.has(question.id) && !this.hasTimedOut(participant, question))) throw new BadRequestException('Answer the current question before moving on');
    return this.advanceParticipant(session, participant);
  }

  private advanceParticipant(session: ModeratedSession, participant: Participant) {
    participant.betweenQuestions = false;
    if (participant.matching) participant.matching.selectedCard = null;
    this.openParticipantQuestion(session, participant);
    return { advanced: true };
  }

  private matchingState(matching: SharedMatchingGame, player?: MatchingGame, participantId?: string) {
    const selectedCard = player?.selectedCard;
    const visibleAttempt = matching.attempt && (!participantId || matching.attempt.isMatch || matching.attempt.participantId === participantId) ? matching.attempt : null;
    return {
      credits: player?.credits ?? null,
      columns: matching.columns,
      rows: matching.rows,
      selectedCard: selectedCard === null || selectedCard === undefined ? null : { id: selectedCard, symbol: matching.cards[selectedCard] },
      cards: matching.cards.map((symbol, index) => ({ symbol: matching.matchedCards.has(index) ? symbol : null, matched: matching.matchedCards.has(index) })),
      attempt: visibleAttempt ? {
        id: visibleAttempt.id,
        cards: visibleAttempt.cards.map((id) => ({ id, symbol: matching.cards[id] })),
        startedAt: visibleAttempt.startedAt.toISOString(),
        isMatch: visibleAttempt.isMatch,
        isActor: visibleAttempt.participantId === participantId,
      } : null,
    };
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
    this.syncSharedMatching(session);
    if (session.phase === 'question' && session.endsAt && Date.now() >= session.endsAt.getTime()) {
      session.phase = 'complete';
      session.expired = true;
      for (const participant of session.participants.values()) this.clearParticipantTimer(participant);
    }
  }

  private syncSharedMatching(session: ModeratedSession) {
    const matching = session.matching;
    // Hold the result long enough for the projector's polling view to play the
    // first flip, second flip, and resolution as one shared event.
    if (!matching?.attempt || Date.now() - matching.attempt.startedAt.getTime() < 2600) return;
    if (matching.attempt.isMatch) {
      matching.matchedCards.add(matching.attempt.cards[0]);
      matching.matchedCards.add(matching.attempt.cards[1]);
    }
    matching.attempt = null;
  }

  private matchingGridDimensions(pairCount: number): [number, number] {
    if (pairCount === 2) return [2, 2];
    if (pairCount === 4) return [4, 2];
    if (pairCount === 6) return [4, 3];
    if (pairCount === 8) return [4, 4];
    if (pairCount === 18) return [6, 6];
    if (pairCount === 32) return [8, 8];
    if (pairCount === 50) return [10, 10];
    return [4, 3];
  }

  private questionsForMode(questions: SessionQuestion[], mode: ModeratedSession['mode']) {
    return mode === 'matching' ? questions.filter((item) => item.itemType === 'question') : questions;
  }

  private activeQuestions(session: ModeratedSession) {
    return this.questionsForMode(session.quiz.questions, session.mode);
  }

  private newPointScore(): PointScore {
    return { points: 0, streak: 0, maxStreak: 0, lastAward: null };
  }

  private newMatchingGame(pairCount: number, seed: string): SharedMatchingGame {
    const [columns, rows] = this.matchingGridDimensions(pairCount);
    return {
      cards: this.shuffle([...MATCHING_SYMBOLS.slice(0, pairCount), ...MATCHING_SYMBOLS.slice(0, pairCount)], seed),
      columns,
      rows,
      matchedCards: new Set<number>(),
      attempt: null,
    };
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
    return session.scoringEnabled ? { correct, answered, points: participant.pointScore.points, streak: participant.pointScore.streak, lastAward: participant.pointScore.lastAward } : { correct, answered };
  }

  private awardPoints(session: ModeratedSession, participant: Participant, question: SessionQuestion, isCorrect: boolean) {
    if (!isCorrect) {
      participant.pointScore.streak = 0;
      participant.pointScore.lastAward = null;
      return;
    }

    participant.pointScore.streak += 1;
    participant.pointScore.maxStreak = Math.max(participant.pointScore.maxStreak, participant.pointScore.streak);
    if (!session.scoringEnabled) return;
    const base = 100;
    const streak = Math.min((participant.pointScore.streak - 1) * 25, 100);
    const openedAt = participant.currentQuestionOpenedAt?.getTime() ?? Date.now();
    // Timed questions use their configured duration; untimed questions use a fair 30-second speed window.
    const speedWindowMs = (question.timerSeconds ?? 30) * 1000;
    const speed = Math.min(100, Math.max(0, Math.round(100 * Math.max(0, speedWindowMs - (Date.now() - openedAt)) / speedWindowMs)));
    const total = base + streak + speed;
    participant.pointScore.points += total;
    participant.pointScore.lastAward = { base, streak, speed, total };
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
      this.onParticipantQuestionTimedOut(session, participant, question);
    };
    participant.autoAdvanceTimer = setTimeout(run, Math.max(0, endsAt.getTime() - Date.now()) + 10);
  }

  private clearParticipantTimer(participant: Participant) {
    if (!participant.autoAdvanceTimer) return;
    clearTimeout(participant.autoAdvanceTimer);
    participant.autoAdvanceTimer = null;
  }

  private onParticipantQuestionTimedOut(session: ModeratedSession, participant: Participant, question: SessionQuestion) {
    if (session.mode === 'matching' || question.itemType === 'game') {
      participant.betweenQuestions = true;
      return;
    }
    this.openParticipantQuestion(session, participant);
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
