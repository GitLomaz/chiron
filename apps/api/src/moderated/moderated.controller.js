"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeratedController = void 0;
var common_1 = require("@nestjs/common");
var google_auth_guard_1 = require("../auth/google-auth.guard");
var ModeratedController = function () {
    var _classDecorators = [(0, common_1.Controller)('moderated-sessions')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _listActive_decorators;
    var _create_decorators;
    var _join_decorators;
    var _submitAnswer_decorators;
    var _reportGameScore_decorators;
    var _flipMatchingCard_decorators;
    var _nextMatchingQuestion_decorators;
    var _attackBattleship_decorators;
    var _nextBattleshipQuestion_decorators;
    var _shootArchery_decorators;
    var _nextArcheryQuestion_decorators;
    var _releaseCurlingStone_decorators;
    var _nextCurlingQuestion_decorators;
    var _digTreasureMap_decorators;
    var _nextTreasureMapQuestion_decorators;
    var _nextQuestion_decorators;
    var _studentState_decorators;
    var _facilitatorState_decorators;
    var _start_decorators;
    var _end_decorators;
    var _updateDuration_decorators;
    var _restart_decorators;
    var _resetBoard_decorators;
    var _updateBoardAutoReset_decorators;
    var _next_decorators;
    var _updateLobbyLock_decorators;
    var _updatePresentationMode_decorators;
    var _removeParticipant_decorators;
    var ModeratedController = _classThis = /** @class */ (function () {
        function ModeratedController_1(moderatedService) {
            this.moderatedService = (__runInitializers(this, _instanceExtraInitializers), moderatedService);
        }
        ModeratedController_1.prototype.listActive = function (user) { return this.moderatedService.listActive(user); };
        ModeratedController_1.prototype.create = function (quizId, body, user) {
            return this.moderatedService.create(quizId, body === null || body === void 0 ? void 0 : body.mode, body.durationSeconds, body.endless, body.scoringEnabled, user);
        };
        ModeratedController_1.prototype.join = function (pin, body) {
            return this.moderatedService.join(pin, body.name, body.clientId);
        };
        ModeratedController_1.prototype.submitAnswer = function (pin, body) {
            return this.moderatedService.submitAnswer(pin, body);
        };
        ModeratedController_1.prototype.reportGameScore = function (pin, body) {
            return this.moderatedService.reportGameScore(pin, body);
        };
        ModeratedController_1.prototype.flipMatchingCard = function (pin, body) {
            return this.moderatedService.flipMatchingCard(pin, body.participantId, body.card);
        };
        ModeratedController_1.prototype.nextMatchingQuestion = function (pin, body) {
            return this.moderatedService.nextMatchingQuestion(pin, body.participantId);
        };
        ModeratedController_1.prototype.attackBattleship = function (pin, body) {
            return this.moderatedService.attackBattleship(pin, body.participantId, body.cell);
        };
        ModeratedController_1.prototype.nextBattleshipQuestion = function (pin, body) {
            return this.moderatedService.nextBattleshipQuestion(pin, body.participantId);
        };
        ModeratedController_1.prototype.shootArchery = function (pin, body) {
            return this.moderatedService.shootArchery(pin, body.participantId, body.x, body.y);
        };
        ModeratedController_1.prototype.nextArcheryQuestion = function (pin, body) {
            return this.moderatedService.nextArcheryQuestion(pin, body.participantId);
        };
        ModeratedController_1.prototype.releaseCurlingStone = function (pin, body) {
            return this.moderatedService.releaseCurlingStone(pin, body.participantId, body.direction, body.speed);
        };
        ModeratedController_1.prototype.nextCurlingQuestion = function (pin, body) {
            return this.moderatedService.nextCurlingQuestion(pin, body.participantId);
        };
        ModeratedController_1.prototype.digTreasureMap = function (pin, body) {
            return this.moderatedService.digTreasureMap(pin, body.participantId, body.cell);
        };
        ModeratedController_1.prototype.nextTreasureMapQuestion = function (pin, body) {
            return this.moderatedService.nextTreasureMapQuestion(pin, body.participantId);
        };
        ModeratedController_1.prototype.nextQuestion = function (pin, body) {
            return this.moderatedService.nextQuestion(pin, body.participantId);
        };
        ModeratedController_1.prototype.studentState = function (pin, participantId, clientId) {
            return this.moderatedService.studentState(pin, participantId, clientId);
        };
        ModeratedController_1.prototype.facilitatorState = function (sessionId, user) {
            return this.moderatedService.facilitatorState(sessionId, user);
        };
        ModeratedController_1.prototype.start = function (sessionId, _, user) {
            return this.moderatedService.start(sessionId, user);
        };
        ModeratedController_1.prototype.end = function (sessionId, _, user) {
            return this.moderatedService.end(sessionId, user);
        };
        ModeratedController_1.prototype.updateDuration = function (sessionId, body, user) {
            return this.moderatedService.updateDuration(sessionId, user, body.durationSeconds);
        };
        ModeratedController_1.prototype.restart = function (sessionId, body, user) {
            return this.moderatedService.restart(sessionId, user, body.mode);
        };
        ModeratedController_1.prototype.resetBoard = function (sessionId, _, user) {
            return this.moderatedService.resetBoard(sessionId, user);
        };
        ModeratedController_1.prototype.updateBoardAutoReset = function (sessionId, body, user) {
            return this.moderatedService.updateBoardAutoReset(sessionId, user, body.autoBoardReset);
        };
        ModeratedController_1.prototype.next = function (sessionId, _, user) {
            return this.moderatedService.next(sessionId, user);
        };
        ModeratedController_1.prototype.updateLobbyLock = function (sessionId, body, user) {
            return this.moderatedService.updateLobbyLock(sessionId, user, body.lobbyLocked);
        };
        ModeratedController_1.prototype.updatePresentationMode = function (sessionId, body, user) {
            return this.moderatedService.updatePresentationMode(sessionId, user, body.presentationMode);
        };
        ModeratedController_1.prototype.removeParticipant = function (sessionId, participantId, _, user) {
            return this.moderatedService.removeParticipant(sessionId, user, participantId);
        };
        return ModeratedController_1;
    }());
    __setFunctionName(_classThis, "ModeratedController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _listActive_decorators = [(0, common_1.Get)(), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _create_decorators = [(0, common_1.Post)('quiz/:quizId'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _join_decorators = [(0, common_1.Post)('pin/:pin/participants')];
        _submitAnswer_decorators = [(0, common_1.Post)('pin/:pin/answers')];
        _reportGameScore_decorators = [(0, common_1.Post)('pin/:pin/games/scores')];
        _flipMatchingCard_decorators = [(0, common_1.Post)('pin/:pin/matching/flip')];
        _nextMatchingQuestion_decorators = [(0, common_1.Post)('pin/:pin/matching/next')];
        _attackBattleship_decorators = [(0, common_1.Post)('pin/:pin/battleship/attack')];
        _nextBattleshipQuestion_decorators = [(0, common_1.Post)('pin/:pin/battleship/next')];
        _shootArchery_decorators = [(0, common_1.Post)('pin/:pin/archery/shoot')];
        _nextArcheryQuestion_decorators = [(0, common_1.Post)('pin/:pin/archery/next')];
        _releaseCurlingStone_decorators = [(0, common_1.Post)('pin/:pin/curling/release')];
        _nextCurlingQuestion_decorators = [(0, common_1.Post)('pin/:pin/curling/next')];
        _digTreasureMap_decorators = [(0, common_1.Post)('pin/:pin/treasure-map/dig')];
        _nextTreasureMapQuestion_decorators = [(0, common_1.Post)('pin/:pin/treasure-map/next')];
        _nextQuestion_decorators = [(0, common_1.Post)('pin/:pin/next')];
        _studentState_decorators = [(0, common_1.Get)('pin/:pin')];
        _facilitatorState_decorators = [(0, common_1.Get)(':sessionId/facilitator'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _start_decorators = [(0, common_1.Post)(':sessionId/start'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _end_decorators = [(0, common_1.Post)(':sessionId/end'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _updateDuration_decorators = [(0, common_1.Post)(':sessionId/duration'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _restart_decorators = [(0, common_1.Post)(':sessionId/restart'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _resetBoard_decorators = [(0, common_1.Post)(':sessionId/board/reset'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _updateBoardAutoReset_decorators = [(0, common_1.Post)(':sessionId/board/auto-reset'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _next_decorators = [(0, common_1.Post)(':sessionId/next'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _updateLobbyLock_decorators = [(0, common_1.Post)(':sessionId/lobby'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _updatePresentationMode_decorators = [(0, common_1.Post)(':sessionId/presentation'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _removeParticipant_decorators = [(0, common_1.Post)(':sessionId/participants/:participantId/remove'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        __esDecorate(_classThis, null, _listActive_decorators, { kind: "method", name: "listActive", static: false, private: false, access: { has: function (obj) { return "listActive" in obj; }, get: function (obj) { return obj.listActive; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _join_decorators, { kind: "method", name: "join", static: false, private: false, access: { has: function (obj) { return "join" in obj; }, get: function (obj) { return obj.join; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _submitAnswer_decorators, { kind: "method", name: "submitAnswer", static: false, private: false, access: { has: function (obj) { return "submitAnswer" in obj; }, get: function (obj) { return obj.submitAnswer; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _reportGameScore_decorators, { kind: "method", name: "reportGameScore", static: false, private: false, access: { has: function (obj) { return "reportGameScore" in obj; }, get: function (obj) { return obj.reportGameScore; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _flipMatchingCard_decorators, { kind: "method", name: "flipMatchingCard", static: false, private: false, access: { has: function (obj) { return "flipMatchingCard" in obj; }, get: function (obj) { return obj.flipMatchingCard; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _nextMatchingQuestion_decorators, { kind: "method", name: "nextMatchingQuestion", static: false, private: false, access: { has: function (obj) { return "nextMatchingQuestion" in obj; }, get: function (obj) { return obj.nextMatchingQuestion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _attackBattleship_decorators, { kind: "method", name: "attackBattleship", static: false, private: false, access: { has: function (obj) { return "attackBattleship" in obj; }, get: function (obj) { return obj.attackBattleship; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _nextBattleshipQuestion_decorators, { kind: "method", name: "nextBattleshipQuestion", static: false, private: false, access: { has: function (obj) { return "nextBattleshipQuestion" in obj; }, get: function (obj) { return obj.nextBattleshipQuestion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _shootArchery_decorators, { kind: "method", name: "shootArchery", static: false, private: false, access: { has: function (obj) { return "shootArchery" in obj; }, get: function (obj) { return obj.shootArchery; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _nextArcheryQuestion_decorators, { kind: "method", name: "nextArcheryQuestion", static: false, private: false, access: { has: function (obj) { return "nextArcheryQuestion" in obj; }, get: function (obj) { return obj.nextArcheryQuestion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _releaseCurlingStone_decorators, { kind: "method", name: "releaseCurlingStone", static: false, private: false, access: { has: function (obj) { return "releaseCurlingStone" in obj; }, get: function (obj) { return obj.releaseCurlingStone; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _nextCurlingQuestion_decorators, { kind: "method", name: "nextCurlingQuestion", static: false, private: false, access: { has: function (obj) { return "nextCurlingQuestion" in obj; }, get: function (obj) { return obj.nextCurlingQuestion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _digTreasureMap_decorators, { kind: "method", name: "digTreasureMap", static: false, private: false, access: { has: function (obj) { return "digTreasureMap" in obj; }, get: function (obj) { return obj.digTreasureMap; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _nextTreasureMapQuestion_decorators, { kind: "method", name: "nextTreasureMapQuestion", static: false, private: false, access: { has: function (obj) { return "nextTreasureMapQuestion" in obj; }, get: function (obj) { return obj.nextTreasureMapQuestion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _nextQuestion_decorators, { kind: "method", name: "nextQuestion", static: false, private: false, access: { has: function (obj) { return "nextQuestion" in obj; }, get: function (obj) { return obj.nextQuestion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _studentState_decorators, { kind: "method", name: "studentState", static: false, private: false, access: { has: function (obj) { return "studentState" in obj; }, get: function (obj) { return obj.studentState; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _facilitatorState_decorators, { kind: "method", name: "facilitatorState", static: false, private: false, access: { has: function (obj) { return "facilitatorState" in obj; }, get: function (obj) { return obj.facilitatorState; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _start_decorators, { kind: "method", name: "start", static: false, private: false, access: { has: function (obj) { return "start" in obj; }, get: function (obj) { return obj.start; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _end_decorators, { kind: "method", name: "end", static: false, private: false, access: { has: function (obj) { return "end" in obj; }, get: function (obj) { return obj.end; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateDuration_decorators, { kind: "method", name: "updateDuration", static: false, private: false, access: { has: function (obj) { return "updateDuration" in obj; }, get: function (obj) { return obj.updateDuration; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _restart_decorators, { kind: "method", name: "restart", static: false, private: false, access: { has: function (obj) { return "restart" in obj; }, get: function (obj) { return obj.restart; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _resetBoard_decorators, { kind: "method", name: "resetBoard", static: false, private: false, access: { has: function (obj) { return "resetBoard" in obj; }, get: function (obj) { return obj.resetBoard; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateBoardAutoReset_decorators, { kind: "method", name: "updateBoardAutoReset", static: false, private: false, access: { has: function (obj) { return "updateBoardAutoReset" in obj; }, get: function (obj) { return obj.updateBoardAutoReset; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _next_decorators, { kind: "method", name: "next", static: false, private: false, access: { has: function (obj) { return "next" in obj; }, get: function (obj) { return obj.next; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateLobbyLock_decorators, { kind: "method", name: "updateLobbyLock", static: false, private: false, access: { has: function (obj) { return "updateLobbyLock" in obj; }, get: function (obj) { return obj.updateLobbyLock; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updatePresentationMode_decorators, { kind: "method", name: "updatePresentationMode", static: false, private: false, access: { has: function (obj) { return "updatePresentationMode" in obj; }, get: function (obj) { return obj.updatePresentationMode; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _removeParticipant_decorators, { kind: "method", name: "removeParticipant", static: false, private: false, access: { has: function (obj) { return "removeParticipant" in obj; }, get: function (obj) { return obj.removeParticipant; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ModeratedController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ModeratedController = _classThis;
}();
exports.ModeratedController = ModeratedController;
