import { pickQuestionWithCooldown, shuffleArray } from './utils.js';

const LETTERS = ['A', 'B', 'C', 'D'];

function optionsWithCorrect(correct, distractors) {
  const correctText = String(correct);
  const unique = [...new Set([correctText, ...distractors.map(String)])];
  const numericCorrect = /^-?\d+$/.test(correctText);
  let next = 1;
  while (unique.length < 4) {
    const candidate = numericCorrect
      ? String(Number(correctText) + next * 3)
      : (parseInt(correctText, 16) + next).toString(16).toUpperCase();
    if (!unique.includes(candidate)) unique.push(candidate);
    next += 1;
  }
  const values = shuffleArray(unique).slice(0, 4);
  const options = values.map((text, index) => ({ id: LETTERS[index], text }));
  const correctAnswer = options.find((option) => option.text === correctText)?.id ?? 'A';
  return { options, correctAnswer };
}

export function makeMentalMathQuestion() {
  const kind = Math.floor(Math.random() * 4);
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (kind === 0) {
    const a = 137 + Math.floor(Math.random() * 800);
    const b = 7 + Math.floor(Math.random() * 19);
    const correct = a % b;
    const generated = optionsWithCorrect(correct, [((correct + 3) % b), ((correct + 5) % b), ((correct + Math.max(1, Math.floor(b / 2))) % b)]);
    return {
      id: `math_mod_${suffix}`, category: 'Mental Math', difficulty: 'Quick calculation', source: 'math',
      question: `What is the remainder when ${a} is divided by ${b}?`, ...generated,
      solution: `The remainder is green(*${correct}*). Divide ${a} by ${b}; the largest whole-number multiple that does not exceed ${a} is ${Math.floor(a / b) * b}, leaving code(${correct}) behind.`,
      takeaway: 'For a % b, find the non-negative remainder after integer division.',
    };
  }

  if (kind === 1) {
    let a = 2 + Math.floor(Math.random() * 11);
    let b = 2 + Math.floor(Math.random() * 11);
    let c = 2 + Math.floor(Math.random() * 11);
    let d = 2 + Math.floor(Math.random() * 11);
    let correct = a * d - b * c;
    if (correct === 0) { d += 2; correct = a * d - b * c; }
    return {
      id: `math_det_${suffix}`, category: 'Mental Math', difficulty: 'Matrix mini-boss', source: 'math',
      question: 'Find the determinant of this 2 × 2 matrix.',
      code: `| ${a}  ${b} |\n| ${c}  ${d} |`,
      ...optionsWithCorrect(correct, [correct + 7, correct - 5, a * d + b * c]),
      solution: `For a 2 × 2 matrix, determinant = (top-left × bottom-right) − (top-right × bottom-left). So code(${a} × ${d} − ${b} × ${c}) = green(*${correct}*).`,
      takeaway: 'For [[a, b], [c, d]], det = ad − bc.',
    };
  }

  if (kind === 2) {
    const a = 12 + Math.floor(Math.random() * 38);
    const b = 13 + Math.floor(Math.random() * 27);
    const c = 11 + Math.floor(Math.random() * 19);
    const correct = a * b + c;
    return {
      id: `math_arith_${suffix}`, category: 'Mental Math', difficulty: 'Head math', source: 'math',
      question: `Calculate ${a} × ${b} + ${c}. Remember the order of operations.`,
      ...optionsWithCorrect(correct, [correct + 12, correct - 9, a * (b + c)]),
      solution: `Multiplication comes first: code(${a} × ${b} = ${a * b}). Then add ${c}: ${a * b} + ${c} = green(*${correct}*).`,
      takeaway: 'Apply multiplication before addition unless parentheses change the order.',
    };
  }

  const decimal = 64 + Math.floor(Math.random() * 192);
  const binary = decimal.toString(2).padStart(8, '0');
  const correct = decimal.toString(16).toUpperCase();
  return {
    id: `math_hex_${suffix}`, category: 'Mental Math', difficulty: 'Binary-to-hex', source: 'math',
    question: `Convert binary ${binary} to hexadecimal.`,
    ...optionsWithCorrect(correct, [((decimal + 17) % 256).toString(16).toUpperCase(), ((decimal + 32) % 256).toString(16).toUpperCase(), ((decimal - 9 + 256) % 256).toString(16).toUpperCase()]),
    solution: `Split the binary number into two 4-bit groups: code(${binary.slice(0, 4)} ${binary.slice(4)}). These represent ${parseInt(binary.slice(0, 4), 2)} and ${parseInt(binary.slice(4), 2)} in decimal, which become green(*${correct}*) in hexadecimal.`,
    takeaway: 'Each hexadecimal digit maps to exactly four binary bits.',
  };
}

const MATH_APTITUDE_CATEGORY = /\b(math|maths|mathematics|quant|quantitative|aptitude|reasoning|word[- ]based|word problems?|numerical ability|data interpretation|arithmetic|algebra|geometry|number system|probability|statistics|percentages?|profit and loss|time and work|speed time distance|mixtures?|ratio|permutation|combination|mensuration|simple interest|compound interest|syllogism|seating arrangement|calendar|clock|blood relation|direction sense|number series)\b/i;

/** Match imported math, aptitude, logical-reasoning, and word-problem categories. */
export function isMathAptitudeQuestion(question) {
  if (!question) return false;
  if (question.source === 'math') return true;
  const tags = Array.isArray(question.tags) ? question.tags.join(' ') : String(question.tags ?? '');
  const categoryMetadata = [question.bankType, question.category, question.topic, question.subCategory, question.questionType, tags].filter(Boolean).join(' ');
  return MATH_APTITUDE_CATEGORY.test(categoryMetadata);
}

/**
 * Pick an imported math/aptitude question using the same recency cooldown as the
 * general randomizer, so hitting Generate Math repeatedly doesn't immediately recycle
 * the same few aptitude questions. Small banks automatically relax the cooldown.
 */
export function pickMathAptitudeQuestion(
  questionBank = [],
  currentQuestionId = null,
  random = Math.random,
  recentQuestionTrail = [],
  history = [],
  cooldownSize = 10,
) {
  const eligible = (questionBank || []).filter(isMathAptitudeQuestion);
  if (!eligible.length) return null;
  return pickQuestionWithCooldown(eligible, currentQuestionId, history, recentQuestionTrail, random, cooldownSize);
}

/** A stable track classification used by the bank inventory and future question types. */
export function getQuestionBankTrack(question) {
  if (!question || typeof question !== 'object') return 'core';
  const explicitTypes = [question.bankType, question.questionType, question.type, question.track]
    .filter(Boolean).map((value) => String(value).trim().toLowerCase());
  const tagText = Array.isArray(question.tags) ? question.tags.join(' ').toLowerCase() : String(question.tags ?? '').toLowerCase();
  const categoryValues = [question.category, question.topic, question.subCategory].filter(Boolean).map((value) => String(value).trim().toLowerCase());
  const explicitProject = explicitTypes.some((value) => /project|capstone|case[ -]?study/.test(value));
  const taggedProject = /project[ -]?based|capstone|case[ -]?study/.test(tagText);
  const categoryProject = categoryValues.some((value) => /^(projects?|project[ -]?based|project[ -]?based engineering|case studies|capstone)$/i.test(value) || /project[ -]?based|capstone|case[ -]?study/.test(value));
  if (explicitProject || taggedProject || categoryProject) return 'project';
  if (isMathAptitudeQuestion(question)) return 'math';
  return 'core';
}

export function normalizeImportedQuestion(input, index = 0) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(`Question ${index + 1} must be an object.`);
  }
  const id = String(input.id ?? '').trim();
  const category = String(input.category ?? '').trim();
  const question = String(input.question ?? input.prompt ?? '').trim();
  const rawOptions = input.options;
  if (!id) throw new Error(`Question ${index + 1} is missing an id.`);
  if (!category) throw new Error(`Question ${index + 1} is missing a category.`);
  if (!question) throw new Error(`Question ${index + 1} is missing question text.`);
  if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
    throw new Error(`Question "${id}" needs an options array with at least 2 options.`);
  }
  const options = rawOptions.map((option, optionIndex) => {
    if (typeof option === 'string' || typeof option === 'number') {
      return { id: LETTERS[optionIndex] ?? `O${optionIndex + 1}`, text: String(option) };
    }
    return {
      id: String(option?.id ?? LETTERS[optionIndex] ?? `O${optionIndex + 1}`).trim(),
      text: String(option?.text ?? option?.label ?? option?.value ?? '').trim(),
    };
  });
  if (options.some((option) => !option.text)) throw new Error(`Question "${id}" contains an empty option.`);
  if (new Set(options.map((option) => option.id)).size !== options.length) throw new Error(`Question "${id}" has duplicate option ids.`);

  const suppliedAnswer = String(input.correctAnswer ?? input.answer ?? '').trim();
  const answerOption = options.find((option) => option.id === suppliedAnswer)
    ?? options.find((option) => option.text === suppliedAnswer);
  if (!answerOption) throw new Error(`Question "${id}" has a correctAnswer that does not match any option id or text.`);

  return {
    id, category, question, options, correctAnswer: answerOption.id,
    difficulty: String(input.difficulty ?? 'Imported'),
    solution: String(input.solution ?? input.explanation ?? 'No explanation provided yet.'),
    takeaway: String(input.takeaway ?? ''),
    topic: String(input.topic ?? '').trim() || undefined,
    subCategory: String(input.subCategory ?? input.subcategory ?? '').trim() || undefined,
    questionType: String(input.questionType ?? input.type ?? '').trim() || undefined,
    bankType: String(input.bankType ?? input.track ?? '').trim() || undefined,
    tags: Array.isArray(input.tags) ? input.tags.map((tag) => String(tag).trim()).filter(Boolean) : undefined,
    code: typeof input.code === 'string' ? input.code : undefined,
    source: 'imported',
  };
}

function hasSameQuestionContent(existing, incoming) {
  if (!existing || existing.category !== incoming.category || existing.question !== incoming.question ||
      existing.correctAnswer !== incoming.correctAnswer || existing.difficulty !== incoming.difficulty ||
      existing.solution !== incoming.solution || (existing.takeaway ?? '') !== (incoming.takeaway ?? '') ||
      (existing.topic ?? '') !== (incoming.topic ?? '') ||
      (existing.subCategory ?? '') !== (incoming.subCategory ?? '') ||
      (existing.questionType ?? '') !== (incoming.questionType ?? '') ||
      (existing.bankType ?? '') !== (incoming.bankType ?? '') ||
      JSON.stringify(existing.tags ?? []) !== JSON.stringify(incoming.tags ?? []) ||
      (existing.code ?? '') !== (incoming.code ?? '')) {
    return false;
  }
  const simplifyOptions = (options = []) => options.map((option) => ({ id: String(option.id), text: String(option.text) }));
  return JSON.stringify(simplifyOptions(existing.options)) === JSON.stringify(simplifyOptions(incoming.options));
}

/**
 * Validate a pasted question array and distinguish three cases:
 * 1) duplicate IDs inside the pasted JSON, 2) collisions with built-in questions,
 * 3) previously imported questions that can be skipped or explicitly updated by ID.
 */
export function validateQuestionArray(rawText, existingQuestions = []) {
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error('That is not valid JSON. Check commas, quotes, brackets, and trailing commas.');
  }
  if (!Array.isArray(data)) throw new Error('Paste a JSON array of question objects, not a single object.');
  if (!data.length) throw new Error('The array is empty. Add at least one question.');

  const normalized = data.map(normalizeImportedQuestion);
  const pastedIds = new Map();
  for (const [index, question] of normalized.entries()) {
    if (pastedIds.has(question.id)) {
      const firstQuestionNumber = pastedIds.get(question.id) + 1;
      const duplicateQuestionNumber = index + 1;
      throw new Error(`Your JSON contains the ID "${question.id}" more than once (questions ${firstQuestionNumber} and ${duplicateQuestionNumber}). Give every question in this pasted list its own ID, such as eng_001, eng_002, eng_003.`);
    }
    pastedIds.set(question.id, index);
  }

  const existingById = new Map(existingQuestions.map((question) => [
    typeof question === 'string' ? question : question.id,
    typeof question === 'string' ? { id: question } : question,
  ]));
  const questions = [];
  const updates = [];
  let alreadyImportedCount = 0;

  for (const question of normalized) {
    const existing = existingById.get(question.id);
    if (!existing) {
      questions.push(question);
      continue;
    }

    if (existing.source === 'imported' && hasSameQuestionContent(existing, question)) {
      alreadyImportedCount += 1;
      continue;
    }

    if (existing.source === 'imported') {
      // An explicit import of the same ID is treated as an intentional update.
      // The drawer previews this count before the user confirms.
      updates.push(question);
      continue;
    }

    throw new Error(`The ID "${question.id}" is already used by a built-in question in the app. Keep your eng_001-style IDs, but choose a different unique number for this question.`);
  }

  return { questions, updates, alreadyImportedCount, inputCount: normalized.length };
}
