"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchSelection = matchSelection;
var common_1 = require("@nestjs/common");
/** Applies one selection to a matching question. Pair indexes are stable within a run. */
function matchSelection(pairs, progress, left, right) {
    var _a, _b;
    if (progress.mistakes >= 3 || progress.matched.length === pairs.length)
        throw new common_1.BadRequestException('This matching question is already complete');
    if (!Number.isInteger(left) || !Number.isInteger(right) || left < 0 || right < 0 || left >= pairs.length || right >= pairs.length)
        throw new common_1.BadRequestException('Choose a valid question and answer');
    if (progress.matched.includes(left) || progress.matched.includes(right))
        throw new common_1.BadRequestException('Choose an unmatched question and answer');
    return left === right
        ? { matched: __spreadArray(__spreadArray([], progress.matched, true), [left], false), mistakes: progress.mistakes, wrongMatches: (_a = progress.wrongMatches) !== null && _a !== void 0 ? _a : [] }
        : { matched: progress.matched, mistakes: progress.mistakes + 1, wrongMatches: __spreadArray(__spreadArray([], ((_b = progress.wrongMatches) !== null && _b !== void 0 ? _b : []), true), [{ left: left, right: right }], false) };
}
