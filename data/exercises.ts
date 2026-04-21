import { Exercise } from '../types/exercise';

export const exercises: Exercise[] = [
  {
    id: 'bench-press',
    name: 'Bench Press',
    muscleGroup: 'Chest',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Front Delts', 'Triceps'],
    equipment: 'Barbell',
    demoMedia: {
      type: 'video',
      url: 'https://www.youtube.com/results?search_query=bench+press+proper+form',
      title: 'Bench Press Form Demo',
      sourceLabel: 'YouTube',
    },
    instructions: [
      'Lie flat on the bench.',
      'Grip the bar slightly wider than shoulder width',
      'Lower the bar to your chest with control',
      'Press the bar back up until your arms are extended'
    ],
    isCustom: false,
  },
  {
    id: 'squat',
    name: 'Squat',
    muscleGroup: 'Legs',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    equipment: 'Barbell',
    demoMedia: {
      type: 'video',
      url: 'https://www.youtube.com/results?search_query=barbell+squat+proper+form',
      title: 'Squat Form Demo',
      sourceLabel: 'YouTube',
    },
    instructions: [
      'Place the bar across your upper back',
      'Stand with feet about shoulder width apart',
      'Lower by bending knees and hips together',
      'Drive back up to standing'
    ],
    isCustom: false,
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    muscleGroup: 'Back',
    primaryMuscles: ['Posterior Chain', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Upper Back', 'Forearms'],
    equipment: 'Barbell',
    demoMedia: {
      type: 'video',
      url: 'https://www.youtube.com/results?search_query=barbell+deadlift+proper+form',
      title: 'Deadlift Form Demo',
      sourceLabel: 'YouTube',
    },
    instructions: [
      'Stand with feet under the bar',
      'Grip the bar just outside your legs',
      'Keep your chest up and back flat',
      'Drive through the floor and stand tall'
    ],
    isCustom: false,
  },
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    muscleGroup: 'Shoulders',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Triceps', 'Upper Chest', 'Core'],
    equipment: 'Barbell',
    demoMedia: {
      type: 'video',
      url: 'https://www.youtube.com/results?search_query=overhead+press+proper+form',
      title: 'Overhead Press Form Demo',
      sourceLabel: 'YouTube',
    },
    instructions: [
      'Hold the bar at shoulder height',
      'Brace your core',
      'Press the bar overhead in a straight path',
      'Lower it back to the starting position with control'
    ],
    isCustom: false,
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    muscleGroup: 'Back',
    primaryMuscles: ['Lats', 'Mid Back'],
    secondaryMuscles: ['Rear Delts', 'Biceps', 'Forearms'],
    equipment: 'Barbell',
    demoMedia: {
      type: 'video',
      url: 'https://www.youtube.com/results?search_query=barbell+row+proper+form',
      title: 'Barbell Row Form Demo',
      sourceLabel: 'YouTube',
    },
    instructions: [
      'Hinge at the hips with a flat back',
      'Hold the bar with arms extended',
      'Pull the bar toward your lower chest or upper stomach',
      'Lower it with control'
    ],
    isCustom: false,
  },
  {
    id: 'bench-press-incline',
    name: 'Bench Press (Incline)',
    muscleGroup: 'Chest',
    primaryMuscles: ['Upper Chest'],
    secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Barbell',
    demoMedia: {
      type: 'video',
      url: 'https://www.youtube.com/results?search_query=bench+press+incline+proper+form',
      title: 'Bench Press (Incline) Form Demo',
      sourceLabel: 'YouTube',
    },
    instructions: [
      'Set bench to a 30-45 degree incline',
      'Grip the bar slightly wider than shoulder width',
      'Lower the bar to your upper chest with control',
      'Press the bar back up until your arms are extended'
    ],
    isCustom: false,
  },
  {
    id: 'bench-press-decline',
    name: 'Bench Press (Decline)',
    muscleGroup: 'Chest',
    primaryMuscles: ['Lower Chest'],
    secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Barbell',
    demoMedia: {
      type: 'video',
      url: 'https://www.youtube.com/results?search_query=bench+press+decline+proper+form',
      title: 'Bench Press (Decline) Form Demo',
      sourceLabel: 'YouTube',
    },
    instructions: [
      'Set bench to a 30-45 degree decline',
      'Grip the bar slightly wider than shoulder width',
      'Lower bar to lower chest',
      'Press upward until arms are extended'
    ],
    isCustom: false,
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close-Grip Bench Press',
    muscleGroup: 'Chest',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: ['Chest', 'Front Delts'],
    equipment: 'Barbell',
    demoMedia: {
      type: 'video',
      url: 'https://www.youtube.com/results?search_query=close+grip+bench+press+proper+form',
      title: 'Close-Grip Bench Press Form Demo',
      sourceLabel: 'YouTube',
    },
    instructions: [
      'Grip bar shoulder-width or closer',
      'Lower bar to chest',
      'Keep elbows tucked',
      'Press upward focusing on triceps'
    ],
    isCustom: false,
  },
  {
    id: 'wide-grip-bench-press',
    name: 'Wide-Grip Bench Press',
    muscleGroup: 'Chest',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders'],
    equipment: 'Barbell',
    demoMedia: {
      type: 'video',
      url: 'https://www.youtube.com/results?search_query=wide+grip+bench+press+proper+form',
      title: 'Wide-Grip Bench Press Form Demo',
      sourceLabel: 'YouTube',
    },
    instructions: [
      'Take a wider-than-normal grip on the bar',
      'Lower bar slowly to your chest',
      'Press upward, focusing on chest contraction'
    ],
    isCustom: false,
  },
  {
    id: 'reverse-grip-bench-press',
    name: 'Reverse-Grip Bench Press',
    muscleGroup: 'Chest',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps'],
    equipment: 'Barbell',
    demoMedia: {
      type: 'video',
      url: 'https://www.youtube.com/results?search_query=reverse+grip+bench+press+proper+form',
      title: 'Reverse-Grip Bench Press Form Demo',
      sourceLabel: 'YouTube',
    },
    instructions: [
      'Use underhand grip on the bar',
      'Lower bar carefully to chest',
      'Press upward while keeping control'
    ],
    isCustom: false,
  },
  {
    id: 'paused-bench-press',
    name: 'Paused Bench Press',
    muscleGroup: 'Chest',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps'],
    equipment: 'Barbell',
    demoMedia: {
      type: 'video',
      url: 'https://www.youtube.com/results?search_query=paused+bench+press+proper+form',
      title: 'Paused Bench Press Form Demo',
      sourceLabel: 'YouTube',
    },
    instructions: [
      'Lower bar to chest',
      'Pause for 1-2 seconds',
      'Press upward explosively'
    ],
    isCustom: false,
  },
  {
    id: 'floor-press',
    name: 'Floor press',
    muscleGroup: 'Chest',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps'],
    equipment: 'Barbell',
    demoMedia: {
      type: 'video',
      url: 'https://www.youtube.com/results?search_query=floor+press+proper+form',
      title: 'Floor Press Form Demo',
      sourceLabel: 'YouTube',
    },
    instructions: [
      'Lie on the floor under the bar',
      'Lower bar until elbows touch the floor',
      'Press upward from a dead stop'
    ],
    isCustom: false,
  },
  {
    id: 'pin-press',
    name: 'Pin Press',
    muscleGroup: 'Chest',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps'],
    equipment: 'Barbell',
    demoMedia: {
      type: 'video',
      url: 'https://www.youtube.com/results?search_query=pin+press+proper+form',
      title: 'Pin Press Form Demo',
      sourceLabel: 'YouTube',
    },
    instructions: [
      'Set safety pins at chest height',
      'Start bar on pins',
      'Press upward from dead stop'
    ],
    isCustom: false,
  },
];
