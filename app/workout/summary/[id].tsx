import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadSettings } from '../../../storage/settings';
import { loadProgressPhotos, saveProgressPhotos } from '../../../storage/progressPhotos';
import { loadWorkouts, updateWorkoutById } from '../../../storage/workouts';
import { ProgressPhoto } from '../../../types/progressPhoto';
import { WeightUnit } from '../../../types/settings';
import {
  SavedExerciseLog,
  SavedWorkoutSession,
  WorkoutSet,
  WorkoutVisibility,
} from '../../../types/workout';
import { calculateWorkoutSummary } from '../../../utils/calculateWorkoutSummary';
import { detectWorkoutPRs } from '../../../utils/detectWorkoutPRs';
import { formatWorkoutDuration } from '../../../utils/formatDuration';
import {
  convertWeightValue,
  convertVolumeValue,
  formatWeightNumber,
  formatWeightWithUnit,
} from '../../../utils/weightUnits';
import { buildWorkoutShareMessage } from '../../../utils/workoutQuickActions';

export default function WorkoutSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<SavedWorkoutSession | null>(null);
  const [workouts, setWorkouts] = useState<SavedWorkoutSession[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [workoutName, setWorkoutName] = useState('');
  const [nameSaved, setNameSaved] = useState(true);
  const [workoutNote, setWorkoutNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [feedCaption, setFeedCaption] = useState('');
  const [workoutVisibility, setWorkoutVisibility] =
    useState<WorkoutVisibility>('private');
  const [feedSettingsSaved, setFeedSettingsSaved] = useState(true);
  const [photoUri, setPhotoUri] = useState('');
  const [photoNote, setPhotoNote] = useState('');
  const [linkedPhotos, setLinkedPhotos] = useState<ProgressPhoto[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchSummary = async () => {
        const [savedWorkouts, savedSettings, savedPhotos] = await Promise.all([
          loadWorkouts(),
          loadSettings(),
          loadProgressPhotos(),
        ]);
        const foundWorkout = savedWorkouts.find((item) => item.id === id) || null;

        setWorkout(foundWorkout);
        setWorkoutName(foundWorkout?.routineName ?? '');
        setNameSaved(true);
        setWorkoutNote(foundWorkout?.note ?? '');
        setNoteSaved(Boolean(foundWorkout?.note?.trim()));
        setFeedCaption(foundWorkout?.feedCaption ?? '');
        setWorkoutVisibility(foundWorkout?.visibility ?? 'private');
        setFeedSettingsSaved(true);
        setWorkouts(savedWorkouts);
        setWeightUnit(savedSettings.weightUnit);
        setLinkedPhotos(savedPhotos.filter((photo) => photo.workoutId === id));
      };

      fetchSummary();
    }, [id])
  );

  const handleDone = () => {
    router.replace('/(tabs)/workout');
  };

  const handleViewDetails = () => {
    if (!workout) return;

    router.replace(`/workout/history/${workout.id}`);
  };

  const handleStartAgain = () => {
    if (!workout) return;

    router.replace({
      pathname: '/workout/session/empty',
      params: {
        templateWorkoutId: workout.id,
      },
    });
  };

  const handleSaveWorkoutName = async () => {
    if (!workout) return;

    const trimmedName = workoutName.trim();

    if (!trimmedName) {
      Alert.alert('Missing name', 'Please enter a workout name.');
      return;
    }

    const updatedWorkout: SavedWorkoutSession = {
      ...workout,
      routineName: trimmedName,
    };

    await updateWorkoutById(workout.id, updatedWorkout);
    setWorkout(updatedWorkout);
    setWorkouts((prev) =>
      prev.map((item) => (item.id === workout.id ? updatedWorkout : item))
    );
    setWorkoutName(updatedWorkout.routineName);
    setNameSaved(true);
    Alert.alert('Name saved', 'Your workout name was updated.');
  };

  const handleSaveWorkoutNote = async () => {
    if (!workout) return;

    const updatedWorkout: SavedWorkoutSession = {
      ...workout,
      note: workoutNote.trim(),
    };

    await updateWorkoutById(workout.id, updatedWorkout);
    setWorkout(updatedWorkout);
    setWorkouts((prev) =>
      prev.map((item) => (item.id === workout.id ? updatedWorkout : item))
    );
    setNoteSaved(true);
    Alert.alert('Note saved', 'Your workout note was added to this workout.');
  };

  const handleSaveFeedSettings = async () => {
    if (!workout) return;

    const updatedWorkout: SavedWorkoutSession = {
      ...workout,
      feedCaption: feedCaption.trim(),
      visibility: workoutVisibility,
    };

    await updateWorkoutById(workout.id, updatedWorkout);
    setWorkout(updatedWorkout);
    setWorkouts((prev) =>
      prev.map((item) => (item.id === workout.id ? updatedWorkout : item))
    );
    setFeedSettingsSaved(true);
    Alert.alert(
      'Feed settings saved',
      'This workout is ready for the future feed preview.'
    );
  };

  const handleSaveProgressPhoto = async () => {
    if (!workout) return;

    const trimmedPhotoUri = photoUri.trim();

    if (!trimmedPhotoUri) {
      Alert.alert('Missing photo URI', 'Paste an image URI to attach a photo.');
      return;
    }

    const existingPhotos = await loadProgressPhotos();
    const newPhoto: ProgressPhoto = {
      id: `photo-${Date.now()}`,
      imageUri: trimmedPhotoUri,
      note: photoNote.trim(),
      createdAt: new Date().toISOString(),
      sourceType: 'uri',
      workoutId: workout.id,
      workoutName: workout.routineName,
      workoutCompletedAt: workout.completedAt,
    };

    await saveProgressPhotos([newPhoto, ...existingPhotos]);
    setLinkedPhotos((prev) => [newPhoto, ...prev]);
    setPhotoUri('');
    setPhotoNote('');
    Alert.alert('Photo attached', 'This progress photo was linked to the workout.');
  };

  const handleShareWorkout = async () => {
    if (!workout) return;

    try {
      await Share.share({
        message: buildWorkoutShareMessage(workout, weightUnit),
      });
    } catch {
      Alert.alert('Share failed', 'Unable to open the share sheet right now.');
    }
  };

  if (!workout) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <Text style={styles.notFoundTitle}>Workout summary not found</Text>
        <Text style={styles.notFoundText}>
          This workout may have been deleted.
        </Text>
      </SafeAreaView>
    );
  }

  const formattedDate = new Date(workout.completedAt).toLocaleDateString();
  const formattedTime = new Date(workout.completedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const formattedDuration = formatWorkoutDuration(workout.durationMinutes);
  const { totalSets, totalReps, totalVolume, heaviestWeight } =
    calculateWorkoutSummary(workout);
  const convertedVolume = convertVolumeValue(totalVolume, 'lb', weightUnit);
  const sourceWeightUnit = workout.weightUnit ?? 'lb';
  const prHighlights = detectWorkoutPRs(workout, workouts);
  const bestSet = workout.exercises
    .flatMap((exercise) =>
      exercise.sets.map((set) => {
        const weight = convertWeightValue(
          Number(set.weight) || 0,
          sourceWeightUnit,
          'lb'
        );
        const reps = Number(set.reps) || 0;

        return {
          exerciseName: exercise.exerciseName,
          weight,
          reps,
          volume: weight * reps,
        };
      })
    )
    .sort((a, b) => b.volume - a.volume)[0];
  const exerciseVolumeSummaries = workout.exercises
    .map((exercise) => {
      const volume = exercise.sets.reduce((sum, set) => {
        const weight = convertWeightValue(
          Number(set.weight) || 0,
          sourceWeightUnit,
          'lb'
        );
        const reps = Number(set.reps) || 0;

        return sum + weight * reps;
      }, 0);

      return {
        exerciseName: exercise.exerciseName,
        volume,
      };
    })
    .sort((a, b) => b.volume - a.volume);
  const topVolumeExercise = exerciseVolumeSummaries[0];
  const nameSuggestions = [
    `${workout.routineName} - ${formattedDate}`,
    workout.routineId ? `${workout.routineName} Run` : 'Custom Workout',
    formattedDuration ? `${formattedDuration} Session` : 'Logged Workout',
  ].filter((suggestion, index, suggestions) => {
    const trimmedSuggestion = suggestion.trim();
    return (
      trimmedSuggestion.length > 0 &&
      suggestions.findIndex((item) => item.trim() === trimmedSuggestion) === index
    );
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Workout Summary' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <FlatList
          data={workout.exercises}
          keyExtractor={(item) => item.exerciseId}
          ListHeaderComponent={
            <View style={styles.headerCard}>
              <Text style={styles.kicker}>Workout Saved</Text>
              <Text style={styles.title}>{workout.routineName}</Text>
              <Text style={styles.subtitle}>
                {formattedDate} at {formattedTime}
              </Text>
              {formattedDuration ? (
                <Text style={styles.subtitle}>Duration: {formattedDuration}</Text>
              ) : null}

              <View style={styles.nameCard}>
                <Text style={styles.nameTitle}>Workout Name</Text>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Workout name"
                  placeholderTextColor="#777777"
                  value={workoutName}
                  onChangeText={(value) => {
                    setWorkoutName(value);
                    setNameSaved(false);
                  }}
                />

                <View style={styles.nameSuggestionRow}>
                  {nameSuggestions.map((suggestion) => (
                    <Pressable
                      key={suggestion}
                      style={styles.nameSuggestionChip}
                      onPress={() => {
                        setWorkoutName(suggestion);
                        setNameSaved(false);
                      }}
                    >
                      <Text style={styles.nameSuggestionText}>{suggestion}</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  style={styles.nameButton}
                  onPress={handleSaveWorkoutName}
                >
                  <Text style={styles.nameButtonText}>
                    {nameSaved ? 'Update Name' : 'Save Name'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryValue}>{workout.exercises.length}</Text>
                  <Text style={styles.summaryLabel}>Exercises</Text>
                </View>

                <View style={styles.summaryStat}>
                  <Text style={styles.summaryValue}>{totalSets}</Text>
                  <Text style={styles.summaryLabel}>Sets</Text>
                </View>

                <View style={styles.summaryStat}>
                  <Text style={styles.summaryValue}>{totalReps}</Text>
                  <Text style={styles.summaryLabel}>Reps</Text>
                </View>

                <View style={styles.summaryStat}>
                  <Text style={styles.summaryValue}>
                    {formatWeightWithUnit(String(heaviestWeight || 0), weightUnit, 'lb')}
                  </Text>
                  <Text style={styles.summaryLabel}>Heaviest</Text>
                </View>

                <View style={[styles.summaryStat, styles.wideSummaryStat]}>
                  <Text style={styles.summaryValue}>
                    {formatWeightNumber(convertedVolume)}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Volume</Text>
                </View>
              </View>

              <View style={styles.highlightCard}>
                <Text style={styles.highlightTitle}>Session Highlights</Text>

                <View style={styles.highlightRow}>
                  <Text style={styles.highlightLabel}>Best Set</Text>
                  <Text style={styles.highlightValue}>
                    {bestSet && bestSet.volume > 0
                      ? `${bestSet.exerciseName}: ${formatWeightNumber(
                          convertWeightValue(bestSet.weight, 'lb', weightUnit)
                        )} ${weightUnit} x ${bestSet.reps}`
                      : 'No loaded sets'}
                  </Text>
                </View>

                <View style={styles.highlightRow}>
                  <Text style={styles.highlightLabel}>Top Volume</Text>
                  <Text style={styles.highlightValue}>
                    {topVolumeExercise && topVolumeExercise.volume > 0
                      ? `${topVolumeExercise.exerciseName}: ${formatWeightNumber(
                          convertVolumeValue(
                            topVolumeExercise.volume,
                            'lb',
                            weightUnit
                          )
                        )} ${weightUnit}`
                      : 'No volume yet'}
                  </Text>
                </View>

                <View style={styles.highlightRow}>
                  <Text style={styles.highlightLabel}>Average Reps/Set</Text>
                  <Text style={styles.highlightValue}>
                    {totalSets > 0
                      ? formatWeightNumber(totalReps / totalSets)
                      : '0'}
                  </Text>
                </View>
              </View>

              {prHighlights.length > 0 && (
                <View style={styles.prCard}>
                  <Text style={styles.prTitle}>New PRs</Text>
                  <Text style={styles.prSubtitle}>
                    {prHighlights.length} new personal record
                    {prHighlights.length === 1 ? '' : 's'} from this workout.
                  </Text>

                  {prHighlights.slice(0, 4).map((pr) => {
                    const displayedValue = convertWeightValue(
                      pr.value,
                      'lb',
                      weightUnit
                    );
                    const displayedPreviousValue = convertWeightValue(
                      pr.previousValue,
                      'lb',
                      weightUnit
                    );
                    const label =
                      pr.type === 'heaviest' ? 'Heaviest Set' : 'Estimated 1RM';

                    return (
                      <View
                        key={`${pr.exerciseId}-${pr.type}`}
                        style={styles.prRow}
                      >
                        <View style={styles.prRowText}>
                          <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                          <Text style={styles.prType}>{label}</Text>
                        </View>

                        <View style={styles.prValueWrap}>
                          <Text style={styles.prValue}>
                            {formatWeightWithUnit(
                              String(displayedValue),
                              weightUnit,
                              weightUnit
                            )}
                          </Text>
                          {pr.previousValue > 0 && (
                            <Text style={styles.prPrevious}>
                              Previous {formatWeightNumber(displayedPreviousValue)}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={styles.noteCard}>
                <Text style={styles.noteTitle}>Workout Note</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="How did this workout feel?"
                  placeholderTextColor="#777777"
                  value={workoutNote}
                  onChangeText={(value) => {
                    setWorkoutNote(value);
                    setNoteSaved(false);
                  }}
                  multiline
                />

                <Pressable
                  style={styles.noteButton}
                  onPress={handleSaveWorkoutNote}
                >
                  <Text style={styles.noteButtonText}>
                    {noteSaved ? 'Update Note' : 'Save Note'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.feedCard}>
                <Text style={styles.noteTitle}>Feed Preview</Text>
                <Text style={styles.photoHelpText}>
                  This stays local for now. Later, these settings can power the
                  real Reptra social feed.
                </Text>

                <TextInput
                  style={styles.noteInput}
                  placeholder="Caption for this workout..."
                  placeholderTextColor="#777777"
                  value={feedCaption}
                  onChangeText={(value) => {
                    setFeedCaption(value);
                    setFeedSettingsSaved(false);
                  }}
                  multiline
                />

                <View style={styles.visibilityRow}>
                  {(['private', 'friends', 'public'] as WorkoutVisibility[]).map(
                    (visibility) => {
                      const isSelected = workoutVisibility === visibility;

                      return (
                        <Pressable
                          key={visibility}
                          style={[
                            styles.visibilityChip,
                            isSelected && styles.visibilityChipSelected,
                          ]}
                          onPress={() => {
                            setWorkoutVisibility(visibility);
                            setFeedSettingsSaved(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.visibilityChipText,
                              isSelected && styles.visibilityChipTextSelected,
                            ]}
                          >
                            {visibility}
                          </Text>
                        </Pressable>
                      );
                    }
                  )}
                </View>

                <Pressable
                  style={styles.noteButton}
                  onPress={handleSaveFeedSettings}
                >
                  <Text style={styles.noteButtonText}>
                    {feedSettingsSaved ? 'Update Feed Preview' : 'Save Feed Preview'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.photoCard}>
                <Text style={styles.noteTitle}>Progress Photo</Text>
                <Text style={styles.photoHelpText}>
                  Attach a post-workout check-in to this saved workout.
                </Text>

                <TextInput
                  style={styles.nameInput}
                  placeholder="Image URI"
                  placeholderTextColor="#777777"
                  autoCapitalize="none"
                  value={photoUri}
                  onChangeText={setPhotoUri}
                />

                <TextInput
                  style={styles.noteInput}
                  placeholder="Optional photo note..."
                  placeholderTextColor="#777777"
                  value={photoNote}
                  onChangeText={setPhotoNote}
                  multiline
                />

                {photoUri.trim() ? (
                  <Image
                    source={{ uri: photoUri.trim() }}
                    style={styles.photoPreview}
                    resizeMode="cover"
                  />
                ) : null}

                <Pressable
                  style={styles.noteButton}
                  onPress={handleSaveProgressPhoto}
                >
                  <Text style={styles.noteButtonText}>Attach Photo</Text>
                </Pressable>

                {linkedPhotos.length > 0 ? (
                  <Text style={styles.linkedPhotoCount}>
                    {linkedPhotos.length} photo
                    {linkedPhotos.length === 1 ? '' : 's'} linked to this workout
                  </Text>
                ) : null}
              </View>

              <View style={styles.actionRow}>
                <Pressable style={styles.secondaryButton} onPress={handleStartAgain}>
                  <Text style={styles.secondaryButtonText}>Start Again</Text>
                </Pressable>

                <Pressable style={styles.secondaryButton} onPress={handleViewDetails}>
                  <Text style={styles.secondaryButtonText}>View Details</Text>
                </Pressable>
              </View>

              <Pressable style={styles.shareButton} onPress={handleShareWorkout}>
                <Text style={styles.shareButtonText}>Share Summary</Text>
              </Pressable>

              <Pressable style={styles.primaryButton} onPress={handleDone}>
                <Text style={styles.primaryButtonText}>Done</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item, index }: { item: SavedExerciseLog; index: number }) => (
            <View style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>
                {index + 1}. {item.exerciseName}
              </Text>

              <Text style={styles.exerciseMeta}>
                {item.sets.length} set{item.sets.length === 1 ? '' : 's'}
              </Text>

              {item.sets.map((set: WorkoutSet) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setLabel}>Set {set.setNumber}</Text>
                  <Text style={styles.setValue}>
                    {formatWeightWithUnit(set.weight, weightUnit, sourceWeightUnit)}
                  </Text>
                  <Text style={styles.setValue}>{set.reps || '-'} reps</Text>
                </View>
              ))}

              {item.note?.trim() ? (
                <View style={styles.exerciseNoteBox}>
                  <Text style={styles.exerciseNoteLabel}>Note</Text>
                  <Text style={styles.exerciseNoteText}>{item.note.trim()}</Text>
                </View>
              ) : null}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  headerCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  kicker: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 14,
    marginBottom: 2,
  },
  nameCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  nameTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  nameInput: {
    backgroundColor: '#101010',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  nameSuggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  nameSuggestionChip: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  nameSuggestionText: {
    color: '#dddddd',
    fontSize: 12,
    fontWeight: '700',
  },
  nameButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  nameButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  summaryStat: {
    width: '48%',
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  wideSummaryStat: {
    width: '100%',
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#8f8f8f',
    fontSize: 12,
    fontWeight: '600',
  },
  highlightCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  highlightTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  highlightRow: {
    backgroundColor: '#101010',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  highlightLabel: {
    color: '#8f8f8f',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  highlightValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  prCard: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  prTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  prSubtitle: {
    color: '#9dbbda',
    fontSize: 13,
    marginBottom: 12,
  },
  prRow: {
    backgroundColor: '#0d1722',
    borderWidth: 1,
    borderColor: '#1f3c58',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  prRowText: {
    flex: 1,
  },
  prExercise: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  prType: {
    color: '#9dbbda',
    fontSize: 12,
    fontWeight: '600',
  },
  prValueWrap: {
    alignItems: 'flex-end',
  },
  prValue: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  prPrevious: {
    color: '#8f8f8f',
    fontSize: 11,
    fontWeight: '600',
  },
  noteCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  photoCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  feedCard: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  photoHelpText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#101010',
    marginBottom: 10,
  },
  linkedPhotoCount: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  noteTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  noteInput: {
    backgroundColor: '#101010',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 82,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 10,
  },
  noteButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  noteButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  visibilityChip: {
    flex: 1,
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 999,
    paddingVertical: 9,
    alignItems: 'center',
  },
  visibilityChipSelected: {
    backgroundColor: '#4da6ff',
    borderColor: '#4da6ff',
  },
  visibilityChipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  visibilityChipTextSelected: {
    color: '#111111',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '700',
  },
  shareButton: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
  exerciseCard: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  exerciseName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
  },
  exerciseMeta: {
    color: '#aaaaaa',
    fontSize: 13,
    marginBottom: 10,
  },
  setRow: {
    backgroundColor: '#161616',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  setLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  setValue: {
    color: '#aaaaaa',
    fontSize: 14,
  },
  exerciseNoteBox: {
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  exerciseNoteLabel: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  exerciseNoteText: {
    color: '#dddddd',
    fontSize: 13,
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
  notFoundTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  notFoundText: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
  },
});
