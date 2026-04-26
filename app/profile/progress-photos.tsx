import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect } from 'expo-router';
import { loadWorkouts } from '../../storage/workouts';
import {
  deleteProgressPhotoById,
  loadProgressPhotos,
  saveProgressPhotos,
} from '../../storage/progressPhotos';
import { ProgressPhoto } from '../../types/progressPhoto';
import { SavedWorkoutSession } from '../../types/workout';

function formatPhotoDate(dateString: string) {
  return new Date(dateString).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ProgressPhotosScreen() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [workouts, setWorkouts] = useState<SavedWorkoutSession[]>([]);
  const [imageUri, setImageUri] = useState('');
  const [note, setNote] = useState('');
  const [sourceType, setSourceType] =
    useState<NonNullable<ProgressPhoto['sourceType']>>('uri');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  const fetchPhotos = async () => {
    const [savedPhotos, savedWorkouts] = await Promise.all([
      loadProgressPhotos(),
      loadWorkouts(),
    ]);
    setPhotos(savedPhotos);
    setWorkouts(savedWorkouts);
  };

  useFocusEffect(
    useCallback(() => {
      fetchPhotos();
    }, [])
  );

  const handleAddPhoto = async () => {
    const trimmedUri = imageUri.trim();
    const trimmedNote = note.trim();
    const selectedWorkout =
      workouts.find((workout) => workout.id === selectedWorkoutId) ?? null;

    if (!trimmedUri) {
      Alert.alert('Missing photo URI', 'Paste an image URI to save a progress photo.');
      return;
    }

    const newPhoto: ProgressPhoto = {
      id: new Date().toISOString(),
      imageUri: trimmedUri,
      note: trimmedNote,
      createdAt: new Date().toISOString(),
      sourceType,
      workoutId: selectedWorkout?.id ?? null,
      workoutName: selectedWorkout?.routineName,
      workoutCompletedAt: selectedWorkout?.completedAt,
    };

    const updatedPhotos = [newPhoto, ...photos];
    await saveProgressPhotos(updatedPhotos);
    setPhotos(updatedPhotos);
    setImageUri('');
    setNote('');
    setSourceType('uri');
    setSelectedWorkoutId(null);
  };

  const handleDeletePhoto = (photo: ProgressPhoto) => {
    Alert.alert(
      'Delete progress photo',
      'Remove this progress photo from your profile history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProgressPhotoById(photo.id);
            setPhotos((prev) => prev.filter((item) => item.id !== photo.id));
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Progress Photos' }} />

      <SafeAreaView style={styles.container}>
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.formCard}>
              <Text style={styles.title}>Progress Photos</Text>
              <Text style={styles.subtitle}>
                Save physique check-ins here. Native camera/gallery picker support
                can plug into this same flow later.
              </Text>

              <View style={styles.sourceRow}>
                {[
                  { key: 'uri', label: 'URI' },
                  { key: 'camera', label: 'Camera Later' },
                  { key: 'gallery', label: 'Gallery Later' },
                ].map((source) => {
                  const isSelected = sourceType === source.key;

                  return (
                    <Pressable
                      key={source.key}
                      style={[
                        styles.sourceButton,
                        isSelected && styles.sourceButtonSelected,
                      ]}
                      onPress={() =>
                        setSourceType(source.key as NonNullable<ProgressPhoto['sourceType']>)
                      }
                    >
                      <Text
                        style={[
                          styles.sourceButtonText,
                          isSelected && styles.sourceButtonTextSelected,
                        ]}
                      >
                        {source.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Image URI"
                placeholderTextColor="#777777"
                autoCapitalize="none"
                value={imageUri}
                onChangeText={setImageUri}
              />

              <TextInput
                style={styles.noteInput}
                placeholder="Optional note..."
                placeholderTextColor="#777777"
                value={note}
                onChangeText={setNote}
                multiline
              />

              {imageUri.trim() ? (
                <Image
                  source={{ uri: imageUri.trim() }}
                  style={styles.previewPhoto}
                  resizeMode="cover"
                />
              ) : null}

              <Text style={styles.sectionLabel}>Attach to workout</Text>
              <View style={styles.workoutPicker}>
                <Pressable
                  style={[
                    styles.workoutChip,
                    selectedWorkoutId === null && styles.workoutChipSelected,
                  ]}
                  onPress={() => setSelectedWorkoutId(null)}
                >
                  <Text
                    style={[
                      styles.workoutChipText,
                      selectedWorkoutId === null && styles.workoutChipTextSelected,
                    ]}
                  >
                    No Workout
                  </Text>
                </Pressable>

                {workouts.slice(0, 5).map((workout) => {
                  const isSelected = selectedWorkoutId === workout.id;

                  return (
                    <Pressable
                      key={workout.id}
                      style={[
                        styles.workoutChip,
                        isSelected && styles.workoutChipSelected,
                      ]}
                      onPress={() => setSelectedWorkoutId(workout.id)}
                    >
                      <Text
                        style={[
                          styles.workoutChipText,
                          isSelected && styles.workoutChipTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {workout.routineName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable style={styles.addButton} onPress={handleAddPhoto}>
                <Text style={styles.addButtonText}>Save Progress Photo</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.photoCard}>
              <Image
                source={{ uri: item.imageUri }}
                style={styles.photo}
                resizeMode="cover"
              />

              <View style={styles.photoInfo}>
                <Text style={styles.photoDate}>{formatPhotoDate(item.createdAt)}</Text>

                {item.note ? (
                  <Text style={styles.photoNote}>{item.note}</Text>
                ) : (
                  <Text style={styles.photoHint}>No note added</Text>
                )}

                {item.workoutName ? (
                  <Text style={styles.photoWorkout}>
                    Workout: {item.workoutName}
                  </Text>
                ) : null}

                <Text style={styles.photoSource}>
                  Source: {item.sourceType ?? 'uri'}
                </Text>

                <Text style={styles.photoUri} numberOfLines={1}>
                  {item.imageUri}
                </Text>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(item)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No progress photos yet. Add your first check-in above.
            </Text>
          }
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
    padding: 16,
  },
  formCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#121212',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sourceButton: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sourceButtonSelected: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  sourceButtonText: {
    color: '#dddddd',
    fontSize: 12,
    fontWeight: '700',
  },
  sourceButtonTextSelected: {
    color: '#4da6ff',
  },
  noteInput: {
    backgroundColor: '#121212',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 88,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  previewPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#121212',
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  workoutPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  workoutChip: {
    maxWidth: '48%',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  workoutChipSelected: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  workoutChipText: {
    color: '#dddddd',
    fontSize: 12,
    fontWeight: '700',
  },
  workoutChipTextSelected: {
    color: '#4da6ff',
  },
  addButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
  photoCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  photo: {
    width: '100%',
    height: 220,
    backgroundColor: '#121212',
  },
  photoInfo: {
    padding: 14,
  },
  photoDate: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  photoNote: {
    color: '#dddddd',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  photoHint: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 8,
  },
  photoWorkout: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  photoSource: {
    color: '#888888',
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  photoUri: {
    color: '#777777',
    fontSize: 12,
    marginBottom: 12,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteButtonText: {
    color: '#ff8a8a',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
});
