# Reptra

Reptra is a mobile fitness app built with React Native, Expo, TypeScript, and `expo-router`.

The app is focused on fast workout logging first: building routines, starting routine workouts, running empty workouts, tracking PRs, reviewing workout history, and seeing progress over time. Longer term, Reptra is intended to grow into a fuller fitness platform with cloud sync, progress media, nutrition tracking, friends, and a social feed.

## Current State

Reptra is already a functional local-first workout tracker with early Supabase account and cloud-sync groundwork.

### What Works Right Now

- Routine creation, editing, deletion, pinning, templates, categories, and reordering
- Empty workout flow with full logging and saving
- Routine workout flow with full logging and saving
- Mid-workout exercise adding for routine and empty workouts
- Set logging with weight, reps, notes, and completion checkmarks
- Smart set autofill from recent workout history
- Per-exercise rest timers with configurable defaults and in-session overrides
- Superset setup in routines and live superset flow in workout sessions
- Workout duration tracking
- Workout history with details, editing, deleting, adding exercises, adding sets, and `Start Again`
- Workout summaries with naming, notes, PR highlights, progress photos, and sharing
- Local feed preview with workout captions and visibility settings
- PR tracking and estimated 1RM calculations
- Exercise library with search, filters, favorites, and detail pages
- Exercise detail pages with summary, history, progress metrics, and instructions
- Custom exercises with demo metadata support
- Progress photo storage and profile previews
- Profile stats, weekly chart, milestones, PR views, and workout history access
- Training split planning for days like legs, upper body, core, rest, and custom categories
- Settings for units, theme, default rest timer, export/import, data reset, and cloud tools
- Supabase account setup, sign in/sign up, profile fields, cloud backup, cloud restore, and cloud record viewing

## Product Direction

Reptra is inspired by apps like Hevy for workout tracking, with future plans to bring in nutrition-style tracking ideas similar to MacrosFirst.

### Planned Direction

- Real installed-app auth redirects and better production account flow
- More reliable cloud sync and conflict handling
- Friends, profiles, and a true social Home feed
- Embedded demo GIFs or videos on exercise pages
- Post-workout camera/photo attachment instead of manual URI entry
- More advanced charts for strength, volume, body progress, and consistency
- Calorie, macro, and nutrition tracking
- Username-based account lookup and social search
- Push-style reminders and smarter workout scheduling

## Tech Stack

- React Native
- Expo
- TypeScript
- `expo-router`
- AsyncStorage
- Supabase
- React Navigation
- Expo Vector Icons

## Project Structure

The app is organized around Expo Router routes and a separated local-storage architecture.

### Main Areas

- `app/(tabs)`
  Home, Workout, and Profile tabs
- `app/routine`
  Routine creation, editing, templates, preview, and detail flows
- `app/workout`
  Active workout sessions, training split planning, summaries, and workout history
- `app/exercise`
  Exercise library, detail pages, custom exercise creation, and custom exercise editing
- `app/profile`
  PRs, settings, import/export, progress photos, and workout history
- `app/account`
  Supabase setup, account management, cloud backup/restore, and cloud record viewing
- `storage`
  Local persistence for workouts, routines, settings, custom exercises, photos, favorites, training split, and cloud sync status
- `services`
  Supabase, auth, cloud backup, cloud restore, and cloud profile helpers
- `types`
  Shared TypeScript models for workout data, routines, settings, exercises, cloud sync, photos, and training split
- `utils`
  Formatting, calculations, charts, exercise loading, superset helpers, import/export helpers, unit conversion, and workout-history logic
- `supabase`
  SQL schema and auth redirect setup notes

## Data Model Notes

Reptra is local-first. AsyncStorage is still the main source of truth for everyday app usage, while Supabase is being added as an account/cloud layer.

Important architectural ideas in the app:

- workout sessions are saved separately from routines
- UI state is kept separate from saved data
- routines and workouts have distinct storage layers
- settings, custom exercises, training split, progress photos, and favorites are stored independently
- cloud backup stores local records in Supabase without replacing the local-first structure
- workout weights remember their original unit so switching between pounds and kilograms converts history correctly

This makes it easier to keep iterating quickly now and later move toward real multi-device sync without rewriting the whole app.

## Supabase Setup

Supabase is optional while developing locally, but account and cloud tools require these environment variables in `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

After changing `.env`, restart Expo.

The SQL setup lives in:

```bash
supabase/schema.sql
```

Auth redirect notes live in:

```bash
supabase/auth-redirects.md
```

## Running the App

### Install dependencies

```bash
npm install
```

### Start the Expo dev server

```bash
npm start
```

### Run on Android

```bash
npm run android
```

### Run on iOS

```bash
npm run ios
```

### Run on web

```bash
npm run web
```

## Available Scripts

- `npm start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run lint`

## Design Goals

- Dark theme
- Clean, modern UI
- Rounded cards
- Blue accent color (`#4da6ff`)
- Minimal clutter
- Smooth workout logging flow
- Mobile-first layouts that work well on iPhone and Android

## Current Priorities

The project is now in a refinement, polish, and advanced-features stage.

Current priorities are:

- continuing workout-system polish
- improving Home into a useful feed/dashboard
- expanding training planning and goals
- improving cloud sync safety
- polishing account/profile groundwork for future social features
- improving exercise detail, charts, media, and progress views

## Backend Note

Reptra has started the backend phase with Supabase, but the app is still intentionally local-first.

AsyncStorage remains the primary day-to-day storage layer right now. Supabase currently supports account setup, cloud backup, cloud restore, cloud record viewing, and profile fields. Real-time multi-device sync, friends, public profiles, and social feed posting are still future work.
