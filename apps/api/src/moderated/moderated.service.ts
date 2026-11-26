import { specialQuestion, matchAttempt, SpecialQuestion } from '../question-types/special';
import { answersMatch, AnswerMatching } from '../question-types/answer-matching';
import { MatchProgress } from '../question-types/matching';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ReportModeratedGameScoreDto, SubmitModeratedAnswerDto } from './dto/moderated-session.dto';
import { AuthUser } from '../auth/auth.types';

type SessionQuestion = { id: string; text: string; itemType: 'question' | 'game' | 'text'; gameType: string | null; options: string[]; correctAnswer: string; timerSeconds: number | null; special?: SpecialQuestion | null };
// Credits and a first selection are personal; the board itself is shared by
// everyone in a live matching session.
type MatchingGame = { credits: number; selectedCard: number | null; score: number };
type SharedMatchingAttempt = { id: string; participantId: string; participantName: string; cards: [number, number]; startedAt: Date; isMatch: boolean };
type SharedMatchingGame = { cards: string[]; columns: number; rows: number; matchedCards: Set<number>; attempt: SharedMatchingAttempt | null; completionId: string | null };
type BattleshipPlayer = { tokens: number; score: number };
type SharedBattleshipGame = { size: number; shipCells: Set<number>; attacks: Map<number, 'hit' | 'miss'>; lastHit: { id: string; cell: number; participantName: string } | null; completionId: string | null };
type TreasureMapPlayer = { tokens: number };
type SharedTreasureMap = { size: number; treasureCell: number; blockedCells: Set<number>; digs: Map<number, { result: 'clue' | 'treasure'; hint: string }>; lastDig: { id: string; cell: number; participantName: string } | null; completionId: string | null };
type ArcheryPlayer = { arrows: number; lastShot: ArcheryArrow | null };
type ArcheryArrow = { id: string; participantId: string; participantName: string; x: number; y: number; score: number };
type SharedArcheryGame = { arrows: ArcheryArrow[] };
type CurlingPlayer = { stones: number; lastStone: CurlingStone | null };
type CurlingStone = { id: string; participantId: string; participantName: string; direction: number; speed: number; x: number; y: number; score: number };
type SharedCurlingGame = { stones: CurlingStone[] };
// A Simon sequence belongs to each player. Every resolved pattern spends one
// token, whether it is completed or missed. A miss leaves the sequence intact
// so the next token resumes that same level.
type SimonPlayer = { tokens: number; sequence: number[]; progress: number; highScore: number; playing: boolean };
type SharedSimonGame = Record<string, never>;
type SnakesLaddersPlayer = { rolls: number; position: number; lastRoll: number | null };
type SnakesLaddersMove = { id: string; participantId: string; participantName: string; roll: number; from: number; landed: number; to: number };
type SharedSnakesLaddersGame = { trackLength: number; jumps: Map<number, number>; lastMove: SnakesLaddersMove | null; recentMoves: SnakesLaddersMove[] };
type ProjectorPresentationMode = 'scores' | 'matching' | 'matching_leaderboard' | 'battleship' | 'battleship_leaderboard' | 'treasure_map' | 'treasure_map_leaderboard' | 'archery' | 'archery_leaderboard' | 'curling' | 'curling_leaderboard' | 'simon' | 'snakes_ladders' | 'snakes_ladders_leaderboard';
const MATCHING_SYMBOLS = ['atlas:blue-orb', 'atlas:gold-orb', 'atlas:green-orb', 'atlas:purple-orb', 'atlas:red-orb', 'atlas:silver-orb', 'atlas:gold-star', 'atlas:silver-star', 'atlas:clover', 'atlas:sprout', 'atlas:bronze-coin', 'atlas:gold-coin', 'atlas:silver-coin', 'atlas:black-gem', 'atlas:blue-gem', 'atlas:green-gem', 'atlas:orange-gem', 'atlas:pink-gem', 'atlas:purple-gem', 'atlas:red-gem', 'atlas:white-gem', 'atlas:yellow-gem', 'atlas:fire', 'atlas:leaf', 'atlas:water-drop', 'atlas:pink-blossom', 'atlas:pink-petal', 'atlas:orange-flower', 'atlas:pink-flower', 'atlas:purple-flower', 'atlas:red-flower', 'atlas:white-flower'];
type PointScore = { points: number; streak: number; maxStreak: number; lastAward: { base: number; streak: number; speed: number; total: number } | null };
type Participant = { id: string; clientId: string; name: string; questions: SessionQuestion[]; answers: Map<string, string>; matchProgress: Map<string, MatchProgress>; gameScores: Map<string, number>; pointScore: PointScore; matching: MatchingGame | null; battleship: BattleshipPlayer | null; treasureMap: TreasureMapPlayer | null; archery: ArcheryPlayer | null; curling: CurlingPlayer | null; simon: SimonPlayer | null; snakesLadders: SnakesLaddersPlayer | null; betweenQuestions: boolean; joinedAt: Date; currentQuestionIndex: number; currentQuestionOpenedAt: Date | null; autoAdvanceTimer: NodeJS.Timeout | null; completedAt: Date | null };
type ModeratedSession = {
  id: string;
  ownerId: string;
  pin: string;
  facilitatorToken: string;
  mode: 'classic' | 'facilitated' | 'matching' | 'battleship' | 'treasure_map' | 'archery' | 'curling' | 'simon' | 'snakes_ladders';
  endless: boolean;
  scoringEnabled: boolean;
  currentRoundIndex: number;
  randomizeQuestionOrder: boolean;
  quiz: { title: string; description: string | null; theme: string; answerMatching: AnswerMatching; matchingPairCount: number; battleshipBoardSize: number; snakesLaddersTrackLength: number; creditEveryCorrectAnswers: number; questions: SessionQuestion[] };
  phase: 'lobby' | 'question' | 'complete';
  endedByTeacher: boolean;
  expired: boolean;
  durationSeconds: number;
  endsAt: Date | null;
  lobbyLocked: boolean;
  presentationMode: ProjectorPresentationMode;
  matching: SharedMatchingGame | null;
  battleship: SharedBattleshipGame | null;
  treasureMap: SharedTreasureMap | null;
  archery: SharedArcheryGame | null;
  curling: SharedCurlingGame | null;
  simon: SharedSimonGame | null;
  snakesLadders: SharedSnakesLaddersGame | null;
  autoBoardReset: boolean;
  boardResetAt: Date | null;
  participants: Map<string, Participant>;
  bannedClientIds: Set<string>;
  createdAt: Date;
};

@Injectable()
export class ModeratedService {
  private readonly sessions = new Map<string, ModeratedSession>();
  private readonly sessionsByPin = new Map<string, ModeratedSession>();

  constructor(private readonly prisma: PrismaService) {}

  listActive(user: AuthUser) {
    return [...this.sessions.values()].filter((session) => {
      this.expire(session);
      return (session.ownerId === user.id || user.canViewAllQuizzes) && session.phase !== 'complete';
    }).map((session) => ({
      sessionId: session.id, title: session.quiz.title, pin: session.pin,
      mode: session.mode, phase: session.phase, participantCount: session.participants.size,
      createdAt: session.createdAt.toISOString(), endsAt: session.endsAt?.toISOString() ?? null,
    }));
  }

  async create(quizId: number, mode: ModeratedSession['mode'] = 'classic', durationSeconds: number, endless = false, scoringEnabled = true, user: AuthUser) {
    if (endless && mode === 'facilitated') throw new BadRequestException('Endless mode is not available for facilitated tests');
    const quiz = await this.prisma.quiz.findUnique({
      where: user.canViewAllQuizzes ? { id: quizId } : { id: quizId, ownerId: user.id },
      include: { questions: { where: { isEnabled: true, OR: [{ itemType: 'question' }, { itemType: 'text' }, { itemType: 'game', gameType: { in: ['coin_catch', 'match_pairs', 'tower_stack'] } }] }, orderBy: { position: 'asc' } } },
    });
    if (!quiz) throw new NotFoundException(`Quiz ${quizId} was not found`);
    if (!quiz.questions.length) throw new BadRequestException('Enable at least one question before creating a moderated test');

    const id = randomUUID();
    const facilitatorToken = user.id;
    const pin = this.createPin();
    const authoredQuestions = quiz.questions.map((question) => {
      if (question.itemType === 'game') return { id: String(question.id), text: question.text, itemType: 'game' as const, gameType: question.gameType, correctAnswer: '', options: [], timerSeconds: question.gameDurationSeconds ?? 20 };
      if (question.itemType === 'text') return { id: String(question.id), text: question.text, itemType: 'text' as const, gameType: null, correctAnswer: '', options: [], timerSeconds: null };
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
        options: special?.kind === 'true_false' ? ['True', 'False'] : special?.kind === 'matching' || special?.kind === 'short_answer' ? [] : this.shuffle([question.correctAnswer, ...this.shuffle(wrongAnswers, `${id}-${question.id}-wrong`).slice(0, count - 1)], `${id}-${question.id}`),
      };
    });
    const activeQuestions = this.questionsForMode(authoredQuestions, mode);
    if (!activeQuestions.length) throw new BadRequestException('Enable at least one question before creating this test');
    if (endless && !activeQuestions.some((item) => item.itemType === 'question')) throw new BadRequestException('Enable at least one question for endless mode');
    const matchingPairCount = this.supportedMatchingPairCount(quiz.matchingPairCount ?? 6);
    const battleshipBoardSize = quiz.battleshipBoardSize ?? 10;
    const creditEveryCorrectAnswers = quiz.creditEveryCorrectAnswers ?? 1;
    const snakesLaddersTrackLength = this.supportedTrackLength(quiz.snakesLaddersTrackLength ?? 30);
    const session = {
      id, ownerId: user.id, pin, facilitatorToken, mode, endless, scoringEnabled, currentRoundIndex: -1, randomizeQuestionOrder: quiz.randomizeQuestionOrder,
      quiz: { title: quiz.title, description: quiz.description, theme: quiz.theme, answerMatching: quiz.answerMatching === 'exact' ? 'exact' : 'close', matchingPairCount, battleshipBoardSize, snakesLaddersTrackLength, creditEveryCorrectAnswers, questions: authoredQuestions },
      phase: 'lobby', endedByTeacher: false, expired: false, durationSeconds, endsAt: null, lobbyLocked: false, presentationMode: mode === 'matching' ? 'matching' : mode === 'battleship' ? 'battleship' : mode === 'treasure_map' ? 'treasure_map' : mode === 'archery' ? 'archery' : mode === 'curling' ? 'curling' : mode === 'simon' ? 'simon' : mode === 'snakes_ladders' ? 'snakes_ladders' : 'scores',
      matching: mode === 'matching' ? this.newMatchingGame(matchingPairCount, randomUUID()) : null,
      battleship: mode === 'battleship' ? this.newBattleshipGame(battleshipBoardSize, id) : null,
      treasureMap: mode === 'treasure_map' ? this.newTreasureMap(id) : null,
      archery: mode === 'archery' ? this.newArcheryGame() : null,
      curling: mode === 'curling' ? this.newCurlingGame() : null,
      simon: mode === 'simon' ? {} : null,
      snakesLadders: mode === 'snakes_ladders' ? this.newSnakesLaddersGame(snakesLaddersTrackLength) : null,
      autoBoardReset: false, boardResetAt: null,
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
      battleship: session.battleship && participant ? this.battleshipState(session.battleship, participant) : null,
      treasureMap: session.treasureMap && participant ? this.treasureMapState(session.treasureMap, participant) : null,
      archery: session.archery && participant ? this.archeryState(session.archery, participant) : null,
      curling: session.curling && participant ? this.curlingState(session.curling, participant) : null,
      simon: session.simon && participant ? this.simonState(session, participant) : null,
      snakesLadders: session.snakesLadders && participant ? this.snakesLaddersState(session, participant) : null,
      gameLeaderboard: this.gameLeaderboard(session),
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

  facilitatorState(sessionId: string, user: AuthUser) {
    const session = this.authorize(sessionId, user);
    const participants = [...session.participants.values()];
    const state = {
      sessionId: session.id, pin: session.pin, title: session.quiz.title, description: session.quiz.description, phase: session.phase, endedByTeacher: session.endedByTeacher, expired: session.expired, endsAt: session.endsAt?.toISOString() ?? null, durationSeconds: session.durationSeconds, lobbyLocked: session.lobbyLocked, presentationMode: session.presentationMode, mode: session.mode, endless: session.endless, scoringEnabled: session.scoringEnabled, currentRound: session.currentRoundIndex + 1, autoBoardReset: session.autoBoardReset, boardResetAt: session.boardResetAt?.toISOString() ?? null,
      questionCount: this.activeQuestions(session).length,
      matching: session.matching ? this.matchingState(session.matching, undefined, undefined, true) : null,
      battleship: session.battleship ? this.battleshipState(session.battleship, undefined, true) : null,
      treasureMap: session.treasureMap ? this.treasureMapState(session.treasureMap, undefined, true) : null,
      archery: session.archery ? this.archeryState(session.archery, undefined, true) : null,
      curling: session.curling ? this.curlingState(session.curling, undefined, true) : null,
      simon: session.simon ? this.simonState(session) : null,
      snakesLadders: session.snakesLadders ? this.snakesLaddersState(session) : null,
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
      gameLeaderboard: this.gameLeaderboard(session),
    };
    if (session.ownerId === user.id) return state;
    const aliases = new Map<string, string>();
    for (const participant of participants) { if (!aliases.has(participant.name)) aliases.set(participant.name, `Student #${aliases.size + 1}`); }
    return this.redactParticipantNames(state, aliases);
  }

  start(sessionId: string, user: AuthUser) {
    const session = this.authorize(sessionId, user);
    if (session.phase !== 'lobby') throw new BadRequestException('This test has already started');
    session.endsAt = new Date(Date.now() + session.durationSeconds * 1000);
    session.phase = 'question';
    session.currentRoundIndex = 0;
    for (const participant of session.participants.values()) this.openParticipantQuestion(session, participant);
    return this.facilitatorState(sessionId, user);
  }

  end(sessionId: string, user: AuthUser) {
    const session = this.authorize(sessionId, user);
    if (session.phase !== 'complete') {
      session.phase = 'complete';
      session.endedByTeacher = true;
      for (const participant of session.participants.values()) this.clearParticipantTimer(participant);
    }
    return this.facilitatorState(sessionId, user);
  }

  updateDuration(sessionId: string, user: AuthUser, durationSeconds: number) {
    const session = this.authorize(sessionId, user);
    if (session.phase === 'complete') throw new BadRequestException('A completed test cannot be extended');
    session.durationSeconds = durationSeconds;
    session.endsAt = session.phase === 'lobby' ? null : new Date(Date.now() + durationSeconds * 1000);
    return this.facilitatorState(sessionId, user);
  }

  restart(sessionId: string, user: AuthUser, mode: ModeratedSession['mode']) {
    const session = this.authorize(sessionId, user);
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
    session.presentationMode = mode === 'matching' ? 'matching' : mode === 'battleship' ? 'battleship' : mode === 'treasure_map' ? 'treasure_map' : mode === 'archery' ? 'archery' : mode === 'curling' ? 'curling' : mode === 'simon' ? 'simon' : mode === 'snakes_ladders' ? 'snakes_ladders' : 'scores';
    session.matching = mode === 'matching' ? this.newMatchingGame(session.quiz.matchingPairCount, randomUUID()) : null;
    session.battleship = mode === 'battleship' ? this.newBattleshipGame(session.quiz.battleshipBoardSize, randomUUID()) : null;
    session.treasureMap = mode === 'treasure_map' ? this.newTreasureMap(randomUUID()) : null;
    session.archery = mode === 'archery' ? this.newArcheryGame() : null;
    session.curling = mode === 'curling' ? this.newCurlingGame() : null;
    session.simon = mode === 'simon' ? {} : null;
    session.snakesLadders = mode === 'snakes_ladders' ? this.newSnakesLaddersGame(session.quiz.snakesLaddersTrackLength) : null;
    session.boardResetAt = null;

    for (const participant of session.participants.values()) {
      this.clearParticipantTimer(participant);
      participant.questions = session.randomizeQuestionOrder ? this.shuffleQuestionsInPlace(questions, []) : [...questions];
      participant.answers = new Map();
      participant.matchProgress = new Map();
      participant.gameScores = new Map();
      participant.pointScore = this.newPointScore();
      participant.matching = mode === 'matching' ? { credits: 0, selectedCard: null, score: 0 } : null;
      participant.battleship = mode === 'battleship' ? { tokens: 0, score: 0 } : null;
      participant.treasureMap = mode === 'treasure_map' ? { tokens: 0 } : null;
      participant.archery = mode === 'archery' ? { arrows: 0, lastShot: null } : null;
      participant.curling = mode === 'curling' ? { stones: 0, lastStone: null } : null;
      participant.simon = mode === 'simon' ? this.newSimonPlayer() : null;
      participant.snakesLadders = mode === 'snakes_ladders' ? this.newSnakesLaddersPlayer() : null;
      participant.betweenQuestions = false;
      participant.currentQuestionIndex = -1;
      participant.currentQuestionOpenedAt = null;
      participant.completedAt = null;
      this.openParticipantQuestion(session, participant);
    }
    return this.facilitatorState(sessionId, user);
  }

  next(sessionId: string, user: AuthUser) {
    const session = this.authorize(sessionId, user);
    if (session.mode !== 'facilitated' || session.phase !== 'question') throw new BadRequestException('There is no facilitated round to advance');
    session.currentRoundIndex += 1;
    for (const participant of session.participants.values()) this.openParticipantQuestion(session, participant);
    if (session.currentRoundIndex >= this.activeQuestions(session).length) session.phase = 'complete';
    return this.facilitatorState(sessionId, user);
  }

  updateLobbyLock(sessionId: string, user: AuthUser, lobbyLocked: boolean) {
    const session = this.authorize(sessionId, user);
    session.lobbyLocked = lobbyLocked;
    return this.facilitatorState(sessionId, user);
  }

  updatePresentationMode(sessionId: string, user: AuthUser, presentationMode: ModeratedSession['presentationMode']) {
    const session = this.authorize(sessionId, user);
    const boardMode = presentationMode.endsWith('_leaderboard') ? presentationMode.slice(0, -'_leaderboard'.length) : presentationMode;
    if (boardMode === 'matching' && !session.matching) throw new BadRequestException('The matching board is only available in Matching mode');
    if (boardMode === 'battleship' && !session.battleship) throw new BadRequestException('The Battleship board is only available in Battleship mode');
    if (boardMode === 'treasure_map' && !session.treasureMap) throw new BadRequestException('The Treasure Map is only available in Treasure Map mode');
    if (boardMode === 'archery' && !session.archery) throw new BadRequestException('The archery board is only available in Archery mode');
    if (boardMode === 'curling' && !session.curling) throw new BadRequestException('The curling sheet is only available in Curling mode');
    if (boardMode === 'simon' && !session.simon) throw new BadRequestException('The Simon high score is only available in Simon mode');
    if (boardMode === 'snakes_ladders' && !session.snakesLadders) throw new BadRequestException('The Snakes & Ladders board is only available in Snakes & Ladders mode');
    session.presentationMode = presentationMode;
    return this.facilitatorState(sessionId, user);
  }

  updateBoardAutoReset(sessionId: string, user: AuthUser, autoBoardReset: boolean) {
    const session = this.authorize(sessionId, user);
    if (session.mode !== 'matching' && session.mode !== 'battleship' && session.mode !== 'treasure_map') throw new BadRequestException('Automatic board reset is only available in shared game modes');
    session.autoBoardReset = autoBoardReset;
    if (autoBoardReset && this.boardComplete(session)) this.scheduleBoardReset(session);
    if (!autoBoardReset) session.boardResetAt = null;
    return this.facilitatorState(sessionId, user);
  }

  resetBoard(sessionId: string, user: AuthUser) {
    const session = this.authorize(sessionId, user);
    if (!this.boardComplete(session)) throw new BadRequestException('Finish the shared board before starting a new one');
    this.startNewBoard(session);
    return this.facilitatorState(sessionId, user);
  }

  removeParticipant(sessionId: string, user: AuthUser, participantId: string) {
    const session = this.authorize(sessionId, user);
    const participant = session.participants.get(participantId);
    if (!participant) throw new NotFoundException('That participant is no longer in this test');
    session.bannedClientIds.add(participant.clientId);
    this.clearParticipantTimer(participant);
    session.participants.delete(participantId);
    this.completeSessionIfFinished(session);
    return this.facilitatorState(sessionId, user);
  }

  join(pin: string, name: string, clientId: string) {
    const session = this.getByPin(pin);
    const cleanName = name.trim();
    if (!cleanName) throw new BadRequestException('Enter your name to join');
    if (session.phase === 'complete') throw new BadRequestException('This moderated test has ended');
    if (session.lobbyLocked) throw new BadRequestException('The facilitator has locked this lobby');
    if (session.bannedClientIds.has(clientId)) throw new ForbiddenException('You have been removed from this live test');
    const questions = this.activeQuestions(session);
    const participant: Participant = { id: randomUUID(), clientId, name: cleanName, questions: session.randomizeQuestionOrder ? this.shuffleQuestionsInPlace(questions, session.participants.values()) : [...questions], answers: new Map<string, string>(), matchProgress: new Map<string, MatchProgress>(), gameScores: new Map<string, number>(), pointScore: this.newPointScore(), matching: session.mode === 'matching' ? { credits: 0, selectedCard: null, score: 0 } : null, battleship: session.mode === 'battleship' ? { tokens: 0, score: 0 } : null, treasureMap: session.mode === 'treasure_map' ? { tokens: 0 } : null, archery: session.mode === 'archery' ? { arrows: 0, lastShot: null } : null, curling: session.mode === 'curling' ? { stones: 0, lastStone: null } : null, simon: session.mode === 'simon' ? this.newSimonPlayer() : null, snakesLadders: session.mode === 'snakes_ladders' ? this.newSnakesLaddersPlayer() : null, betweenQuestions: false, joinedAt: new Date(), currentQuestionIndex: -1, currentQuestionOpenedAt: null, autoAdvanceTimer: null, completedAt: null };
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
    } else if (question.special?.kind === 'short_answer') {
      body.answer = body.answer.trim();
      if (!body.answer) throw new BadRequestException('Enter an answer');
      if (answersMatch(body.answer, question.correctAnswer, session.quiz.answerMatching)) body.answer = question.correctAnswer;
    } else if (!question.options.includes(body.answer)) throw new BadRequestException('Choose one of the available answers');
    if (participant.answers.has(question.id)) throw new BadRequestException('You have already answered this question');
    participant.answers.set(question.id, body.answer);
    const isCorrect = body.answer === question.correctAnswer;
    this.awardPoints(session, participant, question, isCorrect);
    if (session.endless && !isCorrect) this.queueEndlessReinforcement(session, participant, question);
    const earnsCredit = isCorrect && this.score(session, participant).correct % session.quiz.creditEveryCorrectAnswers === 0;
    if (participant.matching) {
      if (earnsCredit) participant.matching.credits += 1;
      participant.betweenQuestions = true;
      this.clearParticipantTimer(participant);
    } else if (participant.battleship) {
      if (earnsCredit) participant.battleship.tokens += 1;
      participant.betweenQuestions = true;
      this.clearParticipantTimer(participant);
    } else if (participant.treasureMap) {
      if (earnsCredit) participant.treasureMap.tokens += 1;
      participant.betweenQuestions = true;
      this.clearParticipantTimer(participant);
    } else if (participant.archery) {
      if (earnsCredit) participant.archery.arrows += 1;
      participant.betweenQuestions = true;
      this.clearParticipantTimer(participant);
    } else if (participant.curling) {
      if (earnsCredit) participant.curling.stones += 1;
      participant.betweenQuestions = true;
      this.clearParticipantTimer(participant);
    } else if (participant.simon) {
      if (earnsCredit) participant.simon.tokens += 1;
      participant.betweenQuestions = true;
      this.clearParticipantTimer(participant);
    } else if (participant.snakesLadders) {
      if (earnsCredit) participant.snakesLadders.rolls += 1;
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
    if (matching.completionId) throw new BadRequestException('All matching pairs have already been found');
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
    matching.attempt = { id: randomUUID(), participantId: participant.id, participantName: participant.name, cards, startedAt: new Date(), isMatch };
    if (isMatch) player.score += 100;
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

  attackBattleship(pin: string, participantId: string, cell: number) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    const game = session.battleship;
    if (session.phase !== 'question' || !participant?.battleship || !participant.betweenQuestions || !game) throw new BadRequestException('Battleship is available between questions');
    if (!Number.isInteger(cell) || cell < 0 || cell >= game.size ** 2) throw new BadRequestException('Choose a square on the board');
    if (participant.battleship.tokens < 1) throw new BadRequestException('Earn an attack token by answering a question correctly');
    if (game.completionId) throw new BadRequestException('The fleet has already been sunk');
    if (game.attacks.has(cell)) throw new BadRequestException('That square has already been attacked');
    participant.battleship.tokens -= 1;
    const result = game.shipCells.has(cell) ? 'hit' : 'miss';
    game.attacks.set(cell, result);
    if (result === 'hit') {
      participant.battleship.score += 100;
      game.lastHit = { id: randomUUID(), cell, participantName: participant.name };
      if ([...game.attacks.values()].filter((attack) => attack === 'hit').length === game.shipCells.size) {
        game.completionId = randomUUID();
        this.scheduleBoardReset(session);
      }
    }
    return this.battleshipState(game, participant);
  }

  nextBattleshipQuestion(pin: string, participantId: string) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    if (session.phase !== 'question' || session.mode !== 'battleship' || !participant?.battleship || !participant.betweenQuestions) throw new BadRequestException('There is no next question to start');
    return this.advanceParticipant(session, participant);
  }

  shootArchery(pin: string, participantId: string, x: number, y: number) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    const game = session.archery;
    if (session.phase !== 'question' || !participant?.archery || !participant.betweenQuestions || !game) throw new BadRequestException('Archery is available between questions');
    if (!Number.isInteger(x) || !Number.isInteger(y) || Math.abs(x) > 100 || Math.abs(y) > 100) throw new BadRequestException('Aim within the target');
    if (participant.archery.arrows < 1) throw new BadRequestException('Answer a question correctly to earn an arrow');
    participant.archery.arrows -= 1;
    const arrow: ArcheryArrow = { id: randomUUID(), participantId: participant.id, participantName: participant.name, x, y, score: this.archeryScore(x, y) };
    participant.archery.lastShot = arrow;
    game.arrows.push(arrow);
    return this.archeryState(game, participant);
  }

  nextArcheryQuestion(pin: string, participantId: string) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    if (session.phase !== 'question' || session.mode !== 'archery' || !participant?.archery || !participant.betweenQuestions) throw new BadRequestException('There is no next question to start');
    return this.advanceParticipant(session, participant);
  }

  releaseCurlingStone(pin: string, participantId: string, direction: number, speed: number) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    const game = session.curling;
    if (session.phase !== 'question' || !participant?.curling || !participant.betweenQuestions || !game) throw new BadRequestException('Curling is available between questions');
    if (!Number.isInteger(direction) || !Number.isInteger(speed) || Math.abs(direction) > 100 || speed < 0 || speed > 100) throw new BadRequestException('Choose a direction and speed on the sheet');
    if (participant.curling.stones < 1) throw new BadRequestException('Answer a question correctly to earn a stone');
    participant.curling.stones -= 1;
    // Each stone has its own final resting point. There is deliberately no
    // collision resolution: stones may overlap without affecting one another.
    const stone: CurlingStone = { id: randomUUID(), participantId: participant.id, participantName: participant.name, direction, speed, ...this.curlingLanding(direction, speed) };
    participant.curling.lastStone = stone;
    game.stones.push(stone);
    return this.curlingState(game, participant);
  }

  nextCurlingQuestion(pin: string, participantId: string) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    if (session.phase !== 'question' || session.mode !== 'curling' || !participant?.curling || !participant.betweenQuestions) throw new BadRequestException('There is no next question to start');
    return this.advanceParticipant(session, participant);
  }

  startSimon(pin: string, participantId: string) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    const simon = participant?.simon;
    if (session.phase !== 'question' || !participant || !simon || !participant.betweenQuestions) throw new BadRequestException('Simon is available between questions');
    if (simon.playing) throw new BadRequestException('Finish the current Simon pattern first');
    if (simon.tokens < 1) throw new BadRequestException('Answer a question correctly to earn a Simon token');
    simon.progress = 0;
    simon.playing = true;
    return this.simonState(session, participant);
  }

  playSimonColor(pin: string, participantId: string, color: number) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    const simon = participant?.simon;
    if (session.phase !== 'question' || !participant || !simon || !participant.betweenQuestions || !simon.playing) throw new BadRequestException('Start a Simon turn before selecting a color');
    if (!Number.isInteger(color) || color < 0 || color > 5) throw new BadRequestException('Choose a Simon color');
    if (simon.sequence[simon.progress] !== color) {
      simon.tokens -= 1;
      simon.progress = 0;
      simon.playing = false;
      return { ...this.simonState(session, participant), correct: false, completedLevel: false };
    }
    simon.progress += 1;
    if (simon.progress === simon.sequence.length) {
      simon.tokens -= 1;
      simon.highScore = Math.max(simon.highScore, simon.sequence.length);
      simon.sequence.push(randomInt(6));
      simon.progress = 0;
      simon.playing = simon.tokens > 0;
      return { ...this.simonState(session, participant), correct: true, completedLevel: true };
    }
    return { ...this.simonState(session, participant), correct: true, completedLevel: false };
  }

  nextSimonQuestion(pin: string, participantId: string) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    if (session.phase !== 'question' || session.mode !== 'simon' || !participant?.simon || !participant.betweenQuestions) throw new BadRequestException('There is no next question to start');
    if (participant.simon.playing) throw new BadRequestException('Finish the current Simon turn before continuing');
    return this.advanceParticipant(session, participant);
  }

  rollSnakesLadders(pin: string, participantId: string) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    const game = session.snakesLadders;
    const player = participant?.snakesLadders;
    if (session.phase !== 'question' || !participant || !player || !game || !participant.betweenQuestions) throw new BadRequestException('Snakes & Ladders is available between questions');
    if (player.rolls < 1) throw new BadRequestException('Answer a question correctly to earn a dice roll');
    const roll = randomInt(1, 7), from = player.position, landed = Math.min(game.trackLength, from + roll), to = game.jumps.get(landed) ?? landed;
    player.rolls -= 1;
    player.position = to;
    player.lastRoll = roll;
    game.lastMove = { id: randomUUID(), participantId: participant.id, participantName: participant.name, roll, from, landed, to };
    game.recentMoves.push(game.lastMove);
    if (game.recentMoves.length > 500) game.recentMoves.splice(0, game.recentMoves.length - 500);
    return this.snakesLaddersState(session, participant);
  }

  nextSnakesLaddersQuestion(pin: string, participantId: string) {
    const session = this.getByPin(pin), participant = session.participants.get(participantId);
    if (session.phase !== 'question' || session.mode !== 'snakes_ladders' || !participant?.snakesLadders || !participant.betweenQuestions) throw new BadRequestException('There is no next question to start');
    return this.advanceParticipant(session, participant);
  }

  digTreasureMap(pin: string, participantId: string, cell: number) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    const map = session.treasureMap;
    if (session.phase !== 'question' || !participant?.treasureMap || !participant.betweenQuestions || !map) throw new BadRequestException('Treasure Map is available between questions');
    if (!Number.isInteger(cell) || cell < 0 || cell >= map.size ** 2) throw new BadRequestException('Choose a square on the map');
    if (participant.treasureMap.tokens < 1) throw new BadRequestException('Earn a scout token by answering a question correctly');
    if (map.completionId) throw new BadRequestException('The treasure has already been found');
    if (map.blockedCells.has(cell)) throw new BadRequestException('Streams cannot be explored');
    if (map.digs.has(cell)) throw new BadRequestException('That square has already been explored');
    participant.treasureMap.tokens -= 1;
    const found = cell === map.treasureCell;
    const hint = found ? 'Treasure found!' : this.treasureHint(map, cell);
    map.digs.set(cell, { result: found ? 'treasure' : 'clue', hint });
    map.lastDig = { id: randomUUID(), cell, participantName: participant.name };
    if (found) {
      map.completionId = randomUUID();
      this.scheduleBoardReset(session);
    }
    return this.treasureMapState(map, participant);
  }

  nextTreasureMapQuestion(pin: string, participantId: string) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    if (session.phase !== 'question' || session.mode !== 'treasure_map' || !participant?.treasureMap || !participant.betweenQuestions) throw new BadRequestException('There is no next question to start');
    return this.advanceParticipant(session, participant);
  }

  nextQuestion(pin: string, participantId: string) {
    const session = this.getByPin(pin);
    const participant = session.participants.get(participantId);
    if (session.phase !== 'question' || session.mode === 'facilitated' || !participant || participant.completedAt) throw new BadRequestException('There is no next question to start');
    const question = participant.questions[participant.currentQuestionIndex];
    if (!question || (question.itemType === 'question' && !participant.answers.has(question.id) && !this.hasTimedOut(participant, question))) throw new BadRequestException('Answer the current question before moving on');
    return this.advanceParticipant(session, participant);
  }

  private advanceParticipant(session: ModeratedSession, participant: Participant) {
    // Token-game actions intentionally never call this themselves, including
    // when they spend a player's last token. Every live mode keeps the player
    // on its game screen until they explicitly choose its Next question action.
    participant.betweenQuestions = false;
    if (participant.matching) participant.matching.selectedCard = null;
    this.openParticipantQuestion(session, participant);
    return { advanced: true };
  }

  private matchingState(matching: SharedMatchingGame, player?: MatchingGame, participantId?: string, includeSuccessName = false) {
    const selectedCard = player?.selectedCard;
    const visibleAttempt = matching.attempt && (!participantId || matching.attempt.isMatch || matching.attempt.participantId === participantId) ? matching.attempt : null;
    return {
      credits: player?.credits ?? null,
      score: player?.score ?? null,
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
        playerName: includeSuccessName && visibleAttempt.isMatch ? visibleAttempt.participantName : undefined,
      } : null,
      complete: matching.completionId !== null,
      completionId: matching.completionId,
    };
  }

  private battleshipState(game: SharedBattleshipGame, player?: Participant, includeSuccessName = false) {
    return {
      size: game.size,
      tokens: player?.battleship?.tokens ?? null,
      score: player?.battleship?.score ?? null,
      shipCells: game.shipCells.size,
      hits: [...game.attacks.values()].filter((result) => result === 'hit').length,
      cells: Array.from({ length: game.size ** 2 }, (_, id) => ({ result: game.attacks.get(id) ?? null })),
      lastHit: includeSuccessName ? game.lastHit : null,
      complete: game.completionId !== null,
      completionId: game.completionId,
    };
  }

  private gameLeaderboard(session: ModeratedSession) {
    if (session.mode !== 'matching' && session.mode !== 'battleship') return [];
    return [...session.participants.values()]
      .map((participant) => ({
        id: participant.id,
        name: participant.name,
        score: session.mode === 'matching' ? participant.matching?.score ?? 0 : participant.battleship?.score ?? 0,
      }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }

  private treasureMapState(map: SharedTreasureMap, player?: Participant, includeSuccessName = false) {
    return {
      size: map.size,
      tokens: player?.treasureMap?.tokens ?? null,
      cells: Array.from({ length: map.size ** 2 }, (_, id) => {
        const dig = map.digs.get(id);
        return { result: dig?.result ?? null, hint: dig?.hint ?? null, terrain: map.blockedCells.has(id) ? 'stream' : 'land' };
      }),
      lastDig: includeSuccessName ? map.lastDig : null,
      complete: map.completionId !== null,
      completionId: map.completionId,
    };
  }

  private archeryState(game: SharedArcheryGame, player?: Participant, includeNames = false) {
    const byScore = (a: ArcheryArrow, b: ArcheryArrow) => b.score - a.score || a.participantName.localeCompare(b.participantName);
    const playerAttempts = player
      ? game.arrows.filter((arrow) => arrow.participantId === player.id)
      : [];
    const sharedBestAttempts = includeNames
      ? [...game.arrows.reduce((byParticipant, arrow) => {
          const attempts = byParticipant.get(arrow.participantId) ?? [];
          attempts.push(arrow);
          byParticipant.set(arrow.participantId, attempts);
          return byParticipant;
        }, new Map<string, ArcheryArrow[]>()).values()]
          .flatMap((attempts) => attempts.sort(byScore).slice(0, 3))
          .sort(byScore)
      : [];
    return {
      arrows: player?.archery?.arrows ?? null,
      lastShot: player?.archery?.lastShot ? { id: player.archery.lastShot.id, x: player.archery.lastShot.x, y: player.archery.lastShot.y, score: player.archery.lastShot.score } : null,
      attempts: (player ? playerAttempts : sharedBestAttempts)
        .sort(byScore)
        .map((arrow) => ({ id: arrow.id, x: arrow.x, y: arrow.y, score: arrow.score, participantName: includeNames ? arrow.participantName : undefined })),
    };
  }

  private curlingState(game: SharedCurlingGame, player?: Participant, includeNames = false) {
    const byScore = (a: CurlingStone, b: CurlingStone) => b.score - a.score || a.participantName.localeCompare(b.participantName);
    const playerAttempts = player ? game.stones.filter((stone) => stone.participantId === player.id) : [];
    const sharedBestAttempts = includeNames
      ? [...game.stones.reduce((byParticipant, stone) => {
          const attempts = byParticipant.get(stone.participantId) ?? [];
          attempts.push(stone);
          byParticipant.set(stone.participantId, attempts);
          return byParticipant;
        }, new Map<string, CurlingStone[]>()).values()].flatMap((attempts) => attempts.sort(byScore).slice(0, 3)).sort(byScore)
      : [];
    const publicStone = (stone: CurlingStone) => ({ id: stone.id, direction: stone.direction, speed: stone.speed, x: stone.x, y: stone.y, score: stone.score, participantName: includeNames ? stone.participantName : undefined });
    return {
      stones: player?.curling?.stones ?? null,
      lastStone: player?.curling?.lastStone ? publicStone(player.curling.lastStone) : null,
      attempts: (player ? playerAttempts : sharedBestAttempts).sort(byScore).map(publicStone),
    };
  }

  private newSimonPlayer(): SimonPlayer {
    return { tokens: 0, sequence: [randomInt(6)], progress: 0, highScore: 0, playing: false };
  }

  private simonState(session: ModeratedSession, player?: Participant) {
    const leaderboard = [...session.participants.values()]
      .filter((participant) => participant.simon)
      .map((participant) => ({ id: participant.id, name: participant.name, score: participant.simon!.highScore }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    const highScore = leaderboard[0]?.score ?? 0;
    return {
      tokens: player?.simon?.tokens ?? null,
      sequence: player?.simon?.sequence ?? [],
      progress: player?.simon?.progress ?? 0,
      playing: player?.simon?.playing ?? false,
      highScore: player?.simon?.highScore ?? highScore,
      classHighScore: highScore,
      leaderboard,
    };
  }

  private snakesLaddersState(session: ModeratedSession, player?: Participant) {
    const game = session.snakesLadders!;
    const players = [...session.participants.values()].filter((participant) => participant.snakesLadders)
      .map((participant) => ({ id: participant.id, name: participant.name, position: participant.snakesLadders!.position }))
      .sort((a, b) => b.position - a.position || a.name.localeCompare(b.name));
    return { trackLength: game.trackLength, jumps: [...game.jumps.entries()].map(([from, to]) => ({ from, to })), rolls: player?.snakesLadders?.rolls ?? null, position: player?.snakesLadders?.position ?? null, lastRoll: player?.snakesLadders?.lastRoll ?? null, players, lastMove: game.lastMove, recentMoves: player ? [] : game.recentMoves };
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
    if (session.boardResetAt && Date.now() >= session.boardResetAt.getTime()) this.startNewBoard(session);
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
      if (matching.matchedCards.size === matching.cards.length) {
        matching.completionId = randomUUID();
        this.scheduleBoardReset(session);
      }
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
    return [4, 3];
  }

  private supportedMatchingPairCount(pairCount: number) {
    return [2, 4, 6, 8, 18, 32].includes(pairCount) ? pairCount : 32;
  }

  private supportedTrackLength(length: number) { return [30, 50, 80, 100].includes(length) ? length : 30; }

  private newSnakesLaddersPlayer(): SnakesLaddersPlayer { return { rolls: 0, position: 0, lastRoll: null }; }

  private newSnakesLaddersGame(trackLength: number): SharedSnakesLaddersGame {
    const length = this.supportedTrackLength(trackLength), jumps = new Map<number, number>();
    const add = (from: number, to: number) => { if (from > 0 && to > 0 && from < length && to < length) jumps.set(from, to); };
    // These endpoints share a column on the alternating, winding track.
    const ladders: Record<number, [number, number][]> = {
      30: [[4, 9], [14, 23], [21, 28]],
      50: [[6, 15], [23, 38], [37, 44]],
      80: [[6, 26], [23, 43], [47, 54], [62, 79]],
      100: [[6, 26], [23, 43], [47, 67], [62, 79], [83, 98]],
    };
    for (const [from, to] of ladders[length]) add(from, to);
    add(Math.round(length * .28), Math.round(length * .08));
    add(Math.round(length * .64), Math.round(length * .38));
    add(Math.round(length * .9), Math.round(length * .58));
    if (length === 80) add(66, 42);
    if (length === 100) add(76, 55);
    return { trackLength: length, jumps, lastMove: null, recentMoves: [] };
  }

  private questionsForMode(questions: SessionQuestion[], mode: ModeratedSession['mode']) {
    return mode === 'matching' || mode === 'battleship' || mode === 'treasure_map' || mode === 'archery' || mode === 'curling' || mode === 'simon' || mode === 'snakes_ladders' ? questions.filter((item) => item.itemType === 'question') : questions;
  }

  private activeQuestions(session: ModeratedSession) {
    return this.questionsForMode(session.quiz.questions, session.mode);
  }

  private newPointScore(): PointScore {
    return { points: 0, streak: 0, maxStreak: 0, lastAward: null };
  }

  private newMatchingGame(pairCount: number, seed: string): SharedMatchingGame {
    const supportedPairCount = this.supportedMatchingPairCount(pairCount);
    const [columns, rows] = this.matchingGridDimensions(supportedPairCount);
    return {
      cards: this.shuffle([...MATCHING_SYMBOLS.slice(0, supportedPairCount), ...MATCHING_SYMBOLS.slice(0, supportedPairCount)], seed),
      columns,
      rows,
      matchedCards: new Set<number>(),
      attempt: null,
      completionId: null,
    };
  }

  private newBattleshipGame(size: number, seed: string): SharedBattleshipGame {
    const cells = new Set<number>();
    const shipLengths = size === 6 ? [3, 2, 2] : size === 8 ? [4, 3, 2, 2] : [5, 4, 3, 3, 2];
    let state = [...seed].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 0) || 1;
    const next = () => { state = (state * 1664525 + 1013904223) >>> 0; return state; };
    const placementsFor = (length: number) => {
      const placements: number[][] = [];
      for (const horizontal of [true, false]) for (let row = 0; row < size; row += 1) for (let column = 0; column < size; column += 1) {
        if ((horizontal && column + length > size) || (!horizontal && row + length > size)) continue;
        placements.push(Array.from({ length }, (_, index) => horizontal ? row * size + column + index : (row + index) * size + column));
      }
      // Keep boards varied while preserving repeatability for a given seed.
      for (let index = placements.length - 1; index > 0; index -= 1) {
        const swap = next() % (index + 1);
        [placements[index], placements[swap]] = [placements[swap], placements[index]];
      }
      return placements;
    };
    const hasBuffer = (ship: number[]) => ship.some((cell) => {
      const row = Math.floor(cell / size), column = cell % size;
      for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        const neighborRow = row + rowOffset, neighborColumn = column + columnOffset;
        if (neighborRow >= 0 && neighborRow < size && neighborColumn >= 0 && neighborColumn < size && cells.has(neighborRow * size + neighborColumn)) return true;
      }
      return false;
    });
    const placeFleet = (shipIndex: number): boolean => {
      if (shipIndex === shipLengths.length) return true;
      for (const ship of placementsFor(shipLengths[shipIndex])) {
        if (hasBuffer(ship)) continue;
        ship.forEach((cell) => cells.add(cell));
        if (placeFleet(shipIndex + 1)) return true;
        ship.forEach((cell) => cells.delete(cell));
      }
      return false;
    };
    if (!placeFleet(0)) throw new Error(`Could not place a buffered Battleship fleet on a ${size}×${size} board`);
    return { size, shipCells: cells, attacks: new Map(), lastHit: null, completionId: null };
  }

  private newTreasureMap(seed: string): SharedTreasureMap {
    const size = 14;
    let state = [...seed].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 0) || 1;
    const next = () => { state = (state * 1664525 + 1013904223) >>> 0; return state; };
    const blockedCells = new Set<number>();
    let streamColumn = 3 + (next() % 8);
    for (let row = 0; row < size; row += 1) {
      blockedCells.add(row * size + streamColumn);
      // Hold a direction for a couple of rows, then make a one-tile bend.
      // Adding the destination on this row keeps every bend connected instead
      // of leaving diagonal or detached water tiles.
      if (row % 2 === 1 && row < size - 1) {
        const nextColumn = Math.max(2, Math.min(size - 3, streamColumn + ((next() % 3) - 1)));
        if (nextColumn !== streamColumn) blockedCells.add(row * size + nextColumn);
        streamColumn = nextColumn;
      }
    }
    const landCells = Array.from({ length: size ** 2 }, (_, id) => id).filter((id) => !blockedCells.has(id));
    return { size, treasureCell: landCells[next() % landCells.length], blockedCells, digs: new Map(), lastDig: null, completionId: null };
  }

  private newArcheryGame(): SharedArcheryGame { return { arrows: [] }; }

  private newCurlingGame(): SharedCurlingGame { return { stones: [] }; }

  private archeryScore(x: number, y: number) {
    const distance = Math.sqrt((x * x) + (y * y));
    // Every fraction closer to the bullseye counts. An exact center is 1000.
    return Math.max(1, Math.round(1000 - (distance * 10)));
  }

  private curlingLanding(direction: number, speed: number) {
    // A straight stone at the marked 85% pace reaches the button at (0, -32). Direction
    // controls lateral travel and speed controls how far up the sheet it goes.
    const x = Math.round(direction * (speed / 100) * 1.2);
    const y = Math.round(100 - (speed * 1.55));
    const distance = Math.sqrt((x * x) + ((y + 32) * (y + 32)));
    return { x, y, score: Math.max(1, Math.round(1000 - (distance * 8))) };
  }

  private treasureHint(map: SharedTreasureMap, cell: number) {
    const { size, treasureCell } = map;
    const row = Math.floor(cell / size), column = cell % size;
    const treasureRow = Math.floor(treasureCell / size), treasureColumn = treasureCell % size;
    const distance = Math.max(Math.abs(treasureRow - row), Math.abs(treasureColumn - column));
    const clueType = map.digs.size % 5;
    if (clueType === 1) {
      const region = treasureRow < Math.floor(size / 3) ? 'northern' : treasureRow >= Math.ceil(size * 2 / 3) ? 'southern' : 'central';
      return `A torn map says the treasure is in the ${region} third of the island.`;
    }
    if (clueType === 2) {
      const region = treasureColumn < Math.floor(size / 3) ? 'western' : treasureColumn >= Math.ceil(size * 2 / 3) ? 'eastern' : 'central';
      return `A landmark clue places the treasure in the ${region} third of the island.`;
    }
    if (clueType === 3 && map.lastDig) {
      const previousRow = Math.floor(map.lastDig.cell / size), previousColumn = map.lastDig.cell % size;
      const previousDistance = Math.max(Math.abs(treasureRow - previousRow), Math.abs(treasureColumn - previousColumn));
      const previousCoordinate = `${String.fromCharCode(65 + previousColumn)}${previousRow + 1}`;
      return distance < previousDistance ? `The sand is warmer than at ${previousCoordinate}.` : distance > previousDistance ? `The sand is colder than at ${previousCoordinate}.` : `The sand feels just as warm as at ${previousCoordinate}.`;
    }
    if (clueType === 4) return `The treasure is on an ${treasureRow % 2 === 0 ? 'odd' : 'even'}-numbered row.`;
    const vertical = treasureRow < row ? 'north' : treasureRow > row ? 'south' : '';
    const horizontal = treasureColumn < column ? 'west' : treasureColumn > column ? 'east' : '';
    const direction = [vertical, horizontal].filter(Boolean).join('-');
    return `The treasure is ${direction}.`;
  }

  private boardComplete(session: ModeratedSession) {
    return Boolean(session.matching?.completionId || session.battleship?.completionId || session.treasureMap?.completionId);
  }

  private scheduleBoardReset(session: ModeratedSession) {
    if (session.autoBoardReset) session.boardResetAt = new Date(Date.now() + 4000);
  }

  private startNewBoard(session: ModeratedSession) {
    if (session.mode === 'matching') {
      session.matching = this.newMatchingGame(session.quiz.matchingPairCount, randomUUID());
      for (const participant of session.participants.values()) if (participant.matching) participant.matching = { credits: 0, selectedCard: null, score: participant.matching.score };
    } else if (session.mode === 'battleship') {
      session.battleship = this.newBattleshipGame(session.quiz.battleshipBoardSize, randomUUID());
      for (const participant of session.participants.values()) if (participant.battleship) participant.battleship = { tokens: 0, score: participant.battleship.score };
    } else if (session.mode === 'treasure_map') {
      session.treasureMap = this.newTreasureMap(randomUUID());
      for (const participant of session.participants.values()) if (participant.treasureMap) participant.treasureMap = { tokens: 0 };
    }
    session.boardResetAt = null;
  }

  private createPin() {
    for (let attempts = 0; attempts < 100; attempts += 1) {
      const pin = String(randomInt(1_000_000)).padStart(6, '0');
      if (!this.sessionsByPin.has(pin)) return pin;
    }
    throw new BadRequestException('Could not create a unique join PIN. Please try again.');
  }

  private authorize(sessionId: string, user: AuthUser) {
    const session = this.get(sessionId);
    if (session.ownerId !== user.id && !user.canViewAllQuizzes) throw new ForbiddenException('You do not have access to this live quiz');
    return session;
  }

  private redactParticipantNames<T>(value: T, aliases: Map<string, string>): T {
    if (Array.isArray(value)) return value.map((item) => this.redactParticipantNames(item, aliases)) as T;
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key,
      (key === 'name' || key === 'participantName' || key === 'playerName') && typeof item === 'string' ? aliases.get(item) ?? item : this.redactParticipantNames(item, aliases),
    ])) as T;
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

  private queueEndlessReinforcement(session: ModeratedSession, participant: Participant, question: SessionQuestion) {
    const questionPool = session.quiz.questions.filter((item) => item.itemType === 'question');
    const futureQuestions = () => participant.questions.slice(participant.currentQuestionIndex + 1).filter((item) => item.itemType === 'question');

    // Keep enough upcoming questions in the personal queue that both review
    // attempts can be placed within the next ten questions, even for a
    // one-question quiz.
    while (futureQuestions().length < 10) {
      participant.questions.push(...this.shuffle(questionPool, randomUUID()).map((item) => ({ ...item, id: randomUUID() })));
    }

    const positions = new Set<number>();
    while (positions.size < 2) positions.add(randomInt(10));
    for (const position of [...positions].sort((left, right) => left - right)) {
      const upcoming = futureQuestions();
      const before = upcoming[position];
      const insertAt = participant.questions.indexOf(before, participant.currentQuestionIndex + 1);
      participant.questions.splice(insertAt, 0, { ...question, id: randomUUID() });
    }
  }

  private clearParticipantTimer(participant: Participant) {
    if (!participant.autoAdvanceTimer) return;
    clearTimeout(participant.autoAdvanceTimer);
    participant.autoAdvanceTimer = null;
  }

  private onParticipantQuestionTimedOut(session: ModeratedSession, participant: Participant, question: SessionQuestion) {
    if (session.mode === 'matching' || session.mode === 'battleship' || session.mode === 'archery' || session.mode === 'curling' || question.itemType === 'game') {
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
