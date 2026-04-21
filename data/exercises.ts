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
      'Grip the bar slightly wider than shoulder width.',
      'Lower the bar to your chest with control.',
      'Press the bar back up until your arms are extended.'
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
      'Place the bar across your upper back.',
      'Stand with feet about shoulder width apart.',
      'Lower by bending knees and hips together.',
      'Drive back up to standing.'
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
      'Stand with feet under the bar.',
      'Grip the bar just outside your legs.',
      'Keep your chest up and back flat.',
      'Drive through the floor and stand tall.'
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
      'Hold the bar at shoulder height.',
      'Brace your core.',
      'Press the bar overhead in a straight path.',
      'Lower it back to the starting position with control.'
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
      'Hinge at the hips with a flat back.',
      'Hold the bar with arms extended.',
      'Pull the bar toward your lower chest or upper stomach.',
      'Lower it with control.'
    ],
    isCustom: false,
  },
];
