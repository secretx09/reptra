import AsyncStorage from '@react-native-async-storage/async-storage';
import { RoutineWithExercises } from '../types/routine';

const TEMPLATE_WORKOUT_DRAFT_PREFIX = 'templateWorkoutDraft:';

export async function saveTemplateWorkoutDraft(draft: RoutineWithExercises) {
  try {
    await AsyncStorage.setItem(
      `${TEMPLATE_WORKOUT_DRAFT_PREFIX}${draft.id}`,
      JSON.stringify(draft)
    );
  } catch (error) {
    console.error('Failed to save template workout draft:', error);
  }
}

export async function loadTemplateWorkoutDraft(
  draftId: string
): Promise<RoutineWithExercises | null> {
  try {
    const data = await AsyncStorage.getItem(
      `${TEMPLATE_WORKOUT_DRAFT_PREFIX}${draftId}`
    );

    return data ? (JSON.parse(data) as RoutineWithExercises) : null;
  } catch (error) {
    console.error('Failed to load template workout draft:', error);
    return null;
  }
}

export function isTemplateWorkoutDraftId(id: string) {
  return id.startsWith('template-draft-');
}
