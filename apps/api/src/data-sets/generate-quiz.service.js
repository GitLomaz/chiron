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
exports.GenerateQuizService = void 0;
var common_1 = require("@nestjs/common");
var GAMES = [
    { gameType: 'coin_catch', text: 'Coin Catch' },
    { gameType: 'match_pairs', text: 'Match Pairs' },
    { gameType: 'tower_stack', text: 'Tower Stack' },
];
var GenerateQuizService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var GenerateQuizService = _classThis = /** @class */ (function () {
        function GenerateQuizService_1(prisma) {
            this.prisma = prisma;
        }
        GenerateQuizService_1.prototype.generate = function (dataSetId, input, user) {
            return __awaiter(this, void 0, void 0, function () {
                var title, set, pairs, matchPairs, choices, types, pool, choicePool, pairIndex, choiceIndex, falseIndex, trueFalseIndex, questions, games, items, nextGame;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            title = input.title.trim();
                            if (!title)
                                throw new common_1.BadRequestException('Enter a quiz title');
                            if (input.questionCount < input.questionTypes.length)
                                throw new common_1.BadRequestException('Choose at least one question per selected type');
                            return [4 /*yield*/, this.prisma.dataSet.findFirst({ where: { id: dataSetId, ownerId: user.id }, include: { pairs: { orderBy: { position: 'asc' } } } })];
                        case 1:
                            set = _a.sent();
                            if (!set)
                                throw new common_1.NotFoundException('Data set not found');
                            pairs = set.pairs.map(function (_a) {
                                var question = _a.question, answer = _a.answer;
                                return ({ question: question.trim(), answer: answer.trim() });
                            })
                                .filter(function (_a) {
                                var question = _a.question, answer = _a.answer;
                                return question.length > 0 && question.length <= 2000 && answer.length > 0 && answer.length <= 500;
                            });
                            if (!pairs.length)
                                throw new common_1.BadRequestException('This data set needs a pair with an answer of at most 500 characters');
                            matchPairs = this.uniqueMatchingPairs(pairs.filter(function (pair) { return pair.question.length <= 500; }));
                            if (input.questionTypes.includes('matching') && matchPairs.length < 2)
                                throw new common_1.BadRequestException('Matching needs two pairs with unique questions and answers, each at most 500 characters');
                            choices = pairs.filter(function (pair) { return _this.alternatives(pair, pairs).length > 0; });
                            if (input.questionTypes.includes('multiple_choice') && !choices.length)
                                throw new common_1.BadRequestException('Multiple choice needs a question with a different answer from another question');
                            types = this.shuffle(input.questionTypes);
                            pool = this.shuffle(pairs);
                            choicePool = this.shuffle(choices);
                            pairIndex = 0, choiceIndex = 0, falseIndex = 0, trueFalseIndex = 0;
                            questions = Array.from({ length: input.questionCount }, function (_, index) {
                                var type = types[index % types.length];
                                if (type === 'matching') {
                                    var shuffled = _this.shuffle(matchPairs);
                                    // A matching question counts as one question and contains up to four pairs.
                                    var selected = shuffled.slice(0, Math.min(4, shuffled.length));
                                    return { text: 'Match the questions and answers', correctAnswer: 'Matched', options: { kind: 'matching', pairs: selected } };
                                }
                                if (type === 'multiple_choice') {
                                    var pair_1 = choicePool[choiceIndex++ % choicePool.length];
                                    var wrong = _this.shuffle(_this.alternatives(pair_1, pairs)).slice(0, 3);
                                    return { text: pair_1.question, correctAnswer: pair_1.answer, options: __spreadArray([pair_1.answer], wrong, true) };
                                }
                                if (type === 'short_answer') {
                                    var pair_2 = pool[pairIndex++ % pool.length];
                                    return { text: pair_2.question, correctAnswer: pair_2.answer, options: { kind: 'short_answer', pairs: [] } };
                                }
                                var showFalse = trueFalseIndex++ % 2 === 1 && choicePool.length > 0;
                                var pair = showFalse ? choicePool[falseIndex++ % choicePool.length] : pool[pairIndex++ % pool.length];
                                var alternatives = _this.alternatives(pair, pairs);
                                return { text: pair.question, correctAnswer: showFalse ? 'False' : 'True', options: { kind: 'true_false', statement: showFalse ? _this.shuffle(alternatives)[0] : pair.answer } };
                            });
                            games = this.shuffle(GAMES);
                            items = [];
                            nextGame = 0;
                            questions.forEach(function (question, index) {
                                items.push(question);
                                while (nextGame < input.gameCount && Math.floor(((nextGame + 1) * input.questionCount) / (input.gameCount + 1)) <= index) {
                                    items.push(__assign(__assign({}, games[nextGame % games.length]), { itemType: 'game', gameDurationSeconds: 20, options: [], correctAnswer: '' }));
                                    nextGame++;
                                }
                            });
                            return [2 /*return*/, this.prisma.quiz.create({
                                    data: { title: title, ownerId: user.id, questions: { create: items.map(function (item, position) { return (__assign(__assign({}, item), { position: position })); }) } },
                                    select: { id: true, title: true },
                                })];
                    }
                });
            });
        };
        GenerateQuizService_1.prototype.alternatives = function (pair, pairs) {
            var knownAnswers = new Set(pairs.filter(function (candidate) { return candidate.question === pair.question; }).map(function (candidate) { return candidate.answer; }));
            return __spreadArray([], new Set(pairs.map(function (candidate) { return candidate.answer; }).filter(function (answer) { return !knownAnswers.has(answer); })), true);
        };
        GenerateQuizService_1.prototype.uniqueMatchingPairs = function (pairs) {
            var selected = [];
            var _loop_1 = function (pair) {
                if (!selected.some(function (item) { return item.question === pair.question || item.answer === pair.answer; }))
                    selected.push(pair);
            };
            for (var _i = 0, _a = this.shuffle(pairs); _i < _a.length; _i++) {
                var pair = _a[_i];
                _loop_1(pair);
            }
            // A greedy selection can miss two compatible pairs; find one when necessary.
            if (selected.length < 2) {
                var _loop_2 = function (first) {
                    var second = pairs.find(function (pair) { return pair.question !== first.question && pair.answer !== first.answer; });
                    if (second)
                        return { value: [first, second] };
                };
                for (var _b = 0, pairs_1 = pairs; _b < pairs_1.length; _b++) {
                    var first = pairs_1[_b];
                    var state_1 = _loop_2(first);
                    if (typeof state_1 === "object")
                        return state_1.value;
                }
            }
            return selected;
        };
        GenerateQuizService_1.prototype.shuffle = function (items) {
            var _a;
            var result = __spreadArray([], items, true);
            for (var i = result.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                _a = [result[j], result[i]], result[i] = _a[0], result[j] = _a[1];
            }
            return result;
        };
        return GenerateQuizService_1;
    }());
    __setFunctionName(_classThis, "GenerateQuizService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GenerateQuizService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GenerateQuizService = _classThis;
}();
exports.GenerateQuizService = GenerateQuizService;
