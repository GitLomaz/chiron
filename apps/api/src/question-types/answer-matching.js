"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANSWER_MATCHING_MODES = void 0;
exports.answersMatch = answersMatch;
exports.ANSWER_MATCHING_MODES = ['exact', 'close'];
function closeAnswer(value) {
    return value
        .trim()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLocaleLowerCase()
        .replace(/[’‘`']/gu, '')
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .replace(/\s+/gu, ' ')
        .trim();
}
function answersMatch(answer, correctAnswer, mode) {
    if (mode === void 0) { mode = 'close'; }
    if (mode === 'exact')
        return answer.trim() === correctAnswer.trim();
    return closeAnswer(answer) === closeAnswer(correctAnswer);
}
