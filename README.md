# Uttej's Daily Morning Engineering Warm-Up

A single-page React app for daily CS fundamentals practice, mental math, XP, streaks, solution walkthroughs, and a pixel companion.

## Features

- Bright, high-contrast responsive dashboard with neon-purple, lemon, cyan, turquoise, and coral accents, larger readable type, and stronger contrast for secondary labels.
- Quiz-first first screen: the greeting leads into a large question-and-options card with a large animated pixel companion beside it. The top bar is removed; account controls and the day-streak badge float at the upper-right while detailed XP, accuracy, weekly activity, and history sit below the challenge.
- Daily Problem of the Day (POTD) picked deterministically from the built-in question bank for the current local date.
- Interactive pixel companion with idle, correct-answer dance, and wrong-answer dizzy states. Companion level increases every 10 correct answers.
- Four-option question flow: answers lock for that run, the solution appears, and correct answers trigger confetti plus distinct synthesized chiptune sounds for first-time solves, repeat solves, wrong answers, randomize, math generation, and returning to POTD.
- Navigation actions automatically scroll to the top so the next question starts in view.
- XP and player level (100 XP per level), correct-answer count, accuracy, recent attempt history, and consecutive-day streak.
- Randomize Next Question preserves broad randomness and has a 30% active-recall branch. When it reviews history, questions whose latest attempt was incorrect have a 72% selection preference over questions most recently answered correctly. Previously generated math questions can also return for review.
- Generate Math selects random imported questions in Math, Quantitative Aptitude, Aptitude, Logical Reasoning, Word Problems, Data Interpretation, and related categories when available. Before you import that kind of bank, it falls back to procedural math (modulo/remainder, 2 × 2 determinants, arithmetic, and binary-to-hex). The importer includes a one-click four-question math/aptitude sample.
- JSON question importer with validation and preview. It distinguishes repeated IDs inside the pasted JSON from IDs already in your saved bank, skips exact re-imports, and lets you explicitly update saved custom questions while keeping their IDs stable.
- Progress export to a JSON file.
- Personalized greeting from the signed-in Google profile, account avatar, sign-out control, and visible sync status.
- Google sign-in through Firebase Authentication with browser-local auth persistence (stays signed in after reload/reopen) and account-specific per-user data.
- Cloud sync across devices for user profile, imported questions, complete attempt history, XP, streaks, POTD completion, and pet level. Each account has its own Firestore subcollections; rules restrict access to the matching authenticated UID.
- Per-account `localStorage` cache plus Firestore IndexedDB persistence for faster startup and offline-friendly reads. Failed cloud writes remain in the local cache and can be retried from the account chip or automatically when the browser reconnects. A local-only mode remains available when Firebase is not configured.
- Each time a question is shown—including an active-recall repeat—its answer choices are reshuffled, and the visible labels are reassigned to A–D. The immediately previous order is avoided. Stable underlying option IDs are preserved, so correct-answer checking and attempt history remain accurate.
- Solution annotation parser that safely renders `red(...)`, `blue(...)`, `green(...)`, `gold(...)`, and `code(...)`. Wrap a value in asterisks for bold, e.g. `green(*bold words*)`.

## 1. Requirements

- Node.js 18+ (Node.js 20+ recommended)
- npm
- A modern browser

## 2. Run locally

From this folder:

```bash
npm install
npm run dev
```

Vite prints a local address, usually `http://localhost:5173`. Open that URL in your browser.

Run the lightweight logic checks with:

```bash
npm run test:logic
```

Create a production build with:

```bash
npm run build
npm run preview
```

The production output is generated in `dist/` and can be deployed to any static host that supports a Vite SPA (for example, Netlify, Vercel, Cloudflare Pages, or GitHub Pages with the correct base path).

## 3. How the app records progress

Local-only mode stores a versioned document in browser `localStorage` under `uttej-engineering-warmup-v1`. After Google sign-in, the app instead uses a per-account local cache (`uttej-engineering-warmup-v1:user:<uid>`) and syncs the same data to Firestore. On first account sign-in, existing local-only progress is migrated to the first Google account that claims it; a local migration marker prevents that legacy cache from being imported into a different account later. The store contains:

- Each attempt's question ID, visible question text, a question snapshot (including generated math), selected response, correct answer ID, correctness, source, timestamp, local date, XP earned, category, repeat-solve status, and whether it was the POTD.
- Cumulative XP, total correct answers, active days, and dates on which the POTD was solved.
- The custom questions imported through the JSON tool.

When signed in and Firebase is configured correctly, the cloud is the cross-device source of truth. Reloads restore the persisted Google session and merge the account cloud state with its local cache. Signed-in users must use the same Google account on each device; each new browser/device needs one initial sign-in. Browser-local data is not shared between browsers, and clearing browser data may remove the local cache, but it does not delete cloud data.

The streak counts days with at least one correct answer. A player level is earned every 100 XP. The pet level increases at every 10 total correct answers. First-seen correct questions give 25 XP; a correct answer to any previously attempted question gives 5 XP; an incorrect answer also gives 5 practice XP. The app uses the question ID in saved history to determine repeat rewards.

## 4. Add your own questions

Open **Import questions** in the data/history section below the main challenge. Paste a JSON array and choose **Validate JSON**. Inspect the preview, then choose **Add questions** or **Add / Update questions**. Every ID must be unique within the pasted array. If an imported ID already exists with identical content, the importer safely skips it; if the same saved custom ID has changed content, the preview offers an update that preserves the ID for history and active recall. IDs that collide with built-in questions are rejected.

### Import math, aptitude, and logical-reasoning questions

Use the same importer—no separate database or file format is needed. Set each question's `category` to a useful category such as `Math`, `Quantitative Aptitude`, `Aptitude`, `Logical Reasoning`, `Word Problems`, or `Data Interpretation`. You can also add optional `topic` and `tags` metadata. Click **Load 4 math examples** inside the importer to see a valid sample and validate/import it. Once this bank is imported, **Generate Math** selects random questions from it (avoiding the question currently on screen when alternatives exist). If no matching questions have been imported yet, it creates a procedural mental-math question as a fallback.

You can paste a large array containing hundreds of questions, as long as every `id` is unique within that array. Example question shape:

```json
{
  "id": "aptitude_profit_001",
  "category": "Quantitative Aptitude",
  "topic": "Profit and Loss",
  "tags": ["percentages", "word problem"],
  "difficulty": "Applied",
  "question": "An item sells for ₹1,020 after a discount. Its cost price was ₹850. What is the profit percentage?",
  "options": [
    { "id": "A", "text": "15%" },
    { "id": "B", "text": "18%" },
    { "id": "C", "text": "20%" },
    { "id": "D", "text": "25%" }
  ],
  "correctAnswer": "C",
  "solution": "Profit = ₹1,020 − ₹850 = ₹170. Profit percentage = (170 / 850) × 100 = green(*20%*)."
}
```

Example:

```json
[
  {
    "id": "my_sql_001",
    "category": "SQL",
    "difficulty": "Challenge",
    "question": "Which clause filters grouped rows after aggregation?",
    "options": [
      { "id": "A", "text": "WHERE" },
      { "id": "B", "text": "HAVING" },
      { "id": "C", "text": "ORDER BY" },
      { "id": "D", "text": "LIMIT" }
    ],
    "correctAnswer": "B",
    "solution": "green(*HAVING*) filters groups after GROUP BY and aggregate calculations.",
    "takeaway": "WHERE filters rows; HAVING filters groups."
  }
]
```

`options` may also be a list of plain strings. `correctAnswer` can be an option ID (`"B"`) or the exact option text. `solution` and `takeaway` are optional. An optional `code` property displays a code block above the options.

Supported solution markers:

- `red(text)` or `red(*bold text*)`
- `blue(text)` or `blue(*bold text*)`
- `green(text)` or `green(*bold text*)`
- `gold(text)` or `gold(*bold text*)`
- `code(text)` for a dark inline code badge

The parser emits React nodes rather than using `dangerouslySetInnerHTML`, so imported solution strings are treated as text, not executable HTML.

## 5. Google sign-in and cloud sync setup (required for cross-device profiles)

The app code includes Google authentication, profile loading, two-way Firestore sync, a per-user local cache, real-time listeners, and first-sign-in migration. After the first account claims the old local-only cache, a recovery backup is retained locally and the shared guest slot is cleared to reduce the chance of progress appearing under another account on the same browser. **You must connect it to a Firebase project that you control** before Google sign-in works; I cannot create/configure resources inside your Google account from this source package.

### One-time Firebase setup

1. Open the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In **Project settings → General → Your apps**, register a Web app (`</>`). Copy the web configuration values.
3. In **Authentication → Sign-in method**, enable **Google** and select a support email.
4. In **Authentication → Settings → Authorized domains**, make sure `localhost` is present for development and add the exact domain where you deploy the app (for example your Netlify or Vercel domain).
5. In **Firestore Database**, create a database. Open its **Rules** tab, replace the rules with this project's `firestore.rules`, and publish them.
6. Copy `.env.example` to `.env.local` and fill in the Firebase web app values:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Then edit `.env.local` and fill `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, and `VITE_FIREBASE_MESSAGING_SENDER_ID`. `VITE_FIREBASE_STORAGE_BUCKET` is optional for this app. These values are available in the Firebase Web SDK config object.

7. Restart Vite after editing environment variables:

   ```bash
   npm install
   npm run dev
   ```

### Where user data lives

- `users/{uid}`: Google profile fields and the user's stats (XP, correct solves, active days, POTD dates).
- `users/{uid}/attempts/{attemptId}`: each attempt, correctness, selected answer, XP earned, timestamp, category and question snapshot for recall.
- `users/{uid}/customQuestions/{questionId}`: imported and updated questions belonging to that user.

The included security rules allow reads/writes only when the signed-in Firebase UID matches the user ID in the document path. Never replace these with open public rules. Firebase web config values are expected to be present in a client app; do not put Admin SDK credentials or other server secrets into `VITE_*` variables.

### Sign-in, browser cache, and devices

- Google sign-in uses Firebase's **local auth persistence**. In a normal browser, refreshes and browser restarts should not require sign-in again unless the user signs out, clears browser data, uses private browsing, or the browser blocks persistent storage.
- Firestore uses persistent IndexedDB cache where supported, with a fallback to the app's per-user `localStorage` cache if the browser cannot enable durable Firestore cache.
- Desktop and mobile work in modern browsers. Mobile user agents use Google's redirect sign-in flow; desktop browsers use popup sign-in with redirect fallback when the popup is blocked. Test the deployed hostname in Firebase Authorized domains.
- A user signs in once on each new device/browser, then cloud data (history, stats and imported question bank) loads from the same Google account. Local browser caches are device-specific, but they merge with cloud state and do not replace it with an empty store.
- Existing local-only progress is migrated into the first Google account that signs in, if no different account has claimed that legacy cache. The app also attempts to link older anonymous Firebase sessions to Google when possible.
- “Continue on this device only” leaves the app usable without account sync. In this mode, data stays in that browser and is not shared with other devices.

### Deployment notes

Deploy this as a Vite single-page app as usual. Set the same `VITE_FIREBASE_*` variables in your hosting provider's environment settings and rebuild/redeploy after changing them. Add the deployed hostname to Firebase Authentication's Authorized domains. Do not upload `.env.local` to a public repository (it is ignored by `.gitignore`).

## 6. Project structure

```text
src/
  App.jsx                    # Main state and answer workflow
  main.jsx                   # React entry point
  index.css                  # Tailwind layers + responsive visual system
  data/questions.js          # Built-in CS question bank
  components/
    PixelPet.jsx              # Pixel companion / mood animation
    QuestionCard.jsx          # MCQ, feedback, and explanation card
    SolutionRenderer.jsx      # Safe custom solution-markup parser
    StatsPanel.jsx            # XP, streak, activity, import/export
    JsonImportDrawer.jsx      # JSON validation, preview, and import
  lib/
    firebaseSync.js           # Google auth + per-user Firestore sync
    questionTools.js          # Math generation + JSON validation
    sounds.js                 # Synthesized chiptune cues via Web Audio
    storage.js                # localStorage read/write + export
    utils.js                  # Dates, streak, XP rules, active recall, POTD
scripts/
  smoke-test.mjs              # Reward and active-recall logic checks
```

## Notes

- The daily challenge is selected from the built-in bank using the local date, so refreshes on the same day preserve the POTD. The bank selection changes on a new local date.
- The question lock applies during one display/run. The daily POTD answer is restored after a refresh for that date, while navigation back to the POTD starts a new recall run; repeat-correct XP is still limited by the saved history.
- The small `scripts/smoke-test.mjs` script checks XP rewards and active-recall selection without requiring a browser.
- This is a client-only single-page app. It does not include a server-side account system or remote moderation for imported question content.
