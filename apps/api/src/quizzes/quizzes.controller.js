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
exports.QuizzesController = void 0;
var common_1 = require("@nestjs/common");
var google_auth_guard_1 = require("../auth/google-auth.guard");
var QuizzesController = function () {
    var _classDecorators = [(0, common_1.Controller)('quizzes'), (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _findAll_decorators;
    var _findCommonQuestions_decorators;
    var _createCommonQuestion_decorators;
    var _updateCommonQuestion_decorators;
    var _findAnswerPools_decorators;
    var _createAnswerPool_decorators;
    var _updateAnswerPool_decorators;
    var _findOne_decorators;
    var _create_decorators;
    var _update_decorators;
    var _archive_decorators;
    var _restore_decorators;
    var _remove_decorators;
    var _addQuestion_decorators;
    var _addGame_decorators;
    var _updateGame_decorators;
    var _addText_decorators;
    var _updateText_decorators;
    var _reorderQuestions_decorators;
    var _updateQuestion_decorators;
    var _updateQuestionEnabled_decorators;
    var _deleteItem_decorators;
    var _addCommonQuestion_decorators;
    var QuizzesController = _classThis = /** @class */ (function () {
        function QuizzesController_1(quizzesService) {
            this.quizzesService = (__runInitializers(this, _instanceExtraInitializers), quizzesService);
        }
        QuizzesController_1.prototype.findAll = function (user) {
            return this.quizzesService.findAll(user);
        };
        QuizzesController_1.prototype.findCommonQuestions = function (user) {
            return this.quizzesService.findCommonQuestions(user);
        };
        QuizzesController_1.prototype.createCommonQuestion = function (question, user) {
            return this.quizzesService.createCommonQuestion(question, user);
        };
        QuizzesController_1.prototype.updateCommonQuestion = function (id, question, user) {
            return this.quizzesService.updateCommonQuestion(id, question, user);
        };
        QuizzesController_1.prototype.findAnswerPools = function (user) {
            return this.quizzesService.findAnswerPools(user);
        };
        QuizzesController_1.prototype.createAnswerPool = function (pool, user) {
            return this.quizzesService.createAnswerPool(pool, user);
        };
        QuizzesController_1.prototype.updateAnswerPool = function (id, pool, user) {
            return this.quizzesService.updateAnswerPool(id, pool, user);
        };
        QuizzesController_1.prototype.findOne = function (id, user) {
            return this.quizzesService.findOne(id, user);
        };
        QuizzesController_1.prototype.create = function (createQuizDto, user) {
            return this.quizzesService.create(createQuizDto, user);
        };
        QuizzesController_1.prototype.update = function (id, updateQuizDto, user) {
            return this.quizzesService.update(id, updateQuizDto, user);
        };
        QuizzesController_1.prototype.archive = function (id, user) {
            return this.quizzesService.archive(id, user);
        };
        QuizzesController_1.prototype.restore = function (id, user) {
            return this.quizzesService.restore(id, user);
        };
        QuizzesController_1.prototype.remove = function (id, user) {
            return this.quizzesService.remove(id, user);
        };
        QuizzesController_1.prototype.addQuestion = function (id, createQuestionDto, user) {
            return this.quizzesService.addQuestion(id, createQuestionDto, user);
        };
        QuizzesController_1.prototype.addGame = function (id, game, user) {
            return this.quizzesService.addGame(id, game, user);
        };
        QuizzesController_1.prototype.updateGame = function (id, gameId, game, user) {
            return this.quizzesService.updateGame(id, gameId, game, user);
        };
        QuizzesController_1.prototype.addText = function (id, text, user) {
            return this.quizzesService.addText(id, text, user);
        };
        QuizzesController_1.prototype.updateText = function (id, textId, text, user) {
            return this.quizzesService.updateText(id, textId, text, user);
        };
        QuizzesController_1.prototype.reorderQuestions = function (id, _a, user) {
            var questionIds = _a.questionIds;
            return this.quizzesService.reorderQuestions(id, questionIds, user);
        };
        QuizzesController_1.prototype.updateQuestion = function (id, questionId, question, user) {
            return this.quizzesService.updateQuestion(id, questionId, question, user);
        };
        QuizzesController_1.prototype.updateQuestionEnabled = function (id, questionId, _a, user) {
            var isEnabled = _a.isEnabled;
            return this.quizzesService.updateQuestionEnabled(id, questionId, isEnabled, user);
        };
        QuizzesController_1.prototype.deleteItem = function (id, itemId, user) {
            return this.quizzesService.deleteItem(id, itemId, user);
        };
        QuizzesController_1.prototype.addCommonQuestion = function (id, commonQuestionId, user) {
            return this.quizzesService.addCommonQuestion(id, commonQuestionId, user);
        };
        return QuizzesController_1;
    }());
    __setFunctionName(_classThis, "QuizzesController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _findAll_decorators = [(0, common_1.Get)()];
        _findCommonQuestions_decorators = [(0, common_1.Get)('common-questions')];
        _createCommonQuestion_decorators = [(0, common_1.Post)('common-questions')];
        _updateCommonQuestion_decorators = [(0, common_1.Put)('common-questions/:id')];
        _findAnswerPools_decorators = [(0, common_1.Get)('answer-pools')];
        _createAnswerPool_decorators = [(0, common_1.Post)('answer-pools')];
        _updateAnswerPool_decorators = [(0, common_1.Put)('answer-pools/:id')];
        _findOne_decorators = [(0, common_1.Get)(':id')];
        _create_decorators = [(0, common_1.Post)()];
        _update_decorators = [(0, common_1.Put)(':id')];
        _archive_decorators = [(0, common_1.Patch)(':id/archive')];
        _restore_decorators = [(0, common_1.Patch)(':id/restore')];
        _remove_decorators = [(0, common_1.Delete)(':id')];
        _addQuestion_decorators = [(0, common_1.Post)(':id/questions')];
        _addGame_decorators = [(0, common_1.Post)(':id/games')];
        _updateGame_decorators = [(0, common_1.Put)(':id/games/:gameId')];
        _addText_decorators = [(0, common_1.Post)(':id/texts')];
        _updateText_decorators = [(0, common_1.Put)(':id/texts/:textId')];
        _reorderQuestions_decorators = [(0, common_1.Put)(':id/questions/order')];
        _updateQuestion_decorators = [(0, common_1.Put)(':id/questions/:questionId')];
        _updateQuestionEnabled_decorators = [(0, common_1.Patch)(':id/questions/:questionId')];
        _deleteItem_decorators = [(0, common_1.Delete)(':id/items/:itemId')];
        _addCommonQuestion_decorators = [(0, common_1.Post)(':id/questions/common/:commonQuestionId')];
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findCommonQuestions_decorators, { kind: "method", name: "findCommonQuestions", static: false, private: false, access: { has: function (obj) { return "findCommonQuestions" in obj; }, get: function (obj) { return obj.findCommonQuestions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createCommonQuestion_decorators, { kind: "method", name: "createCommonQuestion", static: false, private: false, access: { has: function (obj) { return "createCommonQuestion" in obj; }, get: function (obj) { return obj.createCommonQuestion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateCommonQuestion_decorators, { kind: "method", name: "updateCommonQuestion", static: false, private: false, access: { has: function (obj) { return "updateCommonQuestion" in obj; }, get: function (obj) { return obj.updateCommonQuestion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAnswerPools_decorators, { kind: "method", name: "findAnswerPools", static: false, private: false, access: { has: function (obj) { return "findAnswerPools" in obj; }, get: function (obj) { return obj.findAnswerPools; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createAnswerPool_decorators, { kind: "method", name: "createAnswerPool", static: false, private: false, access: { has: function (obj) { return "createAnswerPool" in obj; }, get: function (obj) { return obj.createAnswerPool; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateAnswerPool_decorators, { kind: "method", name: "updateAnswerPool", static: false, private: false, access: { has: function (obj) { return "updateAnswerPool" in obj; }, get: function (obj) { return obj.updateAnswerPool; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _archive_decorators, { kind: "method", name: "archive", static: false, private: false, access: { has: function (obj) { return "archive" in obj; }, get: function (obj) { return obj.archive; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _restore_decorators, { kind: "method", name: "restore", static: false, private: false, access: { has: function (obj) { return "restore" in obj; }, get: function (obj) { return obj.restore; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addQuestion_decorators, { kind: "method", name: "addQuestion", static: false, private: false, access: { has: function (obj) { return "addQuestion" in obj; }, get: function (obj) { return obj.addQuestion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addGame_decorators, { kind: "method", name: "addGame", static: false, private: false, access: { has: function (obj) { return "addGame" in obj; }, get: function (obj) { return obj.addGame; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateGame_decorators, { kind: "method", name: "updateGame", static: false, private: false, access: { has: function (obj) { return "updateGame" in obj; }, get: function (obj) { return obj.updateGame; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addText_decorators, { kind: "method", name: "addText", static: false, private: false, access: { has: function (obj) { return "addText" in obj; }, get: function (obj) { return obj.addText; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateText_decorators, { kind: "method", name: "updateText", static: false, private: false, access: { has: function (obj) { return "updateText" in obj; }, get: function (obj) { return obj.updateText; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _reorderQuestions_decorators, { kind: "method", name: "reorderQuestions", static: false, private: false, access: { has: function (obj) { return "reorderQuestions" in obj; }, get: function (obj) { return obj.reorderQuestions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateQuestion_decorators, { kind: "method", name: "updateQuestion", static: false, private: false, access: { has: function (obj) { return "updateQuestion" in obj; }, get: function (obj) { return obj.updateQuestion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateQuestionEnabled_decorators, { kind: "method", name: "updateQuestionEnabled", static: false, private: false, access: { has: function (obj) { return "updateQuestionEnabled" in obj; }, get: function (obj) { return obj.updateQuestionEnabled; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteItem_decorators, { kind: "method", name: "deleteItem", static: false, private: false, access: { has: function (obj) { return "deleteItem" in obj; }, get: function (obj) { return obj.deleteItem; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addCommonQuestion_decorators, { kind: "method", name: "addCommonQuestion", static: false, private: false, access: { has: function (obj) { return "addCommonQuestion" in obj; }, get: function (obj) { return obj.addCommonQuestion; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        QuizzesController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return QuizzesController = _classThis;
}();
exports.QuizzesController = QuizzesController;
