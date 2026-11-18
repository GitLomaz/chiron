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
exports.HomeworkController = void 0;
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
var google_auth_guard_1 = require("../auth/google-auth.guard");
var HomeworkController = function () {
    var _classDecorators = [(0, common_1.Controller)('homework-sessions')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _listActive_decorators;
    var _listHistory_decorators;
    var _create_decorators;
    var _join_decorators;
    var _studentState_decorators;
    var _teacherAttempt_decorators;
    var _submitAnswer_decorators;
    var _submitSpokenAnswer_decorators;
    var _completeItem_decorators;
    var _restart_decorators;
    var _shootArchery_decorators;
    var _releaseCurling_decorators;
    var _teacherState_decorators;
    var _end_decorators;
    var _updateDuration_decorators;
    var _remove_decorators;
    var HomeworkController = _classThis = /** @class */ (function () {
        function HomeworkController_1(homeworkService) {
            this.homeworkService = (__runInitializers(this, _instanceExtraInitializers), homeworkService);
        }
        HomeworkController_1.prototype.listActive = function (user) { return this.homeworkService.listActive(user); };
        HomeworkController_1.prototype.listHistory = function (user) { return this.homeworkService.listHistory(user); };
        HomeworkController_1.prototype.create = function (quizId, body, user) {
            // The no-user branch keeps cached/legacy controller consumers from being
            // sent new trailing undefined arguments during a rolling frontend update.
            if (!user)
                return this.homeworkService.create(quizId, body.durationSeconds, body.mode);
            return body.speechLanguage
                ? this.homeworkService.create(quizId, body.durationSeconds, body.mode, body.speechLanguage, user)
                : this.homeworkService.create(quizId, body.durationSeconds, body.mode, 'en-US', user);
        };
        HomeworkController_1.prototype.join = function (sessionId, body) { return this.homeworkService.join(sessionId, body.name); };
        HomeworkController_1.prototype.studentState = function (sessionId, participantId) { return this.homeworkService.studentState(sessionId, participantId); };
        HomeworkController_1.prototype.teacherAttempt = function (sessionId, participantId, user) { return this.homeworkService.teacherAttempt(sessionId, user, participantId); };
        HomeworkController_1.prototype.submitAnswer = function (sessionId, body) { return this.homeworkService.submitAnswer(sessionId, body.participantId, body.questionId, body.answer); };
        HomeworkController_1.prototype.submitSpokenAnswer = function (sessionId, audio, body) {
            return this.homeworkService.submitSpokenAnswer(sessionId, body.participantId, body.questionId, audio === null || audio === void 0 ? void 0 : audio.buffer, audio === null || audio === void 0 ? void 0 : audio.mimetype);
        };
        HomeworkController_1.prototype.completeItem = function (sessionId, body) { return this.homeworkService.completeItem(sessionId, body.participantId, body.questionId); };
        HomeworkController_1.prototype.restart = function (sessionId, body) { return this.homeworkService.restart(sessionId, body.participantId); };
        HomeworkController_1.prototype.shootArchery = function (sessionId, body) { return this.homeworkService.shootArchery(sessionId, body.participantId, body.x, body.y); };
        HomeworkController_1.prototype.releaseCurling = function (sessionId, body) { return this.homeworkService.releaseCurlingStone(sessionId, body.participantId, body.direction, body.speed); };
        HomeworkController_1.prototype.teacherState = function (sessionId, user) { return this.homeworkService.teacherState(sessionId, user); };
        HomeworkController_1.prototype.end = function (sessionId, _, user) { return this.homeworkService.end(sessionId, user); };
        HomeworkController_1.prototype.updateDuration = function (sessionId, body, user) { return this.homeworkService.updateDuration(sessionId, user, body.durationSeconds); };
        HomeworkController_1.prototype.remove = function (sessionId, user) { return this.homeworkService.remove(sessionId, user); };
        return HomeworkController_1;
    }());
    __setFunctionName(_classThis, "HomeworkController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _listActive_decorators = [(0, common_1.Get)(), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _listHistory_decorators = [(0, common_1.Get)('history'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _create_decorators = [(0, common_1.Post)('quiz/:quizId'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _join_decorators = [(0, common_1.Post)(':sessionId/participants')];
        _studentState_decorators = [(0, common_1.Get)(':sessionId')];
        _teacherAttempt_decorators = [(0, common_1.Get)(':sessionId/participants/:participantId'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _submitAnswer_decorators = [(0, common_1.Post)(':sessionId/answers')];
        _submitSpokenAnswer_decorators = [(0, common_1.Post)(':sessionId/spoken-answers'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio', { limits: { fileSize: 4 * 1024 * 1024, files: 1 } }))];
        _completeItem_decorators = [(0, common_1.Post)(':sessionId/items/complete')];
        _restart_decorators = [(0, common_1.Post)(':sessionId/restart')];
        _shootArchery_decorators = [(0, common_1.Post)(':sessionId/archery/shoot')];
        _releaseCurling_decorators = [(0, common_1.Post)(':sessionId/curling/release')];
        _teacherState_decorators = [(0, common_1.Get)(':sessionId/teacher'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _end_decorators = [(0, common_1.Post)(':sessionId/end'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _updateDuration_decorators = [(0, common_1.Post)(':sessionId/duration'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        _remove_decorators = [(0, common_1.Delete)(':sessionId'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
        __esDecorate(_classThis, null, _listActive_decorators, { kind: "method", name: "listActive", static: false, private: false, access: { has: function (obj) { return "listActive" in obj; }, get: function (obj) { return obj.listActive; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _listHistory_decorators, { kind: "method", name: "listHistory", static: false, private: false, access: { has: function (obj) { return "listHistory" in obj; }, get: function (obj) { return obj.listHistory; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _join_decorators, { kind: "method", name: "join", static: false, private: false, access: { has: function (obj) { return "join" in obj; }, get: function (obj) { return obj.join; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _studentState_decorators, { kind: "method", name: "studentState", static: false, private: false, access: { has: function (obj) { return "studentState" in obj; }, get: function (obj) { return obj.studentState; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _teacherAttempt_decorators, { kind: "method", name: "teacherAttempt", static: false, private: false, access: { has: function (obj) { return "teacherAttempt" in obj; }, get: function (obj) { return obj.teacherAttempt; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _submitAnswer_decorators, { kind: "method", name: "submitAnswer", static: false, private: false, access: { has: function (obj) { return "submitAnswer" in obj; }, get: function (obj) { return obj.submitAnswer; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _submitSpokenAnswer_decorators, { kind: "method", name: "submitSpokenAnswer", static: false, private: false, access: { has: function (obj) { return "submitSpokenAnswer" in obj; }, get: function (obj) { return obj.submitSpokenAnswer; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _completeItem_decorators, { kind: "method", name: "completeItem", static: false, private: false, access: { has: function (obj) { return "completeItem" in obj; }, get: function (obj) { return obj.completeItem; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _restart_decorators, { kind: "method", name: "restart", static: false, private: false, access: { has: function (obj) { return "restart" in obj; }, get: function (obj) { return obj.restart; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _shootArchery_decorators, { kind: "method", name: "shootArchery", static: false, private: false, access: { has: function (obj) { return "shootArchery" in obj; }, get: function (obj) { return obj.shootArchery; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _releaseCurling_decorators, { kind: "method", name: "releaseCurling", static: false, private: false, access: { has: function (obj) { return "releaseCurling" in obj; }, get: function (obj) { return obj.releaseCurling; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _teacherState_decorators, { kind: "method", name: "teacherState", static: false, private: false, access: { has: function (obj) { return "teacherState" in obj; }, get: function (obj) { return obj.teacherState; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _end_decorators, { kind: "method", name: "end", static: false, private: false, access: { has: function (obj) { return "end" in obj; }, get: function (obj) { return obj.end; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateDuration_decorators, { kind: "method", name: "updateDuration", static: false, private: false, access: { has: function (obj) { return "updateDuration" in obj; }, get: function (obj) { return obj.updateDuration; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        HomeworkController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return HomeworkController = _classThis;
}();
exports.HomeworkController = HomeworkController;
