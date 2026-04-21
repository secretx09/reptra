import { RoutineExerciseWithDefaults } from '../types/routine';

export interface SupersetDisplayMeta {
  label: string;
  position: number;
  size: number;
  slotLabel: string;
  groupLabel: string;
}

export interface SupersetBlock {
  id: string;
  label: string;
  exercises: RoutineExerciseWithDefaults[];
}

const getGroupSizes = (exercises: RoutineExerciseWithDefaults[]) => {
  const sizes: Record<string, number> = {};

  exercises.forEach((exercise) => {
    if (!exercise.supersetGroupId) return;

    sizes[exercise.supersetGroupId] =
      (sizes[exercise.supersetGroupId] || 0) + 1;
  });

  return sizes;
};

export const normalizeSupersetExercises = (
  exercises: RoutineExerciseWithDefaults[]
) => {
  const normalized = exercises.map((exercise) => ({
    ...exercise,
    supersetGroupId: exercise.supersetGroupId || null,
  }));

  const activeGroups = getGroupSizes(normalized);

  normalized.forEach((exercise) => {
    if (
      exercise.supersetGroupId &&
      (activeGroups[exercise.supersetGroupId] || 0) < 2
    ) {
      exercise.supersetGroupId = null;
    }
  });

  for (let index = 0; index < normalized.length; index += 1) {
    const currentGroupId = normalized[index].supersetGroupId;

    if (!currentGroupId) continue;

    if (index > 0 && normalized[index - 1].supersetGroupId !== currentGroupId) {
      let scanIndex = index;

      while (
        scanIndex < normalized.length &&
        normalized[scanIndex].supersetGroupId === currentGroupId
      ) {
        scanIndex += 1;
      }

      if (scanIndex - index < 2) {
        for (let clearIndex = index; clearIndex < scanIndex; clearIndex += 1) {
          normalized[clearIndex].supersetGroupId = null;
        }
      }
    }
  }

  return normalized;
};

export const toggleSupersetWithPrevious = (
  exercises: RoutineExerciseWithDefaults[],
  index: number
) => {
  if (index <= 0 || index >= exercises.length) {
    return exercises;
  }

  const updated = exercises.map((exercise) => ({ ...exercise }));
  const previousExercise = updated[index - 1];
  const currentExercise = updated[index];
  const sharedGroupId =
    previousExercise.supersetGroupId || `superset-${Date.now()}-${index}`;

  const isAlreadySuperset =
    !!currentExercise.supersetGroupId &&
    currentExercise.supersetGroupId === previousExercise.supersetGroupId;

  if (isAlreadySuperset) {
    currentExercise.supersetGroupId = null;
  } else {
    previousExercise.supersetGroupId = sharedGroupId;
    currentExercise.supersetGroupId = sharedGroupId;
  }

  return normalizeSupersetExercises(updated);
};

export const getSupersetDisplayMap = (
  exercises: RoutineExerciseWithDefaults[]
) => {
  const normalizedExercises = normalizeSupersetExercises(exercises);
  const labelsByGroupId: Record<string, string> = {};
  const positionByGroupId: Record<string, number> = {};
  const displayMap: Record<string, SupersetDisplayMeta> = {};
  let groupCount = 0;

  normalizedExercises.forEach((exercise) => {
    const groupId = exercise.supersetGroupId;

    if (!groupId) return;

    if (!labelsByGroupId[groupId]) {
      groupCount += 1;
      labelsByGroupId[groupId] = `Superset ${String.fromCharCode(
        64 + groupCount
      )}`;
      positionByGroupId[groupId] = 0;
    }

    positionByGroupId[groupId] += 1;

    const size = normalizedExercises.filter(
      (item) => item.supersetGroupId === groupId
    ).length;

    displayMap[exercise.id] = {
      label: labelsByGroupId[groupId],
      position: positionByGroupId[groupId],
      size,
      slotLabel: `${String.fromCharCode(64 + groupCount)}${positionByGroupId[groupId]}`,
      groupLabel: String.fromCharCode(64 + groupCount),
    };
  });

  return displayMap;
};

export const getSupersetBlocks = (
  exercises: RoutineExerciseWithDefaults[]
): SupersetBlock[] => {
  const normalizedExercises = normalizeSupersetExercises(exercises);
  const displayMap = getSupersetDisplayMap(normalizedExercises);
  const blocks: SupersetBlock[] = [];

  normalizedExercises.forEach((exercise) => {
    const supersetMeta = displayMap[exercise.id];

    if (!supersetMeta) {
      blocks.push({
        id: exercise.id,
        label: '',
        exercises: [exercise],
      });
      return;
    }

    const blockId = `superset-${supersetMeta.groupLabel}`;
    const existingBlock = blocks[blocks.length - 1];

    if (existingBlock && existingBlock.id === blockId) {
      existingBlock.exercises.push(exercise);
      return;
    }

    blocks.push({
      id: blockId,
      label: supersetMeta.groupLabel,
      exercises: [exercise],
    });
  });

  return blocks;
};
