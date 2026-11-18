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
exports.GenerateQuizDto = exports.QUESTION_TYPES = void 0;
var class_validator_1 = require("class-validator");
exports.QUESTION_TYPES = ['multiple_choice', 'true_false', 'matching', 'short_answer'];
var GenerateQuizDto = function () {
    var _a;
    var _title_decorators;
    var _title_initializers = [];
    var _title_extraInitializers = [];
    var _questionCount_decorators;
    var _questionCount_initializers = [];
    var _questionCount_extraInitializers = [];
    var _questionTypes_decorators;
    var _questionTypes_initializers = [];
    var _questionTypes_extraInitializers = [];
    var _gameCount_decorators;
    var _gameCount_initializers = [];
    var _gameCount_extraInitializers = [];
    return _a = /** @class */ (function () {
            function GenerateQuizDto() {
                this.title = __runInitializers(this, _title_initializers, void 0);
                this.questionCount = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _questionCount_initializers, void 0));
                this.questionTypes = (__runInitializers(this, _questionCount_extraInitializers), __runInitializers(this, _questionTypes_initializers, void 0));
                this.gameCount = (__runInitializers(this, _questionTypes_extraInitializers), __runInitializers(this, _gameCount_initializers, void 0));
                __runInitializers(this, _gameCount_extraInitializers);
            }
            return GenerateQuizDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1), (0, class_validator_1.MaxLength)(200)];
            _questionCount_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(100)];
            _questionTypes_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.ArrayMinSize)(1), (0, class_validator_1.ArrayMaxSize)(4), (0, class_validator_1.ArrayUnique)(), (0, class_validator_1.IsIn)(exports.QUESTION_TYPES, { each: true })];
            _gameCount_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(20)];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: function (obj) { return "title" in obj; }, get: function (obj) { return obj.title; }, set: function (obj, value) { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _questionCount_decorators, { kind: "field", name: "questionCount", static: false, private: false, access: { has: function (obj) { return "questionCount" in obj; }, get: function (obj) { return obj.questionCount; }, set: function (obj, value) { obj.questionCount = value; } }, metadata: _metadata }, _questionCount_initializers, _questionCount_extraInitializers);
            __esDecorate(null, null, _questionTypes_decorators, { kind: "field", name: "questionTypes", static: false, private: false, access: { has: function (obj) { return "questionTypes" in obj; }, get: function (obj) { return obj.questionTypes; }, set: function (obj, value) { obj.questionTypes = value; } }, metadata: _metadata }, _questionTypes_initializers, _questionTypes_extraInitializers);
            __esDecorate(null, null, _gameCount_decorators, { kind: "field", name: "gameCount", static: false, private: false, access: { has: function (obj) { return "gameCount" in obj; }, get: function (obj) { return obj.gameCount; }, set: function (obj, value) { obj.gameCount = value; } }, metadata: _metadata }, _gameCount_initializers, _gameCount_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.GenerateQuizDto = GenerateQuizDto;
