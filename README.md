# Reptra

Reptra is a workout tracking app I am building with React Native and Expo.  
The goal is to make an app where users can track workouts, create routines, log sets, reps, weight, and notes, save workout history, track PRs, estimate 1RM, and more.

---

## Before Starting

Before I even started building the app, I needed to install the tools required for React Native and Expo development.

## What I Needed to Download

- VS Code
- Git
- Node.js LTS
- Android Studio

## What Each One Is For

- **VS Code** - code editor  
- **Git** - version control  
- **Node.js** - installs npm and lets me run JavaScript tools  
- **Android Studio** - Android emulator for testing the app  

---

## Installation Setup

### 1. Check Node and npm

After installing Node.js, I opened Command Prompt and ran:

    node -v
    npm -v

This should print the installed versions of Node.js and npm.

---

### 2. Create the Expo app

I went to the folder where I wanted my project to be stored:

    cd C:\workout app

Then I created the project:

    npx create-expo-app reptra


---

### 3. Open the project

After the project was created, I opened it in VS Code and moved into the project folder:

    cd reptra

---

### 4. Start the development server

To run the project, I used:

    npx expo start

This starts the Expo development server.

---

## Emulator Setup

To test the app on Android, I used Android Studio.

### Steps

1. Open Android Studio  
2. Go to Device Manager  
3. Create or choose an emulator  
4. Start the emulator  
5. In the Expo terminal press:

    a

This opens the app on the emulator.

---

## PowerShell Fix

If scripts are blocked, run:

    Set-ExecutionPolicy RemoteSigned

---

## Additional Package

Later I installed Async Storage:

    npx expo install @react-native-async-storage/async-storage

---

## Full Command List

    node -v
    npm -v
    cd C:\workout app
    npx create-expo-app reptra
    cd reptra
    npx expo start

If PowerShell blocks scripts:

    Set-ExecutionPolicy RemoteSigned

Later:

    npx expo install @react-native-async-storage/async-storage

---

## Tech Stack

- React Native  
- Expo  
- JavaScript / TypeScript  
- VS Code  
- Git  
- Android Studio  

---

## Project Goal

Reptra is being built to include:

- exercise library  
- routine creator  
- workout tracking  
- sets, reps, weights, and notes  
- workout history  
- personal records  
- estimated one rep max  
- workout streaks  
- reminders  
- progress charts  
- settings  

---

## Notes

This project started as a standard Expo app, and I am gradually replacing the starter code with my own structure, screens, components, and workout logic.