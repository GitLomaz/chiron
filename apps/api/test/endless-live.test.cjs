require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { ModeratedService } = require('../src/moderated/moderated.service');
const quiz = { title: 'Test', description: null, theme: 'standard', defaultTimerSeconds: -1, randomizeQuestionOrder: false, questions: [1, 2].map(id => ({ id, text: `Question ${id}`, itemType: 'question', gameType: null, options: ['Yes', 'No'], correctAnswer: 'Yes', answerCount: null, timerSeconds: null })) };
const prisma = { quiz: { findUnique: async () => quiz } };
for (const mode of ['classic', 'matching']) test(`${mode} endless repeats questions and counts each attempt`, async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, mode, 300, true);
  const student = service.join(run.pin, 'Student', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);
  const session = service.sessions.get(run.sessionId), participant = session.participants.get(student.participantId);
  const seen = [];
  for (let i = 0; i < 4; i++) {
    const state = service.studentState(run.pin, student.participantId);
    assert.equal(state.phase, 'question');
    assert.equal(state.currentQuestion.answered, false);
    seen.push(state.currentQuestion.text);
    service.submitAnswer(run.pin, { participantId: student.participantId, questionId: state.currentQuestion.id, answer: 'Yes' });
    if (mode === 'matching') service.nextMatchingQuestion(run.pin, student.participantId);
    else service.openParticipantQuestion(session, participant);
  }
  assert.deepEqual(new Set(seen.slice(2)), new Set(['Question 1', 'Question 2']));
  assert.deepEqual(service.studentState(run.pin, student.participantId).score, { correct: 4, answered: 4 });
  service.end(run.sessionId, run.facilitatorToken);
  assert.equal(service.studentState(run.pin, student.participantId).endedByTeacher, true);
});
test('facilitated mode rejects endless', async () => {
  await assert.rejects(new ModeratedService(prisma).create(1, 'facilitated', 300, true));
});

test('classic live participants can manually advance after answering', async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, 'classic', 300);
  const student = service.join(run.pin, 'Student', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);

  const firstQuestion = service.studentState(run.pin, student.participantId).currentQuestion;
  service.submitAnswer(run.pin, { participantId: student.participantId, questionId: firstQuestion.id, answer: 'Yes' });
  service.nextQuestion(run.pin, student.participantId);

  const nextState = service.studentState(run.pin, student.participantId);
  assert.equal(nextState.currentQuestion.number, 2);
  assert.equal(nextState.currentQuestion.answered, false);
  service.end(run.sessionId, run.facilitatorToken);
});

test('facilitated live participants cannot advance themselves', async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, 'facilitated', 300);
  const student = service.join(run.pin, 'Student', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);

  assert.throws(() => service.nextQuestion(run.pin, student.participantId));
  service.end(run.sessionId, run.facilitatorToken);
});

test('classic live games wait for the participant before advancing', async () => {
  const service = new ModeratedService(prisma);
  const run = await service.create(1, 'classic', 300);
  const student = service.join(run.pin, 'Student', randomUUID());
  service.start(run.sessionId, run.facilitatorToken);
  const session = service.sessions.get(run.sessionId);
  const participant = session.participants.get(student.participantId);
  const game = participant.questions[participant.currentQuestionIndex];
  game.itemType = 'game';
  game.timerSeconds = 1;
  participant.currentQuestionOpenedAt = new Date(Date.now() - 1_000);

  service.onParticipantQuestionTimedOut(session, participant, game);
  assert.equal(service.studentState(run.pin, student.participantId).betweenQuestions, true);
  assert.equal(participant.currentQuestionIndex, 0);

  service.nextQuestion(run.pin, student.participantId);
  assert.equal(participant.currentQuestionIndex, 1);
  service.end(run.sessionId, run.facilitatorToken);
});
