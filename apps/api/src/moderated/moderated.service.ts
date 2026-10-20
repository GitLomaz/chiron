import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitModeratedAnswerDto } from './dto/moderated-session.dto';

type SessionQuestion = { id: string; text: string; options: string[] };
type Participant = { id: string; name: string; answers: Map<string, string>; joinedAt: Date };
type ModeratedSession = {
  id: string;
  pin: string;
  facilitatorToken: string;
  quiz: { title: string; description: string | null; theme: string; questions: SessionQuestion[] };
  phase: 'lobby' | 'question' | 'complete';
  currentQuestionIndex: number;
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
      include: { questions: { where: { isEnabled: true }, orderBy: { position: 'asc' } } },
    });
    if (!quiz) throw new NotFoundException(`Quiz ${quizId} was not found`);
    if (!quiz.questions.length) throw new BadRequestException('Enable at least one question before creating a moderated test');

    const id = randomUUID();
    const facilitatorToken = randomUUID();
    const pin = this.createPin();
    const questions = quiz.questions.map((question) => {
      const options = Array.isArray(question.options) ? question.options.filter((value): value is string => typeof value === 'string') : [];
      const wrongAnswers = [...new Set(options.filter((option) => option !== question.correctAnswer))];
      const count = Math.min(question.answerCount ?? wrongAnswers.length + 1, wrongAnswers.length + 1);
      // Every participant sees the same frozen options, and the correct option
      // is always included even when a question draws only part of an answer pool.
      return {
        id: String(question.id), text: question.text,
        options: this.shuffle([question.correctAnswer, ...this.shuffle(wrongAnswers, `${id}-${question.id}-wrong`).slice(0, count - 1)], `${id}-${question.id}`),
      };
    });
    const session = {
      id, pin, facilitatorToken,
      quiz: { title: quiz.title, description: quiz.description, theme: quiz.theme, questions },
      phase: 'lobby', currentQuestionIndex: -1, participants: new Map(), createdAt: new Date(),
    } satisfies ModeratedSession;
    this.sessions.set(id, session);
    this.sessionsByPin.set(pin, session);
    return { sessionId: id, facilitatorToken, pin, phase: 'lobby' as const };
  }

  studentState(pin: string, participantId?: string) {
    const session = this.getByPin(pin);
    const participant = participantId ? session.participants.get(participantId) : undefined;
    const question = session.phase === 'question' ? session.quiz.questions[session.currentQuestionIndex] : undefined;
    return {
      pin: session.pin,
      title: session.quiz.title,
      description: session.quiz.description,
      theme: session.quiz.theme,
      phase: session.phase,
      participant: participant ? { id: participant.id, name: participant.name } : null,
      currentQuestion: question ? { ...question, number: session.currentQuestionIndex + 1, total: session.quiz.questions.length, answered: participant?.answers.has(question.id) ?? false } : null,
    };
  }

  facilitatorState(sessionId: string, token: string) {
    const session = this.authorize(sessionId, token);
    const currentQuestion = session.phase === 'question' ? session.quiz.questions[session.currentQuestionIndex] : null;
    const nextQuestion = session.phase === 'lobby'
      ? session.quiz.questions[0]
      : session.quiz.questions[session.currentQuestionIndex + 1] ?? null;
    const answered = currentQuestion ? [...session.participants.values()].filter((participant) => participant.answers.has(currentQuestion.id)).length : 0;
    return {
      sessionId: session.id, pin: session.pin, title: session.quiz.title, description: session.quiz.description, phase: session.phase,
      questionCount: session.quiz.questions.length, currentQuestion: currentQuestion ? { ...currentQuestion, number: session.currentQuestionIndex + 1 } : null,
      nextQuestion: nextQuestion ? { ...nextQuestion, number: session.phase === 'lobby' ? 1 : session.currentQuestionIndex + 2 } : null,
      participants: [...session.participants.values()].map((participant) => ({
        id: participant.id, name: participant.name, answeredCurrentQuestion: currentQuestion ? participant.answers.has(currentQuestion.id) : false,
      })),
      answeredCount: answered,
    };
  }

  start(sessionId: string, token: string) {
    const session = this.authorize(sessionId, token);
    if (session.phase !== 'lobby') throw new BadRequestException('This test has already started');
    session.phase = 'question';
    session.currentQuestionIndex = 0;
    return this.facilitatorState(sessionId, token);
  }

  next(sessionId: string, token: string) {
    const session = this.authorize(sessionId, token);
    if (session.phase !== 'question') throw new BadRequestException('Start the test before moving to a question');
    if (session.currentQuestionIndex >= session.quiz.questions.length - 1) {
      session.phase = 'complete';
    } else {
      session.currentQuestionIndex += 1;
    }
    return this.facilitatorState(sessionId, token);
  }

  join(pin: string, name: string) {
    const session = this.getByPin(pin);
    const cleanName = name.trim();
    if (!cleanName) throw new BadRequestException('Enter your name to join');
    if (session.phase === 'complete') throw new BadRequestException('This moderated test has ended');
    const participant = { id: randomUUID(), name: cleanName, answers: new Map<string, string>(), joinedAt: new Date() };
    session.participants.set(participant.id, participant);
    return { participantId: participant.id, name: participant.name };
  }

  submitAnswer(pin: string, body: SubmitModeratedAnswerDto) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(body.participantId);
    if (!participant) throw new NotFoundException('Your participant session could not be found. Please join again.');
    if (session.phase !== 'question') throw new BadRequestException('Wait for the facilitator to open a question');
    const question = session.quiz.questions[session.currentQuestionIndex];
    if (body.questionId !== question.id) throw new BadRequestException('That question is no longer active');
    if (!question.options.includes(body.answer)) throw new BadRequestException('Choose one of the available answers');
    participant.answers.set(question.id, body.answer);
    return { answered: true };
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
