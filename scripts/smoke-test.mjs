import assert from 'node:assert/strict';
import { calculateQuestionReward, ensureLevelingProfile, getLastDisplayedOptionOrder, getLevelInfo, pickQuestionWithActiveRecall, shuffleOptionsForDisplay, xpRequiredForLevel } from '../src/lib/utils.js';
import { getQuestionBankTrack, isMathAptitudeQuestion, pickMathAptitudeQuestion, validateQuestionArray } from '../src/lib/questionTools.js';
import { getLegacyMigrationUid, getUserStorageKey, mergeStores, readStore, setLegacyMigrationUid, storeHasData, writeStore } from '../src/lib/storage.js';

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
assert.equal(pickQuestionWithActiveRecall([q1, q2, q3], combinedHistory, 'q3', pick([0.1, 0.1, 0])).id, 'q1', 'recall branch should favor the latest-wrong question');
assert.equal(pickQuestionWithActiveRecall([q1, q2, q3], combinedHistory, 'q3', pick([0.1, 0.9, 0])).id, 'q2', 'recall branch should still include latest-correct questions');
assert.equal(pickQuestionWithActiveRecall([q1, q2, q3], combinedHistory, 'q3', pick([0.8, 0])).id, 'q1', 'ordinary branch should remain random across the bank');

const generatedMath = { ...question('math_old'), category: 'Mental Math', source: 'math' };
assert.equal(pickQuestionWithActiveRecall([q3], [{ questionId: 'math_old', isCorrect: true, questionSnapshot: generatedMath }], 'q3', pick([0.1, 0, 0])).id, 'math_old', 'previous procedural math can be used for recall');
console.log('Warm-up logic smoke tests passed: XP rewards, weighted active recall, random branch, and procedural-math recall.');


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
const normalizedWithTags = validateQuestionArray(JSON.stringify([{ ...aptitudeQuestion, tags: ['percentages', 'profit-loss'], topic: 'Profit and Loss' }]), []);
assert.equal(normalizedWithTags.questions[0].topic, 'Profit and Loss', 'import preserves math topic metadata');
assert.deepEqual(normalizedWithTags.questions[0].tags, ['percentages', 'profit-loss'], 'import preserves category tags');
const projectJson = JSON.stringify([{ ...question('project_demo'), category: 'Project-Based Engineering', bankType: 'project', questionType: 'project-based' }]);
const normalizedProject = validateQuestionArray(projectJson, []).questions[0];
assert.equal(normalizedProject.bankType, 'project', 'project bank metadata is preserved during import');
assert.equal(getQuestionBankTrack(normalizedProject), 'project', 'project bank questions are classified separately from core and math');
assert.equal(getQuestionBankTrack({ ...question('math-bank-demo'), bankType: 'math', category: 'Custom' }), 'math', 'an explicit math bank type is recognized even with a custom category');
console.log('New feature tests passed: stable-ID option shuffle, active recall, math/aptitude bank selection, topic/tag import, and project-bank metadata.');


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
setLegacyMigrationUid('google-user-a');
assert.equal(getLegacyMigrationUid(), 'google-user-a', 'the first Google account claims the legacy cache');
assert.equal(storeHasData(readStore()), false, 'shared guest cache is cleared after a recoverable backup is made');
assert.deepEqual(JSON.parse(memoryStorage.get('uttej-engineering-warmup-v1:legacy-backup:google-user-a')), legacyStore, 'legacy progress remains recoverable locally');
assert.deepEqual(mergeStores(legacyStore, legacyStore).history.map((item) => item.id), ['attempt-1'], 'merging cloud and local caches does not double-count the same attempt');
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
assert.equal(mergeStores(legacyStore, { history: [{ ...legacyStore.history[0], id: 'attempt-2', timestamp: 20, xpEarned: 5 }], customQuestions: [], stats: { xp: 30, totalCorrect: 2, activeDays: [], potdCompletedDates: [] } }).stats.xp, 30, 'merging keeps XP consistent with attempts and saved stats');
if (existingWindow === undefined) delete globalThis.window;
else globalThis.window = existingWindow;
console.log('Storage tests passed: per-user cache keys, legacy migration backup/clear, unique attempt merge, and latest question edits.');
