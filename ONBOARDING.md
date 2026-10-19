# DailyQuest first-run onboarding

## First sign-in flow

1. A first-time user sees the welcome screen and signs in with Google (or chooses device-only mode).
2. They choose an available companion from `src/data/pets.js`.
3. They choose a preferred in-app display name. This is independent of their Google profile name and can be edited later in Analytics → Edit profile.
4. They optionally choose topic interests and a daily question goal. The goal can be skipped, and the preferences can be edited later.

The profile is stored as `store.profile` in local storage and as `appProfile` in the signed-in user's Firestore `users/{uid}` document. It is merged along with the user's existing stats/history so onboarding does not replace XP, attempts, custom questions, or streak data.

## Bundled starter questions

`src/data/starterBanks.js` includes eight built-in categories with 50 MCQs each (400 total): DSA, SQL, DBMS, Networking, Operating Systems, Web Development, Cloud & DevOps, and Aptitude & Logical Reasoning. Each category has 6 Easy, 24 Medium, and 20 Medium-Hard questions. They are available immediately in the app and do not need a JSON import.

To regenerate the starter module after editing its bank source, run:

```bash
python scripts/generate_starter_banks.py
npm run test:logic
```

Question IDs are stable. If you edit existing questions, keep their IDs so attempts and active-recall history continue to refer to the same questions.
