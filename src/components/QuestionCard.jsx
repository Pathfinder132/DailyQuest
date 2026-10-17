import React from 'react';
import { Check, CircleHelp, LockKeyhole, Sparkles, X } from 'lucide-react';
import SolutionRenderer from './SolutionRenderer.jsx';

const LETTER_STYLES = ['option-lilac', 'option-yellow', 'option-cyan', 'option-coral'];

export default function QuestionCard({
  question,
  selectedOptionId,
  earnedXp = 0,
  isRepeatSolve = false,
  isLocked,
  isPotd,
  potdSolved,
  onAnswer,
  onRandomize,
  onReturnToPotd,
  onGenerateMath,
  randomizing,
}) {
  if (!question) {
    return <div className="question-card p-10 text-center">Import or add a question to begin.</div>;
  }
  const isCorrect = selectedOptionId && selectedOptionId === question.correctAnswer;

  return (
    <section className={`question-card animate-popIn ${randomizing ? 'question-randomizing' : ''}`}>
      <div className="question-topline">
        <div className="question-tags">
          <span className="category-tag"><CircleHelp size={13} strokeWidth={3} /> {question.category}</span>
          <span className="difficulty-tag">{question.difficulty || 'Core concept'}</span>
          {isPotd && <span className="potd-tag"><Sparkles size={12} fill="currentColor" /> TODAY'S POTD</span>}
          {question.source === 'math' && <span className="math-tag">PROCEDURAL</span>}
        </div>
        <span className="question-number">{isPotd ? '01' : 'EXTRA'}</span>
      </div>

      <h2 className="question-prompt">{question.question}</h2>
      {question.code && <pre className="question-code"><code>{question.code}</code></pre>}

      <div className="answer-grid" role="group" aria-label="Choose an answer">
        {question.options.map((option, index) => {
          const selected = selectedOptionId === option.id;
          const correctOption = isLocked && option.id === question.correctAnswer;
          const wrongSelected = selected && isLocked && !isCorrect;
          const disabled = isLocked;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onAnswer(option.id)}
              className={`answer-option ${LETTER_STYLES[index % LETTER_STYLES.length]} ${selected ? 'answer-selected' : ''} ${correctOption ? 'answer-correct' : ''} ${wrongSelected ? 'answer-wrong' : ''} ${disabled && !selected && !correctOption ? 'answer-muted' : ''}`}
              aria-pressed={selected}
            >
              <span className="answer-letter">{option.displayLabel || option.id}</span>
              <span className="answer-copy">{option.text}</span>
              <span className="answer-trailing">
                {correctOption ? <Check size={18} strokeWidth={3} /> : wrongSelected ? <X size={18} strokeWidth={3} /> : null}
              </span>
            </button>
          );
        })}
      </div>

      {isLocked && (
        <div className={`answer-feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`} role="status">
          <div className="feedback-icon">{isCorrect ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}</div>
          <div>
            <strong>{isCorrect ? 'Nailed it. Brain gains secured.' : 'Not quite — this is how you level up.'}</strong>
            <p>{isCorrect
              ? `${isRepeatSolve ? 'Active recall repeat' : 'Correct solve'} · +${earnedXp} XP. Keep the momentum going.`
              : `Correct answer: ${question.options.find((option) => option.id === question.correctAnswer)?.text} · +${earnedXp} practice XP`}</p>
          </div>
          {isPotd && potdSolved && <span className="feedback-potd">POTD CLEAR</span>}
        </div>
      )}

      {isLocked && (
        <div className="solution-card animate-popIn">
          <div className="solution-heading">
            <span className="solution-icon"><Sparkles size={18} /></span>
            <div>
              <p className="eyebrow">THE COLORFUL BREAKDOWN</p>
              <h3>Why that answer works</h3>
            </div>
          </div>
          <p className="solution-copy"><SolutionRenderer text={question.solution || 'Take a moment to review the correct concept, then run it back.'} /></p>
          {question.takeaway && (
            <div className="takeaway-box">
              <span className="takeaway-star">✦</span>
              <p><strong>LOCK THIS IN</strong><br />{question.takeaway}</p>
            </div>
          )}
        </div>
      )}

      <div className="question-actions">
        <div className="lock-note"><LockKeyhole size={14} /> {isLocked ? 'Answer locked for this run' : 'One shot. Think it through.'}</div>
        <div className="action-buttons">
          <button type="button" className="math-generate-button" onClick={onGenerateMath}>✳ Generate math</button>
          {!isPotd && <button type="button" className="text-button" onClick={onReturnToPotd}>Return to POTD</button>}
          <button type="button" className={`randomize-button ${randomizing ? 'randomizing' : ''}`} onClick={onRandomize}>
            <span className="randomize-icon">⇄</span> Randomize Next Question
          </button>
        </div>
      </div>
    </section>
  );
}
