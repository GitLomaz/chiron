"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
require("dotenv/config");
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];
var animals = [
    'Alligator', 'Bear', 'Bee', 'Camel', 'Cat', 'Cheetah', 'Dolphin', 'Eagle', 'Elephant', 'Fox',
    'Giraffe', 'Gorilla', 'Hedgehog', 'Horse', 'Kangaroo', 'Koala', 'Lion', 'Llama', 'Monkey',
    'Octopus', 'Owl', 'Panda', 'Penguin', 'Rabbit', 'Raccoon', 'Shark', 'Sloth', 'Tiger', 'Turtle', 'Wolf',
];
var frenchVocabulary = [
    ['super', 'great'],
    ['ceinture', 'belt'],
    ['noir', 'black'],
    ['bleu', 'blue, bruise'],
    ['avec', 'with'],
    ['cravate', 'tie'],
    ['pull', 'sweater'],
    ['vert', 'green'],
    ['vous cherchez', 'looking'],
    ["d'accord", 'okay'],
    ['robe', 'dress'],
    ['chemise', 'shirt'],
    ['excusez-moi', 'sorry'],
    ['je cherche', "I'm looking for"],
    ['chapeau', 'hat'],
    ['manteau', 'coat'],
    ['pas du tout', 'not at all'],
    ['mais', 'but'],
    ['mon frère', 'my brother'],
    ['mon fils', 'my son'],
    ['ma tante', 'my aunt'],
    ['toujours', 'always'],
    ['intéressant', 'interesting'],
    ['très', 'very'],
    ['ma nièce', 'my niece'],
    ['ma sœur', 'my sister'],
    ['elle', 'she'],
    ['est', 'is, has been, east'],
    ['bien sûr', 'of course'],
    ['il', 'he'],
    ['méchant', 'mean'],
    ['amusant', 'funny'],
    ['il vient', 'he comes'],
    ['il habite', 'he lives'],
    ['neveu', 'nephew'],
    ['nièce', 'niece'],
    ['à', "group's, country's, with"],
    ['elle habite', 'she lives'],
    ['maintenant', 'now'],
    ['oncle', 'uncle'],
    ['tante', 'aunt'],
    ['de', "president's, country's, book's"],
    ['une', 'an, a, one'],
    ['elle vient', 'she comes'],
    ["j'ai", 'I have, I did, I have had'],
    ['fille', 'daughter'],
    ['sœur', 'sister'],
    ['fils', 'son'],
    ['tu as', "you've"],
    ['oh', 'oh, aw, ooh'],
    ['frère', 'brother'],
    ['tu viens de', 'you are from'],
    ["tu viens d'où", 'where are you from, where do you come from, where do you come'],
    ['à bientôt', 'see you soon'],
    ['viens de', 'come from, have just'],
    ['moi aussi', 'me too'],
    ['je', 'I'],
    ['et toi', 'and you'],
    ["je m'appelle", 'my name is, I am called, I call myself'],
    ['bien', 'good'],
    ['ça va', "how are you?, it's going to, I am fine"],
    ['enchanté', 'nice to meet you'],
    ['au revoir', 'goodbye'],
    ['parfait', 'perfect'],
    ['ou', 'or'],
    ['monsieur', 'sir'],
    ['non', 'no'],
    ['sandwich', 'sandwich'],
    ['merci', 'thank you'],
    ['et', 'and'],
    ['oui', 'yes'],
    ['je voudrais', "I'd like"],
    ['éclair', 'eclair, éclairs'],
    ['croissant', 'croissant, crescent roll'],
    ["s'il vous plaît", 'please'],
    ['bonjour', 'hello'],
    ['un', 'an, a, one'],
    ['madame', "ma'am, Mrs., Madam"],
    ['café', 'coffee'],
    ['thé', 'tea'],
];
function replacePool(name, answers) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma.answerPool.upsert({
                    where: { name: name },
                    create: { name: name, answers: { create: answers.map(function (value) { return ({ value: value }); }) } },
                    update: {
                        answers: {
                            deleteMany: {},
                            create: answers.map(function (value) { return ({ value: value }); }),
                        },
                    },
                })];
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var statesPool, frenchEnglishAnswers, frenchEnglishPool, questionText, existingQuestion, questionData, frenchQuizTitle, existingFrenchQuiz, frenchQuestions, frenchQuizData, mathQuizTitle, mathQuestions, mathQuizItems, mathQuizData, existingMathQuiz;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, replacePool('US States', usStates)];
                case 1:
                    statesPool = _a.sent();
                    return [4 /*yield*/, replacePool('Animals', animals)];
                case 2:
                    _a.sent();
                    frenchEnglishAnswers = __spreadArray([], new Set(frenchVocabulary.map(function (_a) {
                        var translation = _a[1];
                        return translation;
                    })), true);
                    return [4 /*yield*/, replacePool('French to English Vocabulary', frenchEnglishAnswers)];
                case 3:
                    frenchEnglishPool = _a.sent();
                    questionText = 'What state is the Grand Canyon in?';
                    return [4 /*yield*/, prisma.commonQuestion.findFirst({ where: { text: questionText } })];
                case 4:
                    existingQuestion = _a.sent();
                    questionData = {
                        text: questionText,
                        correctAnswer: 'Arizona',
                        options: usStates,
                        answerPoolId: statesPool.id,
                        answerCount: 4,
                    };
                    if (!existingQuestion) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma.commonQuestion.update({ where: { id: existingQuestion.id }, data: questionData })];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, prisma.commonQuestion.create({ data: questionData })];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    frenchQuizTitle = 'French Vocabulary: English Translations';
                    return [4 /*yield*/, prisma.quiz.findFirst({ where: { title: frenchQuizTitle } })];
                case 9:
                    existingFrenchQuiz = _a.sent();
                    frenchQuestions = frenchVocabulary.map(function (_a, position) {
                        var french = _a[0], translation = _a[1];
                        return ({
                            position: position,
                            text: french,
                            correctAnswer: translation,
                            options: frenchEnglishAnswers,
                            answerPoolId: frenchEnglishPool.id,
                            answerCount: 6,
                        });
                    });
                    frenchQuizData = {
                        title: frenchQuizTitle,
                        description: 'Choose the English translation for each French word or phrase.',
                    };
                    if (!existingFrenchQuiz) return [3 /*break*/, 11];
                    return [4 /*yield*/, prisma.quiz.update({
                            where: { id: existingFrenchQuiz.id },
                            data: __assign(__assign({}, frenchQuizData), { questions: { deleteMany: {}, create: frenchQuestions } }),
                        })];
                case 10:
                    _a.sent();
                    return [3 /*break*/, 13];
                case 11: return [4 /*yield*/, prisma.quiz.create({
                        data: __assign(__assign({}, frenchQuizData), { questions: { create: frenchQuestions } }),
                    })];
                case 12:
                    _a.sent();
                    _a.label = 13;
                case 13:
                    mathQuizTitle = 'Math Sprint: Numbers & Patterns';
                    mathQuestions = [
                        ['What is 7 + 5?', '12', ['11', '13', '14']],
                        ['What is 15 − 8?', '7', ['6', '8', '9']],
                        ['What is 6 × 4?', '24', ['20', '22', '28']],
                        ['What is 36 ÷ 6?', '6', ['5', '7', '8']],
                        ['What is 9 + 13?', '22', ['21', '23', '24']],
                        ['What is 8 × 7?', '56', ['48', '54', '64']],
                        ['What is half of 50?', '25', ['20', '24', '30']],
                        ['What number comes next: 2, 4, 6, 8, ...?', '10', ['9', '11', '12']],
                        ['What is 100 − 37?', '63', ['53', '57', '73']],
                        ['What is 11 + 19?', '30', ['29', '31', '32']],
                        ['What is 5 × 9?', '45', ['40', '35', '50']],
                        ['What is 72 ÷ 8?', '9', ['8', '7', '10']],
                    ];
                    mathQuizItems = mathQuestions.flatMap(function (_a, questionIndex) {
                        var text = _a[0], correctAnswer = _a[1], wrongAnswers = _a[2];
                        var position = questionIndex + Math.floor(questionIndex / 3);
                        var question = { position: position, text: text, correctAnswer: correctAnswer, options: __spreadArray([correctAnswer], wrongAnswers, true) };
                        if ((questionIndex + 1) % 3 !== 0)
                            return [question];
                        return [question, {
                                position: position + 1,
                                itemType: 'game',
                                gameType: 'match_pairs',
                                gameDurationSeconds: 30,
                                text: "Match Pairs break ".concat(Math.floor(questionIndex / 3) + 1),
                                correctAnswer: '',
                                options: [],
                            }];
                    });
                    mathQuizData = {
                        title: mathQuizTitle,
                        description: 'Twelve quick math questions with four Match Pairs game breaks.',
                        theme: 'kids',
                    };
                    return [4 /*yield*/, prisma.quiz.findFirst({ where: { title: mathQuizTitle } })];
                case 14:
                    existingMathQuiz = _a.sent();
                    if (!existingMathQuiz) return [3 /*break*/, 16];
                    return [4 /*yield*/, prisma.quiz.update({ where: { id: existingMathQuiz.id }, data: __assign(__assign({}, mathQuizData), { questions: { deleteMany: {}, create: mathQuizItems } }) })];
                case 15:
                    _a.sent();
                    return [3 /*break*/, 18];
                case 16: return [4 /*yield*/, prisma.quiz.create({ data: __assign(__assign({}, mathQuizData), { questions: { create: mathQuizItems } }) })];
                case 17:
                    _a.sent();
                    _a.label = 18;
                case 18:
                    console.log('Seeded US States, Animals, the Grand Canyon common question, the French vocabulary quiz, and the Math Sprint quiz.');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (error) {
    console.error(error);
    process.exitCode = 1;
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2 /*return*/, prisma.$disconnect()];
}); }); });
