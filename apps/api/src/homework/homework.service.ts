import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

type HomeworkQuestion = {
  id: string;
  text: string;
  itemType: 'question' | 'game';
  gameType: 'coin_catch' | 'match_pairs' | 'tower_stack' | null;
  gameDurationSeconds: number | null;
  options: string[];
  correctAnswer: string;
  timerSeconds: number | null;
};
type HomeworkParticipant = {
  id: string;
  name: string;
  answers: Map<string, string>;
  completedItems: Set<string>;
  joinedAt: Date;
  completedAt: Date | null;
};
type HomeworkSession = {
  id: string;
  facilitatorToken: string;
  quiz: { title: string; description: string | null; theme: string; questions: HomeworkQuestion[] };
  participants: Map<string, HomeworkParticipant>;
  createdAt: Date;
};

/**
 * Homework runs are deliberately process-local, just like live runs.  The quiz
 * is copied when the teacher creates the run, so later quiz edits cannot alter
 * work that students have already started.
 */
@Injectable()
export class HomeworkService {
  private readonly sessions = new Map<string, HomeworkSession>();

  constructor(private readonly prisma: PrismaService) {}

  async create(quizId: number) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { where: { isEnabled: true }, orderBy: { position: 'asc' } } },
    });
    if (!quiz) throw new NotFoundException(`Quiz ${quizId} was not found`);
    if (!quiz.questions.length) throw new BadRequestException('Enable at least one item before creating homework');

    const id = randomUUID();
    const authoredQuestions = quiz.questions.map((question): HomeworkQuestion => {
      const itemType = question.itemType === 'game' ? 'game' as const : 'question' as const;
      const storedOptions = Array.isArray(question.options) ? question.options.filter((value): value is string => typeof value === 'string') : [];
      const wrongAnswers = [...new Set(storedOptions.filter((option) => option !== question.correctAnswer))];
      const optionCount = Math.min(question.answerCount ?? wrongAnswers.length + 1, wrongAnswers.length + 1);
      return {
        id: String(question.id),
        text: question.text,
        itemType,
        gameType: question.gameType === 'coin_catch' || question.gameType === 'match_pairs' || question.gameType === 'tower_stack' ? question.gameType : null,
        gameDurationSeconds: question.gameDurationSeconds,
        options: itemType === 'game' ? [] : this.shuffle([question.correctAnswer, ...this.shuffle(wrongAnswers).slice(0, optionCount - 1)]),
        correctAnswer: question.correctAnswer,
        timerSeconds: this.effectiveTimer(question.timerSeconds, quiz.defaultTimerSeconds),
      };
    });
    const questions = quiz.randomizeQuestionOrder ? this.shuffleQuestionsInPlace(authoredQuestions) : authoredQuestions;
    const session: HomeworkSession = {
      id,
      facilitatorToken: randomUUID(),
      quiz: { title: quiz.title, description: quiz.description, theme: quiz.theme, questions },
      participants: new Map(),
      createdAt: new Date(),
    };
    this.sessions.set(id, session);
    return { sessionId: id, facilitatorToken: session.facilitatorToken };
  }

  join(sessionId: string, name: string) {
    const session = this.get(sessionId);
    const cleanName = name.trim();
    if (!cleanName) throw new BadRequestException('Enter your name to begin');
    const participant: HomeworkParticipant = { id: randomUUID(), name: cleanName, answers: new Map(), completedItems: new Set(), joinedAt: new Date(), completedAt: null };
    session.participants.set(participant.id, participant);
    return { participantId: participant.id, name: participant.name };
  }

  studentState(sessionId: string, participantId?: string) {
    const session = this.get(sessionId);
    const participant = participantId ? session.participants.get(participantId) : undefined;
    return {
      sessionId: session.id,
      title: session.quiz.title,
      description: session.quiz.description,
      theme: session.quiz.theme,
      questions: session.quiz.questions,
      participant: participant ? { id: participant.id, name: participant.name, score: this.score(session, participant), completed: participant.completedAt !== null } : null,
    };
  }

  submitAnswer(sessionId: string, participantId: string, questionId: string, answer: string) {
    const { session, participant } = this.participant(sessionId, participantId);
    if (participant.completedAt) throw new BadRequestException('This homework attempt is already complete');
    const question = session.quiz.questions.find((item) => item.id === questionId);
    if (!question || question.itemType !== 'question') throw new BadRequestException('That is not a homework question');
    if (!question.options.includes(answer)) throw new BadRequestException('Choose one of the available answers');
    if (participant.answers.has(questionId)) throw new BadRequestException('That answer has already been submitted');
    participant.answers.set(questionId, answer);
    participant.completedItems.add(questionId);
    this.completeIfFinished(session, participant);
    return { isCorrect: answer === question.correctAnswer, correctAnswer: question.correctAnswer, score: this.score(session, participant), completed: participant.completedAt !== null };
  }

  completeItem(sessionId: string, participantId: string, questionId: string) {
    const { session, participant } = this.participant(sessionId, participantId);
    if (participant.completedAt) throw new BadRequestException('This homework attempt is already complete');
    const item = session.quiz.questions.find((question) => question.id === questionId);
    if (!item) throw new BadRequestException('That homework item could not be found');
    participant.completedItems.add(questionId);
    this.completeIfFinished(session, participant);
    return { completed: participant.completedAt !== null, score: this.score(session, participant) };
  }

  teacherState(sessionId: string, token: string) {
    const session = this.get(sessionId);
    if (!token || session.facilitatorToken !== token) throw new ForbiddenException('That teacher code is not valid');
    const questionCount = session.quiz.questions.filter((question) => question.itemType === 'question').length;
    return {
      sessionId: session.id,
      title: session.quiz.title,
      description: session.quiz.description,
      questionCount,
      itemCount: session.quiz.questions.length,
      createdAt: session.createdAt.toISOString(),
      participants: [...session.participants.values()].map((participant) => ({
        id: participant.id,
        name: participant.name,
        joinedAt: participant.joinedAt.toISOString(),
        completedAt: participant.completedAt?.toISOString() ?? null,
        completed: participant.completedAt !== null,
        completedItems: participant.completedItems.size,
        score: this.score(session, participant),
      })),
    };
  }

  private get(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new NotFoundException('That homework run is no longer available');
    return session;
  }

  private participant(sessionId: string, participantId: string) {
    const session = this.get(sessionId);
    const participant = session.participants.get(participantId);
    if (!participant) throw new NotFoundException('Your homework attempt could not be found. Please begin again.');
    return { session, participant };
  }

  private completeIfFinished(session: HomeworkSession, participant: HomeworkParticipant) {
    if (participant.completedItems.size === session.quiz.questions.length) participant.completedAt = new Date();
  }

  private score(session: HomeworkSession, participant: HomeworkParticipant) {
    const questions = session.quiz.questions.filter((question) => question.itemType === 'question');
    const correct = questions.filter((question) => participant.answers.get(question.id) === question.correctAnswer).length;
    return { correct, answered: participant.answers.size, total: questions.length };
  }

  private effectiveTimer(questionTimerSeconds: number | null, defaultTimerSeconds: number) {
    const value = questionTimerSeconds ?? defaultTimerSeconds;
    return value === -1 || value === null ? null : value;
  }

  private shuffleQuestionsInPlace(items: HomeworkQuestion[]) {
    const questions = items.filter((item) => item.itemType === 'question');
    for (let index = questions.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [questions[index], questions[randomIndex]] = [questions[randomIndex], questions[index]];
    }
    let questionIndex = 0;
    return items.map((item) => item.itemType === 'question' ? questions[questionIndex++] : item);
  }

  private shuffle<T>(items: T[]) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }
}
