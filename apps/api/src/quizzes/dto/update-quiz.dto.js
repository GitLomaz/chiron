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
exports.UpdateQuizDto = void 0;
var class_validator_1 = require("class-validator");
var create_quiz_dto_1 = require("./create-quiz.dto");
var answer_matching_1 = require("../../question-types/answer-matching");
var UpdateQuizDto = function () {
    var _a;
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _randomizeQuestionOrder_decorators;
    var _randomizeQuestionOrder_initializers = [];
    var _randomizeQuestionOrder_extraInitializers = [];
    var _theme_decorators;
    var _theme_initializers = [];
    var _theme_extraInitializers = [];
    var _answerMatching_decorators;
    var _answerMatching_initializers = [];
    var _answerMatching_extraInitializers = [];
    var _defaultTimerSeconds_decorators;
    var _defaultTimerSeconds_initializers = [];
    var _defaultTimerSeconds_extraInitializers = [];
    var _matchingPairCount_decorators;
    var _matchingPairCount_initializers = [];
    var _matchingPairCount_extraInitializers = [];
    var _battleshipBoardSize_decorators;
    var _battleshipBoardSize_initializers = [];
    var _battleshipBoardSize_extraInitializers = [];
    var _creditEveryCorrectAnswers_decorators;
    var _creditEveryCorrectAnswers_initializers = [];
    var _creditEveryCorrectAnswers_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateQuizDto() {
                this.title = __runInitializers(this, _title_initializers, void 0);
                this.description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.randomizeQuestionOrder = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _randomizeQuestionOrder_initializers, void 0));
                this.theme = (__runInitializers(this, _randomizeQuestionOrder_extraInitializers), __runInitializers(this, _theme_initializers, void 0));
                this.answerMatching = (__runInitializers(this, _theme_extraInitializers), __runInitializers(this, _answerMatching_initializers, void 0));
                this.defaultTimerSeconds = (__runInitializers(this, _answerMatching_extraInitializers), __runInitializers(this, _defaultTimerSeconds_initializers, void 0));
                this.matchingPairCount = (__runInitializers(this, _defaultTimerSeconds_extraInitializers), __runInitializers(this, _matchingPairCount_initializers, void 0));
                this.battleshipBoardSize = (__runInitializers(this, _matchingPairCount_extraInitializers), __runInitializers(this, _battleshipBoardSize_initializers, void 0));
                this.creditEveryCorrectAnswers = (__runInitializers(this, _battleshipBoardSize_extraInitializers), __runInitializers(this, _creditEveryCorrectAnswers_initializers, void 0));
                __runInitializers(this, _creditEveryCorrectAnswers_extraInitializers);
            }
            return UpdateQuizDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1), (0, class_validator_1.MaxLength)(200)];
            _description_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(2000)];
            _randomizeQuestionOrder_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _theme_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(create_quiz_dto_1.QUIZ_THEMES)];
            _answerMatching_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(answer_matching_1.ANSWER_MATCHING_MODES)];
            _defaultTimerSeconds_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.IsIn)(create_quiz_dto_1.TIMER_SECONDS)];
            _matchingPairCount_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.IsIn)(create_quiz_dto_1.MATCHING_PAIR_COUNTS)];
            _battleshipBoardSize_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.IsIn)(create_quiz_dto_1.BATTLESHIP_BOARD_SIZES)];
            _creditEveryCorrectAnswers_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.IsIn)(create_quiz_dto_1.CREDIT_EARNING_INTERVALS)];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _randomizeQuestionOrder_decorators, { kind: "field", name: "randomizeQuestionOrder", static: false, private: false, access: { has: function (obj) { return "randomizeQuestionOrder" in obj; }, get: function (obj) { return obj.randomizeQuestionOrder; }, set: function (obj, value) { obj.randomizeQuestionOrder = value; } }, metadata: _metadata }, _randomizeQuestionOrder_initializers, _randomizeQuestionOrder_extraInitializers);
            __esDecorate(null, null, _theme_decorators, { kind: "field", name: "theme", static: false, private: false, access: { has: function (obj) { return "theme" in obj; }, get: function (obj) { return obj.theme; }, set: function (obj, value) { obj.theme = value; } }, metadata: _metadata }, _theme_initializers, _theme_extraInitializers);
            __esDecorate(null, null, _answerMatching_decorators, { kind: "field", name: "answerMatching", static: false, private: false, access: { has: function (obj) { return "answerMatching" in obj; }, get: function (obj) { return obj.answerMatching; }, set: function (obj, value) { obj.answerMatching = value; } }, metadata: _metadata }, _answerMatching_initializers, _answerMatching_extraInitializers);
            __esDecorate(null, null, _defaultTimerSeconds_decorators, { kind: "field", name: "defaultTimerSeconds", static: false, private: false, access: { has: function (obj) { return "defaultTimerSeconds" in obj; }, get: function (obj) { return obj.defaultTimerSeconds; }, set: function (obj, value) { obj.defaultTimerSeconds = value; } }, metadata: _metadata }, _defaultTimerSeconds_initializers, _defaultTimerSeconds_extraInitializers);
            __esDecorate(null, null, _matchingPairCount_decorators, { kind: "field", name: "matchingPairCount", static: false, private: false, access: { has: function (obj) { return "matchingPairCount" in obj; }, get: function (obj) { return obj.matchingPairCount; }, set: function (obj, value) { obj.matchingPairCount = value; } }, metadata: _metadata }, _matchingPairCount_initializers, _matchingPairCount_extraInitializers);
            __esDecorate(null, null, _battleshipBoardSize_decorators, { kind: "field", name: "battleshipBoardSize", static: false, private: false, access: { has: function (obj) { return "battleshipBoardSize" in obj; }, get: function (obj) { return obj.battleshipBoardSize; }, set: function (obj, value) { obj.battleshipBoardSize = value; } }, metadata: _metadata }, _battleshipBoardSize_initializers, _battleshipBoardSize_extraInitializers);
            __esDecorate(null, null, _creditEveryCorrectAnswers_decorators, { kind: "field", name: "creditEveryCorrectAnswers", static: false, private: false, access: { has: function (obj) { return "creditEveryCorrectAnswers" in obj; }, get: function (obj) { return obj.creditEveryCorrectAnswers; }, set: function (obj, value) { obj.creditEveryCorrectAnswers = value; } }, metadata: _metadata }, _creditEveryCorrectAnswers_initializers, _creditEveryCorrectAnswers_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateQuizDto = UpdateQuizDto;
