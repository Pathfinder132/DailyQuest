import React from 'react';

const COLOR_CLASSES = {
  red: 'solution-red',
  blue: 'solution-blue',
  green: 'solution-green',
  gold: 'solution-gold',
  code: 'solution-code',
};

/**
 * Parses the safe explanation mini-language into React elements.
 * Supported tokens: red(...), blue(...), green(...), gold(...), code(...).
 * Use *...* inside a token to emphasize its contents.
 */
export function parseSolution(rawText = '') {
  const text = String(rawText ?? '');
  const nodes = [];
  let plainStart = 0;
  let cursor = 0;
  let keyIndex = 0;

  while (cursor < text.length) {
    const match = /\b(red|blue|green|gold|code)\(/g;
    match.lastIndex = cursor;
    const found = match.exec(text);
    if (!found) break;

    const start = found.index;
    const name = found[1];
    const contentStart = match.lastIndex;
    let depth = 1;
    let end = contentStart;
    for (; end < text.length; end += 1) {
      if (text[end] === '(') depth += 1;
      else if (text[end] === ')') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) {
      cursor = contentStart;
      continue;
    }

    if (start > plainStart) nodes.push({ type: 'text', value: text.slice(plainStart, start), key: `t-${keyIndex++}` });
    let value = text.slice(contentStart, end).trim();
    const bold = value.startsWith('*') && value.endsWith('*') && value.length >= 2;
    if (bold) value = value.slice(1, -1);
    nodes.push({ type: name, value, bold, key: `s-${keyIndex++}` });
    cursor = end + 1;
    plainStart = cursor;
  }
  if (plainStart < text.length) nodes.push({ type: 'text', value: text.slice(plainStart), key: `t-${keyIndex++}` });

  return nodes.map((node) => {
    if (node.type === 'text') return <React.Fragment key={node.key}>{node.value}</React.Fragment>;
    return <span key={node.key} className={`${COLOR_CLASSES[node.type]} ${node.bold ? 'font-extrabold' : 'font-semibold'}`}>{node.value}</span>;
  });
}

function explanationObject(question, text) {
  if (text && typeof text === 'object' && !Array.isArray(text)) return text;
  if (question?.explanation && typeof question.explanation === 'object' && !Array.isArray(question.explanation)) return question.explanation;
  return {};
}

function sectionValue(question, explanation, keys) {
  for (const key of keys) {
    const value = question?.[key] ?? explanation?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function withLabel(labelToken, value, labelPattern) {
  if (!value) return '';
  return labelPattern.test(value) ? value : `${labelToken} ${value}`;
}

export default function SolutionRenderer({ text, question = null }) {
  const explanation = explanationObject(question, text);
  const blocks = [
    {
      key: 'why',
      className: 'solution-structured-why',
      text: withLabel('blue(*Why it works:*)', sectionValue(question, explanation, ['whyItWorks', 'why_it_works']), /blue\(\*?Why it works:/i),
    },
    {
      key: 'trap',
      className: 'solution-structured-trap',
      text: withLabel('gold(*The Core Trap:*)', sectionValue(question, explanation, ['commonTrap', 'coreTrap', 'common_trap', 'takeCare']), /gold\(\*?The Core Trap:/i),
    },
    {
      key: 'analogy',
      className: 'solution-structured-analogy',
      text: withLabel('green(*Real-world analogy:*)', sectionValue(question, explanation, ['analogy', 'realWorldAnalogy', 'real_world_analogy']), /green\(\*?Real-world analogy:/i),
    },
  ].filter((block) => block.text);
  const suppliedMainText = typeof text === 'string'
    ? text
    : explanation.summary || explanation.text || explanation.solution || question?.solution || '';
  const hasStructuredExplanation = Boolean(
    blocks.length
    || question?.takeaway
    || explanation.takeaway
    || question?.whyItWorks
    || question?.commonTrap
    || question?.analogy,
  );
  // Only use the generic prompt when the imported question truly has no explanation.
  // A structured custom explanation should never be obscured by a placeholder sentence.
  const mainText = String(suppliedMainText || (hasStructuredExplanation ? '' : 'Review the key concept, then try it again.')).trim();

  return (
    <div className="solution-renderer">
      {mainText && <div className="solution-main-text">{parseSolution(mainText)}</div>}
      {blocks.map((block) => (
        <div className={`solution-structured-block ${block.className}`} key={block.key}>
          {parseSolution(block.text)}
        </div>
      ))}
    </div>
  );
}
