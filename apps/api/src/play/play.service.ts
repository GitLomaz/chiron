import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlayService {
  constructor(private readonly prisma: PrismaService) {}

  async findQuiz(guid: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { guid },
      select: {
        guid: true,
        title: true,
        description: true,
        randomizeQuestionOrder: true,
        theme: true,
        defaultTimerSeconds: true,
        questions: {
          where: { isEnabled: true },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            itemType: true,
            gameType: true,
            text: true,
            options: true,
            correctAnswer: true,
            answerPoolId: true,
            answerCount: true,
            timerSeconds: true,
          },
        },
      },
    });

    if (!quiz) throw new NotFoundException('That quiz link could not be found');

    const { randomizeQuestionOrder, questions, ...quizDetails } = quiz;
    // Games remain at their authored positions; only quiz questions shuffle
    // among the question slots so a planned game break is never displaced.
    const orderedQuestions = randomizeQuestionOrder ? this.shuffleQuestionsInPlace(questions) : questions;

    return {
      ...quizDetails,
      questions: orderedQuestions.map(({ answerPoolId, answerCount, ...question }) => ({
        ...question,
        // Questions created before answerCount was introduced used the full
        // pool as their options. Keep the player approachable for those
        // legacy questions by showing the standard four choices.
        answerCount: answerCount ?? (answerPoolId ? 4 : null),
      })),
    };
  }

  private shuffle<T>(items: T[]) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
  }

  private shuffleQuestionsInPlace<T extends { itemType: string }>(items: T[]) {
    const shuffledQuestions = this.shuffle(items.filter((item) => item.itemType === 'question'));
    let questionIndex = 0;
    return items.map((item) => item.itemType === 'question' ? shuffledQuestions[questionIndex++] : item);
  }
}
