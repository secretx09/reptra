export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  focus: string;
  exerciseIds: string[];
}

export const routineTemplates: RoutineTemplate[] = [
  {
    id: 'push',
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps with simple strength defaults.',
    focus: 'Chest + Shoulders + Triceps',
    exerciseIds: [
      'bench-press',
      'overhead-press',
      'dumbbell-bench-press-incline',
      'lateral-raise',
      'tricep-pushdown-rope',
    ],
  },
  {
    id: 'pull',
    name: 'Pull Day',
    description: 'Back and biceps with rows, pulldowns, and curls.',
    focus: 'Back + Biceps',
    exerciseIds: [
      'deadlift',
      'barbell-row',
      'lat-pulldown-wide',
      'seated-cable-row',
      'barbell-curl',
    ],
  },
  {
    id: 'legs',
    name: 'Leg Day',
    description: 'Squat-focused lower body session with posterior chain work.',
    focus: 'Quads + Glutes + Hamstrings',
    exerciseIds: [
      'squat',
      'romanian-deadlift',
      'leg-press',
      'nordic-curl',
      'standing-calf-raise',
    ],
  },
  {
    id: 'upper',
    name: 'Upper Body',
    description: 'Balanced upper session for chest, back, shoulders, and arms.',
    focus: 'Upper Body',
    exerciseIds: [
      'bench-press',
      'barbell-row',
      'overhead-press',
      'lat-pulldown-wide',
      'tricep-pushdown-rope',
      'barbell-curl',
    ],
  },
  {
    id: 'lower',
    name: 'Lower Body',
    description: 'Lower-body session with squat, hinge, and calf work.',
    focus: 'Lower Body',
    exerciseIds: [
      'squat',
      'romanian-deadlift',
      'walking-lunge',
      'leg-extension',
      'seated-calf-raise',
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body',
    description: 'A simple full-body starter routine for general training days.',
    focus: 'Full Body',
    exerciseIds: [
      'squat',
      'bench-press',
      'barbell-row',
      'overhead-press',
      'romanian-deadlift',
    ],
  },
];
