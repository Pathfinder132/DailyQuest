# DailyQuest question-selection behavior

- **Random bank:** The selector considers the full de-duplicated question bank, not a slice from the beginning. It also makes answered generated-math question snapshots eligible for later recall.
- **Recency cooldown:** A question normally cannot be selected again if it was among the last **25 distinct previously displayed questions**. The current question is always excluded from alternatives.
- **Small-bank fallback:** If the cooldown leaves no candidates, the oldest cooldown exclusions are relaxed until at least one alternative exists. A one-question bank has to repeat its only question.
- **Active recall:** When an eligible previously attempted question exists, there is a 10% active-recall branch. Among eligible review questions, the latest-incorrect pool receives 72% of the branch and the latest-correct pool receives 28%, when both pools are available. The other 90% is a uniform random pick from the fresh candidates.
- **Latest result:** For each question, the most recent attempt is determined chronologically by its timestamp rather than relying on array order.
- **Math / aptitude:** `Generate Math` uses the same recent-question cooldown across imported math, aptitude, logical-reasoning, and word-problem candidates. If no imported math-bank question is available, the existing procedural generator remains the fallback.
- **Persistence:** A compact display trail is kept with profile stats (last 40 display events), merged and deduplicated across local/cloud state, and synced to the signed-in user's Firestore profile. These entries record question IDs and timestamps, not answer text.

Randomness is probabilistic rather than a guaranteed round-robin. The cooldown reduces accidental clusters without forcing every question to appear in a fixed order.

- **Confidence auto-advance:** After a confidence choice finalizes the attempt and one-time XP, DailyQuest immediately picks and presents the next question using the updated history, difficulty filter, review flags, and recency cooldown.
- **Player level:** The Home header shows the account-level badge immediately left of Sign out; it updates reactively from saved XP and is separate from the pet level.
