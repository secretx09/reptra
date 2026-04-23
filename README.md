# Reptra

Reptra is a mobile fitness app built with React Native, Expo, TypeScript, and `expo-router`.

The app is focused on fast workout logging first: building routines, starting routine workouts, running empty workouts, tracking PRs, viewing workout history, and analyzing exercise progress. Longer term, Reptra is intended to grow into a more complete fitness platform with calorie tracking, progress media, cloud sync, and social features.

## Current State

Reptra is already a functional workout tracker with a strong local-first foundation.

### What Works Right Now

- Routine creation, editing, deletion, and reordering
- Mid-workout exercise adding for both routine workouts and empty workouts
- Empty workout flow with full logging and saving
- Set logging with weight, reps, notes, and completion checkmarks
- Smart first-set autofill from recent workout history
- Per-exercise rest timers with configurable defaults and in-session overrides
- Superset setup in routines and live superset flow in workout sessions
- Workout duration tracking
- Workout history with detail view and `Start Again` reuse flow
- PR tracking and estimated 1RM calculations
- Exercise detail pages with summary, history, and how-to tabs
- Exercise progress charts and recent-session stats
- Custom exercises
- Progress photo storage and profile previews
- Profile stats, weekly activity chart, and PR views
- Settings for units, theme, default rest timer, export/import, and reset

## Product Direction

Reptra is inspired by apps like Hevy for workout tracking, with future plans to bring in nutrition-style tracking ideas similar to MacrosFirst.

### Planned Direction

- Embedded demo GIFs and videos on exercise pages
- Post-workout photo attachment tied directly to workout history
- More advanced superset behavior and polish
- Additional progress analytics and charts
- Calorie and macro tracking
- Cloud sync and multi-device support
- User accounts, friends, and social features
- A real Home feed once the backend phase starts

## Tech Stack

- React Native
- Expo
- TypeScript
- `expo-router`
- AsyncStorage
- React Navigation
- Expo Vector Icons

## Project Structure

The app is organized around Expo Router routes and a local-storage architecture.

### Main Areas

- `app/(tabs)`
  Home, Workout, and Profile tabs
- `app/routine`
  Routine creation, editing, and detail flows
- `app/workout`
  Active workout sessions and workout history
- `app/exercise`
  Exercise library, detail pages, and custom exercise creation
- `app/profile`
  PRs, settings, progress photos, and related profile screens
- `storage`
  Local persistence for workouts, routines, settings, custom exercises, and progress photos
- `types`
  Shared TypeScript models for workout data, routines, settings, and exercises
- `utils`
  Formatting, calculations, charts, exercise loading, superset helpers, import/export helpers, and workout-history logic

## Data Model Notes

Reptra currently stores data locally with AsyncStorage.

Important architectural ideas in the app:

- workout sessions are saved separately from routines
- UI state is kept separate from saved data
- routines and workouts have distinct storage layers
- settings, custom exercises, and progress photos are also stored independently

This makes it easier to keep iterating locally now and later migrate to a backend without rewriting the entire app shape.

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

## Current Priorities

The project is now in a refinement and advanced-features stage rather than initial scaffolding.

Current priorities are:

- continuing workout-system polish
- expanding superset support
- improving exercise detail and progress views
- improving workout reuse and history tools
- polishing the overall mobile experience across iPhone and Android

## Backend Note

Reptra does not use a backend yet.

Current storage is fully local. Account systems, cloud sync, social features, and cross-device data are planned for a later phase once the local product foundation is complete.
