import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clipboard, FileJson, Plus, X } from 'lucide-react';
import { validateQuestionArray } from '../lib/questionTools.js';

const EXAMPLE = `[
  {
    "id": "my_custom_001",
    "category": "Networking",
    "difficulty": "Challenge",
    "question": "Which protocol maps a domain name to an IP address?",
    "options": [
      { "id": "A", "text": "DNS" },
      { "id": "B", "text": "DHCP" },
      { "id": "C", "text": "ARP" },
      { "id": "D", "text": "SMTP" }
    ],
    "correctAnswer": "A",
    "solution": "green(*DNS*) resolves domain names to records such as IP addresses.",
    "takeaway": "DNS is a name-resolution system."
  }
]`;

const FILL_IN_BLANK_EXAMPLE = `[
  {
    "id": "hard_001",
    "category": "SQL",
    "difficulty": "Hard / Interview Snippet",
    "type": "fill-in-blank",
    "question": "Which SQL clause filters grouped records AFTER aggregation operations such as COUNT() or SUM()?",
    "correctAnswer": "HAVING",
    "acceptedAnswers": ["HAVING"],
    "code": "SELECT department, COUNT(*) AS headcount\nFROM employees\nGROUP BY department\n_____ headcount > 5;",
    "explanation": "gold(*The Core Rule:* WHERE filters individual rows before aggregation). blue(*HAVING filters grouped results*) after GROUP BY computes aggregate values.",
    "takeaway": "Use HAVING to filter based on aggregate conditions."
  }
]`;

const PROJECT_BASED_EXAMPLE = `[
  {
    "id": "project_api_design_001",
    "bankType": "project",
    "questionType": "project-based",
    "category": "Project-Based Engineering",
    "topic": "API Design",
    "difficulty": "Scenario",
    "question": "Your team is building a task-tracking API. Which choice is best for preventing one user from reading another user's tasks?",
    "options": [
      { "id": "A", "text": "Hide task IDs in the frontend" },
      { "id": "B", "text": "Check ownership/authorization on the server for every request" },
      { "id": "C", "text": "Use a longer URL" },
      { "id": "D", "text": "Store all tasks in localStorage" }
    ],
    "correctAnswer": "B",
    "solution": "The server must enforce authorization for every request. Frontend checks and unguessable IDs are not substitutes for access control.",
    "takeaway": "Use bankType = project for project scenarios; IDs and history remain stable across imports."
  }
]`;

const MATH_APTITUDE_EXAMPLE = `[
  {
    "id": "aptitude_profit_001",
    "category": "Quantitative Aptitude",
    "topic": "Profit and Loss",
    "difficulty": "Word problem",
    "question": "A shopkeeper marks an item at ₹1,200 and gives a 15% discount. If the cost price is ₹850, what is the profit percentage?",
    "options": [
      { "id": "A", "text": "15%" },
      { "id": "B", "text": "18%" },
      { "id": "C", "text": "20%" },
      { "id": "D", "text": "25%" }
    ],
    "correctAnswer": "C",
    "solution": "Selling price = ₹1,200 × 0.85 = ₹1,020. Profit = ₹1,020 − ₹850 = ₹170. Profit percentage = (170 / 850) × 100 = green(*20%*).",
    "takeaway": "Calculate the discounted selling price before finding profit percentage."
  },
  {
    "id": "aptitude_timework_001",
    "category": "Aptitude",
    "topic": "Time and Work",
    "difficulty": "Applied",
    "question": "A can complete a job in 12 days and B can complete it in 18 days. If they work together at the same rate, how many days will they need?",
    "options": [
      { "id": "A", "text": "6 days" },
      { "id": "B", "text": "7.2 days" },
      { "id": "C", "text": "8 days" },
      { "id": "D", "text": "9 days" }
    ],
    "correctAnswer": "B",
    "solution": "Combined daily work = 1/12 + 1/18 = 5/36. Total time = 1 ÷ (5/36) = green(*36/5 = 7.2 days*).",
    "takeaway": "Add work rates, not the number of days each worker needs."
  },
  {
    "id": "reasoning_series_001",
    "category": "Logical Reasoning",
    "topic": "Number Series",
    "difficulty": "Pattern finding",
    "question": "Find the next number in the series: 3, 8, 15, 24, 35, ?",
    "options": [
      { "id": "A", "text": "42" },
      { "id": "B", "text": "45" },
      { "id": "C", "text": "48" },
      { "id": "D", "text": "50" }
    ],
    "correctAnswer": "C",
    "solution": "The differences are 5, 7, 9, and 11, increasing by 2 each time. The next difference is 13, so 35 + 13 = green(*48*).",
    "takeaway": "When a sequence is unclear, inspect the differences between consecutive terms."
  },
  {
    "id": "wordproblem_speed_001",
    "category": "Word Problems",
    "topic": "Average Speed",
    "difficulty": "Applied",
    "question": "A car travels 150 km at 50 km/h and returns 150 km at 75 km/h. What is its average speed for the whole trip?",
    "options": [
      { "id": "A", "text": "55 km/h" },
      { "id": "B", "text": "58 km/h" },
      { "id": "C", "text": "60 km/h" },
      { "id": "D", "text": "62.5 km/h" }
    ],
    "correctAnswer": "C",
    "solution": "Total distance = 300 km. Total time = 150/50 + 150/75 = 3 + 2 = 5 hours. Average speed = 300/5 = green(*60 km/h*).",
    "takeaway": "Average speed is total distance divided by total time; it is not always the mean of the two speeds."
  }
]`;

export default function JsonImportDrawer({ open, onClose, existingQuestions = [], onImport }) {
  const [raw, setRaw] = useState(EXAMPLE);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [alreadyImportedCount, setAlreadyImportedCount] = useState(0);
  const [inputCount, setInputCount] = useState(0);
  const [success, setSuccess] = useState('');

  const lineCount = useMemo(() => raw.split('\n').length, [raw]);
  if (!open) return null;

  function validate() {
    setError(''); setSuccess(''); setPreview(null); setAlreadyImportedCount(0); setInputCount(0);
    try {
      const result = validateQuestionArray(raw, existingQuestions);
      setPreview(result);
      setAlreadyImportedCount(result.alreadyImportedCount);
      setInputCount(result.inputCount);
    } catch (validationError) {
      setError(validationError.message);
    }
  }

  function importNow() {
    if (!preview || (preview.questions.length === 0 && preview.updates.length === 0)) return;
    const addedCount = preview.questions.length;
    const updatedCount = preview.updates.length;
    onImport({ questions: preview.questions, updates: preview.updates });
    const resultParts = [];
    if (addedCount) resultParts.push(`${addedCount} new question${addedCount === 1 ? '' : 's'} added`);
    if (updatedCount) resultParts.push(`${updatedCount} saved question${updatedCount === 1 ? '' : 's'} updated`);
    if (alreadyImportedCount) resultParts.push(`${alreadyImportedCount} unchanged question${alreadyImportedCount === 1 ? '' : 's'} skipped`);
    setSuccess(`${resultParts.join('; ')}.`);
    setPreview(null);
  }

  function loadExample() {
    setRaw(EXAMPLE); setError(''); setSuccess(''); setPreview(null); setAlreadyImportedCount(0); setInputCount(0);
  }

  function loadMathExamples() {
    setRaw(MATH_APTITUDE_EXAMPLE); setError(''); setSuccess(''); setPreview(null); setAlreadyImportedCount(0); setInputCount(0);
  }

  function loadProjectExample() {
    setRaw(PROJECT_BASED_EXAMPLE); setError(''); setSuccess(''); setPreview(null); setAlreadyImportedCount(0); setInputCount(0);
  }

  function loadFillInBlankExample() {
    setRaw(FILL_IN_BLANK_EXAMPLE); setError(''); setSuccess(''); setPreview(null); setAlreadyImportedCount(0); setInputCount(0);
  }

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="import-drawer" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <div className="drawer-header">
          <div className="drawer-title-icon"><FileJson size={23} /></div>
          <div className="drawer-heading-copy">
            <p className="eyebrow">CUSTOM QUESTION LAB</p>
            <h2 id="import-title">Import your own questions</h2>
            <p>Paste a JSON array to grow your daily challenge bank.</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close JSON import drawer" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="format-note">
          <strong>Must-have fields</strong>
          <div className="format-chips"><code>id</code><code>category</code><code>question</code><code>correctAnswer</code><code>options[] (MCQ only)</code></div>
          <p>Multiple-choice questions need at least two options. For <code>"type": "fill-in-blank"</code>, omit options and supply <code>correctAnswer</code> plus optional <code>acceptedAnswers[]</code>. Both <code>solution</code> and <code>explanation</code> are supported.</p>
        </div>

        <div className="math-import-note">
          <div>
            <strong>Import a Math / Aptitude bank</strong>
            <p>Use categories such as <code>Math</code>, <code>Quantitative Aptitude</code>, <code>Logical Reasoning</code>, <code>Word Problems</code>, or <code>Data Interpretation</code>. These are picked by <b>Generate Math</b> after import.</p>
          </div>
          <button type="button" className="secondary-button" onClick={loadMathExamples}>Load 4 math examples</button>
        </div>

        <div className="project-import-note">
          <div>
            <strong>Project-based question bank</strong>
            <p>For case studies, architecture trade-offs, debugging scenarios, or project decisions, add <code>"bankType": "project"</code>. The dashboard will count these separately from Core and Math.</p>
          </div>
          <button type="button" className="secondary-button" onClick={loadProjectExample}>Load project example</button>
        </div>

        <div className="fillblank-import-note">
          <div><strong>Typed recall / interview snippets</strong><p>Use <code>"type": "fill-in-blank"</code> to replace A/B/C/D buttons with a high-contrast text field. Matching ignores letter case and repeated whitespace.</p></div>
          <button type="button" className="secondary-button" onClick={loadFillInBlankExample}>Load fill-in-the-blank example</button>
        </div>

        <div className="editor-topline">
          <label htmlFor="json-input">QUESTIONS.JSON</label>
          <span>{lineCount} lines</span>
        </div>
        <textarea
          id="json-input"
          className="json-editor"
          value={raw}
          onChange={(event) => { setRaw(event.target.value); setError(''); setSuccess(''); setPreview(null); setAlreadyImportedCount(0); setInputCount(0); }}
          spellCheck="false"
          aria-describedby="json-help"
        />
        <p className="editor-help" id="json-help">Explanations can use <code>red(text)</code>, <code>blue(text)</code>, <code>green(*bold*)</code>, <code>gold(text)</code>, and <code>code(text)</code>.</p>

        {error && <div className="import-message import-error"><AlertCircle size={18} /><span>{error}</span></div>}
        {success && <div className="import-message import-success"><CheckCircle2 size={18} /><span>{success}</span></div>}
        {preview && (
          <div className="import-preview">
            <div className="preview-title"><CheckCircle2 size={18} /><strong>{(preview.questions.length + preview.updates.length) > 0 ? `Looks good — ${preview.questions.length} new, ${preview.updates.length} update${preview.updates.length === 1 ? '' : 's'} ready` : `All ${inputCount} question${inputCount === 1 ? '' : 's'} are already in your bank`}</strong></div>
            {alreadyImportedCount > 0 && <p className="preview-existing-note">{alreadyImportedCount} unchanged question{alreadyImportedCount === 1 ? ' is' : 's are'} already saved and will be skipped. Your existing history stays intact.</p>}
            {preview.updates.length > 0 && <p className="preview-existing-note">{preview.updates.length} saved question{preview.updates.length === 1 ? ' has' : 's have'} the same ID but updated content. Confirming will replace their question content while keeping the IDs stable for history and active recall.</p>}
            {(preview.questions.length + preview.updates.length) > 0 && <div className="preview-list">
              {[...preview.questions, ...preview.updates].slice(0, 4).map((question) => <div key={question.id} className="preview-row"><span>{preview.updates.some((update) => update.id === question.id) ? 'UPDATE · ' : ''}{question.category}</span><strong>{question.question}</strong></div>)}
              {(preview.questions.length + preview.updates.length) > 4 && <small>+ {preview.questions.length + preview.updates.length - 4} more question(s)</small>}
            </div>}
          </div>
        )}

        <div className="drawer-footer">
          <button type="button" className="text-button" onClick={loadExample}><Clipboard size={15} /> Load example</button>
          <div className="drawer-footer-actions">
            <button type="button" className="secondary-button" onClick={validate}>Validate JSON</button>
            <button type="button" className="primary-button" onClick={importNow} disabled={!preview || (preview.questions.length === 0 && preview.updates.length === 0)}><Plus size={17} /> {preview?.updates.length ? 'Add / Update questions' : 'Add questions'}</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
