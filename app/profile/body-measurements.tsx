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
import { convertWeightValue, formatWeightNumber } from '../../utils/weightUnits';

function getDisplayBodyWeightInput(value: string, weightUnit: WeightUnit) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return '';
  }

  return formatWeightNumber(convertWeightValue(parsedValue, 'lb', weightUnit));
}

function getSavedBodyWeightInput(value: string, weightUnit: WeightUnit) {
  const parsedValue = Number(value);

  if (!value.trim() || !Number.isFinite(parsedValue) || parsedValue <= 0) {
    return '';
  }

  return weightUnit === 'kg'
    ? String(Math.round((parsedValue / 0.45359237) * 10) / 10)
    : value.trim();
}

export default function BodyMeasurementsScreen() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [bodyWeight, setBodyWeight] = useState('');
  const [note, setNote] = useState('');
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(
    null
  );

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
    if (!bodyWeight.trim() && !note.trim()) {
      Alert.alert(
        'Missing check-in',
        'Add at least body weight or a note.'
      );
      return;
    }

    const savedBodyWeight = getSavedBodyWeightInput(bodyWeight, weightUnit);

    if (bodyWeight.trim() && !savedBodyWeight) {
      Alert.alert('Invalid weight', 'Enter a valid body weight first.');
      return;
    }

    if (editingMeasurementId) {
      const updatedMeasurements = measurements.map((measurement) =>
        measurement.id === editingMeasurementId
          ? {
              ...measurement,
              bodyWeight: savedBodyWeight,
              note: note.trim(),
            }
          : measurement
      );

      await saveBodyMeasurements(updatedMeasurements);
    } else {
      const newMeasurement: BodyMeasurement = {
        id: `measurement-${Date.now()}`,
        measuredAt: new Date().toISOString(),
        bodyWeight: savedBodyWeight,
        waist: '',
        chest: '',
        arms: '',
        thighs: '',
        note: note.trim(),
      };

      await saveBodyMeasurements([newMeasurement, ...measurements]);
    }

    clearForm();
    await fetchData();
  };

  const clearForm = () => {
    setBodyWeight('');
    setNote('');
    setEditingMeasurementId(null);
  };

  const handleUseLatestWeight = () => {
    if (!latestMeasurement?.bodyWeight) {
      return;
    }

    setBodyWeight(getDisplayBodyWeightInput(latestMeasurement.bodyWeight, weightUnit));
  };

  const handleEditMeasurement = (measurement: BodyMeasurement) => {
    setEditingMeasurementId(measurement.id);
    setBodyWeight(getDisplayBodyWeightInput(measurement.bodyWeight, weightUnit));
    setNote(measurement.note);
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
  const previousMeasurement = measurements[1];
  const bodyWeightMeasurements = measurements.filter((measurement) => {
    const parsedWeight = Number(measurement.bodyWeight);
    return Number.isFinite(parsedWeight) && parsedWeight > 0;
  });
  const oldestWeightMeasurement =
    bodyWeightMeasurements[bodyWeightMeasurements.length - 1];
  const latestWeightValue = Number(latestMeasurement?.bodyWeight);
  const previousWeightValue = Number(previousMeasurement?.bodyWeight);
  const oldestWeightValue = Number(oldestWeightMeasurement?.bodyWeight);
  const latestChange =
    Number.isFinite(latestWeightValue) && Number.isFinite(previousWeightValue)
      ? convertWeightValue(latestWeightValue - previousWeightValue, 'lb', weightUnit)
      : null;
  const totalChange =
    Number.isFinite(latestWeightValue) && Number.isFinite(oldestWeightValue)
      ? convertWeightValue(latestWeightValue - oldestWeightValue, 'lb', weightUnit)
      : null;
  const chartPoints = [...bodyWeightMeasurements]
    .reverse()
    .slice(-8)
    .map((measurement) => ({
      ...measurement,
      displayWeight: convertWeightValue(
        Number(measurement.bodyWeight),
        'lb',
        weightUnit
      ),
    }));
  const chartWeights = chartPoints.map((point) => point.displayWeight);
  const minChartWeight = Math.min(...chartWeights);
  const maxChartWeight = Math.max(...chartWeights);
  const chartRange = Math.max(maxChartWeight - minChartWeight, 1);

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
                  Track body weight and quick notes alongside your training.
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

                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{measurements.length}</Text>
                    <Text style={styles.summaryLabel}>Check-ins</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {latestChange === null
                        ? '--'
                        : `${latestChange > 0 ? '+' : ''}${formatWeightNumber(
                            latestChange
                          )}`}
                    </Text>
                    <Text style={styles.summaryLabel}>Last Change</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {totalChange === null
                        ? '--'
                        : `${totalChange > 0 ? '+' : ''}${formatWeightNumber(
                            totalChange
                          )}`}
                    </Text>
                    <Text style={styles.summaryLabel}>Total Change</Text>
                  </View>
                </View>
              </View>

              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Body Weight Trend</Text>
                    <Text style={styles.chartSubtitle}>
                      Last {chartPoints.length || 0} weight check-ins
                    </Text>
                  </View>
                </View>

                {chartPoints.length >= 2 ? (
                  <View style={styles.chartRow}>
                    {chartPoints.map((point) => {
                      const heightPercent =
                        30 + ((point.displayWeight - minChartWeight) / chartRange) * 70;

                      return (
                        <View key={point.id} style={styles.chartColumn}>
                          <View style={styles.chartBarTrack}>
                            <View
                              style={[
                                styles.chartBarFill,
                                { height: `${heightPercent}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.chartLabel}>
                            {new Date(point.measuredAt).toLocaleDateString([], {
                              month: 'numeric',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>
                    Add two body-weight check-ins to see your trend chart.
                  </Text>
                )}
              </View>

              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <Text style={styles.sectionTitle}>
                    {editingMeasurementId ? 'Edit Check-In' : 'New Check-In'}
                  </Text>

                  {latestMeasurement && !editingMeasurementId ? (
                    <Pressable onPress={handleUseLatestWeight}>
                      <Text style={styles.inlineAction}>Use Latest</Text>
                    </Pressable>
                  ) : null}
                </View>

                <TextInput
                  style={styles.input}
                  placeholder={`Body weight (${weightUnit})`}
                  placeholderTextColor="#777777"
                  keyboardType="numeric"
                  value={bodyWeight}
                  onChangeText={setBodyWeight}
                />

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

                {editingMeasurementId ? (
                  <Pressable style={styles.cancelButton} onPress={clearForm}>
                    <Text style={styles.cancelButtonText}>Cancel Edit</Text>
                  </Pressable>
                ) : null}
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

                <View style={styles.measurementActions}>
                  <Pressable onPress={() => handleEditMeasurement(item)}>
                    <Text style={styles.editText}>Edit</Text>
                  </Pressable>

                  <Pressable onPress={() => handleDeleteMeasurement(item)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
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
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#0d1722',
    borderWidth: 1,
    borderColor: '#1f3c58',
    borderRadius: 12,
    padding: 10,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 3,
  },
  summaryLabel: {
    color: '#9dbbda',
    fontSize: 11,
    fontWeight: '800',
  },
  chartCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  chartHeader: {
    marginBottom: 12,
  },
  chartSubtitle: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 18,
  },
  chartRow: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
  },
  chartBarTrack: {
    width: '100%',
    height: 110,
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 999,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#4da6ff',
    borderRadius: 999,
  },
  chartLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  inlineAction: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '900',
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
  cancelButton: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#dddddd',
    fontSize: 14,
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
  editText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '800',
  },
  measurementActions: {
    flexDirection: 'row',
    gap: 14,
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
