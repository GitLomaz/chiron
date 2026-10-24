import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
];

const animals = [
  'Alligator', 'Bear', 'Bee', 'Camel', 'Cat', 'Cheetah', 'Dolphin', 'Eagle', 'Elephant', 'Fox',
  'Giraffe', 'Gorilla', 'Hedgehog', 'Horse', 'Kangaroo', 'Koala', 'Lion', 'Llama', 'Monkey',
  'Octopus', 'Owl', 'Panda', 'Penguin', 'Rabbit', 'Raccoon', 'Shark', 'Sloth', 'Tiger', 'Turtle', 'Wolf',
];

const frenchVocabulary = [
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
] as const;

async function replacePool(name: string, answers: string[]) {
  return prisma.answerPool.upsert({
    where: { name },
    create: { name, answers: { create: answers.map((value) => ({ value })) } },
    update: {
      answers: {
        deleteMany: {},
        create: answers.map((value) => ({ value })),
      },
    },
  });
}

async function main() {
  const statesPool = await replacePool('US States', usStates);
  await replacePool('Animals', animals);
  const frenchEnglishAnswers = [...new Set(frenchVocabulary.map(([, translation]) => translation))];
  const frenchEnglishPool = await replacePool('French to English Vocabulary', frenchEnglishAnswers);

  const questionText = 'What state is the Grand Canyon in?';
  const existingQuestion = await prisma.commonQuestion.findFirst({ where: { text: questionText } });
  const questionData = {
    text: questionText,
    correctAnswer: 'Arizona',
    options: usStates as Prisma.InputJsonValue,
    answerPoolId: statesPool.id,
    answerCount: 4,
  };

  if (existingQuestion) {
    await prisma.commonQuestion.update({ where: { id: existingQuestion.id }, data: questionData });
  } else {
    await prisma.commonQuestion.create({ data: questionData });
  }

  const frenchQuizTitle = 'French Vocabulary: English Translations';
  const existingFrenchQuiz = await prisma.quiz.findFirst({ where: { title: frenchQuizTitle } });
  const frenchQuestions = frenchVocabulary.map(([french, translation], position) => ({
    position,
    text: french,
    correctAnswer: translation,
    options: frenchEnglishAnswers as Prisma.InputJsonValue,
    answerPoolId: frenchEnglishPool.id,
    answerCount: 6,
  }));

  const frenchQuizData = {
    title: frenchQuizTitle,
    description: 'Choose the English translation for each French word or phrase.',
  };

  if (existingFrenchQuiz) {
    await prisma.quiz.update({
      where: { id: existingFrenchQuiz.id },
      data: {
        ...frenchQuizData,
        questions: { deleteMany: {}, create: frenchQuestions },
      },
    });
  } else {
    await prisma.quiz.create({
      data: { ...frenchQuizData, questions: { create: frenchQuestions } },
    });
  }

  const mathQuizTitle = 'Math Sprint: Numbers & Patterns';
  const mathQuestions = [
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
  ] as const;
  const mathQuizItems = mathQuestions.flatMap(([text, correctAnswer, wrongAnswers], questionIndex) => {
    const position = questionIndex + Math.floor(questionIndex / 3);
    const question = { position, text, correctAnswer, options: [correctAnswer, ...wrongAnswers] as unknown as Prisma.InputJsonValue };
    if ((questionIndex + 1) % 3 !== 0) return [question];
    return [question, {
      position: position + 1,
      itemType: 'game',
      gameType: 'match_pairs',
      gameDurationSeconds: 30,
      text: `Match Pairs break ${Math.floor(questionIndex / 3) + 1}`,
      correctAnswer: '',
      options: [] as unknown as Prisma.InputJsonValue,
    }];
  });
  const mathQuizData = {
    title: mathQuizTitle,
    description: 'Twelve quick math questions with four Match Pairs game breaks.',
    theme: 'kids',
  };
  const existingMathQuiz = await prisma.quiz.findFirst({ where: { title: mathQuizTitle } });
  if (existingMathQuiz) {
    await prisma.quiz.update({ where: { id: existingMathQuiz.id }, data: { ...mathQuizData, questions: { deleteMany: {}, create: mathQuizItems } } });
  } else {
    await prisma.quiz.create({ data: { ...mathQuizData, questions: { create: mathQuizItems } } });
  }

  console.log('Seeded US States, Animals, the Grand Canyon common question, the French vocabulary quiz, and the Math Sprint quiz.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
