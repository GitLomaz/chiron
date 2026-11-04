import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateQuizDto, GeneratedQuestionType } from './generate-quiz.dto';

type Pair = { question: string; answer: string };
type GeneratedItem = { text: string; correctAnswer: string; options: Prisma.InputJsonValue; itemType?: string; gameType?: string; gameDurationSeconds?: number };
const GAMES = [
  { gameType: 'coin_catch', text: 'Coin Catch' },
  { gameType: 'match_pairs', text: 'Match Pairs' },
  { gameType: 'tower_stack', text: 'Tower Stack' },
];

@Injectable()
export class GenerateQuizService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(dataSetId: number, input: GenerateQuizDto) {
    const title = input.title.trim();
    if (!title) throw new BadRequestException('Enter a quiz title');
    if (input.questionCount < input.questionTypes.length) throw new BadRequestException('Choose at least one question per selected type');
    const set = await this.prisma.dataSet.findUnique({ where: { id: dataSetId }, include: { pairs: { orderBy: { position: 'asc' } } } });
    if (!set) throw new NotFoundException('Data set not found');
    // Existing question editors limit answers to 500 characters; omit entries
    // that could not be edited as generated questions.
    const pairs = set.pairs.map(({ question, answer }) => ({ question: question.trim(), answer: answer.trim() }))
      .filter(({ question, answer }) => question.length > 0 && question.length <= 2000 && answer.length > 0 && answer.length <= 500);
    if (!pairs.length) throw new BadRequestException('This data set needs a pair with an answer of at most 500 characters');
    const matchPairs = this.uniqueMatchingPairs(pairs.filter((pair) => pair.question.length <= 500));
    if (input.questionTypes.includes('matching') && matchPairs.length < 2) throw new BadRequestException('Matching needs two pairs with unique questions and answers, each at most 500 characters');
    const choices = pairs.filter((pair) => this.alternatives(pair, pairs).length > 0);
    if (input.questionTypes.includes('multiple_choice') && !choices.length) throw new BadRequestException('Multiple choice needs a question with a different answer from another question');

    const types = this.shuffle(input.questionTypes);
    const pool = this.shuffle(pairs);
    const choicePool = this.shuffle(choices);
    let pairIndex = 0, choiceIndex = 0, falseIndex = 0, trueFalseIndex = 0;
    const questions: GeneratedItem[] = Array.from({ length: input.questionCount }, (_, index) => {
      const type: GeneratedQuestionType = types[index % types.length];
      if (type === 'matching') {
        const shuffled = this.shuffle(matchPairs);
        // A matching question counts as one question and contains up to four pairs.
        const selected = shuffled.slice(0, Math.min(4, shuffled.length));
        return { text: 'Match the questions and answers', correctAnswer: 'Matched', options: { kind: 'matching', pairs: selected } };
      }
      if (type === 'multiple_choice') {
        const pair = choicePool[choiceIndex++ % choicePool.length];
        const wrong = this.shuffle(this.alternatives(pair, pairs)).slice(0, 3);
        return { text: pair.question, correctAnswer: pair.answer, options: [pair.answer, ...wrong] };
      }
      const showFalse = trueFalseIndex++ % 2 === 1 && choicePool.length > 0;
      const pair = showFalse ? choicePool[falseIndex++ % choicePool.length] : pool[pairIndex++ % pool.length];
      const alternatives = this.alternatives(pair, pairs);
      return { text: pair.question, correctAnswer: showFalse ? 'False' : 'True', options: { kind: 'true_false', statement: showFalse ? this.shuffle(alternatives)[0] : pair.answer } };
    });
    const games = this.shuffle(GAMES);
    const items: GeneratedItem[] = [];
    let nextGame = 0;
    questions.forEach((question, index) => {
      items.push(question);
      while (nextGame < input.gameCount && Math.floor(((nextGame + 1) * input.questionCount) / (input.gameCount + 1)) <= index) {
        items.push({ ...games[nextGame % games.length], itemType: 'game', gameDurationSeconds: 20, options: [], correctAnswer: '' });
        nextGame++;
      }
    });
    return this.prisma.quiz.create({
      data: { title, questions: { create: items.map((item, position) => ({ ...item, position })) } },
      select: { id: true, title: true },
    });
  }

  private alternatives(pair: Pair, pairs: Pair[]) {
    const knownAnswers = new Set(pairs.filter((candidate) => candidate.question === pair.question).map((candidate) => candidate.answer));
    return [...new Set(pairs.map((candidate) => candidate.answer).filter((answer) => !knownAnswers.has(answer)))];
  }

  private uniqueMatchingPairs(pairs: Pair[]) {
    const selected: Pair[] = [];
    for (const pair of this.shuffle(pairs)) {
      if (!selected.some((item) => item.question === pair.question || item.answer === pair.answer)) selected.push(pair);
    }
    // A greedy selection can miss two compatible pairs; find one when necessary.
    if (selected.length < 2) {
      for (const first of pairs) {
        const second = pairs.find((pair) => pair.question !== first.question && pair.answer !== first.answer);
        if (second) return [first, second];
      }
    }
    return selected;
  }

  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
