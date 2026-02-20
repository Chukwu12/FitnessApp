# KC-FitnessApp – Copilot Instructions

This repository contains a small but multi-part Expo/React Native application backed by a
Sanity CMS and a tiny Express server.  The goal of an AI agent working here is to move
quickly by understanding how the pieces fit together, where to look for data, and how
developers ordinarily run/build/modify the project.

---
## Big picture / architecture

1. **Mobile/Web app** – lives under `src/`.  It is an Expo Router project written in
   TypeScript/TSX.  Tailwind classes (via Nativewind) style the UI.  Authentication is
   handled by Clerk (`@clerk/clerk-expo`).  Global state uses a persisted Zustand store
   (`src/store/workout-store.ts`).

2. **Sanity content studio** – a standalone project in the `sanity/` folder.  Schemas
   for `exercise` and `workout` live under `sanity/schemaTypes`.  The studio is used for
   editing exercise data and is also the source of truth for the front end.  Queries
   from the app use GROQ.

3. **Backend** – a minimal Express server in `backend/server.js` that exposes three
   routes:
   - `/api/ai` uses the OpenAI SDK to generate exercise instructions.
   - `/api/gifs` proxies RapidAPI gif URLs (exercise database).
   - `/api/delete-workout` (simple cleanup endpoint).
   A handful of maintenance scripts (`backend/scripts/*.ts`) manipulate the Sanity dataset
   (e.g. fill missing IDs, update gif URLs).  These are run with `ts-node`.

Data flows:
- App → Sanity client (`src/lib/sanity.ts`) for read-only queries.
- App → backend using `EXPO_PUBLIC_BACKEND_URL` (set in `.env`) for AI/gif guidance.
- Backend scripts call the same Sanity client to patch documents.

Path alias `@/` maps to `src/` per `tsconfig.json`.

---
## Key developer workflows

### Setup
```sh
# install root deps
npm install
# install studio deps (only once)
cd sanity && npm install
```

### Running
```sh
# start expo dev server (web/android/ios)
npm run start      # or `expo start`
npm run android     # open on emulator/device
npm run ios
npm run web

# run backend (separate shell)
node backend/server.js
# or: npx ts-node backend/server.js during dev

# run Sanity studio
cd sanity && npm run dev
```

### Scripts & maintenance
- `npx ts-node backend/scripts/autoFillExerciseIds.ts`
- `npx ts-node backend/scripts/updateExerciseGifs.ts`
- Other scripts in `backend/scripts` follow the same pattern.

### Type generation
Sanity types are regenerated when you change schemas:
```sh
cd sanity && npm run typegen
```
The generated types land at `src/lib/sanity/types.ts` (see `sanity.cli.ts`).

### Builds & deployment
- Expo mobile/web: use EAS commands (`npx eas-cli deploy` for web, `eas build` for iOS/Android).
- Backend may be deployed separately; remember to set `OPENAI_API_KEY` and other server-only
  vars.  Update `EXPO_PUBLIC_BACKEND_URL` accordingly.

---
## Project-specific conventions

- **Routing:** `src/app/` mirrors Expo Router's filesystem routing; group folders with
  parentheses (`(tabs)`, `(app)`) are used for layout grouping.  `_layout.tsx` files
  define shared UI.  Look at existing files for examples of nested layouts.

- **State store:** see `src/store/workout-store.ts`.  The store persists to AsyncStorage
  on native and localStorage on web using a safe wrapper.  Every action guards
  `hasHydrated` on web to avoid hydration mismatches.  When you add new state/fields,
  update the `partialize` option.

- **Sanity queries:** use `defineQuery` from `groq` at the top of a component file
  (`export const getWorkoutsQuery = defineQuery(`...).  Import types from
  `@/lib/sanity/types` so that results are typed.  Only fetch fields needed by the UI.

- **Sanity client:** import from `@/lib/sanity` (there is a comment in
  `ExerciseSelectionModal.tsx` showing an alternative path).  Always use the same
  client instance to avoid duplication.

- **Environment variables:**
  - Prefix `EXPO_PUBLIC_` for values the client must see (Clerk key, Sanity project id,
    RapidAPI key, backend URL).
  - Server-only secrets (e.g. `OPENAI_API_KEY`) should not be published; they are read
    by the Express server or by Sanity scripts.
  - The root `.env` file is used by both Expo and backend.  `app.json` also includes
    some sanity values for EAS builds.

- **Styling:** Tailwind classes appear in JSX via Nativewind.  Tailwind config is in
  `tailwind.config.js`; global styles live in `src/global.css`.

- **Comments:** many components include ✅ checklists or explanatory notes.  Use these as
  guidance when copying/pasting components or modifying logic.

- **Backend routes:** located in `backend/scripts/routes/*.js`; mounted in
  `backend/server.js`.  If you add a new route, export an Express router and register it
  in `server.js`.  The server binds to `0.0.0.0` for CodeSandbox compatibility and uses
  a CORS whitelist defined there.

- **External APIs:**
  - RapidAPI exercise database for gifs (`getExerciseGif` util, or `/api/gifs` server
    proxy).
  - OpenAI's `gpt-4o-mini` model accessed server‑side.

---
## Useful file references

| Purpose | Example files |
|---------|---------------|
| Main layout & routing | `src/app/_layout.tsx` and `(tabs)` subfolders |
| Sanity client/types | `src/lib/sanity.ts`, `src/lib/sanity/types.ts` |
| Store logic | `src/store/workout-store.ts` |
| Exercise selection UI | `src/app/(app)/components/ExerciseSelectionModal.tsx` |
| Backend server | `backend/server.js`, `backend/scripts/routes/ai.js` |
| Sanity schema | `sanity/schemaTypes/exercise.ts` |

---

Feel free to ask for clarification if any of the above is incomplete or ambiguous.