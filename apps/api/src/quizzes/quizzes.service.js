"use strict";
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
exports.QuizzesService = void 0;
var common_1 = require("@nestjs/common");
var QuizzesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var QuizzesService = _classThis = /** @class */ (function () {
        function QuizzesService_1(prisma) {
            this.prisma = prisma;
        }
        QuizzesService_1.prototype.findAll = function (user) {
            return this.prisma.quiz.findMany({
                where: user.canViewAllQuizzes ? {} : { ownerId: user.id },
                orderBy: [{ archivedAt: 'asc' }, { createdAt: 'desc' }],
                include: { _count: { select: { questions: true } } },
            });
        };
        QuizzesService_1.prototype.archive = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.prisma.quiz.update({ where: { id: id }, data: { archivedAt: new Date() } })];
                    }
                });
            });
        };
        QuizzesService_1.prototype.restore = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, this.prisma.quiz.update({ where: { id: id }, data: { archivedAt: null } })];
                    }
                });
            });
        };
        QuizzesService_1.prototype.remove = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.quiz.delete({ where: { id: id } })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { deleted: true }];
                    }
                });
            });
        };
        QuizzesService_1.prototype.findOne = function (id, user) {
            return __awaiter(this, void 0, void 0, function () {
                var quiz;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.quiz.findFirst({
                                where: user.canViewAllQuizzes ? { id: id } : { id: id, ownerId: user.id },
                                include: {
                                    questions: {
                                        orderBy: { position: 'asc' },
                                        include: { answerPool: { select: { name: true } } },
                                    },
                                },
                            })];
                        case 1:
                            quiz = _a.sent();
                            if (!quiz)
                                throw new common_1.NotFoundException("Quiz ".concat(id, " was not found"));
                            return [2 /*return*/, quiz];
                    }
                });
            });
        };
        QuizzesService_1.prototype.create = function (_a, user) {
            var title = _a.title, description = _a.description, randomizeQuestionOrder = _a.randomizeQuestionOrder, theme = _a.theme, answerMatching = _a.answerMatching, defaultTimerSeconds = _a.defaultTimerSeconds, matchingPairCount = _a.matchingPairCount, battleshipBoardSize = _a.battleshipBoardSize, creditEveryCorrectAnswers = _a.creditEveryCorrectAnswers;
            if (!title.trim()) {
                throw new common_1.BadRequestException('title cannot be blank');
            }
            return this.prisma.quiz.create({
                data: {
                    title: title.trim(),
                    description: (description === null || description === void 0 ? void 0 : description.trim()) || null,
                    randomizeQuestionOrder: randomizeQuestionOrder !== null && randomizeQuestionOrder !== void 0 ? randomizeQuestionOrder : false,
                    theme: theme !== null && theme !== void 0 ? theme : 'standard',
                    answerMatching: answerMatching !== null && answerMatching !== void 0 ? answerMatching : 'close',
                    defaultTimerSeconds: defaultTimerSeconds !== null && defaultTimerSeconds !== void 0 ? defaultTimerSeconds : -1,
                    matchingPairCount: matchingPairCount !== null && matchingPairCount !== void 0 ? matchingPairCount : 6,
                    battleshipBoardSize: battleshipBoardSize !== null && battleshipBoardSize !== void 0 ? battleshipBoardSize : 10,
                    creditEveryCorrectAnswers: creditEveryCorrectAnswers !== null && creditEveryCorrectAnswers !== void 0 ? creditEveryCorrectAnswers : 1,
                    ownerId: user.id,
                },
            });
        };
        QuizzesService_1.prototype.update = function (id_1, _a, user_1) {
            return __awaiter(this, arguments, void 0, function (id, _b, user) {
                var title = _b.title, description = _b.description, randomizeQuestionOrder = _b.randomizeQuestionOrder, theme = _b.theme, answerMatching = _b.answerMatching, defaultTimerSeconds = _b.defaultTimerSeconds, matchingPairCount = _b.matchingPairCount, battleshipBoardSize = _b.battleshipBoardSize, creditEveryCorrectAnswers = _b.creditEveryCorrectAnswers;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.findOne(id, user)];
                        case 1:
                            _c.sent();
                            if (title !== undefined && !title.trim())
                                throw new common_1.BadRequestException('title cannot be blank');
                            return [2 /*return*/, this.prisma.quiz.update({
                                    where: { id: id },
                                    data: { title: title === null || title === void 0 ? void 0 : title.trim(), description: description === undefined ? undefined : description.trim() || null, randomizeQuestionOrder: randomizeQuestionOrder, theme: theme, answerMatching: answerMatching, defaultTimerSeconds: defaultTimerSeconds, matchingPairCount: matchingPairCount, battleshipBoardSize: battleshipBoardSize, creditEveryCorrectAnswers: creditEveryCorrectAnswers },
                                })];
                    }
                });
            });
        };
        QuizzesService_1.prototype.addQuestion = function (quizId, question, user) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, text, correctAnswer, acceptedAnswers, options, answerPoolId, answerCount, _max;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.findOne(quizId, user)];
                        case 1:
                            _d.sent();
                            return [4 /*yield*/, this.prepareQuestion(question, user)];
                        case 2:
                            _a = _d.sent(), text = _a.text, correctAnswer = _a.correctAnswer, acceptedAnswers = _a.acceptedAnswers, options = _a.options, answerPoolId = _a.answerPoolId, answerCount = _a.answerCount;
                            return [4 /*yield*/, this.prisma.question.aggregate({ where: { quizId: quizId }, _max: { position: true } })];
                        case 3:
                            _max = (_d.sent())._max;
                            return [2 /*return*/, this.prisma.question.create({
                                    data: {
                                        quizId: quizId,
                                        position: ((_b = _max.position) !== null && _b !== void 0 ? _b : -1) + 1,
                                        text: text,
                                        options: options,
                                        correctAnswer: correctAnswer,
                                        acceptedAnswers: acceptedAnswers,
                                        answerPoolId: answerPoolId,
                                        answerCount: answerCount,
                                        timerSeconds: (_c = question.timerSeconds) !== null && _c !== void 0 ? _c : null,
                                    },
                                })];
                    }
                });
            });
        };
        QuizzesService_1.prototype.addGame = function (quizId, game, user) {
            return __awaiter(this, void 0, void 0, function () {
                var _max, text;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.findOne(quizId, user)];
                        case 1:
                            _d.sent();
                            return [4 /*yield*/, this.prisma.question.aggregate({ where: { quizId: quizId }, _max: { position: true } })];
                        case 2:
                            _max = (_d.sent())._max;
                            text = ((_a = game.text) === null || _a === void 0 ? void 0 : _a.trim()) || this.gameTitle(game.gameType);
                            return [2 /*return*/, this.prisma.question.create({
                                    data: {
                                        quizId: quizId,
                                        position: ((_b = _max.position) !== null && _b !== void 0 ? _b : -1) + 1,
                                        itemType: 'game',
                                        gameType: game.gameType,
                                        gameDurationSeconds: (_c = game.durationSeconds) !== null && _c !== void 0 ? _c : 20,
                                        text: text,
                                        // These required legacy fields are deliberately unused by game items.
                                        correctAnswer: '',
                                        options: [],
                                    },
                                })];
                    }
                });
            });
        };
        QuizzesService_1.prototype.updateGame = function (quizId, gameId, game, user) {
            return __awaiter(this, void 0, void 0, function () {
                var existing;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.findOne(quizId, user)];
                        case 1:
                            _d.sent();
                            return [4 /*yield*/, this.prisma.question.findFirst({ where: { id: gameId, quizId: quizId, itemType: 'game' } })];
                        case 2:
                            existing = _d.sent();
                            if (!existing)
                                throw new common_1.NotFoundException("Game ".concat(gameId, " was not found in quiz ").concat(quizId));
                            return [2 /*return*/, this.prisma.question.update({
                                    where: { id: gameId },
                                    data: {
                                        text: ((_a = game.text) === null || _a === void 0 ? void 0 : _a.trim()) || this.gameTitle(game.gameType),
                                        gameType: game.gameType,
                                        gameDurationSeconds: (_c = (_b = game.durationSeconds) !== null && _b !== void 0 ? _b : existing.gameDurationSeconds) !== null && _c !== void 0 ? _c : 20,
                                    },
                                })];
                    }
                });
            });
        };
        QuizzesService_1.prototype.addText = function (quizId, textItem, user) {
            return __awaiter(this, void 0, void 0, function () {
                var text, _max;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.findOne(quizId, user)];
                        case 1:
                            _b.sent();
                            text = textItem.text.trim();
                            if (!text)
                                throw new common_1.BadRequestException('Text cannot be blank');
                            return [4 /*yield*/, this.prisma.question.aggregate({ where: { quizId: quizId }, _max: { position: true } })];
                        case 2:
                            _max = (_b.sent())._max;
                            return [2 /*return*/, this.prisma.question.create({
                                    data: {
                                        quizId: quizId,
                                        position: ((_a = _max.position) !== null && _a !== void 0 ? _a : -1) + 1,
                                        itemType: 'text',
                                        text: text,
                                        // These fields remain required for the shared timeline table.
                                        correctAnswer: '',
                                        options: [],
                                    },
                                })];
                    }
                });
            });
        };
        QuizzesService_1.prototype.updateText = function (quizId, textId, textItem, user) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, text;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(quizId, user)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.question.findFirst({ where: { id: textId, quizId: quizId, itemType: 'text' } })];
                        case 2:
                            existing = _a.sent();
                            if (!existing)
                                throw new common_1.NotFoundException("Text item ".concat(textId, " was not found in quiz ").concat(quizId));
                            text = textItem.text.trim();
                            if (!text)
                                throw new common_1.BadRequestException('Text cannot be blank');
                            return [2 /*return*/, this.prisma.question.update({ where: { id: textId }, data: { text: text } })];
                    }
                });
            });
        };
        QuizzesService_1.prototype.updateQuestion = function (quizId, questionId, question, user) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, _a, text, correctAnswer, acceptedAnswers, options, answerPoolId, answerCount;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.findOne(quizId, user)];
                        case 1:
                            _c.sent();
                            return [4 /*yield*/, this.prisma.question.findFirst({ where: { id: questionId, quizId: quizId } })];
                        case 2:
                            existing = _c.sent();
                            if (!existing)
                                throw new common_1.NotFoundException("Question ".concat(questionId, " was not found in quiz ").concat(quizId));
                            return [4 /*yield*/, this.prepareQuestion(question, user)];
                        case 3:
                            _a = _c.sent(), text = _a.text, correctAnswer = _a.correctAnswer, acceptedAnswers = _a.acceptedAnswers, options = _a.options, answerPoolId = _a.answerPoolId, answerCount = _a.answerCount;
                            return [2 /*return*/, this.prisma.question.update({
                                    where: { id: questionId },
                                    data: { text: text, correctAnswer: correctAnswer, acceptedAnswers: acceptedAnswers, options: options, answerPoolId: answerPoolId, answerCount: answerCount, timerSeconds: (_b = question.timerSeconds) !== null && _b !== void 0 ? _b : null },
                                })];
                    }
                });
            });
        };
        QuizzesService_1.prototype.updateQuestionEnabled = function (quizId, questionId, isEnabled, user) {
            return __awaiter(this, void 0, void 0, function () {
                var existing;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(quizId, user)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.question.findFirst({ where: { id: questionId, quizId: quizId } })];
                        case 2:
                            existing = _a.sent();
                            if (!existing)
                                throw new common_1.NotFoundException("Question ".concat(questionId, " was not found in quiz ").concat(quizId));
                            return [4 /*yield*/, this.prisma.question.update({ where: { id: questionId }, data: { isEnabled: isEnabled } })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, this.findOne(quizId, user)];
                    }
                });
            });
        };
        QuizzesService_1.prototype.deleteItem = function (quizId, itemId, user) {
            return __awaiter(this, void 0, void 0, function () {
                var item;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(quizId, user)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.question.findFirst({ where: { id: itemId, quizId: quizId } })];
                        case 2:
                            item = _a.sent();
                            if (!item)
                                throw new common_1.NotFoundException("Quiz item ".concat(itemId, " was not found in quiz ").concat(quizId));
                            return [4 /*yield*/, this.prisma.question.delete({ where: { id: itemId } })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, this.findOne(quizId, user)];
                    }
                });
            });
        };
        QuizzesService_1.prototype.reorderQuestions = function (quizId, questionIds, user) {
            return __awaiter(this, void 0, void 0, function () {
                var questions, existingIds, requestedIds;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findOne(quizId, user)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.prisma.question.findMany({ where: { quizId: quizId }, select: { id: true } })];
                        case 2:
                            questions = _a.sent();
                            existingIds = new Set(questions.map(function (question) { return question.id; }));
                            requestedIds = new Set(questionIds);
                            if (requestedIds.size !== questionIds.length || requestedIds.size !== existingIds.size || __spreadArray([], requestedIds, true).some(function (id) { return !existingIds.has(id); })) {
                                throw new common_1.BadRequestException('Question order must contain every question in this quiz exactly once');
                            }
                            return [4 /*yield*/, this.prisma.$transaction(questionIds.map(function (questionId, position) { return _this.prisma.question.update({ where: { id: questionId }, data: { position: position } }); }))];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, this.findOne(quizId, user)];
                    }
                });
            });
        };
        QuizzesService_1.prototype.findCommonQuestions = function (user) {
            return this.prisma.commonQuestion.findMany({
                where: { ownerId: user.id },
                orderBy: { createdAt: 'desc' },
                include: { answerPool: { include: { answers: { orderBy: { value: 'asc' } } } } },
            });
        };
        QuizzesService_1.prototype.createCommonQuestion = function (question, user) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, text, correctAnswer, acceptedAnswers, options, answerPoolId, answerCount;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prepareQuestion(question, user)];
                        case 1:
                            _a = _b.sent(), text = _a.text, correctAnswer = _a.correctAnswer, acceptedAnswers = _a.acceptedAnswers, options = _a.options, answerPoolId = _a.answerPoolId, answerCount = _a.answerCount;
                            return [2 /*return*/, this.prisma.commonQuestion.create({
                                    data: { text: text, correctAnswer: correctAnswer, acceptedAnswers: acceptedAnswers, options: options, answerPoolId: answerPoolId, answerCount: answerCount, ownerId: user.id },
                                    include: { answerPool: { include: { answers: true } } },
                                })];
                    }
                });
            });
        };
        QuizzesService_1.prototype.updateCommonQuestion = function (id, question, user) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, _a, text, correctAnswer, acceptedAnswers, options, answerPoolId, answerCount;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.commonQuestion.findFirst({ where: { id: id, ownerId: user.id } })];
                        case 1:
                            existing = _b.sent();
                            if (!existing)
                                throw new common_1.NotFoundException("Common question ".concat(id, " was not found"));
                            return [4 /*yield*/, this.prepareQuestion(question, user)];
                        case 2:
                            _a = _b.sent(), text = _a.text, correctAnswer = _a.correctAnswer, acceptedAnswers = _a.acceptedAnswers, options = _a.options, answerPoolId = _a.answerPoolId, answerCount = _a.answerCount;
                            return [2 /*return*/, this.prisma.commonQuestion.update({
                                    where: { id: id },
                                    data: { text: text, correctAnswer: correctAnswer, acceptedAnswers: acceptedAnswers, options: options, answerPoolId: answerPoolId, answerCount: answerCount },
                                    include: { answerPool: { include: { answers: true } } },
                                })];
                    }
                });
            });
        };
        QuizzesService_1.prototype.findAnswerPools = function (user) {
            return this.prisma.answerPool.findMany({
                where: { ownerId: user.id },
                orderBy: { name: 'asc' },
                include: { answers: { orderBy: { value: 'asc' } }, _count: { select: { questions: true, commonQuestions: true } } },
            });
        };
        QuizzesService_1.prototype.createAnswerPool = function (pool, user) {
            return __awaiter(this, void 0, void 0, function () {
                var name, answers;
                return __generator(this, function (_a) {
                    name = pool.name.trim();
                    answers = this.cleanUnique(pool.answers);
                    if (!name || !answers.length)
                        throw new common_1.BadRequestException('A pool name and at least one answer are required');
                    return [2 /*return*/, this.prisma.answerPool.create({
                            data: { name: name, ownerId: user.id, answers: { create: answers.map(function (value) { return ({ value: value }); }) } },
                            include: { answers: true, _count: { select: { questions: true, commonQuestions: true } } },
                        })];
                });
            });
        };
        QuizzesService_1.prototype.updateAnswerPool = function (id, pool, user) {
            return __awaiter(this, void 0, void 0, function () {
                var name, answers, existing, invalidQuestion;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            name = pool.name.trim();
                            answers = this.cleanUnique(pool.answers);
                            if (!name || !answers.length)
                                throw new common_1.BadRequestException('A pool name and at least one answer are required');
                            return [4 /*yield*/, this.prisma.answerPool.findFirst({
                                    where: { id: id, ownerId: user.id },
                                    include: {
                                        questions: { select: { correctAnswer: true, answerCount: true } },
                                        commonQuestions: { select: { correctAnswer: true, answerCount: true } },
                                    },
                                })];
                        case 1:
                            existing = _a.sent();
                            if (!existing)
                                throw new common_1.NotFoundException("Answer pool ".concat(id, " was not found"));
                            invalidQuestion = __spreadArray(__spreadArray([], existing.questions, true), existing.commonQuestions, true).find(function (question) {
                                if (!question.answerCount)
                                    return false;
                                var availableAnswers = answers.includes(question.correctAnswer) ? answers.length : answers.length + 1;
                                return question.answerCount > availableAnswers;
                            });
                            if (invalidQuestion) {
                                throw new common_1.BadRequestException('This pool would not contain enough answers for a question that already uses it');
                            }
                            return [2 /*return*/, this.prisma.answerPool.update({
                                    where: { id: id },
                                    data: { name: name, answers: { deleteMany: {}, create: answers.map(function (value) { return ({ value: value }); }) } },
                                    include: { answers: { orderBy: { value: 'asc' } }, _count: { select: { questions: true, commonQuestions: true } } },
                                })];
                    }
                });
            });
        };
        QuizzesService_1.prototype.addCommonQuestion = function (quizId, commonQuestionId, user) {
            return __awaiter(this, void 0, void 0, function () {
                var commonQuestion, _max;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.findOne(quizId, user)];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, this.prisma.commonQuestion.findFirst({ where: { id: commonQuestionId, ownerId: user.id } })];
                        case 2:
                            commonQuestion = _b.sent();
                            if (!commonQuestion)
                                throw new common_1.NotFoundException("Common question ".concat(commonQuestionId, " was not found"));
                            return [4 /*yield*/, this.prisma.question.aggregate({ where: { quizId: quizId }, _max: { position: true } })];
                        case 3:
                            _max = (_b.sent())._max;
                            return [2 /*return*/, this.prisma.question.create({
                                    data: {
                                        quizId: quizId,
                                        position: ((_a = _max.position) !== null && _a !== void 0 ? _a : -1) + 1,
                                        text: commonQuestion.text,
                                        options: commonQuestion.options,
                                        correctAnswer: commonQuestion.correctAnswer,
                                        acceptedAnswers: commonQuestion.acceptedAnswers,
                                        answerPoolId: commonQuestion.answerPoolId,
                                        answerCount: commonQuestion.answerCount,
                                        timerSeconds: null,
                                    },
                                })];
                    }
                });
            });
        };
        QuizzesService_1.prototype.prepareQuestion = function (question, user) {
            return __awaiter(this, void 0, void 0, function () {
                var text, correctAnswer, acceptedAnswers, statement, pairs, wrongAnswers, answerCount, pool;
                var _a, _b, _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            text = question.text.trim();
                            correctAnswer = question.correctAnswer.trim();
                            acceptedAnswers = this.cleanUnique(__spreadArray([correctAnswer], ((_a = question.acceptedAnswers) !== null && _a !== void 0 ? _a : []), true));
                            if (!text || !correctAnswer)
                                throw new common_1.BadRequestException('Question text and the correct answer cannot be blank');
                            if (question.questionType === 'true_false') {
                                statement = (_b = question.statement) === null || _b === void 0 ? void 0 : _b.trim();
                                if (!statement || !['True', 'False'].includes(correctAnswer))
                                    throw new common_1.BadRequestException('Enter an answer and select True or False');
                                return [2 /*return*/, { text: text, correctAnswer: correctAnswer, acceptedAnswers: acceptedAnswers, options: { kind: 'true_false', statement: statement }, answerPoolId: null, answerCount: null }];
                            }
                            if (question.questionType === 'matching') {
                                pairs = (_d = (_c = question.pairs) === null || _c === void 0 ? void 0 : _c.map(function (pair) { return ({ question: pair.question.trim(), answer: pair.answer.trim() }); })) !== null && _d !== void 0 ? _d : [];
                                if (pairs.length < 2 || pairs.some(function (pair) { return !pair.question || !pair.answer; }))
                                    throw new common_1.BadRequestException('Provide at least two complete pairs');
                                if (new Set(pairs.map(function (pair) { return pair.question; })).size !== pairs.length || new Set(pairs.map(function (pair) { return pair.answer; })).size !== pairs.length)
                                    throw new common_1.BadRequestException('Questions and answers must be unique within a matching question');
                                return [2 /*return*/, { text: text, correctAnswer: 'Matched', acceptedAnswers: ['Matched'], options: { kind: 'matching', pairs: pairs }, answerPoolId: null, answerCount: null }];
                            }
                            if (question.questionType === 'short_answer') {
                                return [2 /*return*/, { text: text, correctAnswer: correctAnswer, acceptedAnswers: acceptedAnswers, options: { kind: 'short_answer', pairs: [] }, answerPoolId: null, answerCount: null }];
                            }
                            wrongAnswers = this.cleanUnique((_e = question.wrongAnswers) !== null && _e !== void 0 ? _e : []).filter(function (answer) { return answer !== correctAnswer; });
                            answerCount = null;
                            if (!question.answerPoolId) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.prisma.answerPool.findFirst({
                                    where: { id: question.answerPoolId, ownerId: user.id }, include: { answers: true },
                                })];
                        case 1:
                            pool = _f.sent();
                            if (!pool)
                                throw new common_1.NotFoundException("Answer pool ".concat(question.answerPoolId, " was not found"));
                            wrongAnswers = pool.answers.map(function (answer) { return answer.value; }).filter(function (answer) { return answer !== correctAnswer; });
                            if (!question.answerCount)
                                throw new common_1.BadRequestException('Number of answers shown is required when using an answer pool');
                            if (question.answerCount > wrongAnswers.length + 1) {
                                throw new common_1.BadRequestException("Number of answers shown cannot exceed ".concat(wrongAnswers.length + 1, " for this answer pool"));
                            }
                            answerCount = question.answerCount;
                            _f.label = 2;
                        case 2:
                            if (wrongAnswers.length < 1)
                                throw new common_1.BadRequestException('Provide at least one wrong answer or select an answer pool');
                            return [2 /*return*/, { text: text, correctAnswer: correctAnswer, acceptedAnswers: acceptedAnswers, options: this.cleanUnique(__spreadArray([correctAnswer], wrongAnswers, true)), answerPoolId: question.answerPoolId, answerCount: answerCount }];
                    }
                });
            });
        };
        QuizzesService_1.prototype.cleanUnique = function (values) {
            return __spreadArray([], new Set(values.map(function (value) { return value.trim(); }).filter(Boolean)), true);
        };
        QuizzesService_1.prototype.gameTitle = function (gameType) {
            if (gameType === 'match_pairs')
                return 'Match Pairs';
            if (gameType === 'tower_stack')
                return 'Tower Stack';
            return 'Coin Catch';
        };
        return QuizzesService_1;
    }());
    __setFunctionName(_classThis, "QuizzesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        QuizzesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return QuizzesService = _classThis;
}();
exports.QuizzesService = QuizzesService;
