import { ExercisePR, SavedWorkoutSession } from '../types/workout';

export interface ProfileMilestone {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: string;
}

export function calculateProfileMilestones(
  workouts: SavedWorkoutSession[],
  prs: ExercisePR[],
  currentStreak: number
): ProfileMilestone[] {
  const totalSets = workouts.reduce(
    (sum, workout) =>
      sum +
      workout.exercises.reduce(
        (exerciseSum, exercise) => exerciseSum + exercise.sets.length,
        0
      ),
    0
  );
  const uniqueExerciseIds = new Set(
    workouts.flatMap((workout) =>
      workout.exercises.map((exercise) => exercise.exerciseId)
    )
  );
  const routineWorkouts = workouts.filter((workout) => workout.routineId).length;
  const emptyWorkouts = workouts.filter((workout) => !workout.routineId).length;

  return [
    {
      id: 'first-workout',
      title: 'First Log',
      description: 'Complete your first workout.',
      unlocked: workouts.length >= 1,
      progress: `${Math.min(workouts.length, 1)}/1`,
    },
    {
      id: 'ten-workouts',
      title: 'Locked In',
      description: 'Complete 10 workouts.',
      unlocked: workouts.length >= 10,
      progress: `${Math.min(workouts.length, 10)}/10`,
    },
    {
      id: 'hundred-sets',
      title: 'Volume Builder',
      description: 'Log 100 total sets.',
      unlocked: totalSets >= 100,
      progress: `${Math.min(totalSets, 100)}/100`,
    },
    {
      id: 'five-prs',
      title: 'PR Hunter',
      description: 'Record PRs on 5 exercises.',
      unlocked: prs.length >= 5,
      progress: `${Math.min(prs.length, 5)}/5`,
    },
    {
      id: 'three-day-streak',
      title: 'Streak Starter',
      description: 'Train for a 3-day streak.',
      unlocked: currentStreak >= 3,
      progress: `${Math.min(currentStreak, 3)}/3`,
    },
    {
      id: 'exercise-explorer',
      title: 'Exercise Explorer',
      description: 'Log 15 different exercises.',
      unlocked: uniqueExerciseIds.size >= 15,
      progress: `${Math.min(uniqueExerciseIds.size, 15)}/15`,
    },
    {
      id: 'routine-and-empty',
      title: 'Flexible Training',
      description: 'Complete both routine and empty workouts.',
      unlocked: routineWorkouts > 0 && emptyWorkouts > 0,
      progress: `${Number(routineWorkouts > 0) + Number(emptyWorkouts > 0)}/2`,
    },
  ];
}
