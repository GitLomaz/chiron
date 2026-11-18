"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.specialQuestion = specialQuestion;
exports.matchAttempt = matchAttempt;
var matching_1 = require("./matching");
function specialQuestion(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    var data = value;
    if (data.kind === 'true_false' && typeof data.statement === 'string')
        return data;
    if (data.kind === 'matching' && Array.isArray(data.pairs))
        return data;
    if (data.kind === 'short_answer')
        return data;
    return null;
}
function matchAttempt(pairs, progress, answer) {
    var parts = /^match:(\d+):(\d+)$/.exec(answer);
    if (!parts)
        return null;
    return (0, matching_1.matchSelection)(pairs, progress !== null && progress !== void 0 ? progress : { matched: [], mistakes: 0, wrongMatches: [] }, Number(parts[1]), Number(parts[2]));
}
