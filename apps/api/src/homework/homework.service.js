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
exports.HomeworkService = void 0;
var special_1 = require("../question-types/special");
var answer_matching_1 = require("../question-types/answer-matching");
var common_1 = require("@nestjs/common");
var crypto_1 = require("crypto");
/** Homework snapshots and attempts live in Postgres so they survive API restarts. */
var HomeworkService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var HomeworkService = _classThis = /** @class */ (function () {
        function HomeworkService_1(prisma, speech) {
            this.prisma = prisma;
            this.speech = speech;
        }
        HomeworkService_1.prototype.listActive = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                var sessions;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.homeworkSession.findMany({ where: __assign(__assign({}, (user.canViewAllQuizzes ? {} : { ownerId: user.id })), { ended: false, endsAt: { gt: new Date() } }), orderBy: { createdAt: 'desc' }, include: { _count: { select: { participants: true } } } })];
                        case 1:
                            sessions = _a.sent();
                            return [2 /*return*/, sessions.map(function (session) { return ({ sessionId: session.id, title: session.quizSnapshot.title, participantCount: session._count.participants, createdAt: session.createdAt.toISOString(), endsAt: session.endsAt.toISOString(), mode: _this.homeworkMode(session.mode) }); })];
                    }
                });
            });
        };
        HomeworkService_1.prototype.listHistory = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                var ownership, sessions;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            ownership = user.canViewAllQuizzes ? {} : { ownerId: user.id };
                            return [4 /*yield*/, this.prisma.homeworkSession.updateMany({ where: __assign(__assign({}, ownership), { ended: false, endsAt: { lte: new Date() } }), data: { ended: true, expired: true } })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.homeworkSession.findMany({ where: __assign(__assign({}, ownership), { ended: true }), orderBy: { createdAt: 'desc' }, take: 100, include: { _count: { select: { participants: true } } } })];
                        case 2:
                            sessions = _a.sent();
                            return [2 /*return*/, sessions.map(function (session) { return ({ sessionId: session.id, title: session.quizSnapshot.title, participantCount: session._count.participants, createdAt: session.createdAt.toISOString(), endsAt: session.endsAt.toISOString(), mode: _this.homeworkMode(session.mode), ended: true, expired: session.expired }); })];
                    }
                });
            });
        };
        HomeworkService_1.prototype.create = function (quizId_1, durationSeconds_1) {
            return __awaiter(this, arguments, void 0, function (quizId, durationSeconds, mode, speechLanguage, user) {
                var quiz, authoredQuestions, questions, createdAt, session;
                var _this = this;
                var _a;
                if (mode === void 0) { mode = 'classic'; }
                if (speechLanguage === void 0) { speechLanguage = 'en-US'; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.quiz.findFirst({ where: user.canViewAllQuizzes ? { id: quizId } : { id: quizId, ownerId: user.id }, include: { questions: { where: { isEnabled: true }, orderBy: { position: 'asc' } } } })];
                        case 1:
                            quiz = _b.sent();
                            if (!quiz)
                                throw new common_1.NotFoundException("Quiz ".concat(quizId, " was not found"));
                            if (!quiz.questions.length)
                                throw new common_1.BadRequestException('Enable at least one item before creating homework');
                            authoredQuestions = quiz.questions.map(function (question) {
                                var _a;
                                var special = (0, special_1.specialQuestion)(question.options);
                                var itemType = question.itemType === 'game' ? 'game' : question.itemType === 'text' ? 'text' : 'question';
                                var storedOptions = Array.isArray(question.options) ? question.options.filter(function (value) { return typeof value === 'string'; }) : [];
                                var wrongAnswers = __spreadArray([], new Set(storedOptions.filter(function (option) { return option !== question.correctAnswer; })), true);
                                var optionCount = Math.min((_a = question.answerCount) !== null && _a !== void 0 ? _a : wrongAnswers.length + 1, wrongAnswers.length + 1);
                                return { id: String(question.id), text: question.text, itemType: itemType, special: special, gameType: question.gameType === 'coin_catch' || question.gameType === 'match_pairs' || question.gameType === 'tower_stack' ? question.gameType : null, gameDurationSeconds: question.gameDurationSeconds, options: itemType !== 'question' || (special === null || special === void 0 ? void 0 : special.kind) === 'matching' || (special === null || special === void 0 ? void 0 : special.kind) === 'short_answer' ? [] : (special === null || special === void 0 ? void 0 : special.kind) === 'true_false' ? ['True', 'False'] : _this.shuffle(__spreadArray([question.correctAnswer], _this.shuffle(wrongAnswers).slice(0, optionCount - 1), true)), correctAnswer: question.correctAnswer, acceptedAnswers: _this.acceptedAnswers(question.correctAnswer, question.acceptedAnswers), timerSeconds: _this.effectiveTimer(question.timerSeconds, quiz.defaultTimerSeconds) };
                            });
                            if (mode === 'speak' && authoredQuestions.some(function (question) { var _a; return ((_a = question.special) === null || _a === void 0 ? void 0 : _a.kind) === 'matching'; }))
                                throw new common_1.BadRequestException('Speak the Answer homework does not support matching exercises. Remove or disable matching items first.');
                            questions = quiz.randomizeQuestionOrder ? this.shuffleQuestionsInPlace(authoredQuestions) : authoredQuestions;
                            createdAt = new Date();
                            return [4 /*yield*/, this.prisma.homeworkSession.create({ data: { id: (0, crypto_1.randomUUID)(), ownerId: user.id, facilitatorToken: (0, crypto_1.randomUUID)(), mode: mode, quizSnapshot: { title: quiz.title, description: quiz.description, theme: quiz.theme, answerMatching: quiz.answerMatching === 'exact' ? 'exact' : 'close', speechLanguage: speechLanguage, creditEveryCorrectAnswers: (_a = quiz.creditEveryCorrectAnswers) !== null && _a !== void 0 ? _a : 1, questions: questions }, endsAt: new Date(createdAt.getTime() + durationSeconds * 1000), createdAt: createdAt } })];
                        case 2:
                            session = _b.sent();
                            return [2 /*return*/, { sessionId: session.id, facilitatorToken: user.id }];
                    }
                });
            });
        };
        HomeworkService_1.prototype.join = function (sessionId, name) {
            return __awaiter(this, void 0, void 0, function () {
                var session, cleanName, participant;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.get(sessionId)];
                        case 1:
                            session = _a.sent();
                            this.assertOpen(session);
                            cleanName = name.trim();
                            if (!cleanName)
                                throw new common_1.BadRequestException('Enter your name to begin');
                            return [4 /*yield*/, this.prisma.homeworkParticipant.create({ data: { id: (0, crypto_1.randomUUID)(), homeworkSessionId: session.id, name: cleanName } })];
                        case 2:
                            participant = _a.sent();
                            return [2 /*return*/, { participantId: participant.id, name: participant.name }];
                    }
                });
            });
        };
        HomeworkService_1.prototype.restart = function (sessionId, participantId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, session, participant, retry;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.participant(sessionId, participantId)];
                        case 1:
                            _a = _b.sent(), session = _a.session, participant = _a.participant;
                            this.assertOpen(session);
                            if (!participant.completedAt)
                                throw new common_1.BadRequestException('Finish this homework before taking it again');
                            return [4 /*yield*/, this.prisma.homeworkParticipant.create({ data: { id: (0, crypto_1.randomUUID)(), homeworkSessionId: session.id, name: participant.name } })];
                        case 2:
                            retry = _b.sent();
                            return [2 /*return*/, { participantId: retry.id, name: retry.name }];
                    }
                });
            });
        };
        HomeworkService_1.prototype.studentState = function (sessionId, participantId) {
            return __awaiter(this, void 0, void 0, function () {
                var session, participant;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.get(sessionId)];
                        case 1:
                            session = _c.sent(), participant = participantId ? session.participants.find(function (item) { return item.id === participantId; }) : undefined;
                            return [2 /*return*/, { sessionId: session.id, title: session.quiz.title, description: session.quiz.description, theme: session.quiz.theme, answerMatching: (_a = session.quiz.answerMatching) !== null && _a !== void 0 ? _a : 'close', speechLanguage: (_b = session.quiz.speechLanguage) !== null && _b !== void 0 ? _b : 'en-US', mode: session.mode, ended: session.ended, expired: session.expired, endsAt: session.endsAt.toISOString(), questions: session.quiz.questions.map(function (question) { var _a, _b, _c; return (__assign(__assign({}, question), { answer: (_a = participant === null || participant === void 0 ? void 0 : participant.answers[question.id]) !== null && _a !== void 0 ? _a : null, completed: (_b = participant === null || participant === void 0 ? void 0 : participant.completedItems.includes(question.id)) !== null && _b !== void 0 ? _b : false, matchProgress: (_c = participant === null || participant === void 0 ? void 0 : participant.matchProgress[question.id]) !== null && _c !== void 0 ? _c : null })); }), participant: participant ? { id: participant.id, name: participant.name, score: this.score(session, participant), archery: session.mode === 'archery' ? this.archeryState(participant) : null, curling: session.mode === 'curling' ? this.curlingState(participant) : null, completed: participant.completedAt !== null } : null }];
                    }
                });
            });
        };
        HomeworkService_1.prototype.submitAnswer = function (sessionId, participantId, questionId, answer) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, session, participant, question, answers, matchProgress, completedItems, progress, correct, correctAnswers, earnsCredit, archeryArrows, curlingStones, completedAt, updated;
                var _this = this;
                var _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, this.participant(sessionId, participantId)];
                        case 1:
                            _a = _e.sent(), session = _a.session, participant = _a.participant;
                            this.assertActiveAttempt(session, participant);
                            question = session.quiz.questions.find(function (item) { return item.id === questionId; });
                            if (!question || question.itemType !== 'question')
                                throw new common_1.BadRequestException('That is not a homework question');
                            answers = __assign({}, participant.answers), matchProgress = __assign({}, participant.matchProgress), completedItems = new Set(participant.completedItems);
                            progress = null;
                            if (!(((_b = question.special) === null || _b === void 0 ? void 0 : _b.kind) === 'matching')) return [3 /*break*/, 4];
                            if (answers[questionId])
                                throw new common_1.BadRequestException('That answer has already been submitted');
                            progress = (0, special_1.matchAttempt)(question.special.pairs, matchProgress[questionId], answer);
                            if (!progress)
                                throw new common_1.BadRequestException('Choose one item from each column');
                            matchProgress[questionId] = progress;
                            if (!(progress.mistakes < 3 && progress.matched.length < question.special.pairs.length)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.saveParticipant(participant.id, { matchProgress: matchProgress })];
                        case 2:
                            _e.sent();
                            return [2 /*return*/, { answered: false, matchProgress: progress }];
                        case 3:
                            answer = progress.matched.length === question.special.pairs.length ? 'Matched' : 'Not matched';
                            return [3 /*break*/, 5];
                        case 4:
                            if (((_c = question.special) === null || _c === void 0 ? void 0 : _c.kind) === 'short_answer') {
                                answer = answer.trim();
                                if (!answer)
                                    throw new common_1.BadRequestException('Enter an answer');
                            }
                            else if (session.mode === 'speak') {
                                answer = answer.trim();
                                if (!answer)
                                    throw new common_1.BadRequestException('No speech was detected. Please try again.');
                            }
                            else if (!question.options.includes(answer))
                                throw new common_1.BadRequestException('Choose one of the available answers');
                            _e.label = 5;
                        case 5:
                            if (answers[questionId])
                                throw new common_1.BadRequestException('That answer has already been submitted');
                            answers[questionId] = answer;
                            completedItems.add(questionId);
                            correct = this.isAcceptedAnswer(answer, question, session.quiz.answerMatching);
                            correctAnswers = session.quiz.questions.filter(function (item) { return item.itemType === 'question' && answers[item.id] !== undefined && _this.isAcceptedAnswer(answers[item.id], item, session.quiz.answerMatching); }).length;
                            earnsCredit = correct && correctAnswers % session.quiz.creditEveryCorrectAnswers === 0;
                            archeryArrows = participant.archeryArrows + (session.mode === 'archery' && earnsCredit ? 1 : 0);
                            curlingStones = ((_d = participant.curlingStones) !== null && _d !== void 0 ? _d : 0) + (session.mode === 'curling' && earnsCredit ? 1 : 0);
                            completedAt = completedItems.size === session.quiz.questions.length ? new Date() : null;
                            updated = __assign(__assign({}, participant), { answers: answers, matchProgress: matchProgress, completedItems: __spreadArray([], completedItems, true), archeryArrows: archeryArrows, curlingStones: curlingStones, completedAt: completedAt });
                            return [4 /*yield*/, this.saveParticipant(participant.id, { answers: answers, matchProgress: matchProgress, completedItems: __spreadArray([], completedItems, true), archeryArrows: archeryArrows, curlingStones: curlingStones, completedAt: completedAt })];
                        case 6:
                            _e.sent();
                            return [2 /*return*/, { answered: true, matchProgress: progress, isCorrect: correct, correctAnswer: question.correctAnswer, score: this.score(session, updated), archery: session.mode === 'archery' ? this.archeryState(updated) : null, curling: session.mode === 'curling' ? this.curlingState(updated) : null, completed: completedAt !== null }];
                    }
                });
            });
        };
        HomeworkService_1.prototype.submitSpokenAnswer = function (sessionId, participantId, questionId, audio, mimeType) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, session, participant, question, transcript, _b;
                var _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, this.participant(sessionId, participantId)];
                        case 1:
                            _a = _e.sent(), session = _a.session, participant = _a.participant;
                            this.assertActiveAttempt(session, participant);
                            if (session.mode !== 'speak')
                                throw new common_1.BadRequestException('Speaking answers is not enabled for this homework');
                            question = session.quiz.questions.find(function (item) { return item.id === questionId; });
                            if (!question || question.itemType !== 'question')
                                throw new common_1.BadRequestException('That is not a homework question');
                            if (((_c = question.special) === null || _c === void 0 ? void 0 : _c.kind) === 'matching')
                                throw new common_1.BadRequestException('Matching exercises cannot be answered by voice');
                            if (!(audio === null || audio === void 0 ? void 0 : audio.length))
                                return [2 /*return*/, { detected: false }];
                            if (mimeType && !mimeType.startsWith('audio/webm'))
                                throw new common_1.BadRequestException('Please record using a browser that supports WebM audio');
                            return [4 /*yield*/, this.speech.transcribe(audio, (_d = session.quiz.speechLanguage) !== null && _d !== void 0 ? _d : 'en-US')];
                        case 2:
                            transcript = _e.sent();
                            if (!transcript)
                                return [2 /*return*/, { detected: false }];
                            _b = [{ detected: true, transcript: transcript }];
                            return [4 /*yield*/, this.submitAnswer(sessionId, participantId, questionId, transcript)];
                        case 3: return [2 /*return*/, __assign.apply(void 0, _b.concat([(_e.sent())]))];
                    }
                });
            });
        };
        HomeworkService_1.prototype.completeItem = function (sessionId, participantId, questionId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, session, participant, completedItems, completedAt;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.participant(sessionId, participantId)];
                        case 1:
                            _a = _b.sent(), session = _a.session, participant = _a.participant;
                            this.assertActiveAttempt(session, participant);
                            if (!session.quiz.questions.some(function (question) { return question.id === questionId; }))
                                throw new common_1.BadRequestException('That homework item could not be found');
                            completedItems = __spreadArray([], new Set(__spreadArray(__spreadArray([], participant.completedItems, true), [questionId], false)), true), completedAt = completedItems.length === session.quiz.questions.length ? new Date() : null;
                            return [4 /*yield*/, this.saveParticipant(participant.id, { completedItems: completedItems, completedAt: completedAt })];
                        case 2:
                            _b.sent();
                            return [2 /*return*/, { completed: completedAt !== null, score: this.score(session, __assign(__assign({}, participant), { completedItems: completedItems, completedAt: completedAt })) }];
                    }
                });
            });
        };
        HomeworkService_1.prototype.shootArchery = function (sessionId, participantId, x, y) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, session, participant, shot, archeryShots, archeryArrows, shootingScore;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.participant(sessionId, participantId)];
                        case 1:
                            _a = _b.sent(), session = _a.session, participant = _a.participant;
                            this.assertOpen(session);
                            if (session.mode !== 'archery')
                                throw new common_1.BadRequestException('Archery is not enabled for this homework');
                            if (participant.archeryArrows < 1)
                                throw new common_1.BadRequestException('Answer a question correctly to earn an arrow');
                            shot = { id: (0, crypto_1.randomUUID)(), x: x, y: y, score: this.archeryScore(x, y) }, archeryShots = __spreadArray(__spreadArray([], participant.archeryShots, true), [shot], false), archeryArrows = participant.archeryArrows - 1, shootingScore = participant.shootingScore + shot.score;
                            return [4 /*yield*/, this.saveParticipant(participant.id, { archeryShots: archeryShots, archeryArrows: archeryArrows, shootingScore: shootingScore })];
                        case 2:
                            _b.sent();
                            return [2 /*return*/, this.archeryState(__assign(__assign({}, participant), { archeryShots: archeryShots, archeryArrows: archeryArrows, shootingScore: shootingScore }))];
                    }
                });
            });
        };
        HomeworkService_1.prototype.releaseCurlingStone = function (sessionId, participantId, direction, speed) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, session, participant, shot, curlingShots, curlingStones, curlingScore;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.participant(sessionId, participantId)];
                        case 1:
                            _a = _b.sent(), session = _a.session, participant = _a.participant;
                            this.assertOpen(session);
                            if (session.mode !== 'curling')
                                throw new common_1.BadRequestException('Curling is not enabled for this homework');
                            if (!Number.isInteger(direction) || !Number.isInteger(speed) || Math.abs(direction) > 100 || speed < 0 || speed > 100)
                                throw new common_1.BadRequestException('Choose a direction and speed on the sheet');
                            if (participant.curlingStones < 1)
                                throw new common_1.BadRequestException('Answer a question correctly to earn a stone');
                            shot = __assign({ id: (0, crypto_1.randomUUID)(), direction: direction, speed: speed }, this.curlingLanding(direction, speed)), curlingShots = __spreadArray(__spreadArray([], participant.curlingShots, true), [shot], false), curlingStones = participant.curlingStones - 1, curlingScore = participant.curlingScore + shot.score;
                            return [4 /*yield*/, this.saveParticipant(participant.id, { curlingShots: curlingShots, curlingStones: curlingStones, curlingScore: curlingScore })];
                        case 2:
                            _b.sent();
                            return [2 /*return*/, this.curlingState(__assign(__assign({}, participant), { curlingShots: curlingShots, curlingStones: curlingStones, curlingScore: curlingScore }))];
                    }
                });
            });
        };
        HomeworkService_1.prototype.teacherState = function (sessionId, user) {
            return __awaiter(this, void 0, void 0, function () {
                var session, aliases, questionCount, attemptsByStudent, participants, questionStats, archeryLeaderboard, curlingLeaderboard;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.get(sessionId)];
                        case 1:
                            session = _a.sent();
                            this.authorizeTeacher(session, user);
                            aliases = this.nameAliases(session, user);
                            questionCount = session.quiz.questions.filter(function (question) { return question.itemType === 'question'; }).length;
                            attemptsByStudent = new Map();
                            participants = session.participants.map(function (participant) {
                                var _a, _b, _c;
                                var key = participant.name.trim().toLocaleLowerCase();
                                var attemptNumber = ((_a = attemptsByStudent.get(key)) !== null && _a !== void 0 ? _a : 0) + 1;
                                attemptsByStudent.set(key, attemptNumber);
                                return { id: participant.id, name: _this.displayName(participant.name, aliases), attemptNumber: attemptNumber, joinedAt: participant.joinedAt.toISOString(), completedAt: (_c = (_b = participant.completedAt) === null || _b === void 0 ? void 0 : _b.toISOString()) !== null && _c !== void 0 ? _c : null, completed: participant.completedAt !== null, completedItems: participant.completedItems.length, score: _this.score(session, participant), shootingScore: session.mode === 'archery' ? participant.shootingScore : session.mode === 'curling' ? participant.curlingScore : null };
                            });
                            questionStats = session.quiz.questions.filter(function (question) { return question.itemType === 'question'; }).map(function (question) {
                                var _a;
                                var answered = session.participants.filter(function (participant) { return Object.hasOwn(participant.answers, question.id); });
                                var correct = answered.filter(function (participant) { return _this.isAcceptedAnswer(participant.answers[question.id], question, session.quiz.answerMatching); }).length;
                                var matchingPairs = ((_a = question.special) === null || _a === void 0 ? void 0 : _a.kind) === 'matching' ? question.special.pairs : undefined;
                                return __assign(__assign({ id: question.id, text: question.text }, (matchingPairs ? { matchingPairs: matchingPairs } : {})), { answered: answered.length, correct: correct, correctRate: answered.length ? Math.round((correct / answered.length) * 100) : 0 });
                            });
                            archeryLeaderboard = session.mode === 'archery' ? __spreadArray([], session.participants.reduce(function (leaders, participant) {
                                var key = participant.name.trim().toLocaleLowerCase();
                                var current = leaders.get(key);
                                leaders.set(key, current ? __assign(__assign({}, current), { attempts: current.attempts + 1, bestScore: Math.max(current.bestScore, participant.shootingScore) }) : { name: _this.displayName(participant.name, aliases), attempts: 1, bestScore: participant.shootingScore });
                                return leaders;
                            }, new Map()).values(), true).sort(function (a, b) { return b.bestScore - a.bestScore || a.name.localeCompare(b.name); }) : [];
                            curlingLeaderboard = session.mode === 'curling' ? __spreadArray([], session.participants.reduce(function (leaders, participant) {
                                var key = participant.name.trim().toLocaleLowerCase();
                                var current = leaders.get(key);
                                leaders.set(key, current ? __assign(__assign({}, current), { attempts: current.attempts + 1, bestScore: Math.max(current.bestScore, participant.curlingScore) }) : { name: _this.displayName(participant.name, aliases), attempts: 1, bestScore: participant.curlingScore });
                                return leaders;
                            }, new Map()).values(), true).sort(function (a, b) { return b.bestScore - a.bestScore || a.name.localeCompare(b.name); }) : [];
                            return [2 /*return*/, { sessionId: session.id, title: session.quiz.title, description: session.quiz.description, mode: session.mode, ended: session.ended, expired: session.expired, endsAt: session.endsAt.toISOString(), questionCount: questionCount, itemCount: session.quiz.questions.length, createdAt: session.createdAt.toISOString(), participants: participants, questionStats: questionStats, archeryLeaderboard: archeryLeaderboard, curlingLeaderboard: curlingLeaderboard }];
                    }
                });
            });
        };
        HomeworkService_1.prototype.teacherAttempt = function (sessionId, user, participantId) {
            return __awaiter(this, void 0, void 0, function () {
                var session, aliases, participant;
                var _this = this;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.get(sessionId)];
                        case 1:
                            session = _c.sent();
                            this.authorizeTeacher(session, user);
                            aliases = this.nameAliases(session, user);
                            participant = session.participants.find(function (item) { return item.id === participantId; });
                            if (!participant)
                                throw new common_1.NotFoundException('That homework attempt could not be found');
                            return [2 /*return*/, {
                                    id: participant.id,
                                    name: this.displayName(participant.name, aliases),
                                    joinedAt: participant.joinedAt.toISOString(),
                                    completedAt: (_b = (_a = participant.completedAt) === null || _a === void 0 ? void 0 : _a.toISOString()) !== null && _b !== void 0 ? _b : null,
                                    completed: participant.completedAt !== null,
                                    completedItems: participant.completedItems.length,
                                    score: this.score(session, participant),
                                    shootingScore: session.mode === 'archery' ? participant.shootingScore : session.mode === 'curling' ? participant.curlingScore : null,
                                    answers: session.quiz.questions.filter(function (question) { return question.itemType === 'question'; }).map(function (question) {
                                        var _a;
                                        var answer = participant.answers[question.id];
                                        var matchingPairs = ((_a = question.special) === null || _a === void 0 ? void 0 : _a.kind) === 'matching' ? question.special.pairs : undefined;
                                        return __assign(__assign({ id: question.id, text: question.text }, (matchingPairs ? { matchingPairs: matchingPairs } : {})), { answer: answer !== null && answer !== void 0 ? answer : null, correctAnswer: question.correctAnswer, isCorrect: answer === undefined ? null : _this.isAcceptedAnswer(answer, question, session.quiz.answerMatching) });
                                    }),
                                }];
                    }
                });
            });
        };
        HomeworkService_1.prototype.end = function (sessionId, user) {
            return __awaiter(this, void 0, void 0, function () { var session; return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.get(sessionId)];
                    case 1:
                        session = _a.sent();
                        this.authorizeTeacher(session, user);
                        return [4 /*yield*/, this.prisma.homeworkSession.update({ where: { id: session.id }, data: { ended: true } })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, this.teacherState(sessionId, user)];
                }
            }); });
        };
        HomeworkService_1.prototype.updateDuration = function (sessionId, user, durationSeconds) {
            return __awaiter(this, void 0, void 0, function () {
                var session;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.get(sessionId)];
                        case 1:
                            session = _a.sent();
                            this.authorizeTeacher(session, user);
                            this.assertOpen(session);
                            return [4 /*yield*/, this.prisma.homeworkSession.update({ where: { id: session.id }, data: { endsAt: new Date(Date.now() + durationSeconds * 1000), expired: false } })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, this.teacherState(sessionId, user)];
                    }
                });
            });
        };
        HomeworkService_1.prototype.remove = function (sessionId, user) {
            return __awaiter(this, void 0, void 0, function () {
                var session;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.get(sessionId)];
                        case 1:
                            session = _a.sent();
                            this.authorizeTeacher(session, user);
                            if (!session.ended)
                                throw new common_1.BadRequestException('Only closed homework sessions can be deleted');
                            return [4 /*yield*/, this.prisma.homeworkSession.delete({ where: { id: session.id } })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { deleted: true }];
                    }
                });
            });
        };
        HomeworkService_1.prototype.get = function (sessionId) {
            return __awaiter(this, void 0, void 0, function () {
                var include, row;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            include = { participants: { orderBy: { joinedAt: 'asc' } } };
                            return [4 /*yield*/, this.prisma.homeworkSession.findUnique({ where: { id: sessionId }, include: include })];
                        case 1:
                            row = _a.sent();
                            if (!row)
                                throw new common_1.NotFoundException('That homework run is no longer available');
                            if (!(!row.ended && Date.now() >= row.endsAt.getTime())) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.homeworkSession.update({ where: { id: row.id }, data: { ended: true, expired: true }, include: include })];
                        case 2:
                            row = _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/, { id: row.id, ownerId: row.ownerId, facilitatorToken: row.facilitatorToken, mode: this.homeworkMode(row.mode), quiz: row.quizSnapshot, ended: row.ended, expired: row.expired, endsAt: row.endsAt, createdAt: row.createdAt, participants: row.participants.map(function (participant) { var _a, _b; return ({ id: participant.id, name: participant.name, answers: participant.answers, matchProgress: participant.matchProgress, completedItems: participant.completedItems, archeryArrows: participant.archeryArrows, archeryShots: participant.archeryShots, shootingScore: participant.shootingScore, curlingStones: (_a = participant.curlingStones) !== null && _a !== void 0 ? _a : 0, curlingShots: Array.isArray(participant.curlingShots) ? participant.curlingShots : [], curlingScore: (_b = participant.curlingScore) !== null && _b !== void 0 ? _b : 0, joinedAt: participant.joinedAt, completedAt: participant.completedAt }); }) }];
                    }
                });
            });
        };
        HomeworkService_1.prototype.participant = function (sessionId, participantId) {
            return __awaiter(this, void 0, void 0, function () { var session, participant; return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.get(sessionId)];
                    case 1:
                        session = _a.sent(), participant = session.participants.find(function (item) { return item.id === participantId; });
                        if (!participant)
                            throw new common_1.NotFoundException('Your homework attempt could not be found. Please begin again.');
                        return [2 /*return*/, { session: session, participant: participant }];
                }
            }); });
        };
        HomeworkService_1.prototype.nameAliases = function (session, user) { if (session.ownerId === user.id)
            return new Map(); var aliases = new Map(); for (var _i = 0, _a = session.participants; _i < _a.length; _i++) {
            var participant = _a[_i];
            var key = participant.name.trim().toLocaleLowerCase();
            if (!aliases.has(key))
                aliases.set(key, "Student #".concat(aliases.size + 1));
        } return aliases; };
        HomeworkService_1.prototype.displayName = function (name, aliases) { var _a; return (_a = aliases.get(name.trim().toLocaleLowerCase())) !== null && _a !== void 0 ? _a : name; };
        HomeworkService_1.prototype.authorizeTeacher = function (session, user) { if (session.ownerId !== user.id && !user.canViewAllQuizzes)
            throw new common_1.ForbiddenException('You do not have access to this homework run'); };
        HomeworkService_1.prototype.assertOpen = function (session) { if (session.ended)
            throw new common_1.BadRequestException('This homework has ended'); };
        HomeworkService_1.prototype.assertActiveAttempt = function (session, participant) { this.assertOpen(session); if (participant.completedAt)
            throw new common_1.BadRequestException('This homework attempt is already complete'); };
        HomeworkService_1.prototype.saveParticipant = function (id, data) { return this.prisma.homeworkParticipant.update({ where: { id: id }, data: data }); };
        HomeworkService_1.prototype.score = function (session, participant) {
            var _this = this;
            var questions = session.quiz.questions.filter(function (question) { return question.itemType === 'question'; });
            return { correct: questions.filter(function (question) { return participant.answers[question.id] !== undefined && _this.isAcceptedAnswer(participant.answers[question.id], question, session.quiz.answerMatching); }).length, answered: Object.keys(participant.answers).length, total: questions.length };
        };
        HomeworkService_1.prototype.archeryState = function (participant) { var _a; return { arrows: participant.archeryArrows, lastShot: (_a = participant.archeryShots.at(-1)) !== null && _a !== void 0 ? _a : null, attempts: __spreadArray([], participant.archeryShots, true).sort(function (a, b) { return b.score - a.score; }), shootingScore: participant.shootingScore }; };
        HomeworkService_1.prototype.archeryScore = function (x, y) { return Math.max(1, Math.round(1000 - (Math.sqrt((x * x) + (y * y)) * 10))); };
        HomeworkService_1.prototype.curlingState = function (participant) { var _a; return { stones: participant.curlingStones, lastStone: (_a = participant.curlingShots.at(-1)) !== null && _a !== void 0 ? _a : null, attempts: __spreadArray([], participant.curlingShots, true).sort(function (a, b) { return b.score - a.score; }), shootingScore: participant.curlingScore }; };
        HomeworkService_1.prototype.curlingLanding = function (direction, speed) { var x = Math.round(direction * (speed / 100) * 1.2), y = Math.round(100 - (speed * 1.55)), distance = Math.sqrt((x * x) + ((y + 32) * (y + 32))); return { x: x, y: y, score: Math.max(1, Math.round(1000 - (distance * 8))) }; };
        HomeworkService_1.prototype.effectiveTimer = function (questionTimerSeconds, defaultTimerSeconds) { var value = questionTimerSeconds !== null && questionTimerSeconds !== void 0 ? questionTimerSeconds : defaultTimerSeconds; return value === -1 || value === null ? null : value; };
        HomeworkService_1.prototype.shuffleQuestionsInPlace = function (items) {
            var _a;
            var questions = items.filter(function (item) { return item.itemType === 'question'; });
            for (var index = questions.length - 1; index > 0; index -= 1) {
                var randomIndex = Math.floor(Math.random() * (index + 1));
                _a = [questions[randomIndex], questions[index]], questions[index] = _a[0], questions[randomIndex] = _a[1];
            }
            var questionIndex = 0;
            return items.map(function (item) { return item.itemType === 'question' ? questions[questionIndex++] : item; });
        };
        HomeworkService_1.prototype.shuffle = function (items) {
            var _a;
            var result = __spreadArray([], items, true);
            for (var index = result.length - 1; index > 0; index -= 1) {
                var randomIndex = Math.floor(Math.random() * (index + 1));
                _a = [result[randomIndex], result[index]], result[index] = _a[0], result[randomIndex] = _a[1];
            }
            return result;
        };
        HomeworkService_1.prototype.homeworkMode = function (mode) { return mode === 'archery' || mode === 'curling' || mode === 'speak' ? mode : 'classic'; };
        HomeworkService_1.prototype.acceptedAnswers = function (correctAnswer, values) { return __spreadArray([], new Set(__spreadArray([correctAnswer], (Array.isArray(values) ? values.filter(function (value) { return typeof value === 'string'; }) : []), true).map(function (value) { return value.trim(); }).filter(Boolean)), true); };
        HomeworkService_1.prototype.isAcceptedAnswer = function (answer, question, mode) { return this.acceptedAnswers(question.correctAnswer, question.acceptedAnswers).some(function (candidate) { return (0, answer_matching_1.answersMatch)(answer, candidate, mode); }); };
        return HomeworkService_1;
    }());
    __setFunctionName(_classThis, "HomeworkService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        HomeworkService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return HomeworkService = _classThis;
}();
exports.HomeworkService = HomeworkService;
