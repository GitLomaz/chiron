"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.ReleaseHomeworkCurlingDto = exports.ShootHomeworkArcheryDto = exports.RestartHomeworkDto = exports.CompleteHomeworkItemDto = exports.SubmitSpokenHomeworkAnswerDto = exports.SubmitHomeworkAnswerDto = exports.JoinHomeworkSessionDto = exports.UpdateHomeworkDurationDto = exports.EndHomeworkSessionDto = exports.CreateHomeworkSessionDto = void 0;
var class_validator_1 = require("class-validator");
var CreateHomeworkSessionDto = function () {
    var _a;
    var _durationSeconds_decorators;
    var _durationSeconds_initializers = [];
    var _durationSeconds_extraInitializers = [];
    var _mode_decorators;
    var _mode_initializers = [];
    var _mode_extraInitializers = [];
    var _speechLanguage_decorators;
    var _speechLanguage_initializers = [];
    var _speechLanguage_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateHomeworkSessionDto() {
                this.durationSeconds = __runInitializers(this, _durationSeconds_initializers, void 0);
                this.mode = (__runInitializers(this, _durationSeconds_extraInitializers), __runInitializers(this, _mode_initializers, void 0));
                this.speechLanguage = (__runInitializers(this, _mode_extraInitializers), __runInitializers(this, _speechLanguage_initializers, void 0));
                __runInitializers(this, _speechLanguage_extraInitializers);
            }
            return CreateHomeworkSessionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _durationSeconds_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(60), (0, class_validator_1.Max)(604800)];
            _mode_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['classic', 'archery', 'curling', 'speak'])];
            _speechLanguage_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['en-US', 'fr-FR', 'es-ES'])];
            __esDecorate(null, null, _durationSeconds_decorators, { kind: "field", name: "durationSeconds", static: false, private: false, access: { has: function (obj) { return "durationSeconds" in obj; }, get: function (obj) { return obj.durationSeconds; }, set: function (obj, value) { obj.durationSeconds = value; } }, metadata: _metadata }, _durationSeconds_initializers, _durationSeconds_extraInitializers);
            __esDecorate(null, null, _mode_decorators, { kind: "field", name: "mode", static: false, private: false, access: { has: function (obj) { return "mode" in obj; }, get: function (obj) { return obj.mode; }, set: function (obj, value) { obj.mode = value; } }, metadata: _metadata }, _mode_initializers, _mode_extraInitializers);
            __esDecorate(null, null, _speechLanguage_decorators, { kind: "field", name: "speechLanguage", static: false, private: false, access: { has: function (obj) { return "speechLanguage" in obj; }, get: function (obj) { return obj.speechLanguage; }, set: function (obj, value) { obj.speechLanguage = value; } }, metadata: _metadata }, _speechLanguage_initializers, _speechLanguage_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateHomeworkSessionDto = CreateHomeworkSessionDto;
var LegacyFacilitatorTokenDto = function () {
    var _a;
    var _facilitatorToken_decorators;
    var _facilitatorToken_initializers = [];
    var _facilitatorToken_extraInitializers = [];
    return _a = /** @class */ (function () {
            function LegacyFacilitatorTokenDto() {
                // Kept only so an already-cached teacher frontend can complete its request
                // while the new Authorization-header-only frontend is rolling out.
                this.facilitatorToken = __runInitializers(this, _facilitatorToken_initializers, void 0);
                __runInitializers(this, _facilitatorToken_extraInitializers);
            }
            return LegacyFacilitatorTokenDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _facilitatorToken_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(8192)];
            __esDecorate(null, null, _facilitatorToken_decorators, { kind: "field", name: "facilitatorToken", static: false, private: false, access: { has: function (obj) { return "facilitatorToken" in obj; }, get: function (obj) { return obj.facilitatorToken; }, set: function (obj, value) { obj.facilitatorToken = value; } }, metadata: _metadata }, _facilitatorToken_initializers, _facilitatorToken_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var EndHomeworkSessionDto = /** @class */ (function (_super) {
    __extends(EndHomeworkSessionDto, _super);
    function EndHomeworkSessionDto() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return EndHomeworkSessionDto;
}(LegacyFacilitatorTokenDto));
exports.EndHomeworkSessionDto = EndHomeworkSessionDto;
var UpdateHomeworkDurationDto = function () {
    var _a;
    var _classSuper = LegacyFacilitatorTokenDto;
    var _durationSeconds_decorators;
    var _durationSeconds_initializers = [];
    var _durationSeconds_extraInitializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(UpdateHomeworkDurationDto, _super);
            function UpdateHomeworkDurationDto() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.durationSeconds = __runInitializers(_this, _durationSeconds_initializers, void 0);
                __runInitializers(_this, _durationSeconds_extraInitializers);
                return _this;
            }
            return UpdateHomeworkDurationDto;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _durationSeconds_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(60), (0, class_validator_1.Max)(604800)];
            __esDecorate(null, null, _durationSeconds_decorators, { kind: "field", name: "durationSeconds", static: false, private: false, access: { has: function (obj) { return "durationSeconds" in obj; }, get: function (obj) { return obj.durationSeconds; }, set: function (obj, value) { obj.durationSeconds = value; } }, metadata: _metadata }, _durationSeconds_initializers, _durationSeconds_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateHomeworkDurationDto = UpdateHomeworkDurationDto;
var JoinHomeworkSessionDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    return _a = /** @class */ (function () {
            function JoinHomeworkSessionDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                __runInitializers(this, _name_extraInitializers);
            }
            return JoinHomeworkSessionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1), (0, class_validator_1.MaxLength)(100)];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.JoinHomeworkSessionDto = JoinHomeworkSessionDto;
var SubmitHomeworkAnswerDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    var _questionId_decorators;
    var _questionId_initializers = [];
    var _questionId_extraInitializers = [];
    var _answer_decorators;
    var _answer_initializers = [];
    var _answer_extraInitializers = [];
    return _a = /** @class */ (function () {
            function SubmitHomeworkAnswerDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                this.questionId = (__runInitializers(this, _participantId_extraInitializers), __runInitializers(this, _questionId_initializers, void 0));
                this.answer = (__runInitializers(this, _questionId_extraInitializers), __runInitializers(this, _answer_initializers, void 0));
                __runInitializers(this, _answer_extraInitializers);
            }
            return SubmitHomeworkAnswerDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            _questionId_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1)];
            _answer_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(500)];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            __esDecorate(null, null, _questionId_decorators, { kind: "field", name: "questionId", static: false, private: false, access: { has: function (obj) { return "questionId" in obj; }, get: function (obj) { return obj.questionId; }, set: function (obj, value) { obj.questionId = value; } }, metadata: _metadata }, _questionId_initializers, _questionId_extraInitializers);
            __esDecorate(null, null, _answer_decorators, { kind: "field", name: "answer", static: false, private: false, access: { has: function (obj) { return "answer" in obj; }, get: function (obj) { return obj.answer; }, set: function (obj, value) { obj.answer = value; } }, metadata: _metadata }, _answer_initializers, _answer_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.SubmitHomeworkAnswerDto = SubmitHomeworkAnswerDto;
var SubmitSpokenHomeworkAnswerDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    var _questionId_decorators;
    var _questionId_initializers = [];
    var _questionId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function SubmitSpokenHomeworkAnswerDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                this.questionId = (__runInitializers(this, _participantId_extraInitializers), __runInitializers(this, _questionId_initializers, void 0));
                __runInitializers(this, _questionId_extraInitializers);
            }
            return SubmitSpokenHomeworkAnswerDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            _questionId_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1)];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            __esDecorate(null, null, _questionId_decorators, { kind: "field", name: "questionId", static: false, private: false, access: { has: function (obj) { return "questionId" in obj; }, get: function (obj) { return obj.questionId; }, set: function (obj, value) { obj.questionId = value; } }, metadata: _metadata }, _questionId_initializers, _questionId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.SubmitSpokenHomeworkAnswerDto = SubmitSpokenHomeworkAnswerDto;
var CompleteHomeworkItemDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    var _questionId_decorators;
    var _questionId_initializers = [];
    var _questionId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CompleteHomeworkItemDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                this.questionId = (__runInitializers(this, _participantId_extraInitializers), __runInitializers(this, _questionId_initializers, void 0));
                __runInitializers(this, _questionId_extraInitializers);
            }
            return CompleteHomeworkItemDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            _questionId_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1)];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            __esDecorate(null, null, _questionId_decorators, { kind: "field", name: "questionId", static: false, private: false, access: { has: function (obj) { return "questionId" in obj; }, get: function (obj) { return obj.questionId; }, set: function (obj, value) { obj.questionId = value; } }, metadata: _metadata }, _questionId_initializers, _questionId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CompleteHomeworkItemDto = CompleteHomeworkItemDto;
var RestartHomeworkDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function RestartHomeworkDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                __runInitializers(this, _participantId_extraInitializers);
            }
            return RestartHomeworkDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.RestartHomeworkDto = RestartHomeworkDto;
var ShootHomeworkArcheryDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    var _x_decorators;
    var _x_initializers = [];
    var _x_extraInitializers = [];
    var _y_decorators;
    var _y_initializers = [];
    var _y_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ShootHomeworkArcheryDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                this.x = (__runInitializers(this, _participantId_extraInitializers), __runInitializers(this, _x_initializers, void 0));
                this.y = (__runInitializers(this, _x_extraInitializers), __runInitializers(this, _y_initializers, void 0));
                __runInitializers(this, _y_extraInitializers);
            }
            return ShootHomeworkArcheryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            _x_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(-100), (0, class_validator_1.Max)(100)];
            _y_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(-100), (0, class_validator_1.Max)(100)];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            __esDecorate(null, null, _x_decorators, { kind: "field", name: "x", static: false, private: false, access: { has: function (obj) { return "x" in obj; }, get: function (obj) { return obj.x; }, set: function (obj, value) { obj.x = value; } }, metadata: _metadata }, _x_initializers, _x_extraInitializers);
            __esDecorate(null, null, _y_decorators, { kind: "field", name: "y", static: false, private: false, access: { has: function (obj) { return "y" in obj; }, get: function (obj) { return obj.y; }, set: function (obj, value) { obj.y = value; } }, metadata: _metadata }, _y_initializers, _y_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ShootHomeworkArcheryDto = ShootHomeworkArcheryDto;
var ReleaseHomeworkCurlingDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    var _direction_decorators;
    var _direction_initializers = [];
    var _direction_extraInitializers = [];
    var _speed_decorators;
    var _speed_initializers = [];
    var _speed_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ReleaseHomeworkCurlingDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                this.direction = (__runInitializers(this, _participantId_extraInitializers), __runInitializers(this, _direction_initializers, void 0));
                this.speed = (__runInitializers(this, _direction_extraInitializers), __runInitializers(this, _speed_initializers, void 0));
                __runInitializers(this, _speed_extraInitializers);
            }
            return ReleaseHomeworkCurlingDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            _direction_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(-100), (0, class_validator_1.Max)(100)];
            _speed_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(100)];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            __esDecorate(null, null, _direction_decorators, { kind: "field", name: "direction", static: false, private: false, access: { has: function (obj) { return "direction" in obj; }, get: function (obj) { return obj.direction; }, set: function (obj, value) { obj.direction = value; } }, metadata: _metadata }, _direction_initializers, _direction_extraInitializers);
            __esDecorate(null, null, _speed_decorators, { kind: "field", name: "speed", static: false, private: false, access: { has: function (obj) { return "speed" in obj; }, get: function (obj) { return obj.speed; }, set: function (obj, value) { obj.speed = value; } }, metadata: _metadata }, _speed_initializers, _speed_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ReleaseHomeworkCurlingDto = ReleaseHomeworkCurlingDto;
