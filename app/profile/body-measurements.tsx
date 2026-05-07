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
  deleteBodyMeasurementById,
  loadBodyMeasurements,
  saveBodyMeasurements,
} from '../../storage/bodyMeasurements';
import { loadSettings } from '../../storage/settings';
import { BodyMeasurement } from '../../types/bodyMeasurement';
import { WeightUnit } from '../../types/settings';
import {
  formatBodyWeight,
  formatMeasurementDate,
  getBodyWeightTrend,
} from '../../utils/bodyMeasurements';

export default function BodyMeasurementsScreen() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [bodyWeight, setBodyWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [arms, setArms] = useState('');
  const [thighs, setThighs] = useState('');
  const [note, setNote] = useState('');

  const fetchData = useCallback(async () => {
    const [savedMeasurements, settings] = await Promise.all([
      loadBodyMeasurements(),
      loadSettings(),
    ]);

    setMeasurements(savedMeasurements);
    setWeightUnit(settings.weightUnit);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleSaveMeasurement = async () => {
    if (!bodyWeight.trim() && !waist.trim() && !chest.trim() && !note.trim()) {
      Alert.alert(
        'Missing check-in',
        'Add at least body weight, a measurement, or a note.'
      );
      return;
    }

    const parsedBodyWeight = Number(bodyWeight);
    const savedBodyWeight =
      bodyWeight.trim() && Number.isFinite(parsedBodyWeight)
        ? weightUnit === 'kg'
          ? String(Math.round((parsedBodyWeight / 0.45359237) * 10) / 10)
          : bodyWeight.trim()
        : '';
    const newMeasurement: BodyMeasurement = {
      id: `measurement-${Date.now()}`,
      measuredAt: new Date().toISOString(),
      bodyWeight: savedBodyWeight,
      waist: waist.trim(),
      chest: chest.trim(),
      arms: arms.trim(),
      thighs: thighs.trim(),
      note: note.trim(),
    };

    await saveBodyMeasurements([newMeasurement, ...measurements]);
    setBodyWeight('');
    setWaist('');
    setChest('');
    setArms('');
    setThighs('');
    setNote('');
    await fetchData();
  };

  const handleDeleteMeasurement = (measurement: BodyMeasurement) => {
    Alert.alert('Delete check-in', 'Remove this body check-in?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBodyMeasurementById(measurement.id);
          await fetchData();
        },
      },
    ]);
  };

  const latestMeasurement = measurements[0];

  return (
    <>
      <Stack.Screen options={{ title: 'Body Measurements' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <FlatList
          data={measurements}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              <View style={styles.headerCard}>
                <Text style={styles.kicker}>Reptra</Text>
                <Text style={styles.title}>Body Check-Ins</Text>
                <Text style={styles.subtitle}>
                  Track body weight and simple measurements alongside your
                  training.
                </Text>

                <View style={styles.trendCard}>
                  <Text style={styles.trendLabel}>Latest body weight</Text>
                  <Text style={styles.trendValue}>
                    {latestMeasurement
                      ? formatBodyWeight(
                          latestMeasurement.bodyWeight,
                          weightUnit,
                          'lb'
                        )
                      : '--'}
                  </Text>
                  <Text style={styles.trendText}>
                    {getBodyWeightTrend(measurements, weightUnit)}
                  </Text>
                </View>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>New Check-In</Text>

                <TextInput
                  style={styles.input}
                  placeholder={`Body weight (${weightUnit})`}
                  placeholderTextColor="#777777"
                  keyboardType="numeric"
                  value={bodyWeight}
                  onChangeText={setBodyWeight}
                />

                <View style={styles.grid}>
                  <TextInput
                    style={styles.gridInput}
                    placeholder="Waist"
                    placeholderTextColor="#777777"
                    keyboardType="numeric"
                    value={waist}
                    onChangeText={setWaist}
                  />
                  <TextInput
                    style={styles.gridInput}
                    placeholder="Chest"
                    placeholderTextColor="#777777"
                    keyboardType="numeric"
                    value={chest}
                    onChangeText={setChest}
                  />
                  <TextInput
                    style={styles.gridInput}
                    placeholder="Arms"
                    placeholderTextColor="#777777"
                    keyboardType="numeric"
                    value={arms}
                    onChangeText={setArms}
                  />
                  <TextInput
                    style={styles.gridInput}
                    placeholder="Thighs"
                    placeholderTextColor="#777777"
                    keyboardType="numeric"
                    value={thighs}
                    onChangeText={setThighs}
                  />
                </View>

                <TextInput
                  style={[styles.input, styles.noteInput]}
                  placeholder="Optional note..."
                  placeholderTextColor="#777777"
                  multiline
                  value={note}
                  onChangeText={setNote}
                />

                <Pressable
                  style={styles.primaryButton}
                  onPress={handleSaveMeasurement}
                >
                  <Text style={styles.primaryButtonText}>Save Check-In</Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>History</Text>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.measurementCard}>
              <View style={styles.measurementHeader}>
                <View>
                  <Text style={styles.measurementDate}>
                    {formatMeasurementDate(item.measuredAt)}
                  </Text>
                  <Text style={styles.measurementWeight}>
                    {formatBodyWeight(item.bodyWeight, weightUnit, 'lb')}
                  </Text>
                </View>

                <Pressable onPress={() => handleDeleteMeasurement(item)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>

              <View style={styles.measurementGrid}>
                <Text style={styles.measurementPill}>Waist: {item.waist || '--'}</Text>
                <Text style={styles.measurementPill}>Chest: {item.chest || '--'}</Text>
                <Text style={styles.measurementPill}>Arms: {item.arms || '--'}</Text>
                <Text style={styles.measurementPill}>
                  Thighs: {item.thighs || '--'}
                </Text>
              </View>

              {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No body check-ins yet. Add your first one above.
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
  trendCard: {
    backgroundColor: '#0d1722',
    borderWidth: 1,
    borderColor: '#1f3c58',
    borderRadius: 14,
    padding: 14,
  },
  trendLabel: {
    color: '#9dbbda',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  trendValue: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
  },
  trendText: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 18,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridInput: {
    width: '48%',
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
  measurementCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  measurementDate: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  measurementWeight: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  deleteText: {
    color: '#ff8a8a',
    fontSize: 12,
    fontWeight: '800',
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  measurementPill: {
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
