require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { HomeworkController } = require('../dist/homework/homework.controller');
const { HomeworkService } = require('../dist/homework/homework.service');

const quiz = { title: 'Archery homework', description: null, theme: 'standard', randomizeQuestionOrder: false, defaultTimerSeconds: -1, creditEveryCorrectAnswers: 1, questions: [{ id: 1, text: 'Ready?', itemType: 'question', gameType: null, gameDurationSeconds: null, options: ['Yes', 'No'], correctAnswer: 'Yes', answerCount: 2, timerSeconds: null }] };

function database({ omitCurlingFields = false } = {}) {
  const sessions = new Map(), participants = new Map();
  const participantsFor = (id) => [...participants.values()].filter((participant) => participant.homeworkSessionId === id).sort((a, b) => a.joinedAt - b.joinedAt);
  const sessionResult = (session, include) => include ? { ...session, participants: participantsFor(session.id), _count: { participants: participantsFor(session.id).length } } : { ...session };
  return {
    quiz: { findUnique: async () => quiz },
    homeworkSession: {
      create: async ({ data }) => { const session = { ...data, ended: false, expired: false }; sessions.set(session.id, session); return sessionResult(session); },
      findUnique: async ({ where, include }) => sessions.has(where.id) ? sessionResult(sessions.get(where.id), include) : null,
      findMany: async () => [...sessions.values()].map((session) => sessionResult(session, true)),
      updateMany: async ({ where, data }) => { let count = 0; for (const [id, session] of sessions) { if (session.ended === where.ended && session.endsAt <= where.endsAt.lte) { sessions.set(id, { ...session, ...data }); count += 1; } } return { count }; },
      update: async ({ where, data, include }) => { const session = { ...sessions.get(where.id), ...data }; sessions.set(where.id, session); return sessionResult(session, include); },
      delete: async ({ where }) => { const session = sessions.get(where.id); if (!session) throw new Error('Not found'); sessions.delete(where.id); for (const [id, participant] of participants) if (participant.homeworkSessionId === where.id) participants.delete(id); return session; },
    },
    homeworkParticipant: {
      create: async ({ data }) => { const participant = { ...data, answers: {}, matchProgress: {}, completedItems: [], archeryArrows: 0, archeryShots: [], shootingScore: 0, ...(omitCurlingFields ? {} : { curlingStones: 0, curlingShots: [], curlingScore: 0 }), joinedAt: new Date(), completedAt: null }; participants.set(participant.id, participant); return participant; },
      update: async ({ where, data }) => { const participant = { ...participants.get(where.id), ...data }; participants.set(where.id, participant); return participant; },
    },
  };
}

test('homework creation forwards the selected Archery mode', async () => {
  let received;
  const controller = new HomeworkController({
    create: async (...args) => { received = args; return { sessionId: 'session' }; },
  });

  await controller.create(42, { durationSeconds: 300, mode: 'archery' });

  assert.deepEqual(received, [42, 300, 'archery']);
});

test('homework persists archery scores and preserves completed attempts when a student retries', async () => {
  const prisma = database();
  const firstService = new HomeworkService(prisma);
  const run = await firstService.create(1, 300, 'archery');
  assert.equal((await firstService.listActive())[0].mode, 'archery');
  const firstAttempt = await firstService.join(run.sessionId, 'Archer');
  const answer = await firstService.submitAnswer(run.sessionId, firstAttempt.participantId, '1', 'Yes');
  assert.equal(answer.archery.arrows, 1);
  const inProgress = await firstService.studentState(run.sessionId, firstAttempt.participantId);
  assert.equal(inProgress.questions[0].answer, 'Yes');
  assert.equal(inProgress.questions[0].completed, true);
  const shot = await firstService.shootArchery(run.sessionId, firstAttempt.participantId, 0, 0);
  assert.equal(shot.shootingScore, 1000);

  const restartedService = new HomeworkService(prisma);
  const recovered = await restartedService.studentState(run.sessionId, firstAttempt.participantId);
  assert.equal(recovered.participant.archery.shootingScore, 1000);
  assert.equal(recovered.participant.archery.attempts.length, 1);

  const retry = await restartedService.restart(run.sessionId, firstAttempt.participantId);
  assert.notEqual(retry.participantId, firstAttempt.participantId);
  const retryAnswer = await restartedService.submitAnswer(run.sessionId, retry.participantId, '1', 'Yes');
  assert.equal(retryAnswer.archery.arrows, 1);
  await restartedService.shootArchery(run.sessionId, retry.participantId, 50, 50);
  const teacher = await restartedService.teacherState(run.sessionId, run.facilitatorToken);
  await assert.rejects(restartedService.teacherState(run.sessionId, 'not-testing'));
  assert.equal(teacher.participants.length, 2);
  assert.equal(teacher.participants[0].shootingScore, 1000);
  assert.equal(teacher.participants[1].shootingScore, 293);
  assert.deepEqual(teacher.archeryLeaderboard, [{ name: 'Archer', attempts: 2, bestScore: 1000 }]);
  const attempt = await restartedService.teacherAttempt(run.sessionId, run.facilitatorToken, firstAttempt.participantId);
  assert.deepEqual(attempt.answers, [{ id: '1', text: 'Ready?', answer: 'Yes', correctAnswer: 'Yes', isCorrect: true }]);

  await restartedService.end(run.sessionId, run.facilitatorToken);
  const history = await restartedService.listHistory();
  assert.deepEqual(history.map((session) => session.sessionId), [run.sessionId]);
  assert.equal(history[0].mode, 'archery');
  const anonymized = await restartedService.anonymize(run.sessionId, run.facilitatorToken);
  assert.deepEqual(anonymized.participants.map((participant) => participant.name), ['Student 1', 'Student 1']);
  await restartedService.remove(run.sessionId, run.facilitatorToken);
  assert.deepEqual(await restartedService.listHistory(), []);
});

test('homework persists independently placed curling stones and their scores', async () => {
  const prisma = database({ omitCurlingFields: true });
  const service = new HomeworkService(prisma);
  const run = await service.create(1, 300, 'curling');
  assert.equal((await service.listActive())[0].mode, 'curling');
  const player = await service.join(run.sessionId, 'Curler');
  const joined = await service.studentState(run.sessionId, player.participantId);
  assert.deepEqual(joined.participant.curling, { stones: 0, lastStone: null, attempts: [], shootingScore: 0 });
  const answer = await service.submitAnswer(run.sessionId, player.participantId, '1', 'Yes');
  assert.equal(answer.curling.stones, 1);

  const stone = await service.releaseCurlingStone(run.sessionId, player.participantId, 0, 85);
  assert.equal(stone.shootingScore, 1000);
  assert.equal(stone.lastStone.x, 0);
  assert.equal(stone.lastStone.y, -32);

  const reloaded = await new HomeworkService(prisma).studentState(run.sessionId, player.participantId);
  assert.equal(reloaded.participant.curling.attempts.length, 1);
  assert.equal(reloaded.participant.curling.shootingScore, 1000);
  const teacher = await service.teacherState(run.sessionId, run.facilitatorToken);
  assert.deepEqual(teacher.curlingLeaderboard, [{ name: 'Curler', attempts: 1, bestScore: 1000 }]);
});
