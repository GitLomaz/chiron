"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeratedService = void 0;
var special_1 = require("../question-types/special");
var answer_matching_1 = require("../question-types/answer-matching");
var common_1 = require("@nestjs/common");
var crypto_1 = require("crypto");
var MATCHING_SYMBOLS = ['🍎', '🍌', '🍇', '🍓', '🍍', '🍉', '🍒', '🥝', '🍑', '🍐', '🍋', '🍊', '🍈', '🥭', '🍅', '🥕', '🌽', '🥑', '🥦', '🥥', '🍄', '🌶️', '🫐', '🍓‍❄️', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄', '🐝', '🦋', '🐢', '🐬', '🐳', '🦉', '🦜', '🦖', '🌈', '⭐'];
var ModeratedService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ModeratedService = _classThis = /** @class */ (function () {
        function ModeratedService_1(prisma) {
            this.prisma = prisma;
            this.sessions = new Map();
            this.sessionsByPin = new Map();
        }
        ModeratedService_1.prototype.listActive = function (user) {
            var _this = this;
            return __spreadArray([], this.sessions.values(), true).filter(function (session) {
                _this.expire(session);
                return (session.ownerId === user.id || user.canViewAllQuizzes) && session.phase !== 'complete';
            }).map(function (session) {
                var _a, _b;
                return ({
                    sessionId: session.id, title: session.quiz.title, pin: session.pin,
                    mode: session.mode, phase: session.phase, participantCount: session.participants.size,
                    createdAt: session.createdAt.toISOString(), endsAt: (_b = (_a = session.endsAt) === null || _a === void 0 ? void 0 : _a.toISOString()) !== null && _b !== void 0 ? _b : null,
                });
            });
        };
        ModeratedService_1.prototype.create = function (quizId_1) {
            return __awaiter(this, arguments, void 0, function (quizId, mode, durationSeconds, endless, scoringEnabled, user) {
                var quiz, id, facilitatorToken, pin, authoredQuestions, activeQuestions, matchingPairCount, battleshipBoardSize, creditEveryCorrectAnswers, session;
                var _this = this;
                var _a, _b, _c;
                if (mode === void 0) { mode = 'classic'; }
                if (endless === void 0) { endless = false; }
                if (scoringEnabled === void 0) { scoringEnabled = true; }
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            if (endless && mode === 'facilitated')
                                throw new common_1.BadRequestException('Endless mode is not available for facilitated tests');
                            return [4 /*yield*/, this.prisma.quiz.findUnique({
                                    where: user.canViewAllQuizzes ? { id: quizId } : { id: quizId, ownerId: user.id },
                                    include: { questions: { where: { isEnabled: true, OR: [{ itemType: 'question' }, { itemType: 'text' }, { itemType: 'game', gameType: { in: ['coin_catch', 'match_pairs', 'tower_stack'] } }] }, orderBy: { position: 'asc' } } },
                                })];
                        case 1:
                            quiz = _d.sent();
                            if (!quiz)
                                throw new common_1.NotFoundException("Quiz ".concat(quizId, " was not found"));
                            if (!quiz.questions.length)
                                throw new common_1.BadRequestException('Enable at least one question before creating a moderated test');
                            id = (0, crypto_1.randomUUID)();
                            facilitatorToken = user.id;
                            pin = this.createPin();
                            authoredQuestions = quiz.questions.map(function (question) {
                                var _a, _b;
                                if (question.itemType === 'game')
                                    return { id: String(question.id), text: question.text, itemType: 'game', gameType: question.gameType, correctAnswer: '', options: [], timerSeconds: (_a = question.gameDurationSeconds) !== null && _a !== void 0 ? _a : 20 };
                                if (question.itemType === 'text')
                                    return { id: String(question.id), text: question.text, itemType: 'text', gameType: null, correctAnswer: '', options: [], timerSeconds: null };
                                var special = (0, special_1.specialQuestion)(question.options);
                                var options = Array.isArray(question.options) ? question.options.filter(function (value) { return typeof value === 'string'; }) : [];
                                var wrongAnswers = __spreadArray([], new Set(options.filter(function (option) { return option !== question.correctAnswer; })), true);
                                var count = Math.min((_b = question.answerCount) !== null && _b !== void 0 ? _b : wrongAnswers.length + 1, wrongAnswers.length + 1);
                                // Every participant sees the same frozen options, and the correct option
                                // is always included even when a question draws only part of an answer pool.
                                return {
                                    id: String(question.id), text: question.text,
                                    special: special,
                                    itemType: 'question', gameType: null,
                                    correctAnswer: question.correctAnswer,
                                    timerSeconds: _this.effectiveTimer(question.timerSeconds, quiz.defaultTimerSeconds),
                                    options: (special === null || special === void 0 ? void 0 : special.kind) === 'true_false' ? ['True', 'False'] : (special === null || special === void 0 ? void 0 : special.kind) === 'matching' || (special === null || special === void 0 ? void 0 : special.kind) === 'short_answer' ? [] : _this.shuffle(__spreadArray([question.correctAnswer], _this.shuffle(wrongAnswers, "".concat(id, "-").concat(question.id, "-wrong")).slice(0, count - 1), true), "".concat(id, "-").concat(question.id)),
                                };
                            });
                            activeQuestions = this.questionsForMode(authoredQuestions, mode);
                            if (!activeQuestions.length)
                                throw new common_1.BadRequestException('Enable at least one question before creating this test');
                            if (endless && !activeQuestions.some(function (item) { return item.itemType === 'question'; }))
                                throw new common_1.BadRequestException('Enable at least one question for endless mode');
                            matchingPairCount = this.supportedMatchingPairCount((_a = quiz.matchingPairCount) !== null && _a !== void 0 ? _a : 6);
                            battleshipBoardSize = (_b = quiz.battleshipBoardSize) !== null && _b !== void 0 ? _b : 10;
                            creditEveryCorrectAnswers = (_c = quiz.creditEveryCorrectAnswers) !== null && _c !== void 0 ? _c : 1;
                            session = {
                                id: id,
                                ownerId: user.id,
                                pin: pin,
                                facilitatorToken: facilitatorToken,
                                mode: mode,
                                endless: endless,
                                scoringEnabled: scoringEnabled,
                                currentRoundIndex: -1, randomizeQuestionOrder: quiz.randomizeQuestionOrder,
                                quiz: { title: quiz.title, description: quiz.description, theme: quiz.theme, answerMatching: quiz.answerMatching === 'exact' ? 'exact' : 'close', matchingPairCount: matchingPairCount, battleshipBoardSize: battleshipBoardSize, creditEveryCorrectAnswers: creditEveryCorrectAnswers, questions: authoredQuestions },
                                phase: 'lobby', endedByTeacher: false, expired: false,
                                durationSeconds: durationSeconds,
                                endsAt: null, lobbyLocked: false, presentationMode: mode === 'matching' ? 'matching' : mode === 'battleship' ? 'battleship' : mode === 'treasure_map' ? 'treasure_map' : mode === 'archery' ? 'archery' : mode === 'curling' ? 'curling' : 'scores',
                                matching: mode === 'matching' ? this.newMatchingGame(matchingPairCount, (0, crypto_1.randomUUID)()) : null,
                                battleship: mode === 'battleship' ? this.newBattleshipGame(battleshipBoardSize, id) : null,
                                treasureMap: mode === 'treasure_map' ? this.newTreasureMap(id) : null,
                                archery: mode === 'archery' ? this.newArcheryGame() : null,
                                curling: mode === 'curling' ? this.newCurlingGame() : null,
                                autoBoardReset: false, boardResetAt: null,
                                participants: new Map(), bannedClientIds: new Set(), createdAt: new Date(),
                            };
                            this.sessions.set(id, session);
                            this.sessionsByPin.set(pin, session);
                            return [2 /*return*/, { sessionId: id, facilitatorToken: facilitatorToken, pin: pin, phase: 'lobby' }];
                    }
                });
            });
        };
        ModeratedService_1.prototype.studentState = function (pin, participantId, clientId) {
            var _a, _b, _c, _d, _e, _f, _g;
            var session = this.getByPin(pin);
            var participant = participantId ? session.participants.get(participantId) : undefined;
            var question = session.phase === 'question' && participant && !participant.completedAt ? participant.questions[participant.currentQuestionIndex] : undefined;
            var answer = question && participant ? participant.answers.get(question.id) : undefined;
            return {
                pin: session.pin,
                mode: session.mode,
                endless: session.endless,
                scoringEnabled: session.scoringEnabled,
                title: session.quiz.title,
                description: session.quiz.description,
                theme: session.quiz.theme,
                phase: (participant === null || participant === void 0 ? void 0 : participant.completedAt) ? 'complete' : session.phase,
                endedByTeacher: session.endedByTeacher,
                expired: session.expired,
                endsAt: (_b = (_a = session.endsAt) === null || _a === void 0 ? void 0 : _a.toISOString()) !== null && _b !== void 0 ? _b : null,
                removed: Boolean(clientId && session.bannedClientIds.has(clientId)),
                participant: participant ? { id: participant.id, name: participant.name } : null,
                score: participant ? this.score(session, participant) : null,
                matching: session.matching && (participant === null || participant === void 0 ? void 0 : participant.matching) ? this.matchingState(session.matching, participant.matching, participant.id) : null,
                battleship: session.battleship && participant ? this.battleshipState(session.battleship, participant) : null,
                treasureMap: session.treasureMap && participant ? this.treasureMapState(session.treasureMap, participant) : null,
                archery: session.archery && participant ? this.archeryState(session.archery, participant) : null,
                curling: session.curling && participant ? this.curlingState(session.curling, participant) : null,
                gameLeaderboard: this.gameLeaderboard(session),
                betweenQuestions: (_c = participant === null || participant === void 0 ? void 0 : participant.betweenQuestions) !== null && _c !== void 0 ? _c : false,
                currentQuestion: question ? __assign(__assign({}, this.publicQuestion(question)), { matchProgress: (_d = participant === null || participant === void 0 ? void 0 : participant.matchProgress.get(question.id)) !== null && _d !== void 0 ? _d : null, number: participant.currentQuestionIndex + 1, total: this.activeQuestions(session).length, answered: answer !== undefined, gameScore: question.itemType === 'game' && participant ? (_e = participant.gameScores.get(question.id)) !== null && _e !== void 0 ? _e : 0 : null, result: answer === undefined ? null : { answer: answer, correctAnswer: question.correctAnswer, isCorrect: answer === question.correctAnswer }, timedOut: answer === undefined && this.hasTimedOut(participant, question), timerEndsAt: answer === undefined ? (_g = (_f = this.timerEndsAt(participant, question)) === null || _f === void 0 ? void 0 : _f.toISOString()) !== null && _g !== void 0 ? _g : null : null }) : null,
            };
        };
        ModeratedService_1.prototype.facilitatorState = function (sessionId, user) {
            var _this = this;
            var _a, _b, _c, _d;
            var session = this.authorize(sessionId, user);
            var participants = __spreadArray([], session.participants.values(), true);
            var state = {
                sessionId: session.id, pin: session.pin, title: session.quiz.title, description: session.quiz.description, phase: session.phase, endedByTeacher: session.endedByTeacher, expired: session.expired, endsAt: (_b = (_a = session.endsAt) === null || _a === void 0 ? void 0 : _a.toISOString()) !== null && _b !== void 0 ? _b : null, durationSeconds: session.durationSeconds, lobbyLocked: session.lobbyLocked, presentationMode: session.presentationMode, mode: session.mode, endless: session.endless, scoringEnabled: session.scoringEnabled, currentRound: session.currentRoundIndex + 1, autoBoardReset: session.autoBoardReset, boardResetAt: (_d = (_c = session.boardResetAt) === null || _c === void 0 ? void 0 : _c.toISOString()) !== null && _d !== void 0 ? _d : null,
                questionCount: this.activeQuestions(session).length,
                matching: session.matching ? this.matchingState(session.matching, undefined, undefined, true) : null,
                battleship: session.battleship ? this.battleshipState(session.battleship, undefined, true) : null,
                treasureMap: session.treasureMap ? this.treasureMapState(session.treasureMap, undefined, true) : null,
                archery: session.archery ? this.archeryState(session.archery, undefined, true) : null,
                curling: session.curling ? this.curlingState(session.curling, undefined, true) : null,
                completedCount: participants.filter(function (participant) { return participant.completedAt !== null; }).length,
                participants: participants.map(function (participant) { return ({
                    id: participant.id,
                    name: participant.name,
                    completed: participant.completedAt !== null,
                    completedItems: Math.max(0, participant.currentQuestionIndex),
                    currentItemType: participant.completedAt || participant.currentQuestionIndex < 0 ? null : participant.questions[participant.currentQuestionIndex].itemType,
                    currentAnswered: participant.currentQuestionIndex >= 0 && participant.currentQuestionIndex < participant.questions.length && participant.answers.has(participant.questions[participant.currentQuestionIndex].id),
                    score: _this.score(session, participant),
                }); }),
                scoreLeaderboard: participants
                    .map(function (participant) {
                    var score = _this.score(session, participant);
                    return { id: participant.id, name: participant.name, score: participant.pointScore.points, correct: score.correct, answered: score.answered, longestStreak: participant.pointScore.maxStreak };
                })
                    .sort(function (a, b) { return (session.scoringEnabled ? b.score - a.score : b.correct - a.correct) || a.name.localeCompare(b.name); }),
                gameLeaderboard: this.gameLeaderboard(session),
            };
            if (session.ownerId === user.id)
                return state;
            var aliases = new Map();
            for (var _i = 0, participants_1 = participants; _i < participants_1.length; _i++) {
                var participant = participants_1[_i];
                if (!aliases.has(participant.name))
                    aliases.set(participant.name, "Student #".concat(aliases.size + 1));
            }
            return this.redactParticipantNames(state, aliases);
        };
        ModeratedService_1.prototype.start = function (sessionId, user) {
            var session = this.authorize(sessionId, user);
            if (session.phase !== 'lobby')
                throw new common_1.BadRequestException('This test has already started');
            session.endsAt = new Date(Date.now() + session.durationSeconds * 1000);
            session.phase = 'question';
            session.currentRoundIndex = 0;
            for (var _i = 0, _a = session.participants.values(); _i < _a.length; _i++) {
                var participant = _a[_i];
                this.openParticipantQuestion(session, participant);
            }
            return this.facilitatorState(sessionId, user);
        };
        ModeratedService_1.prototype.end = function (sessionId, user) {
            var session = this.authorize(sessionId, user);
            if (session.phase !== 'complete') {
                session.phase = 'complete';
                session.endedByTeacher = true;
                for (var _i = 0, _a = session.participants.values(); _i < _a.length; _i++) {
                    var participant = _a[_i];
                    this.clearParticipantTimer(participant);
                }
            }
            return this.facilitatorState(sessionId, user);
        };
        ModeratedService_1.prototype.updateDuration = function (sessionId, user, durationSeconds) {
            var session = this.authorize(sessionId, user);
            if (session.phase === 'complete')
                throw new common_1.BadRequestException('A completed test cannot be extended');
            session.durationSeconds = durationSeconds;
            session.endsAt = session.phase === 'lobby' ? null : new Date(Date.now() + durationSeconds * 1000);
            return this.facilitatorState(sessionId, user);
        };
        ModeratedService_1.prototype.restart = function (sessionId, user, mode) {
            var session = this.authorize(sessionId, user);
            if (session.phase !== 'complete')
                throw new common_1.BadRequestException('End the quiz before launching it again');
            var questions = this.questionsForMode(session.quiz.questions, mode);
            if (!questions.length)
                throw new common_1.BadRequestException('There are no available quiz items for this mode');
            session.mode = mode;
            // Facilitated rounds do not support endless play. Other modes retain the
            // session preference from the just-completed quiz.
            session.endless = mode === 'facilitated' ? false : session.endless;
            session.phase = 'question';
            session.endedByTeacher = false;
            session.expired = false;
            session.endsAt = new Date(Date.now() + session.durationSeconds * 1000);
            session.currentRoundIndex = 0;
            session.presentationMode = mode === 'matching' ? 'matching' : mode === 'battleship' ? 'battleship' : mode === 'treasure_map' ? 'treasure_map' : mode === 'archery' ? 'archery' : mode === 'curling' ? 'curling' : 'scores';
            session.matching = mode === 'matching' ? this.newMatchingGame(session.quiz.matchingPairCount, (0, crypto_1.randomUUID)()) : null;
            session.battleship = mode === 'battleship' ? this.newBattleshipGame(session.quiz.battleshipBoardSize, (0, crypto_1.randomUUID)()) : null;
            session.treasureMap = mode === 'treasure_map' ? this.newTreasureMap((0, crypto_1.randomUUID)()) : null;
            session.archery = mode === 'archery' ? this.newArcheryGame() : null;
            session.curling = mode === 'curling' ? this.newCurlingGame() : null;
            session.boardResetAt = null;
            for (var _i = 0, _a = session.participants.values(); _i < _a.length; _i++) {
                var participant = _a[_i];
                this.clearParticipantTimer(participant);
                participant.questions = session.randomizeQuestionOrder ? this.shuffleQuestionsInPlace(questions, []) : __spreadArray([], questions, true);
                participant.answers = new Map();
                participant.matchProgress = new Map();
                participant.gameScores = new Map();
                participant.pointScore = this.newPointScore();
                participant.matching = mode === 'matching' ? { credits: 0, selectedCard: null, score: 0 } : null;
                participant.battleship = mode === 'battleship' ? { tokens: 0, score: 0 } : null;
                participant.treasureMap = mode === 'treasure_map' ? { tokens: 0 } : null;
                participant.archery = mode === 'archery' ? { arrows: 0, lastShot: null } : null;
                participant.curling = mode === 'curling' ? { stones: 0, lastStone: null } : null;
                participant.betweenQuestions = false;
                participant.currentQuestionIndex = -1;
                participant.currentQuestionOpenedAt = null;
                participant.completedAt = null;
                this.openParticipantQuestion(session, participant);
            }
            return this.facilitatorState(sessionId, user);
        };
        ModeratedService_1.prototype.next = function (sessionId, user) {
            var session = this.authorize(sessionId, user);
            if (session.mode !== 'facilitated' || session.phase !== 'question')
                throw new common_1.BadRequestException('There is no facilitated round to advance');
            session.currentRoundIndex += 1;
            for (var _i = 0, _a = session.participants.values(); _i < _a.length; _i++) {
                var participant = _a[_i];
                this.openParticipantQuestion(session, participant);
            }
            if (session.currentRoundIndex >= this.activeQuestions(session).length)
                session.phase = 'complete';
            return this.facilitatorState(sessionId, user);
        };
        ModeratedService_1.prototype.updateLobbyLock = function (sessionId, user, lobbyLocked) {
            var session = this.authorize(sessionId, user);
            session.lobbyLocked = lobbyLocked;
            return this.facilitatorState(sessionId, user);
        };
        ModeratedService_1.prototype.updatePresentationMode = function (sessionId, user, presentationMode) {
            var session = this.authorize(sessionId, user);
            if (presentationMode === 'matching' && !session.matching)
                throw new common_1.BadRequestException('The matching board is only available in Matching mode');
            if (presentationMode === 'battleship' && !session.battleship)
                throw new common_1.BadRequestException('The Battleship board is only available in Battleship mode');
            if (presentationMode === 'treasure_map' && !session.treasureMap)
                throw new common_1.BadRequestException('The Treasure Map is only available in Treasure Map mode');
            if (presentationMode === 'archery' && !session.archery)
                throw new common_1.BadRequestException('The archery board is only available in Archery mode');
            if (presentationMode === 'curling' && !session.curling)
                throw new common_1.BadRequestException('The curling sheet is only available in Curling mode');
            session.presentationMode = presentationMode;
            return this.facilitatorState(sessionId, user);
        };
        ModeratedService_1.prototype.updateBoardAutoReset = function (sessionId, user, autoBoardReset) {
            var session = this.authorize(sessionId, user);
            if (session.mode !== 'matching' && session.mode !== 'battleship' && session.mode !== 'treasure_map')
                throw new common_1.BadRequestException('Automatic board reset is only available in shared game modes');
            session.autoBoardReset = autoBoardReset;
            if (autoBoardReset && this.boardComplete(session))
                this.scheduleBoardReset(session);
            if (!autoBoardReset)
                session.boardResetAt = null;
            return this.facilitatorState(sessionId, user);
        };
        ModeratedService_1.prototype.resetBoard = function (sessionId, user) {
            var session = this.authorize(sessionId, user);
            if (!this.boardComplete(session))
                throw new common_1.BadRequestException('Finish the shared board before starting a new one');
            this.startNewBoard(session);
            return this.facilitatorState(sessionId, user);
        };
        ModeratedService_1.prototype.removeParticipant = function (sessionId, user, participantId) {
            var session = this.authorize(sessionId, user);
            var participant = session.participants.get(participantId);
            if (!participant)
                throw new common_1.NotFoundException('That participant is no longer in this test');
            session.bannedClientIds.add(participant.clientId);
            this.clearParticipantTimer(participant);
            session.participants.delete(participantId);
            this.completeSessionIfFinished(session);
            return this.facilitatorState(sessionId, user);
        };
        ModeratedService_1.prototype.join = function (pin, name, clientId) {
            var session = this.getByPin(pin);
            var cleanName = name.trim();
            if (!cleanName)
                throw new common_1.BadRequestException('Enter your name to join');
            if (session.phase === 'complete')
                throw new common_1.BadRequestException('This moderated test has ended');
            if (session.lobbyLocked)
                throw new common_1.BadRequestException('The facilitator has locked this lobby');
            if (session.bannedClientIds.has(clientId))
                throw new common_1.ForbiddenException('You have been removed from this live test');
            var questions = this.activeQuestions(session);
            var participant = { id: (0, crypto_1.randomUUID)(), clientId: clientId, name: cleanName, questions: session.randomizeQuestionOrder ? this.shuffleQuestionsInPlace(questions, session.participants.values()) : __spreadArray([], questions, true), answers: new Map(), matchProgress: new Map(), gameScores: new Map(), pointScore: this.newPointScore(), matching: session.mode === 'matching' ? { credits: 0, selectedCard: null, score: 0 } : null, battleship: session.mode === 'battleship' ? { tokens: 0, score: 0 } : null, treasureMap: session.mode === 'treasure_map' ? { tokens: 0 } : null, archery: session.mode === 'archery' ? { arrows: 0, lastShot: null } : null, curling: session.mode === 'curling' ? { stones: 0, lastStone: null } : null, betweenQuestions: false, joinedAt: new Date(), currentQuestionIndex: -1, currentQuestionOpenedAt: null, autoAdvanceTimer: null, completedAt: null };
            session.participants.set(participant.id, participant);
            if (session.phase === 'question') {
                if (session.mode === 'facilitated')
                    participant.currentQuestionIndex = session.currentRoundIndex - 1;
                this.openParticipantQuestion(session, participant);
            }
            return { participantId: participant.id, name: participant.name };
        };
        ModeratedService_1.prototype.submitAnswer = function (pin, body) {
            var _this = this;
            var _a, _b;
            var session = this.getByPin(pin);
            var participant = session.participants.get(body.participantId);
            if (!participant)
                throw new common_1.NotFoundException('Your participant session could not be found. Please join again.');
            if (session.phase !== 'question' || participant.completedAt)
                throw new common_1.BadRequestException('There is no active question');
            var question = participant.questions[participant.currentQuestionIndex];
            if (question.itemType !== 'question')
                throw new common_1.BadRequestException('This round is a game, not a question');
            if (body.questionId !== question.id)
                throw new common_1.BadRequestException('That question is no longer active');
            if (this.hasTimedOut(participant, question))
                throw new common_1.BadRequestException('Time has expired for this question');
            if (((_a = question.special) === null || _a === void 0 ? void 0 : _a.kind) === 'matching') {
                if (participant.answers.has(question.id))
                    throw new common_1.BadRequestException('You have already answered this question');
                var progress = (0, special_1.matchAttempt)(question.special.pairs, participant.matchProgress.get(question.id), body.answer);
                if (!progress)
                    throw new common_1.BadRequestException('Choose one item from each column');
                participant.matchProgress.set(question.id, progress);
                if (progress.mistakes < 3 && progress.matched.length < question.special.pairs.length)
                    return { answered: false, matchProgress: progress };
                body.answer = progress.matched.length === question.special.pairs.length ? 'Matched' : 'Not matched';
            }
            else if (((_b = question.special) === null || _b === void 0 ? void 0 : _b.kind) === 'short_answer') {
                body.answer = body.answer.trim();
                if (!body.answer)
                    throw new common_1.BadRequestException('Enter an answer');
                if ((0, answer_matching_1.answersMatch)(body.answer, question.correctAnswer, session.quiz.answerMatching))
                    body.answer = question.correctAnswer;
            }
            else if (!question.options.includes(body.answer))
                throw new common_1.BadRequestException('Choose one of the available answers');
            if (participant.answers.has(question.id))
                throw new common_1.BadRequestException('You have already answered this question');
            participant.answers.set(question.id, body.answer);
            var isCorrect = body.answer === question.correctAnswer;
            this.awardPoints(session, participant, question, isCorrect);
            if (session.endless && !isCorrect)
                this.queueEndlessReinforcement(session, participant, question);
            var earnsCredit = isCorrect && this.score(session, participant).correct % session.quiz.creditEveryCorrectAnswers === 0;
            if (participant.matching) {
                if (earnsCredit)
                    participant.matching.credits += 1;
                participant.betweenQuestions = true;
                this.clearParticipantTimer(participant);
            }
            else if (participant.battleship) {
                if (earnsCredit)
                    participant.battleship.tokens += 1;
                participant.betweenQuestions = true;
                this.clearParticipantTimer(participant);
            }
            else if (participant.treasureMap) {
                if (earnsCredit)
                    participant.treasureMap.tokens += 1;
                participant.betweenQuestions = true;
                this.clearParticipantTimer(participant);
            }
            else if (participant.archery) {
                if (earnsCredit)
                    participant.archery.arrows += 1;
                participant.betweenQuestions = true;
                this.clearParticipantTimer(participant);
            }
            else if (participant.curling) {
                if (earnsCredit)
                    participant.curling.stones += 1;
                participant.betweenQuestions = true;
                this.clearParticipantTimer(participant);
            }
            else if (session.mode !== 'facilitated') {
                this.clearParticipantTimer(participant);
                var questionIndex_1 = participant.currentQuestionIndex;
                participant.autoAdvanceTimer = setTimeout(function () {
                    _this.expire(session);
                    if (session.phase === 'question' && session.participants.get(participant.id) === participant && participant.currentQuestionIndex === questionIndex_1) {
                        _this.openParticipantQuestion(session, participant);
                    }
                }, 5000);
            }
            return { answered: true };
        };
        ModeratedService_1.prototype.flipMatchingCard = function (pin, participantId, card) {
            var session = this.getByPin(pin);
            var participant = session.participants.get(participantId);
            if (session.phase !== 'question' || !(participant === null || participant === void 0 ? void 0 : participant.matching) || !participant.betweenQuestions)
                throw new common_1.BadRequestException('Matching is available between questions');
            var player = participant.matching;
            var matching = session.matching;
            if (!matching)
                throw new common_1.BadRequestException('The shared matching board is not available');
            this.syncSharedMatching(session);
            if (matching.completionId)
                throw new common_1.BadRequestException('All matching pairs have already been found');
            if (!Number.isInteger(card) || card < 0 || card >= matching.cards.length)
                throw new common_1.BadRequestException('Choose a card on the board');
            if (matching.attempt)
                throw new common_1.BadRequestException('Wait for the current pair to finish flipping');
            if (matching.matchedCards.has(card))
                throw new common_1.BadRequestException('That pair has already been matched');
            if (player.selectedCard === null) {
                if (player.credits < 1)
                    throw new common_1.BadRequestException('Earn a credit by answering a question correctly');
                player.selectedCard = card;
                return this.matchingState(matching, player);
            }
            if (player.selectedCard === card)
                throw new common_1.BadRequestException('Choose a different card');
            var cards = [player.selectedCard, card];
            var isMatch = matching.cards[cards[0]] === matching.cards[cards[1]];
            matching.attempt = { id: (0, crypto_1.randomUUID)(), participantId: participant.id, participantName: participant.name, cards: cards, startedAt: new Date(), isMatch: isMatch };
            if (isMatch)
                player.score += 100;
            if (!isMatch)
                player.credits -= 1;
            for (var _i = 0, _a = session.participants.values(); _i < _a.length; _i++) {
                var current = _a[_i];
                if (current.matching)
                    current.matching.selectedCard = null;
            }
            return this.matchingState(matching, player, participant.id);
        };
        ModeratedService_1.prototype.nextMatchingQuestion = function (pin, participantId) {
            var session = this.getByPin(pin);
            var participant = session.participants.get(participantId);
            if (session.phase !== 'question' || session.mode !== 'matching' || !participant || !participant.betweenQuestions)
                throw new common_1.BadRequestException('There is no next question to start');
            return this.advanceParticipant(session, participant);
        };
        ModeratedService_1.prototype.attackBattleship = function (pin, participantId, cell) {
            var session = this.getByPin(pin);
            var participant = session.participants.get(participantId);
            var game = session.battleship;
            if (session.phase !== 'question' || !(participant === null || participant === void 0 ? void 0 : participant.battleship) || !participant.betweenQuestions || !game)
                throw new common_1.BadRequestException('Battleship is available between questions');
            if (!Number.isInteger(cell) || cell < 0 || cell >= Math.pow(game.size, 2))
                throw new common_1.BadRequestException('Choose a square on the board');
            if (participant.battleship.tokens < 1)
                throw new common_1.BadRequestException('Earn an attack token by answering a question correctly');
            if (game.completionId)
                throw new common_1.BadRequestException('The fleet has already been sunk');
            if (game.attacks.has(cell))
                throw new common_1.BadRequestException('That square has already been attacked');
            participant.battleship.tokens -= 1;
            var result = game.shipCells.has(cell) ? 'hit' : 'miss';
            game.attacks.set(cell, result);
            if (result === 'hit') {
                participant.battleship.score += 100;
                game.lastHit = { id: (0, crypto_1.randomUUID)(), cell: cell, participantName: participant.name };
                if (__spreadArray([], game.attacks.values(), true).filter(function (attack) { return attack === 'hit'; }).length === game.shipCells.size) {
                    game.completionId = (0, crypto_1.randomUUID)();
                    this.scheduleBoardReset(session);
                }
            }
            return this.battleshipState(game, participant);
        };
        ModeratedService_1.prototype.nextBattleshipQuestion = function (pin, participantId) {
            var session = this.getByPin(pin);
            var participant = session.participants.get(participantId);
            if (session.phase !== 'question' || session.mode !== 'battleship' || !(participant === null || participant === void 0 ? void 0 : participant.battleship) || !participant.betweenQuestions)
                throw new common_1.BadRequestException('There is no next question to start');
            return this.advanceParticipant(session, participant);
        };
        ModeratedService_1.prototype.shootArchery = function (pin, participantId, x, y) {
            var session = this.getByPin(pin);
            var participant = session.participants.get(participantId);
            var game = session.archery;
            if (session.phase !== 'question' || !(participant === null || participant === void 0 ? void 0 : participant.archery) || !participant.betweenQuestions || !game)
                throw new common_1.BadRequestException('Archery is available between questions');
            if (!Number.isInteger(x) || !Number.isInteger(y) || Math.abs(x) > 100 || Math.abs(y) > 100)
                throw new common_1.BadRequestException('Aim within the target');
            if (participant.archery.arrows < 1)
                throw new common_1.BadRequestException('Answer a question correctly to earn an arrow');
            participant.archery.arrows -= 1;
            var arrow = { id: (0, crypto_1.randomUUID)(), participantId: participant.id, participantName: participant.name, x: x, y: y, score: this.archeryScore(x, y) };
            participant.archery.lastShot = arrow;
            game.arrows.push(arrow);
            return this.archeryState(game, participant);
        };
        ModeratedService_1.prototype.nextArcheryQuestion = function (pin, participantId) {
            var session = this.getByPin(pin);
            var participant = session.participants.get(participantId);
            if (session.phase !== 'question' || session.mode !== 'archery' || !(participant === null || participant === void 0 ? void 0 : participant.archery) || !participant.betweenQuestions)
                throw new common_1.BadRequestException('There is no next question to start');
            return this.advanceParticipant(session, participant);
        };
        ModeratedService_1.prototype.releaseCurlingStone = function (pin, participantId, direction, speed) {
            var session = this.getByPin(pin);
            var participant = session.participants.get(participantId);
            var game = session.curling;
            if (session.phase !== 'question' || !(participant === null || participant === void 0 ? void 0 : participant.curling) || !participant.betweenQuestions || !game)
                throw new common_1.BadRequestException('Curling is available between questions');
            if (!Number.isInteger(direction) || !Number.isInteger(speed) || Math.abs(direction) > 100 || speed < 0 || speed > 100)
                throw new common_1.BadRequestException('Choose a direction and speed on the sheet');
            if (participant.curling.stones < 1)
                throw new common_1.BadRequestException('Answer a question correctly to earn a stone');
            participant.curling.stones -= 1;
            // Each stone has its own final resting point. There is deliberately no
            // collision resolution: stones may overlap without affecting one another.
            var stone = __assign({ id: (0, crypto_1.randomUUID)(), participantId: participant.id, participantName: participant.name, direction: direction, speed: speed }, this.curlingLanding(direction, speed));
            participant.curling.lastStone = stone;
            game.stones.push(stone);
            return this.curlingState(game, participant);
        };
        ModeratedService_1.prototype.nextCurlingQuestion = function (pin, participantId) {
            var session = this.getByPin(pin);
            var participant = session.participants.get(participantId);
            if (session.phase !== 'question' || session.mode !== 'curling' || !(participant === null || participant === void 0 ? void 0 : participant.curling) || !participant.betweenQuestions)
                throw new common_1.BadRequestException('There is no next question to start');
            return this.advanceParticipant(session, participant);
        };
        ModeratedService_1.prototype.digTreasureMap = function (pin, participantId, cell) {
            var session = this.getByPin(pin);
            var participant = session.participants.get(participantId);
            var map = session.treasureMap;
            if (session.phase !== 'question' || !(participant === null || participant === void 0 ? void 0 : participant.treasureMap) || !participant.betweenQuestions || !map)
                throw new common_1.BadRequestException('Treasure Map is available between questions');
            if (!Number.isInteger(cell) || cell < 0 || cell >= Math.pow(map.size, 2))
                throw new common_1.BadRequestException('Choose a square on the map');
            if (participant.treasureMap.tokens < 1)
                throw new common_1.BadRequestException('Earn a scout token by answering a question correctly');
            if (map.completionId)
                throw new common_1.BadRequestException('The treasure has already been found');
            if (map.blockedCells.has(cell))
                throw new common_1.BadRequestException('Streams cannot be explored');
            if (map.digs.has(cell))
                throw new common_1.BadRequestException('That square has already been explored');
            participant.treasureMap.tokens -= 1;
            var found = cell === map.treasureCell;
            var hint = found ? 'Treasure found!' : this.treasureHint(map, cell);
            map.digs.set(cell, { result: found ? 'treasure' : 'clue', hint: hint });
            map.lastDig = { id: (0, crypto_1.randomUUID)(), cell: cell, participantName: participant.name };
            if (found) {
                map.completionId = (0, crypto_1.randomUUID)();
                this.scheduleBoardReset(session);
            }
            return this.treasureMapState(map, participant);
        };
        ModeratedService_1.prototype.nextTreasureMapQuestion = function (pin, participantId) {
            var session = this.getByPin(pin);
            var participant = session.participants.get(participantId);
            if (session.phase !== 'question' || session.mode !== 'treasure_map' || !(participant === null || participant === void 0 ? void 0 : participant.treasureMap) || !participant.betweenQuestions)
                throw new common_1.BadRequestException('There is no next question to start');
            return this.advanceParticipant(session, participant);
        };
        ModeratedService_1.prototype.nextQuestion = function (pin, participantId) {
            var session = this.getByPin(pin);
            var participant = session.participants.get(participantId);
            if (session.phase !== 'question' || session.mode === 'facilitated' || !participant || participant.completedAt)
                throw new common_1.BadRequestException('There is no next question to start');
            var question = participant.questions[participant.currentQuestionIndex];
            if (!question || (question.itemType === 'question' && !participant.answers.has(question.id) && !this.hasTimedOut(participant, question)))
                throw new common_1.BadRequestException('Answer the current question before moving on');
            return this.advanceParticipant(session, participant);
        };
        ModeratedService_1.prototype.advanceParticipant = function (session, participant) {
            participant.betweenQuestions = false;
            if (participant.matching)
                participant.matching.selectedCard = null;
            this.openParticipantQuestion(session, participant);
            return { advanced: true };
        };
        ModeratedService_1.prototype.matchingState = function (matching, player, participantId, includeSuccessName) {
            var _a, _b;
            if (includeSuccessName === void 0) { includeSuccessName = false; }
            var selectedCard = player === null || player === void 0 ? void 0 : player.selectedCard;
            var visibleAttempt = matching.attempt && (!participantId || matching.attempt.isMatch || matching.attempt.participantId === participantId) ? matching.attempt : null;
            return {
                credits: (_a = player === null || player === void 0 ? void 0 : player.credits) !== null && _a !== void 0 ? _a : null,
                score: (_b = player === null || player === void 0 ? void 0 : player.score) !== null && _b !== void 0 ? _b : null,
                columns: matching.columns,
                rows: matching.rows,
                selectedCard: selectedCard === null || selectedCard === undefined ? null : { id: selectedCard, symbol: matching.cards[selectedCard] },
                cards: matching.cards.map(function (symbol, index) { return ({ symbol: matching.matchedCards.has(index) ? symbol : null, matched: matching.matchedCards.has(index) }); }),
                attempt: visibleAttempt ? {
                    id: visibleAttempt.id,
                    cards: visibleAttempt.cards.map(function (id) { return ({ id: id, symbol: matching.cards[id] }); }),
                    startedAt: visibleAttempt.startedAt.toISOString(),
                    isMatch: visibleAttempt.isMatch,
                    isActor: visibleAttempt.participantId === participantId,
                    playerName: includeSuccessName && visibleAttempt.isMatch ? visibleAttempt.participantName : undefined,
                } : null,
                complete: matching.completionId !== null,
                completionId: matching.completionId,
            };
        };
        ModeratedService_1.prototype.battleshipState = function (game, player, includeSuccessName) {
            var _a, _b, _c, _d;
            if (includeSuccessName === void 0) { includeSuccessName = false; }
            return {
                size: game.size,
                tokens: (_b = (_a = player === null || player === void 0 ? void 0 : player.battleship) === null || _a === void 0 ? void 0 : _a.tokens) !== null && _b !== void 0 ? _b : null,
                score: (_d = (_c = player === null || player === void 0 ? void 0 : player.battleship) === null || _c === void 0 ? void 0 : _c.score) !== null && _d !== void 0 ? _d : null,
                shipCells: game.shipCells.size,
                hits: __spreadArray([], game.attacks.values(), true).filter(function (result) { return result === 'hit'; }).length,
                cells: Array.from({ length: Math.pow(game.size, 2) }, function (_, id) { var _a; return ({ result: (_a = game.attacks.get(id)) !== null && _a !== void 0 ? _a : null }); }),
                lastHit: includeSuccessName ? game.lastHit : null,
                complete: game.completionId !== null,
                completionId: game.completionId,
            };
        };
        ModeratedService_1.prototype.gameLeaderboard = function (session) {
            if (session.mode !== 'matching' && session.mode !== 'battleship')
                return [];
            return __spreadArray([], session.participants.values(), true).map(function (participant) {
                var _a, _b, _c, _d;
                return ({
                    id: participant.id,
                    name: participant.name,
                    score: session.mode === 'matching' ? (_b = (_a = participant.matching) === null || _a === void 0 ? void 0 : _a.score) !== null && _b !== void 0 ? _b : 0 : (_d = (_c = participant.battleship) === null || _c === void 0 ? void 0 : _c.score) !== null && _d !== void 0 ? _d : 0,
                });
            })
                .sort(function (a, b) { return b.score - a.score || a.name.localeCompare(b.name); });
        };
        ModeratedService_1.prototype.treasureMapState = function (map, player, includeSuccessName) {
            var _a, _b;
            if (includeSuccessName === void 0) { includeSuccessName = false; }
            return {
                size: map.size,
                tokens: (_b = (_a = player === null || player === void 0 ? void 0 : player.treasureMap) === null || _a === void 0 ? void 0 : _a.tokens) !== null && _b !== void 0 ? _b : null,
                cells: Array.from({ length: Math.pow(map.size, 2) }, function (_, id) {
                    var _a, _b;
                    var dig = map.digs.get(id);
                    return { result: (_a = dig === null || dig === void 0 ? void 0 : dig.result) !== null && _a !== void 0 ? _a : null, hint: (_b = dig === null || dig === void 0 ? void 0 : dig.hint) !== null && _b !== void 0 ? _b : null, terrain: map.blockedCells.has(id) ? 'stream' : 'land' };
                }),
                lastDig: includeSuccessName ? map.lastDig : null,
                complete: map.completionId !== null,
                completionId: map.completionId,
            };
        };
        ModeratedService_1.prototype.archeryState = function (game, player, includeNames) {
            var _a, _b, _c;
            if (includeNames === void 0) { includeNames = false; }
            var byScore = function (a, b) { return b.score - a.score || a.participantName.localeCompare(b.participantName); };
            var playerAttempts = player
                ? game.arrows.filter(function (arrow) { return arrow.participantId === player.id; })
                : [];
            var sharedBestAttempts = includeNames
                ? __spreadArray([], game.arrows.reduce(function (byParticipant, arrow) {
                    var _a;
                    var attempts = (_a = byParticipant.get(arrow.participantId)) !== null && _a !== void 0 ? _a : [];
                    attempts.push(arrow);
                    byParticipant.set(arrow.participantId, attempts);
                    return byParticipant;
                }, new Map()).values(), true).flatMap(function (attempts) { return attempts.sort(byScore).slice(0, 3); })
                    .sort(byScore)
                : [];
            return {
                arrows: (_b = (_a = player === null || player === void 0 ? void 0 : player.archery) === null || _a === void 0 ? void 0 : _a.arrows) !== null && _b !== void 0 ? _b : null,
                lastShot: ((_c = player === null || player === void 0 ? void 0 : player.archery) === null || _c === void 0 ? void 0 : _c.lastShot) ? { id: player.archery.lastShot.id, x: player.archery.lastShot.x, y: player.archery.lastShot.y, score: player.archery.lastShot.score } : null,
                attempts: (player ? playerAttempts : sharedBestAttempts)
                    .sort(byScore)
                    .map(function (arrow) { return ({ id: arrow.id, x: arrow.x, y: arrow.y, score: arrow.score, participantName: includeNames ? arrow.participantName : undefined }); }),
            };
        };
        ModeratedService_1.prototype.curlingState = function (game, player, includeNames) {
            var _a, _b, _c;
            if (includeNames === void 0) { includeNames = false; }
            var byScore = function (a, b) { return b.score - a.score || a.participantName.localeCompare(b.participantName); };
            var playerAttempts = player ? game.stones.filter(function (stone) { return stone.participantId === player.id; }) : [];
            var sharedBestAttempts = includeNames
                ? __spreadArray([], game.stones.reduce(function (byParticipant, stone) {
                    var _a;
                    var attempts = (_a = byParticipant.get(stone.participantId)) !== null && _a !== void 0 ? _a : [];
                    attempts.push(stone);
                    byParticipant.set(stone.participantId, attempts);
                    return byParticipant;
                }, new Map()).values(), true).flatMap(function (attempts) { return attempts.sort(byScore).slice(0, 3); }).sort(byScore)
                : [];
            var publicStone = function (stone) { return ({ id: stone.id, direction: stone.direction, speed: stone.speed, x: stone.x, y: stone.y, score: stone.score, participantName: includeNames ? stone.participantName : undefined }); };
            return {
                stones: (_b = (_a = player === null || player === void 0 ? void 0 : player.curling) === null || _a === void 0 ? void 0 : _a.stones) !== null && _b !== void 0 ? _b : null,
                lastStone: ((_c = player === null || player === void 0 ? void 0 : player.curling) === null || _c === void 0 ? void 0 : _c.lastStone) ? publicStone(player.curling.lastStone) : null,
                attempts: (player ? playerAttempts : sharedBestAttempts).sort(byScore).map(publicStone),
            };
        };
        ModeratedService_1.prototype.reportGameScore = function (pin, body) {
            var session = this.getByPin(pin);
            var participant = session.participants.get(body.participantId);
            if (!participant)
                throw new common_1.NotFoundException('Your participant session could not be found. Please join again.');
            if (session.phase !== 'question' || participant.completedAt)
                throw new common_1.BadRequestException('There is no active game');
            var question = participant.questions[participant.currentQuestionIndex];
            if (question.itemType !== 'game' || question.gameType !== 'coin_catch' || body.questionId !== question.id)
                throw new common_1.BadRequestException('That game is no longer active');
            if (this.hasTimedOut(participant, question))
                throw new common_1.BadRequestException('Time has expired for this game');
            participant.gameScores.set(question.id, body.score);
            return { score: body.score };
        };
        ModeratedService_1.prototype.get = function (sessionId) {
            var session = this.sessions.get(sessionId);
            if (!session)
                throw new common_1.NotFoundException('That moderated test is no longer available');
            this.expire(session);
            return session;
        };
        ModeratedService_1.prototype.getByPin = function (pin) {
            var session = this.sessionsByPin.get(pin);
            if (!session)
                throw new common_1.NotFoundException('That moderated test is no longer available');
            this.expire(session);
            return session;
        };
        ModeratedService_1.prototype.expire = function (session) {
            this.syncSharedMatching(session);
            if (session.boardResetAt && Date.now() >= session.boardResetAt.getTime())
                this.startNewBoard(session);
            if (session.phase === 'question' && session.endsAt && Date.now() >= session.endsAt.getTime()) {
                session.phase = 'complete';
                session.expired = true;
                for (var _i = 0, _a = session.participants.values(); _i < _a.length; _i++) {
                    var participant = _a[_i];
                    this.clearParticipantTimer(participant);
                }
            }
        };
        ModeratedService_1.prototype.syncSharedMatching = function (session) {
            var matching = session.matching;
            // Hold the result long enough for the projector's polling view to play the
            // first flip, second flip, and resolution as one shared event.
            if (!(matching === null || matching === void 0 ? void 0 : matching.attempt) || Date.now() - matching.attempt.startedAt.getTime() < 2600)
                return;
            if (matching.attempt.isMatch) {
                matching.matchedCards.add(matching.attempt.cards[0]);
                matching.matchedCards.add(matching.attempt.cards[1]);
                if (matching.matchedCards.size === matching.cards.length) {
                    matching.completionId = (0, crypto_1.randomUUID)();
                    this.scheduleBoardReset(session);
                }
            }
            matching.attempt = null;
        };
        ModeratedService_1.prototype.matchingGridDimensions = function (pairCount) {
            if (pairCount === 2)
                return [2, 2];
            if (pairCount === 4)
                return [4, 2];
            if (pairCount === 6)
                return [4, 3];
            if (pairCount === 8)
                return [4, 4];
            if (pairCount === 18)
                return [6, 6];
            if (pairCount === 32)
                return [8, 8];
            return [4, 3];
        };
        ModeratedService_1.prototype.supportedMatchingPairCount = function (pairCount) {
            return [2, 4, 6, 8, 18, 32].includes(pairCount) ? pairCount : 32;
        };
        ModeratedService_1.prototype.questionsForMode = function (questions, mode) {
            return mode === 'matching' || mode === 'battleship' || mode === 'treasure_map' || mode === 'archery' || mode === 'curling' ? questions.filter(function (item) { return item.itemType === 'question'; }) : questions;
        };
        ModeratedService_1.prototype.activeQuestions = function (session) {
            return this.questionsForMode(session.quiz.questions, session.mode);
        };
        ModeratedService_1.prototype.newPointScore = function () {
            return { points: 0, streak: 0, maxStreak: 0, lastAward: null };
        };
        ModeratedService_1.prototype.newMatchingGame = function (pairCount, seed) {
            var supportedPairCount = this.supportedMatchingPairCount(pairCount);
            var _a = this.matchingGridDimensions(supportedPairCount), columns = _a[0], rows = _a[1];
            return {
                cards: this.shuffle(__spreadArray(__spreadArray([], MATCHING_SYMBOLS.slice(0, supportedPairCount), true), MATCHING_SYMBOLS.slice(0, supportedPairCount), true), seed),
                columns: columns,
                rows: rows,
                matchedCards: new Set(),
                attempt: null,
                completionId: null,
            };
        };
        ModeratedService_1.prototype.newBattleshipGame = function (size, seed) {
            var cells = new Set();
            var shipLengths = size === 6 ? [3, 2, 2] : size === 8 ? [4, 3, 2, 2] : [5, 4, 3, 3, 2];
            var state = __spreadArray([], seed, true).reduce(function (total, character) { return ((total * 31) + character.charCodeAt(0)) >>> 0; }, 0) || 1;
            var next = function () { state = (state * 1664525 + 1013904223) >>> 0; return state; };
            for (var _i = 0, shipLengths_1 = shipLengths; _i < shipLengths_1.length; _i++) {
                var length_1 = shipLengths_1[_i];
                var _loop_1 = function (attempts) {
                    var horizontal = next() % 2 === 0;
                    var row = next() % size;
                    var column = next() % size;
                    if ((horizontal && column + length_1 > size) || (!horizontal && row + length_1 > size))
                        return "continue";
                    var ship = Array.from({ length: length_1 }, function (_, index) { return (horizontal ? row * size + column + index : (row + index) * size + column); });
                    if (ship.every(function (cell) { return !cells.has(cell); })) {
                        ship.forEach(function (cell) { return cells.add(cell); });
                        return "break";
                    }
                };
                for (var attempts = 0; attempts < 500; attempts += 1) {
                    var state_1 = _loop_1(attempts);
                    if (state_1 === "break")
                        break;
                }
            }
            return { size: size, shipCells: cells, attacks: new Map(), lastHit: null, completionId: null };
        };
        ModeratedService_1.prototype.newTreasureMap = function (seed) {
            var size = 14;
            var state = __spreadArray([], seed, true).reduce(function (total, character) { return ((total * 31) + character.charCodeAt(0)) >>> 0; }, 0) || 1;
            var next = function () { state = (state * 1664525 + 1013904223) >>> 0; return state; };
            var blockedCells = new Set();
            var streamColumn = 3 + (next() % 8);
            for (var row = 0; row < size; row += 1) {
                blockedCells.add(row * size + streamColumn);
                // Hold a direction for a couple of rows, then make a one-tile bend.
                // Adding the destination on this row keeps every bend connected instead
                // of leaving diagonal or detached water tiles.
                if (row % 2 === 1 && row < size - 1) {
                    var nextColumn = Math.max(2, Math.min(size - 3, streamColumn + ((next() % 3) - 1)));
                    if (nextColumn !== streamColumn)
                        blockedCells.add(row * size + nextColumn);
                    streamColumn = nextColumn;
                }
            }
            var landCells = Array.from({ length: Math.pow(size, 2) }, function (_, id) { return id; }).filter(function (id) { return !blockedCells.has(id); });
            return { size: size, treasureCell: landCells[next() % landCells.length], blockedCells: blockedCells, digs: new Map(), lastDig: null, completionId: null };
        };
        ModeratedService_1.prototype.newArcheryGame = function () { return { arrows: [] }; };
        ModeratedService_1.prototype.newCurlingGame = function () { return { stones: [] }; };
        ModeratedService_1.prototype.archeryScore = function (x, y) {
            var distance = Math.sqrt((x * x) + (y * y));
            // Every fraction closer to the bullseye counts. An exact center is 1000.
            return Math.max(1, Math.round(1000 - (distance * 10)));
        };
        ModeratedService_1.prototype.curlingLanding = function (direction, speed) {
            // A straight stone at the marked 85% pace reaches the button at (0, -32). Direction
            // controls lateral travel and speed controls how far up the sheet it goes.
            var x = Math.round(direction * (speed / 100) * 1.2);
            var y = Math.round(100 - (speed * 1.55));
            var distance = Math.sqrt((x * x) + ((y + 32) * (y + 32)));
            return { x: x, y: y, score: Math.max(1, Math.round(1000 - (distance * 8))) };
        };
        ModeratedService_1.prototype.treasureHint = function (map, cell) {
            var size = map.size, treasureCell = map.treasureCell;
            var row = Math.floor(cell / size), column = cell % size;
            var treasureRow = Math.floor(treasureCell / size), treasureColumn = treasureCell % size;
            var distance = Math.max(Math.abs(treasureRow - row), Math.abs(treasureColumn - column));
            var clueType = map.digs.size % 5;
            if (clueType === 1) {
                var region = treasureRow < Math.floor(size / 3) ? 'northern' : treasureRow >= Math.ceil(size * 2 / 3) ? 'southern' : 'central';
                return "A torn map says the treasure is in the ".concat(region, " third of the island.");
            }
            if (clueType === 2) {
                var region = treasureColumn < Math.floor(size / 3) ? 'western' : treasureColumn >= Math.ceil(size * 2 / 3) ? 'eastern' : 'central';
                return "A landmark clue places the treasure in the ".concat(region, " third of the island.");
            }
            if (clueType === 3 && map.lastDig) {
                var previousRow = Math.floor(map.lastDig.cell / size), previousColumn = map.lastDig.cell % size;
                var previousDistance = Math.max(Math.abs(treasureRow - previousRow), Math.abs(treasureColumn - previousColumn));
                var previousCoordinate = "".concat(String.fromCharCode(65 + previousColumn)).concat(previousRow + 1);
                return distance < previousDistance ? "The sand is warmer than at ".concat(previousCoordinate, ".") : distance > previousDistance ? "The sand is colder than at ".concat(previousCoordinate, ".") : "The sand feels just as warm as at ".concat(previousCoordinate, ".");
            }
            if (clueType === 4)
                return "The treasure is on an ".concat(treasureRow % 2 === 0 ? 'odd' : 'even', "-numbered row.");
            var vertical = treasureRow < row ? 'north' : treasureRow > row ? 'south' : '';
            var horizontal = treasureColumn < column ? 'west' : treasureColumn > column ? 'east' : '';
            var direction = [vertical, horizontal].filter(Boolean).join('-');
            return "The treasure is ".concat(direction, ".");
        };
        ModeratedService_1.prototype.boardComplete = function (session) {
            var _a, _b, _c;
            return Boolean(((_a = session.matching) === null || _a === void 0 ? void 0 : _a.completionId) || ((_b = session.battleship) === null || _b === void 0 ? void 0 : _b.completionId) || ((_c = session.treasureMap) === null || _c === void 0 ? void 0 : _c.completionId));
        };
        ModeratedService_1.prototype.scheduleBoardReset = function (session) {
            if (session.autoBoardReset)
                session.boardResetAt = new Date(Date.now() + 4000);
        };
        ModeratedService_1.prototype.startNewBoard = function (session) {
            if (session.mode === 'matching') {
                session.matching = this.newMatchingGame(session.quiz.matchingPairCount, (0, crypto_1.randomUUID)());
                for (var _i = 0, _a = session.participants.values(); _i < _a.length; _i++) {
                    var participant = _a[_i];
                    if (participant.matching)
                        participant.matching = { credits: 0, selectedCard: null, score: participant.matching.score };
                }
            }
            else if (session.mode === 'battleship') {
                session.battleship = this.newBattleshipGame(session.quiz.battleshipBoardSize, (0, crypto_1.randomUUID)());
                for (var _b = 0, _c = session.participants.values(); _b < _c.length; _b++) {
                    var participant = _c[_b];
                    if (participant.battleship)
                        participant.battleship = { tokens: 0, score: participant.battleship.score };
                }
            }
            else if (session.mode === 'treasure_map') {
                session.treasureMap = this.newTreasureMap((0, crypto_1.randomUUID)());
                for (var _d = 0, _e = session.participants.values(); _d < _e.length; _d++) {
                    var participant = _e[_d];
                    if (participant.treasureMap)
                        participant.treasureMap = { tokens: 0 };
                }
            }
            session.boardResetAt = null;
        };
        ModeratedService_1.prototype.createPin = function () {
            for (var attempts = 0; attempts < 100; attempts += 1) {
                var pin = String((0, crypto_1.randomInt)(1000000)).padStart(6, '0');
                if (!this.sessionsByPin.has(pin))
                    return pin;
            }
            throw new common_1.BadRequestException('Could not create a unique join PIN. Please try again.');
        };
        ModeratedService_1.prototype.authorize = function (sessionId, user) {
            var session = this.get(sessionId);
            if (session.ownerId !== user.id && !user.canViewAllQuizzes)
                throw new common_1.ForbiddenException('You do not have access to this live quiz');
            return session;
        };
        ModeratedService_1.prototype.redactParticipantNames = function (value, aliases) {
            var _this = this;
            if (Array.isArray(value))
                return value.map(function (item) { return _this.redactParticipantNames(item, aliases); });
            if (!value || typeof value !== 'object')
                return value;
            return Object.fromEntries(Object.entries(value).map(function (_a) {
                var _b;
                var key = _a[0], item = _a[1];
                return [key,
                    (key === 'name' || key === 'participantName' || key === 'playerName') && typeof item === 'string' ? (_b = aliases.get(item)) !== null && _b !== void 0 ? _b : item : _this.redactParticipantNames(item, aliases),
                ];
            }));
        };
        ModeratedService_1.prototype.effectiveTimer = function (questionTimerSeconds, defaultTimerSeconds) {
            var value = questionTimerSeconds !== null && questionTimerSeconds !== void 0 ? questionTimerSeconds : defaultTimerSeconds;
            return value === -1 || value === null ? null : value;
        };
        ModeratedService_1.prototype.publicQuestion = function (question) {
            return { id: question.id, text: question.text, itemType: question.itemType, gameType: question.gameType, options: question.options, special: question.special, timerSeconds: question.timerSeconds };
        };
        ModeratedService_1.prototype.score = function (session, participant) {
            var correct = 0;
            var answered = 0;
            for (var _i = 0, _a = participant.questions; _i < _a.length; _i++) {
                var question = _a[_i];
                var answer = participant.answers.get(question.id);
                if (answer === undefined)
                    continue;
                answered += 1;
                if (answer === question.correctAnswer)
                    correct += 1;
            }
            return session.scoringEnabled ? { correct: correct, answered: answered, points: participant.pointScore.points, streak: participant.pointScore.streak, lastAward: participant.pointScore.lastAward } : { correct: correct, answered: answered };
        };
        ModeratedService_1.prototype.awardPoints = function (session, participant, question, isCorrect) {
            var _a, _b, _c;
            if (!isCorrect) {
                participant.pointScore.streak = 0;
                participant.pointScore.lastAward = null;
                return;
            }
            participant.pointScore.streak += 1;
            participant.pointScore.maxStreak = Math.max(participant.pointScore.maxStreak, participant.pointScore.streak);
            if (!session.scoringEnabled)
                return;
            var base = 100;
            var streak = Math.min((participant.pointScore.streak - 1) * 25, 100);
            var openedAt = (_b = (_a = participant.currentQuestionOpenedAt) === null || _a === void 0 ? void 0 : _a.getTime()) !== null && _b !== void 0 ? _b : Date.now();
            // Timed questions use their configured duration; untimed questions use a fair 30-second speed window.
            var speedWindowMs = ((_c = question.timerSeconds) !== null && _c !== void 0 ? _c : 30) * 1000;
            var speed = Math.min(100, Math.max(0, Math.round(100 * Math.max(0, speedWindowMs - (Date.now() - openedAt)) / speedWindowMs)));
            var total = base + streak + speed;
            participant.pointScore.points += total;
            participant.pointScore.lastAward = { base: base, streak: streak, speed: speed, total: total };
        };
        ModeratedService_1.prototype.timerEndsAt = function (participant, question) {
            if (question.timerSeconds === null || !participant.currentQuestionOpenedAt)
                return null;
            return new Date(participant.currentQuestionOpenedAt.getTime() + (question.timerSeconds * 1000));
        };
        ModeratedService_1.prototype.hasTimedOut = function (participant, question) {
            var endsAt = this.timerEndsAt(participant, question);
            return endsAt !== null && endsAt.getTime() <= Date.now();
        };
        ModeratedService_1.prototype.openParticipantQuestion = function (session, participant) {
            var _a;
            var _this = this;
            this.clearParticipantTimer(participant);
            participant.currentQuestionIndex += 1;
            if (participant.currentQuestionIndex >= participant.questions.length) {
                if (session.endless) {
                    var questions = session.quiz.questions.filter(function (item) { return item.itemType === 'question'; });
                    (_a = participant.questions).push.apply(_a, this.shuffle(questions, (0, crypto_1.randomUUID)()).map(function (question) { return (__assign(__assign({}, question), { id: (0, crypto_1.randomUUID)() })); }));
                }
                else {
                    participant.completedAt = new Date();
                    participant.currentQuestionOpenedAt = null;
                    this.completeSessionIfFinished(session);
                    return;
                }
            }
            participant.currentQuestionOpenedAt = new Date();
            var question = participant.questions[participant.currentQuestionIndex];
            var endsAt = this.timerEndsAt(participant, question);
            if (!endsAt || session.mode === 'facilitated')
                return;
            var questionIndex = participant.currentQuestionIndex;
            var run = function () {
                _this.expire(session);
                if (session.phase !== 'question' || session.participants.get(participant.id) !== participant || participant.currentQuestionIndex !== questionIndex)
                    return;
                if (!_this.hasTimedOut(participant, question)) {
                    participant.autoAdvanceTimer = setTimeout(run, Math.max(0, endsAt.getTime() - Date.now()) + 10);
                    return;
                }
                _this.onParticipantQuestionTimedOut(session, participant, question);
            };
            participant.autoAdvanceTimer = setTimeout(run, Math.max(0, endsAt.getTime() - Date.now()) + 10);
        };
        ModeratedService_1.prototype.queueEndlessReinforcement = function (session, participant, question) {
            var _a;
            var questionPool = session.quiz.questions.filter(function (item) { return item.itemType === 'question'; });
            var futureQuestions = function () { return participant.questions.slice(participant.currentQuestionIndex + 1).filter(function (item) { return item.itemType === 'question'; }); };
            // Keep enough upcoming questions in the personal queue that both review
            // attempts can be placed within the next ten questions, even for a
            // one-question quiz.
            while (futureQuestions().length < 10) {
                (_a = participant.questions).push.apply(_a, this.shuffle(questionPool, (0, crypto_1.randomUUID)()).map(function (item) { return (__assign(__assign({}, item), { id: (0, crypto_1.randomUUID)() })); }));
            }
            var positions = new Set();
            while (positions.size < 2)
                positions.add((0, crypto_1.randomInt)(10));
            for (var _i = 0, _b = __spreadArray([], positions, true).sort(function (left, right) { return left - right; }); _i < _b.length; _i++) {
                var position = _b[_i];
                var upcoming = futureQuestions();
                var before = upcoming[position];
                var insertAt = participant.questions.indexOf(before, participant.currentQuestionIndex + 1);
                participant.questions.splice(insertAt, 0, __assign(__assign({}, question), { id: (0, crypto_1.randomUUID)() }));
            }
        };
        ModeratedService_1.prototype.clearParticipantTimer = function (participant) {
            if (!participant.autoAdvanceTimer)
                return;
            clearTimeout(participant.autoAdvanceTimer);
            participant.autoAdvanceTimer = null;
        };
        ModeratedService_1.prototype.onParticipantQuestionTimedOut = function (session, participant, question) {
            if (session.mode === 'matching' || session.mode === 'battleship' || session.mode === 'archery' || session.mode === 'curling' || question.itemType === 'game') {
                participant.betweenQuestions = true;
                return;
            }
            this.openParticipantQuestion(session, participant);
        };
        ModeratedService_1.prototype.completeSessionIfFinished = function (session) {
            if (session.mode !== 'facilitated' && session.phase === 'question' && session.participants.size > 0
                && __spreadArray([], session.participants.values(), true).every(function (participant) { return participant.completedAt !== null; })) {
                session.phase = 'complete';
            }
        };
        ModeratedService_1.prototype.shuffleQuestionsInPlace = function (items, participants) {
            var _a, _b;
            var questions = items.filter(function (item) { return item.itemType === 'question'; });
            for (var index = questions.length - 1; index > 0; index -= 1) {
                var randomIndex = (0, crypto_1.randomInt)(index + 1);
                _a = [questions[randomIndex], questions[index]], questions[index] = _a[0], questions[randomIndex] = _a[1];
            }
            var orderKey = function (order) { return order.filter(function (item) { return item.itemType === 'question'; }).map(function (item) { return item.id; }).join(','); };
            var usedOrders = new Set(__spreadArray([], participants, true).map(function (participant) { return orderKey(participant.questions); }));
            // Prefer an unused permutation while one exists, including for short quizzes.
            for (var attempt = 0; attempt < usedOrders.size && usedOrders.has(orderKey(questions)); attempt += 1) {
                var pivot = questions.length - 2;
                while (pivot >= 0 && questions[pivot].id >= questions[pivot + 1].id)
                    pivot -= 1;
                if (pivot < 0) {
                    questions.reverse();
                }
                else {
                    var successor = questions.length - 1;
                    while (questions[successor].id <= questions[pivot].id)
                        successor -= 1;
                    _b = [questions[successor], questions[pivot]], questions[pivot] = _b[0], questions[successor] = _b[1];
                    var suffix = questions.splice(pivot + 1).reverse();
                    questions.push.apply(questions, suffix);
                }
            }
            var questionIndex = 0;
            return items.map(function (item) { return item.itemType === 'question' ? questions[questionIndex++] : item; });
        };
        ModeratedService_1.prototype.shuffle = function (items, seed) {
            var _a;
            var value = __spreadArray([], seed, true).reduce(function (total, character) { return ((total * 31) + character.charCodeAt(0)) >>> 0; }, 0) || 1;
            var result = __spreadArray([], items, true);
            for (var index = result.length - 1; index > 0; index -= 1) {
                value = (value * 1664525 + 1013904223) >>> 0;
                var next = value % (index + 1);
                _a = [result[next], result[index]], result[index] = _a[0], result[next] = _a[1];
            }
            return result;
        };
        return ModeratedService_1;
    }());
    __setFunctionName(_classThis, "ModeratedService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ModeratedService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ModeratedService = _classThis;
}();
exports.ModeratedService = ModeratedService;
