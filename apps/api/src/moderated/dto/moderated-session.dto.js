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
exports.AdvanceModeratedQuestionDto = exports.TreasureMapNextDto = exports.TreasureMapDigDto = exports.CurlingNextDto = exports.CurlingReleaseDto = exports.ArcheryNextDto = exports.ArcheryShotDto = exports.BattleshipNextDto = exports.BattleshipAttackDto = exports.MatchingNextDto = exports.FlipMatchingCardDto = exports.ReportModeratedGameScoreDto = exports.UpdateModeratedDurationDto = exports.UpdateBoardAutoResetDto = exports.RestartModeratedSessionDto = exports.UpdatePresentationModeDto = exports.UpdateLobbyLockDto = exports.FacilitatorActionDto = exports.SubmitModeratedAnswerDto = exports.JoinModeratedSessionDto = exports.CreateModeratedSessionDto = void 0;
var class_validator_1 = require("class-validator");
var CreateModeratedSessionDto = function () {
    var _a;
    var _durationSeconds_decorators;
    var _durationSeconds_initializers = [];
    var _durationSeconds_extraInitializers = [];
    var _mode_decorators;
    var _mode_initializers = [];
    var _mode_extraInitializers = [];
    var _endless_decorators;
    var _endless_initializers = [];
    var _endless_extraInitializers = [];
    var _scoringEnabled_decorators;
    var _scoringEnabled_initializers = [];
    var _scoringEnabled_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateModeratedSessionDto() {
                this.durationSeconds = __runInitializers(this, _durationSeconds_initializers, void 0);
                this.mode = (__runInitializers(this, _durationSeconds_extraInitializers), __runInitializers(this, _mode_initializers, void 0));
                this.endless = (__runInitializers(this, _mode_extraInitializers), __runInitializers(this, _endless_initializers, void 0));
                this.scoringEnabled = (__runInitializers(this, _endless_extraInitializers), __runInitializers(this, _scoringEnabled_initializers, void 0));
                __runInitializers(this, _scoringEnabled_extraInitializers);
            }
            return CreateModeratedSessionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _durationSeconds_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(60), (0, class_validator_1.Max)(604800)];
            _mode_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['classic', 'facilitated', 'matching', 'battleship', 'treasure_map', 'archery', 'curling'])];
            _endless_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _scoringEnabled_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _durationSeconds_decorators, { kind: "field", name: "durationSeconds", static: false, private: false, access: { has: function (obj) { return "durationSeconds" in obj; }, get: function (obj) { return obj.durationSeconds; }, set: function (obj, value) { obj.durationSeconds = value; } }, metadata: _metadata }, _durationSeconds_initializers, _durationSeconds_extraInitializers);
            __esDecorate(null, null, _mode_decorators, { kind: "field", name: "mode", static: false, private: false, access: { has: function (obj) { return "mode" in obj; }, get: function (obj) { return obj.mode; }, set: function (obj, value) { obj.mode = value; } }, metadata: _metadata }, _mode_initializers, _mode_extraInitializers);
            __esDecorate(null, null, _endless_decorators, { kind: "field", name: "endless", static: false, private: false, access: { has: function (obj) { return "endless" in obj; }, get: function (obj) { return obj.endless; }, set: function (obj, value) { obj.endless = value; } }, metadata: _metadata }, _endless_initializers, _endless_extraInitializers);
            __esDecorate(null, null, _scoringEnabled_decorators, { kind: "field", name: "scoringEnabled", static: false, private: false, access: { has: function (obj) { return "scoringEnabled" in obj; }, get: function (obj) { return obj.scoringEnabled; }, set: function (obj, value) { obj.scoringEnabled = value; } }, metadata: _metadata }, _scoringEnabled_initializers, _scoringEnabled_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateModeratedSessionDto = CreateModeratedSessionDto;
var JoinModeratedSessionDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _clientId_decorators;
    var _clientId_initializers = [];
    var _clientId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function JoinModeratedSessionDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.clientId = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _clientId_initializers, void 0));
                __runInitializers(this, _clientId_extraInitializers);
            }
            return JoinModeratedSessionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1), (0, class_validator_1.MaxLength)(100)];
            _clientId_decorators = [(0, class_validator_1.IsUUID)('4')];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _clientId_decorators, { kind: "field", name: "clientId", static: false, private: false, access: { has: function (obj) { return "clientId" in obj; }, get: function (obj) { return obj.clientId; }, set: function (obj, value) { obj.clientId = value; } }, metadata: _metadata }, _clientId_initializers, _clientId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.JoinModeratedSessionDto = JoinModeratedSessionDto;
var SubmitModeratedAnswerDto = function () {
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
            function SubmitModeratedAnswerDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                this.questionId = (__runInitializers(this, _participantId_extraInitializers), __runInitializers(this, _questionId_initializers, void 0));
                // The selected option is intentionally not returned to the facilitator.
                // It is retained in memory only so this can grow into scored attempts later.
                this.answer = (__runInitializers(this, _questionId_extraInitializers), __runInitializers(this, _answer_initializers, void 0));
                __runInitializers(this, _answer_extraInitializers);
            }
            return SubmitModeratedAnswerDto;
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
exports.SubmitModeratedAnswerDto = SubmitModeratedAnswerDto;
var FacilitatorActionDto = function () {
    var _a;
    var _facilitatorToken_decorators;
    var _facilitatorToken_initializers = [];
    var _facilitatorToken_extraInitializers = [];
    return _a = /** @class */ (function () {
            function FacilitatorActionDto() {
                // Google ID tokens used by pre-authentication clients were sent in the
                // request body. Authentication now comes exclusively from Authorization,
                // but tolerate that legacy field during a rolling frontend deployment.
                this.facilitatorToken = __runInitializers(this, _facilitatorToken_initializers, void 0);
                __runInitializers(this, _facilitatorToken_extraInitializers);
            }
            return FacilitatorActionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _facilitatorToken_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(8192)];
            __esDecorate(null, null, _facilitatorToken_decorators, { kind: "field", name: "facilitatorToken", static: false, private: false, access: { has: function (obj) { return "facilitatorToken" in obj; }, get: function (obj) { return obj.facilitatorToken; }, set: function (obj, value) { obj.facilitatorToken = value; } }, metadata: _metadata }, _facilitatorToken_initializers, _facilitatorToken_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.FacilitatorActionDto = FacilitatorActionDto;
var UpdateLobbyLockDto = function () {
    var _a;
    var _classSuper = FacilitatorActionDto;
    var _lobbyLocked_decorators;
    var _lobbyLocked_initializers = [];
    var _lobbyLocked_extraInitializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(UpdateLobbyLockDto, _super);
            function UpdateLobbyLockDto() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.lobbyLocked = __runInitializers(_this, _lobbyLocked_initializers, void 0);
                __runInitializers(_this, _lobbyLocked_extraInitializers);
                return _this;
            }
            return UpdateLobbyLockDto;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _lobbyLocked_decorators = [(0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _lobbyLocked_decorators, { kind: "field", name: "lobbyLocked", static: false, private: false, access: { has: function (obj) { return "lobbyLocked" in obj; }, get: function (obj) { return obj.lobbyLocked; }, set: function (obj, value) { obj.lobbyLocked = value; } }, metadata: _metadata }, _lobbyLocked_initializers, _lobbyLocked_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateLobbyLockDto = UpdateLobbyLockDto;
var UpdatePresentationModeDto = function () {
    var _a;
    var _classSuper = FacilitatorActionDto;
    var _presentationMode_decorators;
    var _presentationMode_initializers = [];
    var _presentationMode_extraInitializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(UpdatePresentationModeDto, _super);
            function UpdatePresentationModeDto() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.presentationMode = __runInitializers(_this, _presentationMode_initializers, void 0);
                __runInitializers(_this, _presentationMode_extraInitializers);
                return _this;
            }
            return UpdatePresentationModeDto;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _presentationMode_decorators = [(0, class_validator_1.IsIn)(['scores', 'matching', 'battleship', 'treasure_map', 'archery', 'curling'])];
            __esDecorate(null, null, _presentationMode_decorators, { kind: "field", name: "presentationMode", static: false, private: false, access: { has: function (obj) { return "presentationMode" in obj; }, get: function (obj) { return obj.presentationMode; }, set: function (obj, value) { obj.presentationMode = value; } }, metadata: _metadata }, _presentationMode_initializers, _presentationMode_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdatePresentationModeDto = UpdatePresentationModeDto;
var RestartModeratedSessionDto = function () {
    var _a;
    var _classSuper = FacilitatorActionDto;
    var _mode_decorators;
    var _mode_initializers = [];
    var _mode_extraInitializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(RestartModeratedSessionDto, _super);
            function RestartModeratedSessionDto() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.mode = __runInitializers(_this, _mode_initializers, void 0);
                __runInitializers(_this, _mode_extraInitializers);
                return _this;
            }
            return RestartModeratedSessionDto;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _mode_decorators = [(0, class_validator_1.IsIn)(['classic', 'facilitated', 'matching', 'battleship', 'treasure_map', 'archery', 'curling'])];
            __esDecorate(null, null, _mode_decorators, { kind: "field", name: "mode", static: false, private: false, access: { has: function (obj) { return "mode" in obj; }, get: function (obj) { return obj.mode; }, set: function (obj, value) { obj.mode = value; } }, metadata: _metadata }, _mode_initializers, _mode_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.RestartModeratedSessionDto = RestartModeratedSessionDto;
var UpdateBoardAutoResetDto = function () {
    var _a;
    var _classSuper = FacilitatorActionDto;
    var _autoBoardReset_decorators;
    var _autoBoardReset_initializers = [];
    var _autoBoardReset_extraInitializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(UpdateBoardAutoResetDto, _super);
            function UpdateBoardAutoResetDto() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.autoBoardReset = __runInitializers(_this, _autoBoardReset_initializers, void 0);
                __runInitializers(_this, _autoBoardReset_extraInitializers);
                return _this;
            }
            return UpdateBoardAutoResetDto;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _autoBoardReset_decorators = [(0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _autoBoardReset_decorators, { kind: "field", name: "autoBoardReset", static: false, private: false, access: { has: function (obj) { return "autoBoardReset" in obj; }, get: function (obj) { return obj.autoBoardReset; }, set: function (obj, value) { obj.autoBoardReset = value; } }, metadata: _metadata }, _autoBoardReset_initializers, _autoBoardReset_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateBoardAutoResetDto = UpdateBoardAutoResetDto;
var UpdateModeratedDurationDto = function () {
    var _a;
    var _classSuper = FacilitatorActionDto;
    var _durationSeconds_decorators;
    var _durationSeconds_initializers = [];
    var _durationSeconds_extraInitializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(UpdateModeratedDurationDto, _super);
            function UpdateModeratedDurationDto() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.durationSeconds = __runInitializers(_this, _durationSeconds_initializers, void 0);
                __runInitializers(_this, _durationSeconds_extraInitializers);
                return _this;
            }
            return UpdateModeratedDurationDto;
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
exports.UpdateModeratedDurationDto = UpdateModeratedDurationDto;
var ReportModeratedGameScoreDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    var _questionId_decorators;
    var _questionId_initializers = [];
    var _questionId_extraInitializers = [];
    var _score_decorators;
    var _score_initializers = [];
    var _score_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ReportModeratedGameScoreDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                this.questionId = (__runInitializers(this, _participantId_extraInitializers), __runInitializers(this, _questionId_initializers, void 0));
                this.score = (__runInitializers(this, _questionId_extraInitializers), __runInitializers(this, _score_initializers, void 0));
                __runInitializers(this, _score_extraInitializers);
            }
            return ReportModeratedGameScoreDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            _questionId_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1)];
            _score_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(10000)];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            __esDecorate(null, null, _questionId_decorators, { kind: "field", name: "questionId", static: false, private: false, access: { has: function (obj) { return "questionId" in obj; }, get: function (obj) { return obj.questionId; }, set: function (obj, value) { obj.questionId = value; } }, metadata: _metadata }, _questionId_initializers, _questionId_extraInitializers);
            __esDecorate(null, null, _score_decorators, { kind: "field", name: "score", static: false, private: false, access: { has: function (obj) { return "score" in obj; }, get: function (obj) { return obj.score; }, set: function (obj, value) { obj.score = value; } }, metadata: _metadata }, _score_initializers, _score_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ReportModeratedGameScoreDto = ReportModeratedGameScoreDto;
var FlipMatchingCardDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    var _card_decorators;
    var _card_initializers = [];
    var _card_extraInitializers = [];
    return _a = /** @class */ (function () {
            function FlipMatchingCardDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                this.card = (__runInitializers(this, _participantId_extraInitializers), __runInitializers(this, _card_initializers, void 0));
                __runInitializers(this, _card_extraInitializers);
            }
            return FlipMatchingCardDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            _card_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(99)];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            __esDecorate(null, null, _card_decorators, { kind: "field", name: "card", static: false, private: false, access: { has: function (obj) { return "card" in obj; }, get: function (obj) { return obj.card; }, set: function (obj, value) { obj.card = value; } }, metadata: _metadata }, _card_initializers, _card_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.FlipMatchingCardDto = FlipMatchingCardDto;
var MatchingNextDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function MatchingNextDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                __runInitializers(this, _participantId_extraInitializers);
            }
            return MatchingNextDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.MatchingNextDto = MatchingNextDto;
var BattleshipAttackDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    var _cell_decorators;
    var _cell_initializers = [];
    var _cell_extraInitializers = [];
    return _a = /** @class */ (function () {
            function BattleshipAttackDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                this.cell = (__runInitializers(this, _participantId_extraInitializers), __runInitializers(this, _cell_initializers, void 0));
                __runInitializers(this, _cell_extraInitializers);
            }
            return BattleshipAttackDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            _cell_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(99)];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            __esDecorate(null, null, _cell_decorators, { kind: "field", name: "cell", static: false, private: false, access: { has: function (obj) { return "cell" in obj; }, get: function (obj) { return obj.cell; }, set: function (obj, value) { obj.cell = value; } }, metadata: _metadata }, _cell_initializers, _cell_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.BattleshipAttackDto = BattleshipAttackDto;
var BattleshipNextDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function BattleshipNextDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                __runInitializers(this, _participantId_extraInitializers);
            }
            return BattleshipNextDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.BattleshipNextDto = BattleshipNextDto;
var ArcheryShotDto = function () {
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
            function ArcheryShotDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                this.x = (__runInitializers(this, _participantId_extraInitializers), __runInitializers(this, _x_initializers, void 0));
                this.y = (__runInitializers(this, _x_extraInitializers), __runInitializers(this, _y_initializers, void 0));
                __runInitializers(this, _y_extraInitializers);
            }
            return ArcheryShotDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            _x_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(-100), (0, class_validator_1.Max)(100)];
            _y_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(-100), (0, class_validator_1.Max)(100)];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            __esDecorate(null, null, _x_decorators, { kind: "field", name: "x", static: false, private: false, access: { has: function (obj) { return "x" in obj; }, get: function (obj) { return obj.x; }, set: function (obj, value) { obj.x = value; } }, metadata: _metadata }, _x_initializers, _x_extraInitializers);
            __esDecorate(null, null, _y_decorators, { kind: "field", name: "y", static: false, private: false, access: { has: function (obj) { return "y" in obj; }, get: function (obj) { return obj.y; }, set: function (obj, value) { obj.y = value; } }, metadata: _metadata }, _y_initializers, _y_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ArcheryShotDto = ArcheryShotDto;
var ArcheryNextDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ArcheryNextDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                __runInitializers(this, _participantId_extraInitializers);
            }
            return ArcheryNextDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ArcheryNextDto = ArcheryNextDto;
var CurlingReleaseDto = function () {
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
            function CurlingReleaseDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                // -100 is hard left, 0 is straight, and 100 is hard right.
                this.direction = (__runInitializers(this, _participantId_extraInitializers), __runInitializers(this, _direction_initializers, void 0));
                this.speed = (__runInitializers(this, _direction_extraInitializers), __runInitializers(this, _speed_initializers, void 0));
                __runInitializers(this, _speed_extraInitializers);
            }
            return CurlingReleaseDto;
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
exports.CurlingReleaseDto = CurlingReleaseDto;
var CurlingNextDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CurlingNextDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                __runInitializers(this, _participantId_extraInitializers);
            }
            return CurlingNextDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CurlingNextDto = CurlingNextDto;
var TreasureMapDigDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    var _cell_decorators;
    var _cell_initializers = [];
    var _cell_extraInitializers = [];
    return _a = /** @class */ (function () {
            function TreasureMapDigDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                this.cell = (__runInitializers(this, _participantId_extraInitializers), __runInitializers(this, _cell_initializers, void 0));
                __runInitializers(this, _cell_extraInitializers);
            }
            return TreasureMapDigDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            _cell_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(195)];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            __esDecorate(null, null, _cell_decorators, { kind: "field", name: "cell", static: false, private: false, access: { has: function (obj) { return "cell" in obj; }, get: function (obj) { return obj.cell; }, set: function (obj, value) { obj.cell = value; } }, metadata: _metadata }, _cell_initializers, _cell_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.TreasureMapDigDto = TreasureMapDigDto;
var TreasureMapNextDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function TreasureMapNextDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                __runInitializers(this, _participantId_extraInitializers);
            }
            return TreasureMapNextDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.TreasureMapNextDto = TreasureMapNextDto;
var AdvanceModeratedQuestionDto = function () {
    var _a;
    var _participantId_decorators;
    var _participantId_initializers = [];
    var _participantId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function AdvanceModeratedQuestionDto() {
                this.participantId = __runInitializers(this, _participantId_initializers, void 0);
                __runInitializers(this, _participantId_extraInitializers);
            }
            return AdvanceModeratedQuestionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _participantId_decorators = [(0, class_validator_1.IsUUID)('4')];
            __esDecorate(null, null, _participantId_decorators, { kind: "field", name: "participantId", static: false, private: false, access: { has: function (obj) { return "participantId" in obj; }, get: function (obj) { return obj.participantId; }, set: function (obj, value) { obj.participantId = value; } }, metadata: _metadata }, _participantId_initializers, _participantId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.AdvanceModeratedQuestionDto = AdvanceModeratedQuestionDto;
