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
exports.DataSetDto = exports.DataSetPairDto = void 0;
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
var DataSetPairDto = function () {
    var _a;
    var _question_decorators;
    var _question_initializers = [];
    var _question_extraInitializers = [];
    var _answer_decorators;
    var _answer_initializers = [];
    var _answer_extraInitializers = [];
    return _a = /** @class */ (function () {
            function DataSetPairDto() {
                this.question = __runInitializers(this, _question_initializers, void 0);
                this.answer = (__runInitializers(this, _question_extraInitializers), __runInitializers(this, _answer_initializers, void 0));
                __runInitializers(this, _answer_extraInitializers);
            }
            return DataSetPairDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _question_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(2000)];
            _answer_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(2000)];
            __esDecorate(null, null, _question_decorators, { kind: "field", name: "question", static: false, private: false, access: { has: function (obj) { return "question" in obj; }, get: function (obj) { return obj.question; }, set: function (obj, value) { obj.question = value; } }, metadata: _metadata }, _question_initializers, _question_extraInitializers);
            __esDecorate(null, null, _answer_decorators, { kind: "field", name: "answer", static: false, private: false, access: { has: function (obj) { return "answer" in obj; }, get: function (obj) { return obj.answer; }, set: function (obj, value) { obj.answer = value; } }, metadata: _metadata }, _answer_initializers, _answer_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.DataSetPairDto = DataSetPairDto;
var DataSetDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _pairs_decorators;
    var _pairs_initializers = [];
    var _pairs_extraInitializers = [];
    return _a = /** @class */ (function () {
            function DataSetDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.pairs = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _pairs_initializers, void 0));
                __runInitializers(this, _pairs_extraInitializers);
            }
            return DataSetDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(200)];
            _pairs_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.ArrayMinSize)(1), (0, class_validator_1.ArrayMaxSize)(5000), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(function () { return DataSetPairDto; })];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _pairs_decorators, { kind: "field", name: "pairs", static: false, private: false, access: { has: function (obj) { return "pairs" in obj; }, get: function (obj) { return obj.pairs; }, set: function (obj, value) { obj.pairs = value; } }, metadata: _metadata }, _pairs_initializers, _pairs_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.DataSetDto = DataSetDto;
