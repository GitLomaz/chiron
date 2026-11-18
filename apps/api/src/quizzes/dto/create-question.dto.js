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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateQuestionDto = exports.QuestionPairDto = void 0;
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var create_quiz_dto_1 = require("./create-quiz.dto");
var QuestionPairDto = function () {
    var _a;
    var _question_decorators;
    var _question_initializers = [];
    var _question_extraInitializers = [];
    var _answer_decorators;
    var _answer_initializers = [];
    var _answer_extraInitializers = [];
    return _a = /** @class */ (function () {
            function QuestionPairDto() {
                this.question = __runInitializers(this, _question_initializers, void 0);
                this.answer = (__runInitializers(this, _question_extraInitializers), __runInitializers(this, _answer_initializers, void 0));
                __runInitializers(this, _answer_extraInitializers);
            }
            return QuestionPairDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _question_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1), (0, class_validator_1.MaxLength)(500)];
            _answer_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1), (0, class_validator_1.MaxLength)(500)];
            __esDecorate(null, null, _question_decorators, { kind: "field", name: "question", static: false, private: false, access: { has: function (obj) { return "question" in obj; }, get: function (obj) { return obj.question; }, set: function (obj, value) { obj.question = value; } }, metadata: _metadata }, _question_initializers, _question_extraInitializers);
            __esDecorate(null, null, _answer_decorators, { kind: "field", name: "answer", static: false, private: false, access: { has: function (obj) { return "answer" in obj; }, get: function (obj) { return obj.answer; }, set: function (obj, value) { obj.answer = value; } }, metadata: _metadata }, _answer_initializers, _answer_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.QuestionPairDto = QuestionPairDto;
var CreateQuestionDto = function () {
    var _a;
    var _questionType_decorators;
    var _questionType_initializers = [];
    var _questionType_extraInitializers = [];
    var _statement_decorators;
    var _statement_initializers = [];
    var _statement_extraInitializers = [];
    var _pairs_decorators;
    var _pairs_initializers = [];
    var _pairs_extraInitializers = [];
    var _text_decorators;
    var _text_initializers = [];
    var _text_extraInitializers = [];
    var _wrongAnswers_decorators;
    var _wrongAnswers_initializers = [];
    var _wrongAnswers_extraInitializers = [];
    var _correctAnswer_decorators;
    var _correctAnswer_initializers = [];
    var _correctAnswer_extraInitializers = [];
    var _acceptedAnswers_decorators;
    var _acceptedAnswers_initializers = [];
    var _acceptedAnswers_extraInitializers = [];
    var _answerPoolId_decorators;
    var _answerPoolId_initializers = [];
    var _answerPoolId_extraInitializers = [];
    var _answerCount_decorators;
    var _answerCount_initializers = [];
    var _answerCount_extraInitializers = [];
    var _timerSeconds_decorators;
    var _timerSeconds_initializers = [];
    var _timerSeconds_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateQuestionDto() {
                this.questionType = __runInitializers(this, _questionType_initializers, void 0);
                this.statement = (__runInitializers(this, _questionType_extraInitializers), __runInitializers(this, _statement_initializers, void 0));
                this.pairs = (__runInitializers(this, _statement_extraInitializers), __runInitializers(this, _pairs_initializers, void 0));
                this.text = (__runInitializers(this, _pairs_extraInitializers), __runInitializers(this, _text_initializers, void 0));
                this.wrongAnswers = (__runInitializers(this, _text_extraInitializers), __runInitializers(this, _wrongAnswers_initializers, void 0));
                this.correctAnswer = (__runInitializers(this, _wrongAnswers_extraInitializers), __runInitializers(this, _correctAnswer_initializers, void 0));
                this.acceptedAnswers = (__runInitializers(this, _correctAnswer_extraInitializers), __runInitializers(this, _acceptedAnswers_initializers, void 0));
                this.answerPoolId = (__runInitializers(this, _acceptedAnswers_extraInitializers), __runInitializers(this, _answerPoolId_initializers, void 0));
                this.answerCount = (__runInitializers(this, _answerPoolId_extraInitializers), __runInitializers(this, _answerCount_initializers, void 0));
                this.timerSeconds = (__runInitializers(this, _answerCount_extraInitializers), __runInitializers(this, _timerSeconds_initializers, void 0));
                __runInitializers(this, _timerSeconds_extraInitializers);
            }
            return CreateQuestionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _questionType_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['multiple_choice', 'true_false', 'matching', 'short_answer'])];
            _statement_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(500)];
            _pairs_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.ArrayMinSize)(2), (0, class_validator_1.ArrayMaxSize)(12), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(function () { return QuestionPairDto; })];
            _text_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1), (0, class_validator_1.MaxLength)(2000)];
            _wrongAnswers_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true }), (0, class_validator_1.MinLength)(1, { each: true }), (0, class_validator_1.MaxLength)(500, { each: true })];
            _correctAnswer_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1), (0, class_validator_1.MaxLength)(500)];
            _acceptedAnswers_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.ArrayMaxSize)(12), (0, class_validator_1.IsString)({ each: true }), (0, class_validator_1.MinLength)(1, { each: true }), (0, class_validator_1.MaxLength)(500, { each: true })];
            _answerPoolId_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.IsPositive)()];
            _answerCount_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(2), (0, class_validator_1.Max)(500)];
            _timerSeconds_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.IsIn)(create_quiz_dto_1.TIMER_SECONDS)];
            __esDecorate(null, null, _questionType_decorators, { kind: "field", name: "questionType", static: false, private: false, access: { has: function (obj) { return "questionType" in obj; }, get: function (obj) { return obj.questionType; }, set: function (obj, value) { obj.questionType = value; } }, metadata: _metadata }, _questionType_initializers, _questionType_extraInitializers);
            __esDecorate(null, null, _statement_decorators, { kind: "field", name: "statement", static: false, private: false, access: { has: function (obj) { return "statement" in obj; }, get: function (obj) { return obj.statement; }, set: function (obj, value) { obj.statement = value; } }, metadata: _metadata }, _statement_initializers, _statement_extraInitializers);
            __esDecorate(null, null, _pairs_decorators, { kind: "field", name: "pairs", static: false, private: false, access: { has: function (obj) { return "pairs" in obj; }, get: function (obj) { return obj.pairs; }, set: function (obj, value) { obj.pairs = value; } }, metadata: _metadata }, _pairs_initializers, _pairs_extraInitializers);
            __esDecorate(null, null, _text_decorators, { kind: "field", name: "text", static: false, private: false, access: { has: function (obj) { return "text" in obj; }, get: function (obj) { return obj.text; }, set: function (obj, value) { obj.text = value; } }, metadata: _metadata }, _text_initializers, _text_extraInitializers);
            __esDecorate(null, null, _wrongAnswers_decorators, { kind: "field", name: "wrongAnswers", static: false, private: false, access: { has: function (obj) { return "wrongAnswers" in obj; }, get: function (obj) { return obj.wrongAnswers; }, set: function (obj, value) { obj.wrongAnswers = value; } }, metadata: _metadata }, _wrongAnswers_initializers, _wrongAnswers_extraInitializers);
            __esDecorate(null, null, _correctAnswer_decorators, { kind: "field", name: "correctAnswer", static: false, private: false, access: { has: function (obj) { return "correctAnswer" in obj; }, get: function (obj) { return obj.correctAnswer; }, set: function (obj, value) { obj.correctAnswer = value; } }, metadata: _metadata }, _correctAnswer_initializers, _correctAnswer_extraInitializers);
            __esDecorate(null, null, _acceptedAnswers_decorators, { kind: "field", name: "acceptedAnswers", static: false, private: false, access: { has: function (obj) { return "acceptedAnswers" in obj; }, get: function (obj) { return obj.acceptedAnswers; }, set: function (obj, value) { obj.acceptedAnswers = value; } }, metadata: _metadata }, _acceptedAnswers_initializers, _acceptedAnswers_extraInitializers);
            __esDecorate(null, null, _answerPoolId_decorators, { kind: "field", name: "answerPoolId", static: false, private: false, access: { has: function (obj) { return "answerPoolId" in obj; }, get: function (obj) { return obj.answerPoolId; }, set: function (obj, value) { obj.answerPoolId = value; } }, metadata: _metadata }, _answerPoolId_initializers, _answerPoolId_extraInitializers);
            __esDecorate(null, null, _answerCount_decorators, { kind: "field", name: "answerCount", static: false, private: false, access: { has: function (obj) { return "answerCount" in obj; }, get: function (obj) { return obj.answerCount; }, set: function (obj, value) { obj.answerCount = value; } }, metadata: _metadata }, _answerCount_initializers, _answerCount_extraInitializers);
            __esDecorate(null, null, _timerSeconds_decorators, { kind: "field", name: "timerSeconds", static: false, private: false, access: { has: function (obj) { return "timerSeconds" in obj; }, get: function (obj) { return obj.timerSeconds; }, set: function (obj, value) { obj.timerSeconds = value; } }, metadata: _metadata }, _timerSeconds_initializers, _timerSeconds_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateQuestionDto = CreateQuestionDto;
