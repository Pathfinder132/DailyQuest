import React from 'react';

const COLOR_CLASSES = {
  red: 'solution-red',
  blue: 'solution-blue',
  green: 'solution-green',
  gold: 'solution-gold',
  code: 'solution-code',
};

/**
 * Parses red(text), red(*bold text*), blue(...), green(...), gold(...), and code(...).
 * It produces React nodes—not HTML strings—so explanation text cannot inject markup.
 */
export function parseSolution(rawText = '') {
  const text = String(rawText);
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

export default function SolutionRenderer({ text }) {
  return <>{parseSolution(text)}</>;
}
