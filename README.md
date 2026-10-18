# DailyQuest ⚡

A colorful daily practice app for sharpening computer science fundamentals, mental maths, quantitative aptitude, and logical reasoning — one question at a time.

Meet your pixel companion, solve a quick challenge, review the explanation, and build a consistent learning habit.

## Features

- **Daily challenge:** Practice CS concepts with multiple-choice questions and explanations.
- **Math & aptitude practice:** Generate quick calculations or import your own question bank.
- **Active recall:** Previously seen questions may return, with extra attention to questions you missed.
- **Game-like feedback:** Earn XP, build streaks, level up your pixel companion, and enjoy sound and confetti effects.
- **Personal question banks:** Import questions from JSON and export your progress.
- **Google sign-in:** Keep your profile, question history, progress, and imported questions synced with Firebase across devices.
- **Responsive design:** Use the app on desktop, tablet, or mobile.

## Getting Started

You'll need [Node.js](https://nodejs.org/) and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Firebase Setup

Google sign-in and cross-device sync require a Firebase project.

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Google** in Authentication and create a Firestore database.
3. Copy `.env.example` to `.env.local` and fill in your Firebase web app configuration.
4. Publish the included `firestore.rules` in your Firebase project's Firestore Rules tab.
5. Add `localhost` and your deployed site's domain to Firebase Authentication's **Authorized domains**.
6. Restart the dev server after changing environment variables.

Without Firebase configuration, you can use the app in local-only mode. Never commit `.env.local` or private service-account credentials.

## Importing Questions

Use **Import Questions** in the app to paste a JSON array. Every question needs a unique `id`, a `category`, a `question`, four `options`, and a `correctAnswer`. A `solution` is recommended so you can review the reasoning after answering.

The same importer supports computer science, quantitative aptitude, logical reasoning, word problems, and other categories. The **Generate Math** action uses matching questions from your imported bank when available.

## Useful Commands

```bash
npm run dev          # Start the development server
npm run test:logic   # Run logic checks
npm run build        # Create a production build
npm run preview      # Preview the production build locally
```

## Built With

React · Vite · Tailwind CSS · Lucide · Canvas Confetti · Firebase Authentication · Cloud Firestore

---

Made for small daily wins and a sharper engineering mindset. 🚀
