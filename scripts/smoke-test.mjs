import assert from 'node:assert/strict';
import { ACTIVE_RECALL_CHANCE, RECENT_QUESTION_COOLDOWN, applyConfidenceAssessment, calculateQuestionReward, calculateStreak, ensureLevelingProfile, evaluateFillInBlankAnswer, getDailyQuestion, getLastDisplayedOptionOrder, getLevelInfo, getPotdQuestionPool, getRecentQuestionIds, grantStreakFreezeForConsistency, isFillInBlankQuestion, localDateKey, normalizeStreakFreeze, pickQuestionWithActiveRecall, pickQuestionWithCooldown, reconcileStreakFreezeForMissedDay, shuffleOptionsForDisplay, xpRequiredForLevel } from '../src/lib/utils.js';
import { getQuestionBankTrack, isHardOrSnippetQuestion, isMathAptitudeQuestion, normalizeImportedQuestion, pickMathAptitudeQuestion, prepareQuestionBankExport, validateQuestionArray } from '../src/lib/questionTools.js';
import { getLegacyMigrationUid, getUserStorageKey, mergeProfilesByFieldTimestamp, mergeStores, readStore, setLegacyMigrationUid, storeHasData, writeStore } from '../src/lib/storage.js';
import { getPotdHomeSession, isPotdCompletedForToday, selectDailyPotd } from '../src/lib/potd.js';
import { STARTER_QUESTIONS, STARTER_TOPICS } from '../src/data/starterBanks.js';
import { DEFAULT_QUESTIONS } from '../src/data/questions.js';

const question = (id) => ({
  id,
  category: 'Test',
  question: `Question ${id}?`,
  options: [{ id: 'A', text: 'Correct' }, { id: 'B', text: 'Incorrect' }],
  correctAnswer: 'A',
  solution: 'Test solution',
});
const q1 = question('q1');
const q2 = question('q2');
const q3 = question('q3');
const previousWrong = [{ questionId: 'q1', isCorrect: false, questionSnapshot: q1 }];
const previousCorrect = [{ questionId: 'q2', isCorrect: true, questionSnapshot: q2 }];

assert.deepEqual(calculateQuestionReward('q1', [], true), {
  xpEarned: 25, wasPreviouslyAttempted: false, isRepeatSolve: false,
});
assert.deepEqual(calculateQuestionReward('q1', [], false), {
  xpEarned: 5, wasPreviouslyAttempted: false, isRepeatSolve: false,
});
assert.deepEqual(calculateQuestionReward('q1', previousWrong, true), {
  xpEarned: 5, wasPreviouslyAttempted: true, isRepeatSolve: true,
});
assert.deepEqual(calculateQuestionReward('q2', previousCorrect, true), {
  xpEarned: 5, wasPreviouslyAttempted: true, isRepeatSolve: true,
});
assert.equal(calculateQuestionReward('q2', previousCorrect, false).xpEarned, 5);

// Progressive leveling preserves a returning user's current legacy level/progress,
// then gradually increases the XP target for each subsequent level.
const existingProfile = ensureLevelingProfile({
  history: [], customQuestions: [],
  stats: { xp: 1350, totalCorrect: 95, activeDays: [], potdCompletedDates: [] },
});
const legacyLevelInfo = getLevelInfo(existingProfile.stats.xp, existingProfile.stats.leveling);
assert.equal(legacyLevelInfo.level, 14, 'an existing level 14 profile stays at level 14 after the progression upgrade');
assert.equal(legacyLevelInfo.progressXp, 50, 'existing partial level progress is retained');
assert.equal(legacyLevelInfo.requiredXp, 165, 'the level 14 target increases by 5 XP per level');
assert.ok(xpRequiredForLevel(15) > xpRequiredForLevel(14), 'each higher level needs more XP than the last');
assert.equal(getLevelInfo(1465, existingProfile.stats.leveling).level, 15, 'the next level unlocks after 165 XP from the level 14 anchor');
const freshProfile = ensureLevelingProfile({ history: [], customQuestions: [], stats: { xp: 0, totalCorrect: 0, activeDays: [], potdCompletedDates: [] } });
assert.equal(getLevelInfo(100, freshProfile.stats.leveling).level, 2, 'new profiles need 100 XP for level 2');
assert.equal(xpRequiredForLevel(1), 100);
assert.equal(xpRequiredForLevel(2), 105);
assert.equal(xpRequiredForLevel(3), 110);
assert.equal(getLevelInfo(204, freshProfile.stats.leveling).level, 2, '204 XP is one XP short of the level 3 threshold');
assert.equal(getLevelInfo(205, freshProfile.stats.leveling).level, 3, 'level 3 requires 105 XP after the first 100 XP');

const combinedHistory = [...previousWrong, ...previousCorrect];
const pick = (values) => {
  const queue = [...values];
  return () => queue.shift() ?? 0;
};
assert.equal(pickQuestionWithActiveRecall([q1, q2, q3], combinedHistory, 'q3', pick([0.1, 0.1, 0]), 0.3, [], 0).id, 'q1', 'recall branch should favor the latest-wrong question');
assert.equal(pickQuestionWithActiveRecall([q1, q2, q3], combinedHistory, 'q3', pick([0.1, 0.9, 0]), 0.3, [], 0).id, 'q2', 'recall branch should still include latest-correct questions');
assert.equal(pickQuestionWithActiveRecall([q1, q2, q3], combinedHistory, 'q3', pick([0.8, 0]), 0.3, [], 0).id, 'q1', 'ordinary branch should remain random across the bank');

const generatedMath = { ...question('math_old'), category: 'Mental Math', source: 'math' };
assert.equal(pickQuestionWithActiveRecall([q3], [{ questionId: 'math_old', isCorrect: true, timestamp: 1, questionSnapshot: generatedMath }], 'q3', pick([0.1, 0, 0]), 0.3, [], 0).id, 'math_old', 'previous procedural math can be used for recall');
console.log('Warm-up logic smoke tests passed: XP rewards, weighted active recall, random branch, and procedural-math recall.');

// Recency-aware selection: skipped questions count, ordinary picks stay uniform over
// eligible questions, missed questions are reviewed when fresh, and small banks relax.
const manyQuestions = Array.from({ length: 20 }, (_, index) => question(`bank_${String(index + 1).padStart(3, '0')}`));
const recentTenTrail = Array.from({ length: 11 }, (_, index) => ({
  id: `view_${index + 1}`,
  questionId: index < 10 ? manyQuestions[index].id : manyQuestions[19].id,
  timestamp: 1000 + index,
}));
const recentDistinct = getRecentQuestionIds([], recentTenTrail, manyQuestions[19].id, 10);
assert.deepEqual(recentDistinct, manyQuestions.slice(0, 10).map((item) => item.id).reverse(), 'cooldown is based on the ten most recent distinct prior question IDs');
assert.equal(
  pickQuestionWithActiveRecall(manyQuestions, [], manyQuestions[19].id, pick([0, 0]), 0, recentTenTrail, 10).id,
  manyQuestions[10].id,
  'ordinary random selection starts among candidates outside the last ten questions; it does not take the first bank entries',
);
const reviewHistory = [
  { id: 'attempt-wrong', questionId: manyQuestions[0].id, isCorrect: false, timestamp: 10, questionSnapshot: manyQuestions[0] },
  { id: 'attempt-right', questionId: manyQuestions[1].id, isCorrect: true, timestamp: 20, questionSnapshot: manyQuestions[1] },
];
const recentMiddleTrail = manyQuestions.slice(2, 12).map((item, index) => ({ id: `mid_${index}`, questionId: item.id, timestamp: 100 + index }));
recentMiddleTrail.push({ id: 'current_view', questionId: manyQuestions[12].id, timestamp: 120 });
assert.equal(
  pickQuestionWithActiveRecall(manyQuestions, reviewHistory, manyQuestions[12].id, pick([0.1, 0.1, 0]), 0.3, recentMiddleTrail, 10).id,
  manyQuestions[0].id,
  'active recall prefers a fresh latest-wrong question when both incorrect and correct review pools are available',
);
assert.equal(
  pickQuestionWithCooldown([q1, q2], 'q2', [], [{ id: 'only-recent', questionId: 'q1', timestamp: 100 }], pick([0]), 10).id,
  'q1',
  'the cooldown relaxes for a small bank rather than returning no question',
);
const thousandQuestions = Array.from({ length: 1000 }, (_, index) => question(`large_${String(index + 1).padStart(4, '0')}`));
assert.equal(
  pickQuestionWithCooldown(thousandQuestions, null, [], [], () => 0.999999, 0).id,
  'large_1000',
  'the selector can reach the end of a 1000-question bank and is not limited to an initial slice',
);
assert.equal(
  pickQuestionWithActiveRecall(thousandQuestions, [], null, () => 0.999999, 0, [], 0).id,
  'large_1000',
  'the actual active-recall selector can return the end of a 1000-question bank on a normal random pick',
);
console.log('Recency-selection tests passed: 25-question cooldown, occasional active recall, random pool remains broad, missed-question priority, small-bank fallback, and full-bank reachability.');



const importedQuestion = {
  id: 'eng_001', category: 'OOP', difficulty: 'Warm-up',
  question: 'What is method overriding?',
  options: [{ id: 'A', text: 'Replacing inherited behavior' }, { id: 'B', text: 'Sorting an array' }],
  correctAnswer: 'A', solution: 'A subclass supplies its own implementation.',
};
const importedJson = JSON.stringify([importedQuestion]);
const cleanImport = validateQuestionArray(importedJson, []);
assert.equal(cleanImport.questions.length, 1, 'eng_001 is a valid ID when it is unique');
assert.equal(cleanImport.alreadyImportedCount, 0);
const savedQuestion = { ...cleanImport.questions[0], source: 'imported' };
const reimport = validateQuestionArray(importedJson, [savedQuestion]);
assert.equal(reimport.questions.length, 0, 'identical previously imported questions should be safely skipped');
assert.equal(reimport.updates.length, 0);
assert.equal(reimport.alreadyImportedCount, 1);
const revisedQuestion = { ...importedQuestion, solution: 'Updated explanation.' };
const updatePreview = validateQuestionArray(JSON.stringify([revisedQuestion]), [savedQuestion]);
assert.equal(updatePreview.questions.length, 0);
assert.equal(updatePreview.updates.length, 1, 'same saved ID with changed content should be offered as an update');
assert.throws(
  () => validateQuestionArray(JSON.stringify([importedQuestion, importedQuestion]), []),
  /Your JSON contains the ID "eng_001" more than once \(questions 1 and 2\)/,
  'duplicate IDs inside the pasted JSON should name both question positions',
);
const changedQuestion = { ...importedQuestion, question: 'Different question with same ID' };
assert.equal(validateQuestionArray(JSON.stringify([changedQuestion]), [savedQuestion]).updates.length, 1, 'changed saved custom IDs should be offered as updates');
assert.throws(
  () => validateQuestionArray(importedJson, [{ ...savedQuestion, source: undefined }]),
  /already used by a built-in question/,
  'built-in question collisions should be identified separately',
);
console.log('JSON import tests passed: unique eng_001, duplicate IDs in the payload, safe repeat imports, custom-question updates, and built-in collisions.');


const fourOptionQuestion = {
  id: 'shuffle_test', category: 'Test', question: 'Pick one',
  options: [
    { id: 'A', text: 'Alpha' }, { id: 'B', text: 'Bravo' },
    { id: 'C', text: 'Charlie' }, { id: 'D', text: 'Delta' },
  ],
  correctAnswer: 'C', solution: 'Test explanation',
};
const firstDisplay = shuffleOptionsForDisplay(fourOptionQuestion, ['A', 'B', 'C', 'D'], () => 0);
assert.notDeepEqual(firstDisplay.map((option) => option.id), ['A', 'B', 'C', 'D'], 'initial display differs from source order even when shuffle randomness returns the original order');
assert.deepEqual(firstDisplay.map((option) => option.displayLabel), ['A', 'B', 'C', 'D'], 'display labels are reassigned in visual order');
assert.equal(firstDisplay.find((option) => option.id === 'C').text, 'Charlie', 'stable option IDs and correct-answer mapping remain intact');
const secondDisplay = shuffleOptionsForDisplay(fourOptionQuestion, firstDisplay.map((option) => option.id), () => 0);
assert.notDeepEqual(secondDisplay.map((option) => option.id), firstDisplay.map((option) => option.id), 'the next recall display must differ from the last displayed order');
assert.equal(getLastDisplayedOptionOrder([{ questionId: 'shuffle_test', displayedOptionIds: ['D', 'C', 'B', 'A'] }], fourOptionQuestion).join(','), 'D,C,B,A');

const aptitudeQuestion = { ...question('apt_001'), category: 'Quantitative Aptitude', source: 'imported' };
const logicalQuestion = { ...question('lr_001'), category: 'Logical Reasoning', source: 'imported' };
const wordProblem = { ...question('word_001'), category: 'Word Problems', source: 'imported' };
assert.equal(isMathAptitudeQuestion(aptitudeQuestion), true, 'quantitative aptitude categories are included');
assert.equal(isMathAptitudeQuestion(logicalQuestion), true, 'logical reasoning categories are included');
assert.equal(isMathAptitudeQuestion(wordProblem), true, 'word problem categories are included');
assert.equal(isMathAptitudeQuestion(q1), false, 'unrelated question categories are not included');
assert.equal(pickMathAptitudeQuestion([q1, aptitudeQuestion, logicalQuestion], 'apt_001', () => 0).id, 'lr_001', 'math generation selects from the imported category bank and avoids the current item when possible');
const mathTrail = [
  { id: 'math-view-1', questionId: 'apt_001', timestamp: 10 },
  { id: 'math-view-2', questionId: 'lr_001', timestamp: 20 },
];
assert.equal(
  pickMathAptitudeQuestion([aptitudeQuestion, logicalQuestion, wordProblem, { ...question('math_fresh_004'), category: 'Percentages' }], 'word_001', () => 0, mathTrail, [], 10).id,
  'math_fresh_004',
  'Generate Math applies the recency cooldown and relaxes only when needed, excluding recently displayed math-bank questions',
);
const normalizedWithTags = validateQuestionArray(JSON.stringify([{ ...aptitudeQuestion, tags: ['percentages', 'profit-loss'], topic: 'Profit and Loss' }]), []);
assert.equal(normalizedWithTags.questions[0].topic, 'Profit and Loss', 'import preserves math topic metadata');
assert.deepEqual(normalizedWithTags.questions[0].tags, ['percentages', 'profit-loss'], 'import preserves category tags');
const projectJson = JSON.stringify([{ ...question('project_demo'), category: 'Project-Based Engineering', bankType: 'project', questionType: 'project-based' }]);
const normalizedProject = validateQuestionArray(projectJson, []).questions[0];
assert.equal(normalizedProject.bankType, 'project', 'project bank metadata is preserved during import');
assert.equal(getQuestionBankTrack(normalizedProject), 'project', 'project bank questions are classified separately from core and math');
assert.equal(getQuestionBankTrack({ ...question('math-bank-demo'), bankType: 'math', category: 'Custom' }), 'math', 'an explicit math bank type is recognized even with a custom category');


const fillBlankJson = JSON.stringify([{
  id: 'hard_001', category: 'SQL', difficulty: 'Hard', type: 'fill-in-blank',
  question: 'Which clause filters after aggregation?', correctAnswer: 'HAVING', acceptedAnswers: ['HAVING'],
  explanation: 'gold(*WHERE filters rows.*) blue(*HAVING filters grouped rows.*)',
  code: 'SELECT dept, COUNT(*) FROM employees GROUP BY dept HAVING COUNT(*) > 5;'
}]);
const normalizedFillBlank = validateQuestionArray(fillBlankJson, []).questions[0];
assert.equal(normalizedFillBlank.type, 'fill-in-blank', 'import supports fill-in-the-blank question types');
assert.deepEqual(normalizedFillBlank.options, [], 'fill-in-the-blank does not require MCQ options');
assert.equal(normalizedFillBlank.solution, 'gold(*WHERE filters rows.*) blue(*HAVING filters grouped rows.*)', 'explanation aliases into the solution field');
assert.equal(isFillInBlankQuestion(normalizedFillBlank), true);
assert.equal(evaluateFillInBlankAnswer(normalizedFillBlank, ' having  '), true, 'typed matching ignores case and repeated/surrounding whitespace');
assert.equal(evaluateFillInBlankAnswer(normalizedFillBlank, 'WHERE'), false, 'typed matching rejects unmatched answers');
const fillBlankWithAliases = validateQuestionArray(JSON.stringify([{ id:'fib_alias', category:'SQL', type:'fill-in-blank', question:'What clause?', acceptedAnswers:['HAVING', 'having'] }]), []).questions[0];
assert.equal(evaluateFillInBlankAnswer(fillBlankWithAliases, 'HAVING'), true, 'acceptedAnswers can define answers when correctAnswer is omitted');
assert.throws(() => validateQuestionArray(JSON.stringify([{ id:'fib_invalid', category:'SQL', type:'fill-in-blank', question:'What clause?' }]), []), /needs a correctAnswer or a non-empty acceptedAnswers/);
assert.equal(isHardOrSnippetQuestion(normalizedFillBlank), true, 'hard fill-in-the-blank questions are included in the interview filter');
assert.equal(isHardOrSnippetQuestion({ id:'easy_1', difficulty:'Easy', category:'SQL' }), false);

// Custom explanations remain intact through normalization and complete-bank export.
const structuredCustom = normalizeImportedQuestion({
  id: 'custom_structured_001', category: 'SQL', difficulty: 'Hard',
  question: 'Why is HAVING used after aggregation?',
  options: [{ id: 'A', text: 'After GROUP BY' }, { id: 'B', text: 'Before FROM' }],
  correctAnswer: 'A', solution: '',
  explanation: {
    whyItWorks: 'blue(*HAVING filters groups after aggregation.*)',
    commonTrap: 'gold(*WHERE filters rows before aggregation.*)',
    takeaway: 'Use HAVING for aggregate conditions.',
    realWorldAnalogy: 'green(*It is like filtering department summaries after calculating them.*)',
  },
}, 0);
assert.equal(structuredCustom.solution, '', 'structured explanation without a summary does not receive a generic placeholder');
assert.equal(structuredCustom.whyItWorks, 'blue(*HAVING filters groups after aggregation.*)');
assert.equal(structuredCustom.commonTrap, 'gold(*WHERE filters rows before aggregation.*)');
assert.equal(structuredCustom.takeaway, 'Use HAVING for aggregate conditions.');
assert.equal(structuredCustom.analogy, 'green(*It is like filtering department summaries after calculating them.*)');
const explicitExplanationWins = normalizeImportedQuestion({
  id: 'custom_explanation_alias_001', category: 'SQL', question: 'What does HAVING do?',
  options: [{ id: 'A', text: 'Filters groups' }, { id: 'B', text: 'Filters rows' }],
  correctAnswer: 'A', solution: '', explanation: 'blue(*It filters grouped results.*)',
}, 0);
assert.equal(explicitExplanationWins.solution, 'blue(*It filters grouped results.*)', 'a non-empty explanation is used when solution is an empty string');

const unsortedExportBank = [
  { id: 'z1', category: 'Web Development', solution: 'Custom web explanation', source: 'imported' },
  { id: 'a1', category: 'DBMS', explanation: { summary: 'Custom object explanation' }, source: 'imported' },
  { id: 'b1', category: 'DBMS', solution: 'Built-in explanation' },
];
const sortedExportBank = prepareQuestionBankExport(unsortedExportBank);
assert.deepEqual(sortedExportBank.map((item) => item.id), ['a1', 'b1', 'z1'], 'complete question exports are sorted by category then ID');
assert.equal(sortedExportBank[0].explanation.summary, 'Custom object explanation', 'custom structured explanations survive export unchanged');
assert.equal(sortedExportBank[2].solution, 'Custom web explanation', 'custom solution text survives export unchanged');
const completeExportFixture = prepareQuestionBankExport([...DEFAULT_QUESTIONS, ...STARTER_QUESTIONS, structuredCustom]);
assert.equal(completeExportFixture.length, 413, 'complete export includes original built-ins, starters, and imported custom questions');
assert.ok(completeExportFixture.some((item) => item.id === 'custom_structured_001'), 'complete export includes the custom JSON question');
assert.ok(completeExportFixture.some((item) => item.id === STARTER_QUESTIONS[0].id), 'complete export includes starter-bank questions');
console.log('Question export tests passed: full-bank aggregation, category ordering, and custom explanation preservation.');
const shakyRightQuestion = { ...question('shaky_right'), difficulty: 'Hard' };
const explicitRightQuestion = { ...question('explicit_right'), difficulty: 'Hard' };
const reviewAwarePick = pickQuestionWithActiveRecall(
  [shakyRightQuestion, explicitRightQuestion],
  [
    { id:'shaky-attempt', questionId:'shaky_right', isCorrect:true, needsReview:true, confidenceStatus:'shaky', timestamp:10, questionSnapshot:shakyRightQuestion },
    { id:'explicit-attempt', questionId:'explicit_right', isCorrect:true, needsReview:false, confidenceStatus:'explicit', timestamp:20, questionSnapshot:explicitRightQuestion },
  ],
  'not-in-bank',
  (() => { const values = [0.1, 0.1, 0.1]; return () => values.shift() ?? 0.1; })(),
  0.3,
  [],
  0,
);
assert.equal(reviewAwarePick.id, 'shaky_right', 'correct-but-shaky answers join the active recall review-priority pool');
const filteredSnapshotPick = pickQuestionWithActiveRecall(
  [{ ...question('hard_in_bank'), difficulty: 'Hard' }],
  [{ questionId: 'easy_old', isCorrect: false, timestamp: 10, questionSnapshot: { ...question('easy_old'), difficulty: 'Easy' } }],
  'not-current', () => 0, 1, [], 0,
  (candidate) => String(candidate.difficulty).toLowerCase() === 'hard',
);
assert.equal(filteredSnapshotPick.id, 'hard_in_bank', 'historical snapshots cannot bypass the active difficulty filter');
console.log('Typed-question tests passed: importer normalization, accepted answer matching, explanation aliasing, and hard/snippet filter.');

// Question cooldown should keep recently displayed questions away for 25 distinct picks,
// while active recall remains occasional rather than dominating new-question discovery.
assert.equal(RECENT_QUESTION_COOLDOWN, 25, 'recent-question cooldown is wide enough to reduce repetitive sessions');
assert.equal(ACTIVE_RECALL_CHANCE, 0.10, 'active recall is an occasional 10% branch');
const cooldownBank = Array.from({ length: 40 }, (_, index) => question(`cooldown_${index}`));
const cooldownTrail = Array.from({ length: 25 }, (_, index) => ({
  id: `view_${index}`, questionId: `cooldown_${index}`, timestamp: 1000 + index,
}));
const firstFresh = pickQuestionWithActiveRecall(
  cooldownBank, [], 'outside-bank', () => 0, 0.10, cooldownTrail, RECENT_QUESTION_COOLDOWN,
);
assert.equal(firstFresh.id, 'cooldown_25', 'recent 25 distinct question IDs are excluded when the bank has fresh alternatives');
const repeatedRecentIds = getRecentQuestionIds([], cooldownTrail, 'outside-bank', RECENT_QUESTION_COOLDOWN);
assert.equal(repeatedRecentIds.length, 25, 'the recent trail counts distinct displayed questions, including skipped ones');

const explicitAttempt = applyConfidenceAssessment({ id:'conf-1', baseXpEarned:25, isCorrect:true }, 'explicit', 1000);
assert.equal(explicitAttempt.xpEarned, 25, 'explicit correct answer awards full base XP');
assert.equal(explicitAttempt.mastered, true);
assert.equal(explicitAttempt.needsReview, false);
assert.equal(applyConfidenceAssessment(explicitAttempt, 'shaky', 2000), null, 'a finalized attempt cannot be scored a second time');
const shakyAttempt = applyConfidenceAssessment({ id:'conf-2', baseXpEarned:25, isCorrect:true }, 'shaky', 1000);
assert.equal(shakyAttempt.xpEarned, 12, 'shaky recall awards half XP rounded down');
assert.equal(shakyAttempt.needsReview, true);
assert.equal(shakyAttempt.mastered, false);
const wrongConfidentAttempt = applyConfidenceAssessment({ id:'conf-3', baseXpEarned:5, isCorrect:false }, 'explicit', 1000);
assert.equal(wrongConfidentAttempt.xpEarned, 5, 'confidently wrong responses keep practice XP, not correct-answer XP');
assert.equal(wrongConfidentAttempt.needsReview, true, 'an incorrect answer always remains in review');
const wrongShakyAttempt = applyConfidenceAssessment({ id:'conf-4', baseXpEarned:5, isCorrect:false }, 'shaky', 1000);
assert.equal(wrongShakyAttempt.xpEarned, 2, 'shaky incorrect responses receive half practice XP');
assert.equal(wrongShakyAttempt.needsReview, true);
console.log('Confidence scoring tests passed: full/half XP, review queue flags, mastery flags, and idempotent finalization.');
console.log('New feature tests passed: stable-ID option shuffle, active recall, math/aptitude bank selection, topic/tag import, and project-bank metadata.');

// First-run onboarding has a bundled starter bank, so a new user can practice immediately.
assert.equal(STARTER_TOPICS.length, 8, 'onboarding exposes eight starter interest categories');
assert.equal(STARTER_QUESTIONS.length, 400, 'the bundled starter bank has 50 questions per category');
const defaultIds = new Set(DEFAULT_QUESTIONS.map((item) => item.id));
assert.equal(STARTER_QUESTIONS.filter((item) => defaultIds.has(item.id)).length, 0, 'starter question IDs do not collide with the original POTD bank');
const starterIds = new Set();
for (const topic of STARTER_TOPICS) {
  const topicQuestions = STARTER_QUESTIONS.filter((item) => item.category === topic.id);
  assert.equal(topicQuestions.length, 50, `${topic.label} has exactly 50 starter questions`);
  assert.equal(topicQuestions.filter((item) => item.difficulty === 'Easy').length, 6, `${topic.label} has a few easy questions`);
  assert.equal(topicQuestions.filter((item) => item.difficulty === 'Medium').length, 24, `${topic.label} mostly has medium questions`);
  assert.equal(topicQuestions.filter((item) => item.difficulty === 'Medium-Hard').length, 20, `${topic.label} includes medium-hard questions`);
}
for (const item of STARTER_QUESTIONS) {
  assert.ok(!starterIds.has(item.id), `starter question ID ${item.id} is unique`);
  starterIds.add(item.id);
  assert.equal(item.options.length, 4, `${item.id} has four options`);
  assert.ok(item.options.some((option) => option.id === item.correctAnswer), `${item.id} maps to a valid correct option`);
  assert.ok(item.solution && !/green\(\*undefined\*\)/i.test(item.solution), `${item.id} has a usable solution string`);
}
assert.equal(STARTER_QUESTIONS.find((item) => item.id === 'starter_aptitude_014').options.find((option) => option.id === STARTER_QUESTIONS.find((item) => item.id === 'starter_aptitude_014').correctAnswer).text, '48', 'the odd-one-out aptitude answer is 48, not an accidental negative value');
console.log('Onboarding starter-bank tests passed: 8 categories, 50 questions per topic, level mix, unique IDs, valid answer mapping, and corrected aptitude answer.');


// Daily POTD selection uses all built-in questions and enforces selected topics strictly.
const allBuiltInBank = [...DEFAULT_QUESTIONS, ...STARTER_QUESTIONS].map((item) => ({ ...item, topic: item.topic || item.category }));
assert.equal(allBuiltInBank.length, 412, 'POTD bank includes the 12 original questions plus 400 starter questions');
assert.equal(getPotdQuestionPool(allBuiltInBank, []).length, 412, 'empty preferences use the complete built-in bank');
assert.equal(getPotdQuestionPool(allBuiltInBank, ['DSA']).length, 50, 'a selected topic strictly filters the POTD pool');
assert.ok(getPotdQuestionPool(allBuiltInBank, ['DSA']).every((item) => item.category === 'DSA'), 'a topic-filtered POTD pool never leaks unrelated categories');
assert.equal(getPotdQuestionPool(allBuiltInBank, ['unmapped-topic']).length, 0, 'an unknown non-empty topic never broadens into the full bank');
const dailyKey = '2026-10-21';
const dsaSqlPotd = selectDailyPotd(allBuiltInBank, { interests: ['DSA', 'SQL'] }, dailyKey);
const reorderedPreferencePotd = selectDailyPotd(allBuiltInBank, { interests: ['SQL', 'DSA'] }, dailyKey);
assert.equal(dsaSqlPotd.id, reorderedPreferencePotd.id, 'topic-seed ordering does not change the daily POTD across devices');
assert.ok(['DSA', 'SQL'].includes(dsaSqlPotd.category), 'selected topic preferences constrain the daily POTD');
assert.equal(selectDailyPotd(allBuiltInBank, { interests: [] }, dailyKey).id, getDailyQuestion(allBuiltInBank, dailyKey, 'all-built-in').id, 'no selected topics use a deterministic hash over the full built-in bank');
assert.equal(selectDailyPotd(allBuiltInBank, { interests: ['unmapped-topic'] }, dailyKey), null, 'POTD returns no unrelated question when preferences cannot be matched');

const potdQuestion = allBuiltInBank.find((item) => item.id === 'starter_dsa_001');
const pendingPotdAttempt = {
  id: 'potd-pending-confidence', questionId: potdQuestion.id, questionSnapshot: potdQuestion,
  timestamp: 1, dateKey: dailyKey, isPotd: true, isCorrect: false, baseXpEarned: 5, xpEarned: 0,
};
const pendingPotdSession = getPotdHomeSession({ history: [pendingPotdAttempt], stats: {} }, potdQuestion, dailyKey);
assert.equal(pendingPotdSession.question.id, potdQuestion.id, 'an unsolved POTD takes priority over an old session');
assert.equal(pendingPotdSession.attempt.id, pendingPotdAttempt.id, 'an unfinished confidence assessment resumes after reload');
const finalizedWrongPotd = { ...pendingPotdAttempt, confidenceStatus: 'shaky', confidenceAppliedAt: 2, xpEarned: 2 };
const retryPotdSession = getPotdHomeSession({ history: [finalizedWrongPotd], stats: {} }, potdQuestion, dailyKey);
assert.equal(retryPotdSession.question.id, potdQuestion.id, 'a failed POTD stays on screen for a retry');
assert.equal(retryPotdSession.attempt, null, 'a finalized wrong POTD does not reopen as a permanently locked attempt');
const solvedPotdStore = {
  history: [{ ...finalizedWrongPotd, id: 'old-wrong' }, {
    id: 'potd-correct', questionId: potdQuestion.id, questionSnapshot: potdQuestion, dateKey: dailyKey,
    isPotd: true, isCorrect: true, confidenceStatus: 'explicit', confidenceAppliedAt: 3,
  }],
  stats: { potdCompletedDates: [dailyKey], potdCompletedQuestionIdsByDate: { [dailyKey]: [potdQuestion.id] } },
};
assert.equal(isPotdCompletedForToday(solvedPotdStore, potdQuestion, dailyKey), true, 'POTD completion is tied to the question ID for that date');
assert.equal(getPotdHomeSession(solvedPotdStore, potdQuestion, dailyKey).potdSolved, true, 'a correct daily answer remains completed after reload');
const correctPendingPotdStore = {
  history: [{ ...pendingPotdAttempt, id: 'potd-correct-pending-confidence', isCorrect: true }],
  stats: { potdCompletedDates: [dailyKey], potdCompletedQuestionIdsByDate: { [dailyKey]: [potdQuestion.id] } },
};
const correctPendingSession = getPotdHomeSession(correctPendingPotdStore, potdQuestion, dailyKey);
assert.equal(correctPendingSession.potdSolved, true, 'a correct answer can complete POTD before the confidence assessment is finalized');
assert.equal(correctPendingSession.attempt.id, 'potd-correct-pending-confidence', 'a correct POTD with unfinished confidence is resumed instead of restoring an older question');
const switchedPotdQuestion = allBuiltInBank.find((item) => item.id !== potdQuestion.id && item.category === potdQuestion.category);
assert.equal(isPotdCompletedForToday({ ...solvedPotdStore, history: solvedPotdStore.history, stats: { potdCompletedDates: [dailyKey], potdCompletedQuestionIdsByDate: { [dailyKey]: [potdQuestion.id] } } }, switchedPotdQuestion, dailyKey), false, 'changing the selected POTD topic/question cannot inherit another question ID as solved');
const legacyDateOnlyHistory = { history: [{ id: 'legacy-potd', questionId: potdQuestion.id, questionSnapshot: potdQuestion, dateKey: dailyKey, isPotd: true, isCorrect: true }], stats: { potdCompletedDates: [dailyKey] } };
assert.equal(isPotdCompletedForToday(legacyDateOnlyHistory, switchedPotdQuestion, dailyKey), false, 'a legacy date-only summary does not mark a different topic-filtered POTD complete when the old question ID is known');
console.log('POTD tests passed: full 412-question pool, strict topic preferences, cross-device deterministic hash, pending-confidence resume, retry after wrong answer, and per-question completion tracking.');

// Streak Freeze is earned only after a consistency milestone and protects at most one missed day.
const testToday = new Date(2026, 9, 21, 12, 0, 0);
const isoDay = (offset) => { const date = new Date(testToday); date.setDate(date.getDate() + offset); return localDateKey(date); };
const sevenDayRun = Array.from({ length: 7 }, (_, index) => isoDay(-index));
assert.equal(calculateStreak(sevenDayRun, testToday, []), 7, 'a seven-day active sequence reaches the first freeze milestone');
const earnedFreeze = grantStreakFreezeForConsistency({ activeDays: sevenDayRun, streakFreeze: normalizeStreakFreeze() }, testToday);
assert.equal(earnedFreeze.granted, true, 'consistency grants an available Streak Freeze');
assert.equal(earnedFreeze.stats.streakFreeze.available, true);
assert.equal(earnedFreeze.stats.streakFreeze.lastEarnedMilestone, 7);
const oneGapStats = reconcileStreakFreezeForMissedDay({ activeDays: [isoDay(-2)], streakFreeze: earnedFreeze.stats.streakFreeze }, testToday);
assert.equal(oneGapStats.streakFreeze.available, false, 'using one freeze consumes it');
assert.ok(oneGapStats.streakFreeze.protectedDates.includes(isoDay(-1)), 'the single missed day is recorded as protected');
assert.equal(calculateStreak(oneGapStats.activeDays, testToday, oneGapStats.streakFreeze.protectedDates), 2, 'the protected day keeps the previous streak connected');
const twoGapStats = reconcileStreakFreezeForMissedDay({ activeDays: [isoDay(-3)], streakFreeze: earnedFreeze.stats.streakFreeze }, testToday);
assert.equal(twoGapStats.streakFreeze.available, true, 'a freeze is not spent when more than one day was missed');
console.log('Streak Freeze tests passed: consistency milestone, single-gap protection, consumption, and multi-gap safety.');

// Field-level profile conflict resolution: current remote values survive a newer unrelated
// global timestamp on a stale cache; a newer explicit edit only wins for its own field.
const remoteProfile = {
  preferredName: 'Remote Name', selectedPetId: 'brain-buddy', interests: ['SQL'], dailyGoal: 3,
  updatedAt: 500, fieldUpdatedAt: { preferredName: 500, selectedPetId: 500, interests: 500, dailyGoal: 500 },
  fieldTimestampedFields: ['preferredName', 'selectedPetId', 'interests', 'dailyGoal'],
};
const staleLocalProfile = { preferredName: 'Old Local Name', selectedPetId: 'old-pet', interests: ['DSA'], dailyGoal: 1, updatedAt: 900 };
const mergedStale = mergeProfilesByFieldTimestamp(staleLocalProfile, remoteProfile);
assert.equal(mergedStale.preferredName, 'Remote Name', 'an explicit remote field beats an unversioned local field even if local global updatedAt is newer');
assert.equal(mergedStale.interests.join(','), 'SQL');
const legacyZeroTimestampProfile = {
  preferredName: 'Stale Zero-Timestamp Local', interests: ['DSA'], updatedAt: 900,
  fieldUpdatedAt: { preferredName: 0, interests: 0 },
};
const mergedLegacyZeroTimestamps = mergeProfilesByFieldTimestamp(legacyZeroTimestampProfile, remoteProfile);
assert.equal(mergedLegacyZeroTimestamps.preferredName, 'Remote Name', 'old zero-valued timestamp placeholders are treated as unversioned legacy fields');
assert.deepEqual(mergedLegacyZeroTimestamps.interests, ['SQL'], 'legacy zero-timestamp topic preferences cannot override explicit cloud settings');
const newerLocalEdit = {
  ...staleLocalProfile,
  interests: ['Networking'],
  fieldUpdatedAt: { preferredName: 400, selectedPetId: 400, interests: 1000, dailyGoal: 400 },
  fieldTimestampedFields: ['preferredName', 'selectedPetId', 'interests', 'dailyGoal'],
};
const mergedFieldwise = mergeProfilesByFieldTimestamp(newerLocalEdit, remoteProfile);
assert.equal(mergedFieldwise.preferredName, 'Remote Name', 'older explicit profile fields do not win due to an unrelated local edit');
assert.deepEqual(mergedFieldwise.interests, ['Networking'], 'the newer timestamped field edit can still win independently');
console.log('Profile merge tests passed: per-field timestamps beat stale global timestamps and preserve genuinely newer local field edits.');




// Storage merge + account-isolation checks do not require Firebase or a browser.
const existingWindow = globalThis.window;
const memoryStorage = new Map();
globalThis.window = {
  localStorage: {
    getItem(key) { return memoryStorage.has(key) ? memoryStorage.get(key) : null; },
    setItem(key, value) { memoryStorage.set(key, String(value)); },
    removeItem(key) { memoryStorage.delete(key); },
  },
};
const userAKey = getUserStorageKey('google-user-a');
const userBKey = getUserStorageKey('google-user-b');
assert.notEqual(userAKey, userBKey, 'each Google UID receives a separate browser cache');
const legacyStore = {
  history: [{ id: 'attempt-1', questionId: 'q1', timestamp: 10, isCorrect: true, xpEarned: 25, dateKey: '2026-10-17' }],
  customQuestions: [{ id: 'custom-1', question: 'legacy question', _warmupUpdatedAt: 10 }],
  stats: { xp: 25, totalCorrect: 1, activeDays: ['2026-10-17'], potdCompletedDates: [] },
};
assert.equal(writeStore(legacyStore), true);
const progressionCacheKey = getUserStorageKey('google-user-level-profile');
const profileWithLeveling = { ...legacyStore, stats: { ...legacyStore.stats, leveling: { baseXp: 0, baseLevel: 1, version: 1 } } };
assert.equal(writeStore(profileWithLeveling, progressionCacheKey), true);
assert.deepEqual(readStore(progressionCacheKey).stats.leveling, profileWithLeveling.stats.leveling, 'local reads preserve the progressive-level anchor');

const onboardingProfileKey = getUserStorageKey('google-user-onboarding-profile');
const onboardingProfile = {
  history: [], customQuestions: [],
  profile: { preferredName: 'Alex', selectedPetId: 'brain-buddy', interests: ['DSA', 'SQL'], dailyGoal: 3, onboardingCompleted: true, onboardingVersion: 1 },
  stats: { xp: 0, totalCorrect: 0, activeDays: [], potdCompletedDates: [] },
};
assert.equal(writeStore(onboardingProfile, onboardingProfileKey), true);
assert.deepEqual(readStore(onboardingProfileKey).profile, onboardingProfile.profile, 'chosen name, companion, topic interests, optional goal, and onboarding completion survive local persistence');
assert.deepEqual(mergeStores({ ...onboardingProfile, profile: { ...onboardingProfile.profile, preferredName: 'Alex' } }, onboardingProfile).profile, onboardingProfile.profile, 'profile onboarding fields survive multi-source local/cloud merges');

const trailCacheKey = getUserStorageKey('google-user-trail-profile');
const trailProfile = { history: [], customQuestions: [], stats: { xp: 0, totalCorrect: 0, activeDays: [], potdCompletedDates: [], recentQuestionTrail: [{ id: 'view-q1', questionId: 'q1', timestamp: 101 }, { id: 'view-q2', questionId: 'q2', timestamp: 102 }] } };
assert.equal(writeStore(trailProfile, trailCacheKey), true);
assert.deepEqual(readStore(trailCacheKey).stats.recentQuestionTrail, trailProfile.stats.recentQuestionTrail, 'recent displayed-question trail survives local-cache reloads');
setLegacyMigrationUid('google-user-a');
assert.equal(getLegacyMigrationUid(), 'google-user-a', 'the first Google account claims the legacy cache');
assert.equal(storeHasData(readStore()), false, 'shared guest cache is cleared after a recoverable backup is made');
assert.deepEqual(JSON.parse(memoryStorage.get('uttej-engineering-warmup-v1:legacy-backup:google-user-a')), legacyStore, 'legacy progress remains recoverable locally');
assert.deepEqual(mergeStores(legacyStore, legacyStore).history.map((item) => item.id), ['attempt-1'], 'merging cloud and local caches does not double-count the same attempt');
const pendingConfidence = { id:'confidence-attempt', questionId:'q-conf', timestamp:10, baseXpEarned:25, xpEarned:0, isCorrect:true, confidenceStatus:null };
const finalizedConfidence = { ...pendingConfidence, confidenceStatus:'shaky', xpEarned:12, confidenceAppliedAt:20, needsReview:true };
assert.equal(mergeStores({ history:[pendingConfidence], customQuestions:[], stats:{xp:0,totalCorrect:1,activeDays:[],potdCompletedDates:[]} }, { history:[finalizedConfidence], customQuestions:[], stats:{xp:12,totalCorrect:1,activeDays:[],potdCompletedDates:[]} }).history[0].confidenceStatus, 'shaky', 'merge prefers finalized confidence records over stale pending snapshots');
const mergedCustom = mergeStores(
  { ...legacyStore, customQuestions: [{ id: 'custom-1', question: 'old version', _warmupUpdatedAt: 10 }] },
  { ...legacyStore, customQuestions: [{ id: 'custom-1', question: 'new version', _warmupUpdatedAt: 20 }] },
);
assert.equal(mergedCustom.customQuestions[0].question, 'new version', 'newer edits to imported questions win cache merges');

const anchoredMerge = mergeStores(
  { history: [], customQuestions: [], stats: { xp: 1350, totalCorrect: 10, activeDays: [], potdCompletedDates: [], leveling: { baseXp: 1300, baseLevel: 14, version: 1 } } },
  { history: [], customQuestions: [], stats: { xp: 1350, totalCorrect: 10, activeDays: [], potdCompletedDates: [] } },
);
assert.deepEqual(anchoredMerge.stats.leveling, { baseXp: 1300, baseLevel: 14, version: 1 }, 'profile merge preserves level progression metadata');
const mergedTrailStore = mergeStores(
  { history: [], customQuestions: [], stats: { xp: 0, totalCorrect: 0, activeDays: [], potdCompletedDates: [], recentQuestionTrail: [{ id: 'view-a', questionId: 'q1', timestamp: 100 }, { id: 'view-b', questionId: 'q2', timestamp: 200 }] } },
  { history: [], customQuestions: [], stats: { xp: 0, totalCorrect: 0, activeDays: [], potdCompletedDates: [], recentQuestionTrail: [{ id: 'view-b', questionId: 'q2', timestamp: 200 }, { id: 'view-c', questionId: 'q3', timestamp: 300 }] } },
);
assert.deepEqual(mergedTrailStore.stats.recentQuestionTrail.map((entry) => entry.id), ['view-a', 'view-b', 'view-c'], 'cloud/local trail merging deduplicates shared selections and preserves chronological order');
assert.equal(mergeStores(legacyStore, { history: [{ ...legacyStore.history[0], id: 'attempt-2', timestamp: 20, xpEarned: 5 }], customQuestions: [], stats: { xp: 30, totalCorrect: 2, activeDays: [], potdCompletedDates: [] } }).stats.xp, 30, 'merging keeps XP consistent with attempts and saved stats');
if (existingWindow === undefined) delete globalThis.window;
else globalThis.window = existingWindow;
console.log('Storage tests passed: per-user cache keys, legacy migration backup/clear, unique attempt merge, and latest question edits.');
