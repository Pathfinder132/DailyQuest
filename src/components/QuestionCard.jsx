import React, { useEffect, useState } from 'react';
import { Check, CircleHelp, LockKeyhole, Sparkles, X, Send, Brain } from 'lucide-react';
import SolutionRenderer from './SolutionRenderer.jsx';
import { isFillInBlankQuestion } from '../lib/utils.js';

const LETTER_STYLES = ['option-lilac', 'option-yellow', 'option-cyan', 'option-coral'];

function difficultyPresentation(question) {
  const raw = String(question?.difficulty || 'Medium');
  const lower = raw.toLowerCase();
  if (/interview|snippet|code challenge/.test(lower)) return { label: 'Hard / Interview Snippet', className: 'difficulty-hard' };
  if (/^hard$|advanced|difficult/.test(lower)) return { label: 'Hard', className: 'difficulty-hard' };
  if (/^easy$|beginner|basic/.test(lower)) return { label: 'Easy', className: 'difficulty-easy' };
  if (/medium|moderate|intermediate|core concept/.test(lower)) return { label: 'Medium', className: 'difficulty-medium' };
  return { label: raw, className: 'difficulty-medium' };
}

export default function QuestionCard({
  question,
  selectedOptionId,
  submittedResponse = '',
  answerIsCorrect,
  earnedXp = 0,
  baseXpEarned = 0,
  isRepeatSolve = false,
  confidenceStatus = null,
  confidenceEligible = false,
  requiresConfidence = false,
  isLocked,
  isPotd,
  potdSolved,
  onAnswer,
  onFillBlankAnswer,
  onConfidenceSelect,
  onRandomize,
  onReturnToPotd,
  onGenerateMath,
  randomizing,
  difficultyFilter = 'all',
  onDifficultyFilterChange,
  hardQuestionCount = 0,
}) {
  const [typedAnswer, setTypedAnswer] = useState('');
  const fillInBlank = isFillInBlankQuestion(question);
  useEffect(() => setTypedAnswer(''), [question?.id]);

  if (!question) {
    return <div className="question-card p-10 text-center">Import or add a question to begin.</div>;
  }

  const isCorrect = isLocked
    ? (typeof answerIsCorrect === 'boolean' ? answerIsCorrect : Boolean(selectedOptionId && selectedOptionId === question.correctAnswer))
    : false;
  const correctOptionText = question.options?.find((option) => option.id === question.correctAnswer)?.text || question.correctAnswer;
  const difficulty = difficultyPresentation(question);
  const halfXp = baseXpEarned > 0 ? Math.max(1, Math.floor(baseXpEarned / 2)) : 0;
  const confidenceSaved = confidenceStatus === 'explicit' || confidenceStatus === 'shaky';

  function submitTypedAnswer(event) {
    event.preventDefault();
    const value = typedAnswer.trim();
    if (!value || isLocked) return;
    onFillBlankAnswer?.(value);
  }

  return (
    <section id="question-card-start" className={`question-card animate-popIn ${randomizing ? 'question-randomizing' : ''}`}>
      <div className="question-topline">
        <div className="question-tags">
          <span className="category-tag"><CircleHelp size={13} strokeWidth={3} /> {question.category}</span>
          <span className={`difficulty-tag ${difficulty.className}`}>{difficulty.label}</span>
          {fillInBlank && <span className="question-type-tag">FILL IN THE BLANK</span>}
          {isPotd && <span className="potd-tag"><Sparkles size={12} fill="currentColor" /> TODAY'S POTD</span>}
          {question.source === 'math' && <span className="math-tag">PROCEDURAL</span>}
        </div>
        <span className="question-number">{isPotd ? '01' : 'EXTRA'}</span>
      </div>

      <h2 className="question-prompt">{question.question}</h2>
      {question.code && <pre className="question-code"><code>{question.code}</code></pre>}

      {!fillInBlank ? (
        <div className="answer-grid" role="group" aria-label="Choose an answer">
          {(question.options || []).map((option, index) => {
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
      ) : (
        <form className={`fill-answer-form ${isLocked ? 'fill-answer-locked' : ''}`} onSubmit={submitTypedAnswer}>
          <label htmlFor={`typed-answer-${question.id}`} className="fill-answer-label">Type your answer</label>
          <input
            id={`typed-answer-${question.id}`}
            className="fill-answer-input"
            type="text"
            autoComplete="off"
            spellCheck="false"
            value={isLocked ? String(submittedResponse ?? '') : typedAnswer}
            onChange={(event) => setTypedAnswer(event.target.value)}
            placeholder="Enter your answer…"
            disabled={isLocked}
            aria-describedby={`typed-answer-hint-${question.id}`}
          />
          <div className="fill-answer-footer">
            <span id={`typed-answer-hint-${question.id}`} className="fill-answer-hint">Case-insensitive · surrounding spaces are ignored</span>
            <button type="submit" className="fill-answer-submit" disabled={isLocked || !typedAnswer.trim()}><Send size={16} /> Submit answer</button>
          </div>
        </form>
      )}

      {isLocked && (
        <div className={`answer-feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`} role="status">
          <div className="feedback-icon">{isCorrect ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}</div>
          <div>
            <strong>{isCorrect ? 'Nailed it. Brain gains secured.' : 'Not quite — this is how you level up.'}</strong>
            <p>
              {requiresConfidence
                ? `${isCorrect ? 'Correct answer' : `Correct answer: ${fillInBlank ? correctOptionText : correctOptionText}`} · choose your confidence to confirm XP.`
                : `${isCorrect ? (isRepeatSolve ? 'Active recall repeat' : 'Correct solve') : `Correct answer: ${fillInBlank ? correctOptionText : correctOptionText}`} · +${earnedXp} XP${!isCorrect ? ' practice XP' : ''}`}
            </p>
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
          <p className="solution-copy"><SolutionRenderer text={question.solution || question.explanation || 'Take a moment to review the correct concept, then run it back.'} /></p>
          {question.takeaway && (
            <div className="takeaway-box">
              <span className="takeaway-star">✦</span>
              <p><strong>LOCK THIS IN</strong><br />{question.takeaway}</p>
            </div>
          )}
          {confidenceEligible && (
            <div className="confidence-assessment" aria-labelledby={`confidence-title-${question.id}`}>
              <div className="confidence-heading"><Brain size={18} /><div><strong id={`confidence-title-${question.id}`}>How confident were you?</strong><span>Your honest check tunes future active recall.</span></div></div>
              {confidenceSaved ? (
                <div className={`confidence-saved confidence-saved-${confidenceStatus}`} role="status">
                  <Check size={17} />
                  <span>{confidenceStatus === 'explicit' ? 'Explicit knowledge recorded' : 'Shaky recall recorded'} · +{earnedXp} XP{(confidenceStatus === 'shaky' || !isCorrect) ? ' · sent to review' : ' · marked as a mastered candidate'}</span>
                </div>
              ) : (
                <div className="confidence-buttons">
                  <button type="button" className="confidence-button confidence-explicit" onClick={() => onConfidenceSelect?.('explicit')}>
                    <span className="confidence-button-title">🎯 I Knew This Explicitly</span>
                    <small>+{baseXpEarned}{isCorrect ? ' XP · confident recall' : ' practice XP · still review'}</small>
                  </button>
                  <button type="button" className="confidence-button confidence-shaky" onClick={() => onConfidenceSelect?.('shaky')}>
                    <span className="confidence-button-title">🎲 I Guessed / Shaky Recall</span>
                    <small>+{halfXp}{isCorrect ? ' XP' : ' practice XP'} · mark for review</small>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="question-actions">
        <div className="lock-note"><LockKeyhole size={14} /> {requiresConfidence ? 'Choose confidence to continue' : isLocked ? 'Answer locked for this run' : 'One shot. Think it through.'}</div>
        <div className="action-buttons">
          <div className="difficulty-filter-control" role="group" aria-label="Question difficulty filter">
            <span title="This filter affects Randomize Next Question">Randomize target</span>
            <button type="button" className={difficultyFilter === 'all' ? 'difficulty-filter-active' : ''} onClick={() => onDifficultyFilterChange?.('all')} aria-pressed={difficultyFilter === 'all'}>All</button>
            <button type="button" className={difficultyFilter === 'hard' ? 'difficulty-filter-active' : ''} onClick={() => onDifficultyFilterChange?.('hard')} aria-pressed={difficultyFilter === 'hard'}>Hard / Snippets <small>{hardQuestionCount}</small></button>
          </div>
          <button type="button" className="math-generate-button" onClick={onGenerateMath} disabled={requiresConfidence}>✳ Generate math</button>
          {!isPotd && <button type="button" className="text-button" onClick={onReturnToPotd} disabled={requiresConfidence}>Return to POTD</button>}
          <button type="button" className={`randomize-button ${randomizing ? 'randomizing' : ''}`} onClick={onRandomize} disabled={requiresConfidence}>
            <span className="randomize-icon">⇄</span> Randomize Next Question
          </button>
        </div>
      </div>
    </section>
  );
}
