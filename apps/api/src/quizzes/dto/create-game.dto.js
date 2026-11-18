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
exports.CreateGameDto = void 0;
var class_validator_1 = require("class-validator");
var CreateGameDto = function () {
    var _a;
    var _gameType_decorators;
    var _gameType_initializers = [];
    var _gameType_extraInitializers = [];
    var _text_decorators;
    var _text_initializers = [];
    var _text_extraInitializers = [];
    var _durationSeconds_decorators;
    var _durationSeconds_initializers = [];
    var _durationSeconds_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateGameDto() {
                this.gameType = __runInitializers(this, _gameType_initializers, void 0);
                this.text = (__runInitializers(this, _gameType_extraInitializers), __runInitializers(this, _text_initializers, void 0));
                this.durationSeconds = (__runInitializers(this, _text_extraInitializers), __runInitializers(this, _durationSeconds_initializers, void 0));
                __runInitializers(this, _durationSeconds_extraInitializers);
            }
            return CreateGameDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _gameType_decorators = [(0, class_validator_1.IsIn)(['coin_catch', 'match_pairs', 'tower_stack'])];
            _text_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1), (0, class_validator_1.MaxLength)(200)];
            _durationSeconds_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(5), (0, class_validator_1.Max)(180)];
            __esDecorate(null, null, _gameType_decorators, { kind: "field", name: "gameType", static: false, private: false, access: { has: function (obj) { return "gameType" in obj; }, get: function (obj) { return obj.gameType; }, set: function (obj, value) { obj.gameType = value; } }, metadata: _metadata }, _gameType_initializers, _gameType_extraInitializers);
            __esDecorate(null, null, _text_decorators, { kind: "field", name: "text", static: false, private: false, access: { has: function (obj) { return "text" in obj; }, get: function (obj) { return obj.text; }, set: function (obj, value) { obj.text = value; } }, metadata: _metadata }, _text_initializers, _text_extraInitializers);
            __esDecorate(null, null, _durationSeconds_decorators, { kind: "field", name: "durationSeconds", static: false, private: false, access: { has: function (obj) { return "durationSeconds" in obj; }, get: function (obj) { return obj.durationSeconds; }, set: function (obj, value) { obj.durationSeconds = value; } }, metadata: _metadata }, _durationSeconds_initializers, _durationSeconds_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateGameDto = CreateGameDto;
