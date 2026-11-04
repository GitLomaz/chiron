import { specialQuestion, matchAttempt, SpecialQuestion } from '../question-types/special';
import { MatchProgress } from '../question-types/matching';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const TEACHER_PASSWORD = 'testing';

type HomeworkQuestion = { id: string; text: string; itemType: 'question' | 'game' | 'text'; gameType: 'coin_catch' | 'match_pairs' | 'tower_stack' | null; gameDurationSeconds: number | null; options: string[]; correctAnswer: string; timerSeconds: number | null; special?: SpecialQuestion | null };
type HomeworkQuiz = { title: string; description: string | null; theme: string; creditEveryCorrectAnswers: number; questions: HomeworkQuestion[] };
type ArcheryShot = { id: string; x: number; y: number; score: number };
type HomeworkParticipant = { id: string; name: string; answers: Record<string, string>; matchProgress: Record<string, MatchProgress>; completedItems: string[]; archeryArrows: number; archeryShots: ArcheryShot[]; shootingScore: number; joinedAt: Date; completedAt: Date | null };
type HomeworkSession = { id: string; facilitatorToken: string; mode: 'classic' | 'archery'; quiz: HomeworkQuiz; participants: HomeworkParticipant[]; ended: boolean; expired: boolean; endsAt: Date; createdAt: Date };

/** Homework snapshots and attempts live in Postgres so they survive API restarts. */
@Injectable()
export class HomeworkService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive() {
    const sessions = await (this.prisma as any).homeworkSession.findMany({ where: { ended: false, endsAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' }, include: { _count: { select: { participants: true } } } });
    return sessions.map((session: any) => ({ sessionId: session.id, title: (session.quizSnapshot as HomeworkQuiz).title, participantCount: session._count.participants, createdAt: session.createdAt.toISOString(), endsAt: session.endsAt.toISOString() }));
  }

  async listHistory() {
    await (this.prisma as any).homeworkSession.updateMany({ where: { ended: false, endsAt: { lte: new Date() } }, data: { ended: true, expired: true } });
    const sessions = await (this.prisma as any).homeworkSession.findMany({ where: { ended: true }, orderBy: { createdAt: 'desc' }, take: 100, include: { _count: { select: { participants: true } } } });
    return sessions.map((session: any) => ({ sessionId: session.id, title: (session.quizSnapshot as HomeworkQuiz).title, participantCount: session._count.participants, createdAt: session.createdAt.toISOString(), endsAt: session.endsAt.toISOString(), mode: session.mode === 'archery' ? 'archery' : 'classic', ended: true, expired: session.expired }));
  }

  async create(quizId: number, durationSeconds: number, mode: 'classic' | 'archery' = 'classic') {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId }, include: { questions: { where: { isEnabled: true }, orderBy: { position: 'asc' } } } });
    if (!quiz) throw new NotFoundException(`Quiz ${quizId} was not found`);
    if (!quiz.questions.length) throw new BadRequestException('Enable at least one item before creating homework');
    const authoredQuestions = quiz.questions.map((question): HomeworkQuestion => {
      const special = specialQuestion(question.options);
      const itemType = question.itemType === 'game' ? 'game' as const : question.itemType === 'text' ? 'text' as const : 'question' as const;
      const storedOptions = Array.isArray(question.options) ? question.options.filter((value): value is string => typeof value === 'string') : [];
      const wrongAnswers = [...new Set(storedOptions.filter((option) => option !== question.correctAnswer))];
      const optionCount = Math.min(question.answerCount ?? wrongAnswers.length + 1, wrongAnswers.length + 1);
      return { id: String(question.id), text: question.text, itemType, special, gameType: question.gameType === 'coin_catch' || question.gameType === 'match_pairs' || question.gameType === 'tower_stack' ? question.gameType : null, gameDurationSeconds: question.gameDurationSeconds, options: itemType !== 'question' || special?.kind === 'matching' ? [] : special?.kind === 'true_false' ? ['True', 'False'] : this.shuffle([question.correctAnswer, ...this.shuffle(wrongAnswers).slice(0, optionCount - 1)]), correctAnswer: question.correctAnswer, timerSeconds: this.effectiveTimer(question.timerSeconds, quiz.defaultTimerSeconds) };
    });
    const questions = quiz.randomizeQuestionOrder ? this.shuffleQuestionsInPlace(authoredQuestions) : authoredQuestions;
    const createdAt = new Date();
    const session = await (this.prisma as any).homeworkSession.create({ data: { id: randomUUID(), facilitatorToken: randomUUID(), mode, quizSnapshot: { title: quiz.title, description: quiz.description, theme: quiz.theme, creditEveryCorrectAnswers: quiz.creditEveryCorrectAnswers ?? 1, questions }, endsAt: new Date(createdAt.getTime() + durationSeconds * 1000), createdAt } });
    return { sessionId: session.id, facilitatorToken: TEACHER_PASSWORD };
  }

  async join(sessionId: string, name: string) {
    const session = await this.get(sessionId); this.assertOpen(session);
    const cleanName = name.trim(); if (!cleanName) throw new BadRequestException('Enter your name to begin');
    const participant = await (this.prisma as any).homeworkParticipant.create({ data: { id: randomUUID(), homeworkSessionId: session.id, name: cleanName } });
    return { participantId: participant.id, name: participant.name };
  }

  async restart(sessionId: string, participantId: string) {
    const { session, participant } = await this.participant(sessionId, participantId); this.assertOpen(session);
    if (!participant.completedAt) throw new BadRequestException('Finish this homework before taking it again');
    const retry = await (this.prisma as any).homeworkParticipant.create({ data: { id: randomUUID(), homeworkSessionId: session.id, name: participant.name } });
    return { participantId: retry.id, name: retry.name };
  }

  async studentState(sessionId: string, participantId?: string) {
    const session = await this.get(sessionId), participant = participantId ? session.participants.find((item) => item.id === participantId) : undefined;
    return { sessionId: session.id, title: session.quiz.title, description: session.quiz.description, theme: session.quiz.theme, mode: session.mode, ended: session.ended, expired: session.expired, endsAt: session.endsAt.toISOString(), questions: session.quiz.questions.map((question) => ({ ...question, answer: participant?.answers[question.id] ?? null, completed: participant?.completedItems.includes(question.id) ?? false, matchProgress: participant?.matchProgress[question.id] ?? null })), participant: participant ? { id: participant.id, name: participant.name, score: this.score(session, participant), archery: session.mode === 'archery' ? this.archeryState(participant) : null, completed: participant.completedAt !== null } : null };
  }

  async submitAnswer(sessionId: string, participantId: string, questionId: string, answer: string) {
    const { session, participant } = await this.participant(sessionId, participantId); this.assertActiveAttempt(session, participant);
    const question = session.quiz.questions.find((item) => item.id === questionId);
    if (!question || question.itemType !== 'question') throw new BadRequestException('That is not a homework question');
    const answers = { ...participant.answers }, matchProgress = { ...participant.matchProgress }, completedItems = new Set(participant.completedItems);
    let progress: MatchProgress | null = null;
    if (question.special?.kind === 'matching') {
      if (answers[questionId]) throw new BadRequestException('That answer has already been submitted');
      progress = matchAttempt(question.special.pairs, matchProgress[questionId], answer);
      if (!progress) throw new BadRequestException('Choose one item from each column');
      matchProgress[questionId] = progress;
      if (progress.mistakes < 3 && progress.matched.length < question.special.pairs.length) { await this.saveParticipant(participant.id, { matchProgress }); return { answered: false, matchProgress: progress }; }
      answer = progress.matched.length === question.special.pairs.length ? 'Matched' : 'Not matched';
    } else if (!question.options.includes(answer)) throw new BadRequestException('Choose one of the available answers');
    if (answers[questionId]) throw new BadRequestException('That answer has already been submitted');
    answers[questionId] = answer; completedItems.add(questionId);
    const correct = answer === question.correctAnswer;
    const correctAnswers = session.quiz.questions.filter((item) => item.itemType === 'question' && answers[item.id] === item.correctAnswer).length;
    const archeryArrows = participant.archeryArrows + (session.mode === 'archery' && correct && correctAnswers % session.quiz.creditEveryCorrectAnswers === 0 ? 1 : 0);
    const completedAt = completedItems.size === session.quiz.questions.length ? new Date() : null;
    const updated = { ...participant, answers, matchProgress, completedItems: [...completedItems], archeryArrows, completedAt };
    await this.saveParticipant(participant.id, { answers, matchProgress, completedItems: [...completedItems], archeryArrows, completedAt });
    return { answered: true, matchProgress: progress, isCorrect: correct, correctAnswer: question.correctAnswer, score: this.score(session, updated), archery: session.mode === 'archery' ? this.archeryState(updated) : null, completed: completedAt !== null };
  }

  async completeItem(sessionId: string, participantId: string, questionId: string) {
    const { session, participant } = await this.participant(sessionId, participantId); this.assertActiveAttempt(session, participant);
    if (!session.quiz.questions.some((question) => question.id === questionId)) throw new BadRequestException('That homework item could not be found');
    const completedItems = [...new Set([...participant.completedItems, questionId])], completedAt = completedItems.length === session.quiz.questions.length ? new Date() : null;
    await this.saveParticipant(participant.id, { completedItems, completedAt });
    return { completed: completedAt !== null, score: this.score(session, { ...participant, completedItems, completedAt }) };
  }

  async shootArchery(sessionId: string, participantId: string, x: number, y: number) {
    const { session, participant } = await this.participant(sessionId, participantId); this.assertOpen(session);
    if (session.mode !== 'archery') throw new BadRequestException('Archery is not enabled for this homework');
    if (participant.archeryArrows < 1) throw new BadRequestException('Answer a question correctly to earn an arrow');
    const shot = { id: randomUUID(), x, y, score: this.archeryScore(x, y) }, archeryShots = [...participant.archeryShots, shot], archeryArrows = participant.archeryArrows - 1, shootingScore = participant.shootingScore + shot.score;
    await this.saveParticipant(participant.id, { archeryShots, archeryArrows, shootingScore });
    return this.archeryState({ ...participant, archeryShots, archeryArrows, shootingScore });
  }

  async teacherState(sessionId: string, token: string) {
    const session = await this.get(sessionId); this.authorizeTeacher(token);
    const questionCount = session.quiz.questions.filter((question) => question.itemType === 'question').length;
    const attemptsByStudent = new Map<string, number>();
    const participants = session.participants.map((participant) => {
      const key = participant.name.trim().toLocaleLowerCase();
      const attemptNumber = (attemptsByStudent.get(key) ?? 0) + 1;
      attemptsByStudent.set(key, attemptNumber);
      return { id: participant.id, name: participant.name, attemptNumber, joinedAt: participant.joinedAt.toISOString(), completedAt: participant.completedAt?.toISOString() ?? null, completed: participant.completedAt !== null, completedItems: participant.completedItems.length, score: this.score(session, participant), shootingScore: session.mode === 'archery' ? participant.shootingScore : null };
    });
    const questionStats = session.quiz.questions.filter((question) => question.itemType === 'question').map((question) => {
      const answered = session.participants.filter((participant) => Object.hasOwn(participant.answers, question.id));
      const correct = answered.filter((participant) => participant.answers[question.id] === question.correctAnswer).length;
      const matchingPairs = question.special?.kind === 'matching' ? question.special.pairs : undefined;
      return { id: question.id, text: question.text, ...(matchingPairs ? { matchingPairs } : {}), answered: answered.length, correct, correctRate: answered.length ? Math.round((correct / answered.length) * 100) : 0 };
    });
    const archeryLeaderboard = session.mode === 'archery' ? [...session.participants.reduce((leaders, participant) => {
      const key = participant.name.trim().toLocaleLowerCase();
      const current = leaders.get(key);
      leaders.set(key, current ? { ...current, attempts: current.attempts + 1, bestScore: Math.max(current.bestScore, participant.shootingScore) } : { name: participant.name, attempts: 1, bestScore: participant.shootingScore });
      return leaders;
    }, new Map<string, { name: string; attempts: number; bestScore: number }>()).values()].sort((a, b) => b.bestScore - a.bestScore || a.name.localeCompare(b.name)) : [];
    return { sessionId: session.id, title: session.quiz.title, description: session.quiz.description, mode: session.mode, ended: session.ended, expired: session.expired, endsAt: session.endsAt.toISOString(), questionCount, itemCount: session.quiz.questions.length, createdAt: session.createdAt.toISOString(), participants, questionStats, archeryLeaderboard };
  }

  async teacherAttempt(sessionId: string, token: string, participantId: string) {
    const session = await this.get(sessionId);
    this.authorizeTeacher(token);
    const participant = session.participants.find((item) => item.id === participantId);
    if (!participant) throw new NotFoundException('That homework attempt could not be found');
    return {
      id: participant.id,
      name: participant.name,
      joinedAt: participant.joinedAt.toISOString(),
      completedAt: participant.completedAt?.toISOString() ?? null,
      completed: participant.completedAt !== null,
      completedItems: participant.completedItems.length,
      score: this.score(session, participant),
      shootingScore: session.mode === 'archery' ? participant.shootingScore : null,
      answers: session.quiz.questions.filter((question) => question.itemType === 'question').map((question) => {
        const answer = participant.answers[question.id];
        const matchingPairs = question.special?.kind === 'matching' ? question.special.pairs : undefined;
        return { id: question.id, text: question.text, ...(matchingPairs ? { matchingPairs } : {}), answer: answer ?? null, correctAnswer: question.correctAnswer, isCorrect: answer === undefined ? null : answer === question.correctAnswer };
      }),
    };
  }

  async end(sessionId: string, token: string) { const session = await this.get(sessionId); this.authorizeTeacher(token); await (this.prisma as any).homeworkSession.update({ where: { id: session.id }, data: { ended: true } }); return this.teacherState(sessionId, token); }

  async updateDuration(sessionId: string, token: string, durationSeconds: number) {
    const session = await this.get(sessionId);
    this.authorizeTeacher(token);
    this.assertOpen(session);
    await (this.prisma as any).homeworkSession.update({ where: { id: session.id }, data: { endsAt: new Date(Date.now() + durationSeconds * 1000), expired: false } });
    return this.teacherState(sessionId, token);
  }

  async remove(sessionId: string, token: string) {
    const session = await this.get(sessionId);
    this.authorizeTeacher(token);
    if (!session.ended) throw new BadRequestException('Only closed homework sessions can be deleted');
    await (this.prisma as any).homeworkSession.delete({ where: { id: session.id } });
    return { deleted: true };
  }

  private async get(sessionId: string): Promise<HomeworkSession> {
    const include = { participants: { orderBy: { joinedAt: 'asc' } } };
    let row = await (this.prisma as any).homeworkSession.findUnique({ where: { id: sessionId }, include });
    if (!row) throw new NotFoundException('That homework run is no longer available');
    if (!row.ended && Date.now() >= row.endsAt.getTime()) row = await (this.prisma as any).homeworkSession.update({ where: { id: row.id }, data: { ended: true, expired: true }, include });
    return { id: row.id, facilitatorToken: row.facilitatorToken, mode: row.mode === 'archery' ? 'archery' : 'classic', quiz: row.quizSnapshot as HomeworkQuiz, ended: row.ended, expired: row.expired, endsAt: row.endsAt, createdAt: row.createdAt, participants: row.participants.map((participant: any) => ({ id: participant.id, name: participant.name, answers: participant.answers as Record<string, string>, matchProgress: participant.matchProgress as Record<string, MatchProgress>, completedItems: participant.completedItems as string[], archeryArrows: participant.archeryArrows, archeryShots: participant.archeryShots as ArcheryShot[], shootingScore: participant.shootingScore, joinedAt: participant.joinedAt, completedAt: participant.completedAt })) };
  }

  private async participant(sessionId: string, participantId: string) { const session = await this.get(sessionId), participant = session.participants.find((item) => item.id === participantId); if (!participant) throw new NotFoundException('Your homework attempt could not be found. Please begin again.'); return { session, participant }; }
  private authorizeTeacher(password: string) { if (password !== TEACHER_PASSWORD) throw new ForbiddenException('That teacher password is not valid'); }
  private assertOpen(session: HomeworkSession) { if (session.ended) throw new BadRequestException('This homework has ended'); }
  private assertActiveAttempt(session: HomeworkSession, participant: HomeworkParticipant) { this.assertOpen(session); if (participant.completedAt) throw new BadRequestException('This homework attempt is already complete'); }
  private saveParticipant(id: string, data: Record<string, unknown>) { return (this.prisma as any).homeworkParticipant.update({ where: { id }, data }); }
  private score(session: HomeworkSession, participant: HomeworkParticipant) { const questions = session.quiz.questions.filter((question) => question.itemType === 'question'); return { correct: questions.filter((question) => participant.answers[question.id] === question.correctAnswer).length, answered: Object.keys(participant.answers).length, total: questions.length }; }
  private archeryState(participant: HomeworkParticipant) { return { arrows: participant.archeryArrows, lastShot: participant.archeryShots.at(-1) ?? null, attempts: [...participant.archeryShots].sort((a, b) => b.score - a.score), shootingScore: participant.shootingScore }; }
  private archeryScore(x: number, y: number) { return Math.max(1, Math.round(1000 - (Math.sqrt((x * x) + (y * y)) * 10))); }
  private effectiveTimer(questionTimerSeconds: number | null, defaultTimerSeconds: number) { const value = questionTimerSeconds ?? defaultTimerSeconds; return value === -1 || value === null ? null : value; }
  private shuffleQuestionsInPlace(items: HomeworkQuestion[]) { const questions = items.filter((item) => item.itemType === 'question'); for (let index = questions.length - 1; index > 0; index -= 1) { const randomIndex = Math.floor(Math.random() * (index + 1)); [questions[index], questions[randomIndex]] = [questions[randomIndex], questions[index]]; } let questionIndex = 0; return items.map((item) => item.itemType === 'question' ? questions[questionIndex++] : item); }
  private shuffle<T>(items: T[]) { const result = [...items]; for (let index = result.length - 1; index > 0; index -= 1) { const randomIndex = Math.floor(Math.random() * (index + 1)); [result[index], result[randomIndex]] = [result[randomIndex], result[index]]; } return result; }
}
