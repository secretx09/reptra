import { Exercise } from '../types/exercise';

export const exercises: Exercise[] = [
  {
    id: 'bench-press',
    name: 'Bench Press',
    muscleGroup: 'Chest',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Front Delts', 'Triceps'],
    equipment: 'Barbell',
    instructions: [
      'Lie flat on the bench.',
      'Grip the bar slightly wider than shoulder width.',
      'Lower the bar to your chest with control.',
      'Press the bar back up until your arms are extended.'
    ],
    commonMistakes: [
      'Bouncing the bar off the chest',
      'Flaring elbows too much',
      'Lifting feet off the floor'
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
    instructions: [
      'Place the bar across your upper back.',
      'Stand with feet about shoulder width apart.',
      'Lower by bending knees and hips together.',
      'Drive back up to standing.'
    ],
    commonMistakes: [
      'Knees collapsing inward',
      'Heels coming off the floor',
      'Rounding the lower back'
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
    instructions: [
      'Stand with feet under the bar.',
      'Grip the bar just outside your legs.',
      'Keep your chest up and back flat.',
      'Drive through the floor and stand tall.'
    ],
    commonMistakes: [
      'Rounding the back',
      'Jerking the bar off the floor',
      'Letting the bar drift away from the body'
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
    instructions: [
      'Hold the bar at shoulder height.',
      'Brace your core.',
      'Press the bar overhead in a straight path.',
      'Lower it back to the starting position with control.'
    ],
    commonMistakes: [
      'Overarching the lower back',
      'Pressing the bar too far forward',
      'Using too much leg drive'
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
    instructions: [
      'Hinge at the hips with a flat back.',
      'Hold the bar with arms extended.',
      'Pull the bar toward your lower chest or upper stomach.',
      'Lower it with control.'
    ],
    commonMistakes: [
      'Standing too upright',
      'Using too much momentum',
      'Rounding the upper back'
    ],
    isCustom: false,
  },
];
