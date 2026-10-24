import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ReportModeratedGameScoreDto, SubmitModeratedAnswerDto } from './dto/moderated-session.dto';

type SessionQuestion = { id: string; text: string; itemType: 'question' | 'game'; gameType: string | null; options: string[]; correctAnswer: string; timerSeconds: number | null };
type Participant = { id: string; name: string; answers: Map<string, string>; gameScores: Map<string, number>; joinedAt: Date };
type ModeratedSession = {
  id: string;
  pin: string;
  facilitatorToken: string;
  quiz: { title: string; description: string | null; theme: string; questions: SessionQuestion[] };
  phase: 'lobby' | 'question' | 'complete';
  currentQuestionIndex: number;
  currentQuestionOpenedAt: Date | null;
  autoAdvanceOnTimeout: boolean;
  autoAdvanceTimer: NodeJS.Timeout | null;
  participants: Map<string, Participant>;
  createdAt: Date;
};

@Injectable()
export class ModeratedService {
  private readonly sessions = new Map<string, ModeratedSession>();
  private readonly sessionsByPin = new Map<string, ModeratedSession>();

  constructor(private readonly prisma: PrismaService) {}

  async create(quizId: number) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { where: { isEnabled: true, OR: [{ itemType: 'question' }, { itemType: 'game', gameType: 'coin_catch' }] }, orderBy: { position: 'asc' } } },
    });
    if (!quiz) throw new NotFoundException(`Quiz ${quizId} was not found`);
    if (!quiz.questions.length) throw new BadRequestException('Enable at least one question before creating a moderated test');

    const id = randomUUID();
    const facilitatorToken = randomUUID();
    const pin = this.createPin();
    const questions = quiz.questions.map((question) => {
      if (question.itemType === 'game') return { id: String(question.id), text: question.text, itemType: 'game' as const, gameType: question.gameType, correctAnswer: '', options: [], timerSeconds: question.gameDurationSeconds ?? 20 };
      const options = Array.isArray(question.options) ? question.options.filter((value): value is string => typeof value === 'string') : [];
      const wrongAnswers = [...new Set(options.filter((option) => option !== question.correctAnswer))];
      const count = Math.min(question.answerCount ?? wrongAnswers.length + 1, wrongAnswers.length + 1);
      // Every participant sees the same frozen options, and the correct option
      // is always included even when a question draws only part of an answer pool.
      return {
        id: String(question.id), text: question.text,
        itemType: 'question' as const, gameType: null,
        correctAnswer: question.correctAnswer,
        timerSeconds: this.effectiveTimer(question.timerSeconds, quiz.defaultTimerSeconds),
        options: this.shuffle([question.correctAnswer, ...this.shuffle(wrongAnswers, `${id}-${question.id}-wrong`).slice(0, count - 1)], `${id}-${question.id}`),
      };
    });
    const session = {
      id, pin, facilitatorToken,
      quiz: { title: quiz.title, description: quiz.description, theme: quiz.theme, questions },
      phase: 'lobby', currentQuestionIndex: -1, currentQuestionOpenedAt: null, autoAdvanceOnTimeout: false, autoAdvanceTimer: null, participants: new Map(), createdAt: new Date(),
    } satisfies ModeratedSession;
    this.sessions.set(id, session);
    this.sessionsByPin.set(pin, session);
    return { sessionId: id, facilitatorToken, pin, phase: 'lobby' as const };
  }

  studentState(pin: string, participantId?: string) {
    const session = this.getByPin(pin);
    const participant = participantId ? session.participants.get(participantId) : undefined;
    const question = session.phase === 'question' ? session.quiz.questions[session.currentQuestionIndex] : undefined;
    const answer = question && participant ? participant.answers.get(question.id) : undefined;
    return {
      pin: session.pin,
      title: session.quiz.title,
      description: session.quiz.description,
      theme: session.quiz.theme,
      phase: session.phase,
      participant: participant ? { id: participant.id, name: participant.name } : null,
      score: participant ? this.score(session, participant) : null,
      currentQuestion: question ? {
        ...this.publicQuestion(question),
        number: session.currentQuestionIndex + 1,
        total: session.quiz.questions.length,
        answered: answer !== undefined,
        gameScore: question.itemType === 'game' && participant ? participant.gameScores.get(question.id) ?? 0 : null,
        result: answer === undefined ? null : { answer, correctAnswer: question.correctAnswer, isCorrect: answer === question.correctAnswer },
        timedOut: this.hasTimedOut(session, question),
        timerEndsAt: this.timerEndsAt(session, question)?.toISOString() ?? null,
      } : null,
    };
  }

  facilitatorState(sessionId: string, token: string) {
    const session = this.authorize(sessionId, token);
    const currentQuestion = session.phase === 'question' ? session.quiz.questions[session.currentQuestionIndex] : null;
    const nextQuestion = session.phase === 'lobby'
      ? session.quiz.questions[0]
      : session.quiz.questions[session.currentQuestionIndex + 1] ?? null;
    const answered = currentQuestion && currentQuestion.itemType === 'question' ? [...session.participants.values()].filter((participant) => participant.answers.has(currentQuestion.id)).length : 0;
    return {
      sessionId: session.id, pin: session.pin, title: session.quiz.title, description: session.quiz.description, phase: session.phase, autoAdvanceOnTimeout: session.autoAdvanceOnTimeout,
      questionCount: session.quiz.questions.length, currentQuestion: currentQuestion ? { ...this.publicQuestion(currentQuestion), number: session.currentQuestionIndex + 1, timerEndsAt: this.timerEndsAt(session, currentQuestion)?.toISOString() ?? null } : null,
      nextQuestion: nextQuestion ? { ...this.publicQuestion(nextQuestion), number: session.phase === 'lobby' ? 1 : session.currentQuestionIndex + 2 } : null,
      participants: [...session.participants.values()].map((participant) => ({
        id: participant.id,
        name: participant.name,
        answeredCurrentQuestion: currentQuestion ? participant.answers.has(currentQuestion.id) : false,
        score: this.score(session, participant),
      })),
      answeredCount: answered,
      gameLeaderboard: currentQuestion?.itemType === 'game' ? [...session.participants.values()].map((participant) => ({ id: participant.id, name: participant.name, score: participant.gameScores.get(currentQuestion.id) ?? 0 })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)) : null,
    };
  }

  start(sessionId: string, token: string) {
    const session = this.authorize(sessionId, token);
    if (session.phase !== 'lobby') throw new BadRequestException('This test has already started');
    session.phase = 'question';
    session.currentQuestionIndex = 0;
    session.currentQuestionOpenedAt = new Date();
    this.scheduleAutoAdvance(session);
    return this.facilitatorState(sessionId, token);
  }

  next(sessionId: string, token: string) {
    const session = this.authorize(sessionId, token);
    if (session.phase !== 'question') throw new BadRequestException('Start the test before moving to a question');
    this.advance(session);
    return this.facilitatorState(sessionId, token);
  }

  updateSettings(sessionId: string, token: string, autoAdvanceOnTimeout: boolean) {
    const session = this.authorize(sessionId, token);
    session.autoAdvanceOnTimeout = autoAdvanceOnTimeout;
    this.scheduleAutoAdvance(session);
    return this.facilitatorState(sessionId, token);
  }

  join(pin: string, name: string) {
    const session = this.getByPin(pin);
    const cleanName = name.trim();
    if (!cleanName) throw new BadRequestException('Enter your name to join');
    if (session.phase === 'complete') throw new BadRequestException('This moderated test has ended');
    const participant = { id: randomUUID(), name: cleanName, answers: new Map<string, string>(), gameScores: new Map<string, number>(), joinedAt: new Date() };
    session.participants.set(participant.id, participant);
    return { participantId: participant.id, name: participant.name };
  }

  submitAnswer(pin: string, body: SubmitModeratedAnswerDto) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(body.participantId);
    if (!participant) throw new NotFoundException('Your participant session could not be found. Please join again.');
    if (session.phase !== 'question') throw new BadRequestException('Wait for the facilitator to open a question');
    const question = session.quiz.questions[session.currentQuestionIndex];
    if (question.itemType !== 'question') throw new BadRequestException('This round is a game, not a question');
    if (body.questionId !== question.id) throw new BadRequestException('That question is no longer active');
    if (this.hasTimedOut(session, question)) throw new BadRequestException('Time has expired for this question');
    if (!question.options.includes(body.answer)) throw new BadRequestException('Choose one of the available answers');
    participant.answers.set(question.id, body.answer);
    return { answered: true };
  }

  reportGameScore(pin: string, body: ReportModeratedGameScoreDto) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(body.participantId);
    if (!participant) throw new NotFoundException('Your participant session could not be found. Please join again.');
    if (session.phase !== 'question') throw new BadRequestException('Wait for the facilitator to open a game');
    const question = session.quiz.questions[session.currentQuestionIndex];
    if (question.itemType !== 'game' || question.gameType !== 'coin_catch' || body.questionId !== question.id) throw new BadRequestException('That game is no longer active');
    if (this.hasTimedOut(session, question)) throw new BadRequestException('Time has expired for this game');
    participant.gameScores.set(question.id, body.score);
    return { score: body.score };
  }

  private get(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new NotFoundException('That moderated test is no longer available');
    return session;
  }

  private getByPin(pin: string) {
    const session = this.sessionsByPin.get(pin);
    if (!session) throw new NotFoundException('That moderated test is no longer available');
    return session;
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
    return { id: question.id, text: question.text, itemType: question.itemType, gameType: question.gameType, options: question.options, timerSeconds: question.timerSeconds };
  }

  private score(session: ModeratedSession, participant: Participant) {
    let correct = 0;
    let answered = 0;
    for (const question of session.quiz.questions) {
      const answer = participant.answers.get(question.id);
      if (answer === undefined) continue;
      answered += 1;
      if (answer === question.correctAnswer) correct += 1;
    }
    return { correct, answered };
  }

  private timerEndsAt(session: ModeratedSession, question: SessionQuestion) {
    if (question.timerSeconds === null || !session.currentQuestionOpenedAt) return null;
    return new Date(session.currentQuestionOpenedAt.getTime() + (question.timerSeconds * 1000));
  }

  private hasTimedOut(session: ModeratedSession, question: SessionQuestion) {
    const endsAt = this.timerEndsAt(session, question);
    return endsAt !== null && endsAt.getTime() <= Date.now();
  }

  private advance(session: ModeratedSession) {
    this.clearAutoAdvanceTimer(session);
    if (session.currentQuestionIndex >= session.quiz.questions.length - 1) {
      session.phase = 'complete';
      return;
    }
    session.currentQuestionIndex += 1;
    session.currentQuestionOpenedAt = new Date();
    this.scheduleAutoAdvance(session);
  }

  private scheduleAutoAdvance(session: ModeratedSession) {
    this.clearAutoAdvanceTimer(session);
    if (!session.autoAdvanceOnTimeout || session.phase !== 'question') return;
    const question = session.quiz.questions[session.currentQuestionIndex];
    const endsAt = this.timerEndsAt(session, question);
    if (!endsAt) return;
    const questionId = question.id;
    const run = () => {
      if (session.phase !== 'question' || session.quiz.questions[session.currentQuestionIndex]?.id !== questionId) return;
      if (!this.hasTimedOut(session, question)) {
        this.scheduleAutoAdvance(session);
        return;
      }
      this.advance(session);
    };
    session.autoAdvanceTimer = setTimeout(run, Math.max(0, endsAt.getTime() - Date.now()) + 10);
  }

  private clearAutoAdvanceTimer(session: ModeratedSession) {
    if (!session.autoAdvanceTimer) return;
    clearTimeout(session.autoAdvanceTimer);
    session.autoAdvanceTimer = null;
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
