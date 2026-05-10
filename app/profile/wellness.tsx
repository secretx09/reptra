import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  deleteWellnessCheckInById,
  loadWellnessCheckIns,
  saveWellnessCheckIns,
} from '../../storage/wellnessCheckIns';
import { WellnessCheckIn } from '../../types/wellnessCheckIn';
import {
  formatWellnessDate,
  getAverageReadiness,
  getReadinessLabel,
  getReadinessScore,
} from '../../utils/wellnessCheckIns';

const moodOptions = ['Great', 'Good', 'Okay', 'Low', 'Stressed'];
const scaleValues = [1, 2, 3, 4, 5];

export default function WellnessScreen() {
  const [checkIns, setCheckIns] = useState<WellnessCheckIn[]>([]);
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [sleepHours, setSleepHours] = useState('');
  const [mood, setMood] = useState('Good');
  const [note, setNote] = useState('');

  const fetchCheckIns = useCallback(async () => {
    const savedCheckIns = await loadWellnessCheckIns();
    setCheckIns(savedCheckIns);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCheckIns();
    }, [fetchCheckIns])
  );

  const handleSaveCheckIn = async () => {
    const parsedSleep = Number(sleepHours);

    if (sleepHours.trim() && (!Number.isFinite(parsedSleep) || parsedSleep < 0)) {
      Alert.alert('Invalid sleep', 'Enter sleep as a number of hours.');
      return;
    }

    const newCheckIn: WellnessCheckIn = {
      id: `wellness-${Date.now()}`,
      checkedInAt: new Date().toISOString(),
      energy,
      soreness,
      sleepHours: sleepHours.trim(),
      mood,
      note: note.trim(),
    };

    await saveWellnessCheckIns([newCheckIn, ...checkIns]);
    setEnergy(3);
    setSoreness(3);
    setSleepHours('');
    setMood('Good');
    setNote('');
    await fetchCheckIns();
  };

  const handleDeleteCheckIn = (checkIn: WellnessCheckIn) => {
    Alert.alert('Delete check-in', 'Remove this wellness check-in?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWellnessCheckInById(checkIn.id);
          await fetchCheckIns();
        },
      },
    ]);
  };

  const latestCheckIn = checkIns[0];
  const latestReadiness = getReadinessScore(latestCheckIn);
  const averageReadiness = getAverageReadiness(checkIns.slice(0, 7));

  return (
    <>
      <Stack.Screen options={{ title: 'Wellness' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <FlatList
          data={checkIns}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              <View style={styles.headerCard}>
                <Text style={styles.kicker}>Reptra</Text>
                <Text style={styles.title}>Wellness Check-Ins</Text>
                <Text style={styles.subtitle}>
                  Track energy, soreness, sleep, and mood so your training has
                  more context.
                </Text>

                <View style={styles.readinessRow}>
                  <View style={styles.readinessCard}>
                    <Text style={styles.readinessLabel}>Today</Text>
                    <Text style={styles.readinessValue}>{latestReadiness}%</Text>
                    <Text style={styles.readinessText}>
                      {getReadinessLabel(latestReadiness)}
                    </Text>
                  </View>

                  <View style={styles.readinessCard}>
                    <Text style={styles.readinessLabel}>7-check avg</Text>
                    <Text style={styles.readinessValue}>{averageReadiness}%</Text>
                    <Text style={styles.readinessText}>
                      {getReadinessLabel(averageReadiness)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>New Check-In</Text>

                <Text style={styles.fieldLabel}>Energy</Text>
                <View style={styles.scaleRow}>
                  {scaleValues.map((value) => (
                    <Pressable
                      key={`energy-${value}`}
                      style={[
                        styles.scaleButton,
                        energy === value && styles.scaleButtonSelected,
                      ]}
                      onPress={() => setEnergy(value)}
                    >
                      <Text
                        style={[
                          styles.scaleButtonText,
                          energy === value && styles.scaleButtonTextSelected,
                        ]}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Soreness</Text>
                <View style={styles.scaleRow}>
                  {scaleValues.map((value) => (
                    <Pressable
                      key={`soreness-${value}`}
                      style={[
                        styles.scaleButton,
                        soreness === value && styles.scaleButtonSelected,
                      ]}
                      onPress={() => setSoreness(value)}
                    >
                      <Text
                        style={[
                          styles.scaleButtonText,
                          soreness === value && styles.scaleButtonTextSelected,
                        ]}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Sleep hours"
                  placeholderTextColor="#777777"
                  keyboardType="numeric"
                  value={sleepHours}
                  onChangeText={setSleepHours}
                />

                <View style={styles.moodRow}>
                  {moodOptions.map((option) => {
                    const isSelected = mood === option;

                    return (
                      <Pressable
                        key={option}
                        style={[
                          styles.moodButton,
                          isSelected && styles.moodButtonSelected,
                        ]}
                        onPress={() => setMood(option)}
                      >
                        <Text
                          style={[
                            styles.moodButtonText,
                            isSelected && styles.moodButtonTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <TextInput
                  style={[styles.input, styles.noteInput]}
                  placeholder="Optional note..."
                  placeholderTextColor="#777777"
                  multiline
                  value={note}
                  onChangeText={setNote}
                />

                <Pressable style={styles.primaryButton} onPress={handleSaveCheckIn}>
                  <Text style={styles.primaryButtonText}>Save Check-In</Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>History</Text>
            </>
          }
          renderItem={({ item }) => {
            const readinessScore = getReadinessScore(item);

            return (
              <View style={styles.checkInCard}>
                <View style={styles.checkInHeader}>
                  <View>
                    <Text style={styles.checkInDate}>
                      {formatWellnessDate(item.checkedInAt)}
                    </Text>
                    <Text style={styles.checkInTitle}>
                      {readinessScore}% - {getReadinessLabel(readinessScore)}
                    </Text>
                  </View>

                  <Pressable onPress={() => handleDeleteCheckIn(item)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>

                <View style={styles.metricGrid}>
                  <Text style={styles.metricPill}>Energy: {item.energy}/5</Text>
                  <Text style={styles.metricPill}>
                    Soreness: {item.soreness}/5
                  </Text>
                  <Text style={styles.metricPill}>
                    Sleep: {item.sleepHours || '--'}h
                  </Text>
                  <Text style={styles.metricPill}>Mood: {item.mood}</Text>
                </View>

                {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No wellness check-ins yet. Add one above when you are ready.
            </Text>
          }
          contentContainerStyle={styles.content}
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
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  headerCard: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  kicker: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    color: '#b9d6f2',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  readinessRow: {
    flexDirection: 'row',
    gap: 10,
  },
  readinessCard: {
    flex: 1,
    backgroundColor: '#0d1722',
    borderWidth: 1,
    borderColor: '#1f3c58',
    borderRadius: 14,
    padding: 12,
  },
  readinessLabel: {
    color: '#9dbbda',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  readinessValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  readinessText: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 17,
  },
  formCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  fieldLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  scaleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  scaleButton: {
    flex: 1,
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  scaleButtonSelected: {
    backgroundColor: '#4da6ff',
    borderColor: '#4da6ff',
  },
  scaleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  scaleButtonTextSelected: {
    color: '#111111',
  },
  input: {
    backgroundColor: '#101010',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: 10,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  moodButton: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  moodButtonSelected: {
    backgroundColor: '#4da6ff',
    borderColor: '#4da6ff',
  },
  moodButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  moodButtonTextSelected: {
    color: '#111111',
  },
  noteInput: {
    minHeight: 78,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '900',
  },
  checkInCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  checkInDate: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  checkInTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  deleteText: {
    color: '#ff8a8a',
    fontSize: 12,
    fontWeight: '800',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricPill: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 999,
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  noteText: {
    color: '#dddddd',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 14,
    lineHeight: 20,
  },
});
