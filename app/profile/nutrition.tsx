import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  deleteDailyNutritionLogById,
  deleteSavedMealPresetById,
  loadDailyNutritionLogs,
  loadNutritionTargets,
  loadSavedMealPresets,
  saveDailyNutritionLogs,
  saveNutritionTargets,
  saveSavedMealPresets,
} from '../../storage/nutrition';
import {
  DailyNutritionLog,
  NutritionTargets,
  SavedMealPreset,
} from '../../types/nutrition';
import {
  calculateNutritionTotals,
  formatMacroValue,
  getNutritionLogsForDate,
  getNutritionProgress,
  getWeeklyNutritionChart,
  hasNutritionTargets,
} from '../../utils/nutrition';

const primaryTargetFields: {
  key: keyof Omit<NutritionTargets, 'updatedAt'>;
  label: string;
  suffix: string;
}[] = [
  { key: 'calories', label: 'Calories', suffix: '' },
  { key: 'protein', label: 'Protein', suffix: 'g' },
];

const advancedTargetFields: {
  key: keyof Omit<NutritionTargets, 'updatedAt'>;
  label: string;
  suffix: string;
}[] = [
  { key: 'carbs', label: 'Carbs', suffix: 'g' },
  { key: 'fat', label: 'Fat', suffix: 'g' },
  { key: 'water', label: 'Water', suffix: 'oz' },
];

const mealCategories = ['Meal', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Drink'];

function getDateFromOffset(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function getLogDateTime(date: Date) {
  const now = new Date();
  const loggedAt = new Date(date);
  loggedAt.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
  return loggedAt.toISOString();
}

function formatSelectedDate(offset: number, date: Date) {
  if (offset === 0) {
    return 'Today';
  }

  if (offset === -1) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function blankLogFields() {
  return {
    mealName: '',
    mealCategory: 'Meal',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    water: '',
    note: '',
  };
}

export default function NutritionScreen() {
  const [targets, setTargets] = useState<NutritionTargets>({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    water: '',
    updatedAt: '',
  });
  const [logs, setLogs] = useState<DailyNutritionLog[]>([]);
  const [mealPresets, setMealPresets] = useState<SavedMealPreset[]>([]);
  const [selectedDateOffset, setSelectedDateOffset] = useState(0);
  const [showAdvancedMacros, setShowAdvancedMacros] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [form, setForm] = useState(blankLogFields);

  const selectedDate = useMemo(
    () => getDateFromOffset(selectedDateOffset),
    [selectedDateOffset]
  );

  const fetchNutrition = useCallback(async () => {
    const [savedTargets, savedLogs, savedMeals] = await Promise.all([
      loadNutritionTargets(),
      loadDailyNutritionLogs(),
      loadSavedMealPresets(),
    ]);

    setTargets(savedTargets);
    setLogs(savedLogs);
    setMealPresets(savedMeals);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNutrition();
    }, [fetchNutrition])
  );

  const selectedLogs = useMemo(
    () => getNutritionLogsForDate(logs, selectedDate),
    [logs, selectedDate]
  );
  const selectedTotals = useMemo(
    () => calculateNutritionTotals(selectedLogs),
    [selectedLogs]
  );
  const weeklyChart = useMemo(() => getWeeklyNutritionChart(logs), [logs]);
  const primaryFields = showAdvancedMacros
    ? [...primaryTargetFields, ...advancedTargetFields]
    : primaryTargetFields;

  const updateForm = (key: keyof ReturnType<typeof blankLogFields>, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setForm(blankLogFields());
    setEditingLogId(null);
    setEditingMealId(null);
  };

  const handleUpdateTarget = (
    key: keyof Omit<NutritionTargets, 'updatedAt'>,
    value: string
  ) => {
    setTargets((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSaveTargets = async () => {
    const updatedTargets = {
      ...targets,
      updatedAt: new Date().toISOString(),
    };

    await saveNutritionTargets(updatedTargets);
    setTargets(updatedTargets);
    Alert.alert('Targets saved', 'Your nutrition targets were updated.');
  };

  const handleSaveLog = async () => {
    const hasEntry =
      form.calories.trim() ||
      form.protein.trim() ||
      form.carbs.trim() ||
      form.fat.trim() ||
      form.water.trim() ||
      form.note.trim() ||
      form.mealName.trim();

    if (!hasEntry) {
      Alert.alert('Missing entry', 'Add at least calories, protein, or a note.');
      return;
    }

    const noteParts = [form.mealName.trim(), form.note.trim()].filter(Boolean);

    if (editingLogId) {
      const updatedLogs = logs.map((log) =>
        log.id === editingLogId
          ? {
              ...log,
              calories: form.calories.trim(),
              protein: form.protein.trim(),
              carbs: form.carbs.trim(),
              fat: form.fat.trim(),
              water: form.water.trim(),
              note: noteParts.join(' - '),
            }
          : log
      );
      await saveDailyNutritionLogs(updatedLogs);
      resetForm();
      await fetchNutrition();
      return;
    }

    const newLog: DailyNutritionLog = {
      id: `nutrition-${Date.now()}`,
      loggedAt: getLogDateTime(selectedDate),
      calories: form.calories.trim(),
      protein: form.protein.trim(),
      carbs: form.carbs.trim(),
      fat: form.fat.trim(),
      water: form.water.trim(),
      note: noteParts.join(' - '),
    };

    await saveDailyNutritionLogs([newLog, ...logs]);
    resetForm();
    await fetchNutrition();
  };

  const handleEditLog = (log: DailyNutritionLog) => {
    setEditingLogId(log.id);
    setEditingMealId(null);
    setForm({
      mealName: '',
      mealCategory: 'Meal',
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat,
      water: log.water,
      note: log.note,
    });
  };

  const handleSaveMealPreset = async () => {
    const trimmedMealName = form.mealName.trim();

    if (!trimmedMealName) {
      Alert.alert('Missing meal name', 'Name this meal preset first.');
      return;
    }

    if (
      !form.calories.trim() &&
      !form.protein.trim() &&
      !form.carbs.trim() &&
      !form.fat.trim() &&
      !form.water.trim()
    ) {
      Alert.alert('Missing macros', 'Enter at least calories or protein first.');
      return;
    }

    if (editingMealId) {
      const updatedMeals = mealPresets.map((meal) =>
        meal.id === editingMealId
          ? {
              ...meal,
              name: trimmedMealName,
              category: form.mealCategory,
              calories: form.calories.trim(),
              protein: form.protein.trim(),
              carbs: form.carbs.trim(),
              fat: form.fat.trim(),
              water: form.water.trim(),
              note: form.note.trim(),
            }
          : meal
      );
      await saveSavedMealPresets(updatedMeals);
      resetForm();
      await fetchNutrition();
      Alert.alert('Meal updated', `${trimmedMealName} was updated.`);
      return;
    }

    const newMeal: SavedMealPreset = {
      id: `meal-${Date.now()}`,
      name: trimmedMealName,
      category: form.mealCategory,
      calories: form.calories.trim(),
      protein: form.protein.trim(),
      carbs: form.carbs.trim(),
      fat: form.fat.trim(),
      water: form.water.trim(),
      note: form.note.trim(),
      createdAt: new Date().toISOString(),
    };

    await saveSavedMealPresets([newMeal, ...mealPresets]);
    resetForm();
    await fetchNutrition();
    Alert.alert('Meal saved', `${newMeal.name} is ready for quick add.`);
  };

  const handleEditMealPreset = (meal: SavedMealPreset) => {
    setEditingMealId(meal.id);
    setEditingLogId(null);
    setForm({
      mealName: meal.name,
      mealCategory: meal.category || 'Meal',
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      water: meal.water,
      note: meal.note,
    });
  };

  const handleQuickAddMeal = async (meal: SavedMealPreset) => {
    const newLog: DailyNutritionLog = {
      id: `nutrition-${Date.now()}`,
      loggedAt: getLogDateTime(selectedDate),
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      water: meal.water,
      note: meal.note || `${meal.category || 'Meal'} - ${meal.name}`,
    };

    await saveDailyNutritionLogs([newLog, ...logs]);
    await fetchNutrition();
  };

  const handleDeleteMealPreset = (meal: SavedMealPreset) => {
    Alert.alert('Delete meal preset', `Remove "${meal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSavedMealPresetById(meal.id);
          await fetchNutrition();
        },
      },
    ]);
  };

  const handleDeleteLog = (log: DailyNutritionLog) => {
    Alert.alert('Delete nutrition entry', 'Remove this nutrition entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDailyNutritionLogById(log.id);
          await fetchNutrition();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Nutrition' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <FlatList
          data={selectedLogs}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              <View style={styles.headerCard}>
                <Text style={styles.kicker}>Reptra</Text>
                <Text style={styles.title}>Nutrition</Text>
                <Text style={styles.subtitle}>
                  Calories and protein stay front and center. Advanced macros are
                  still available when you want them.
                </Text>
              </View>

              <View style={styles.dateSwitcherCard}>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setSelectedDateOffset((current) => current - 1)}
                >
                  <Text style={styles.dateButtonText}>Previous</Text>
                </Pressable>

                <View style={styles.dateCenter}>
                  <Text style={styles.dateLabel}>
                    {formatSelectedDate(selectedDateOffset, selectedDate)}
                  </Text>
                  <Text style={styles.dateSubLabel}>
                    {selectedDate.toLocaleDateString([], {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.dateButton,
                    selectedDateOffset === 0 && styles.dateButtonDisabled,
                  ]}
                  disabled={selectedDateOffset === 0}
                  onPress={() => setSelectedDateOffset((current) => current + 1)}
                >
                  <Text style={styles.dateButtonText}>Next</Text>
                </Pressable>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Day Summary</Text>

                <View style={styles.progressGrid}>
                  {primaryFields.map((field) => {
                    const currentValue = selectedTotals[field.key];
                    const progress = getNutritionProgress(
                      currentValue,
                      targets[field.key]
                    );
                    const targetValue = Number(targets[field.key]) || 0;

                    return (
                      <View key={field.key} style={styles.progressItem}>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressLabel}>{field.label}</Text>
                          <Text style={styles.progressPercent}>
                            {Math.round(progress * 100)}%
                          </Text>
                        </View>
                        <Text style={styles.progressValue}>
                          {field.key === 'calories'
                            ? `${Math.round(currentValue)} / ${targetValue || '--'}`
                            : `${formatMacroValue(
                                currentValue,
                                field.suffix
                              )} / ${
                                targetValue
                                  ? formatMacroValue(targetValue, field.suffix)
                                  : '--'
                              }`}
                        </Text>
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${progress * 100}%` },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>Weekly Trend</Text>
                    <Text style={styles.helperText}>
                      Avg {Math.round(weeklyChart.averageCalories)} cal |{' '}
                      {Math.round(weeklyChart.averageProtein)}g protein
                    </Text>
                  </View>
                </View>

                <View style={styles.weeklyChartRow}>
                  {weeklyChart.days.map((day) => {
                    const height =
                      weeklyChart.maxCalories > 0
                        ? Math.max(
                            10,
                            Math.round((day.calories / weeklyChart.maxCalories) * 88)
                          )
                        : 10;

                    return (
                      <View key={day.key} style={styles.weeklyChartColumn}>
                        <Text style={styles.weeklyChartValue}>
                          {Math.round(day.calories)}
                        </Text>
                        <View style={styles.weeklyChartTrack}>
                          <View
                            style={[styles.weeklyChartFill, { height }]}
                          />
                        </View>
                        <Text style={styles.weeklyChartLabel}>{day.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>Targets</Text>
                    <Text style={styles.helperText}>
                      Keep this simple: calories and protein are the main numbers.
                    </Text>
                  </View>

                  <Pressable
                    style={styles.smallToggle}
                    onPress={() => setShowAdvancedMacros((current) => !current)}
                  >
                    <Text style={styles.smallToggleText}>
                      {showAdvancedMacros ? 'Hide Advanced' : 'Advanced'}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.inputGrid}>
                  {primaryFields.map((field) => (
                    <TextInput
                      key={field.key}
                      style={styles.gridInput}
                      placeholder={field.label}
                      placeholderTextColor="#777777"
                      keyboardType="numeric"
                      value={targets[field.key]}
                      onChangeText={(value) =>
                        handleUpdateTarget(field.key, value)
                      }
                    />
                  ))}
                </View>

                <Pressable style={styles.secondaryButton} onPress={handleSaveTargets}>
                  <Text style={styles.secondaryButtonText}>
                    {hasNutritionTargets(targets) ? 'Update Targets' : 'Save Targets'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                  {editingLogId
                    ? 'Edit Entry'
                    : editingMealId
                      ? 'Edit Saved Meal'
                      : 'Add Intake'}
                </Text>

                <TextInput
                  style={styles.fullInput}
                  placeholder="Meal name if saving as preset"
                  placeholderTextColor="#777777"
                  value={form.mealName}
                  onChangeText={(value) => updateForm('mealName', value)}
                />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryRow}
                >
                  {mealCategories.map((category) => {
                    const isSelected = form.mealCategory === category;

                    return (
                      <Pressable
                        key={category}
                        style={[
                          styles.categoryChip,
                          isSelected && styles.categoryChipSelected,
                        ]}
                        onPress={() => updateForm('mealCategory', category)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            isSelected && styles.categoryChipTextSelected,
                          ]}
                        >
                          {category}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.inputGrid}>
                  {primaryFields.map((field) => (
                    <TextInput
                      key={field.key}
                      style={styles.gridInput}
                      placeholder={field.label}
                      placeholderTextColor="#777777"
                      keyboardType="numeric"
                      value={form[field.key]}
                      onChangeText={(value) => updateForm(field.key, value)}
                    />
                  ))}
                </View>

                <TextInput
                  style={styles.noteInput}
                  placeholder="Optional note..."
                  placeholderTextColor="#777777"
                  multiline
                  value={form.note}
                  onChangeText={(value) => updateForm('note', value)}
                />

                <Pressable style={styles.primaryButton} onPress={handleSaveLog}>
                  <Text style={styles.primaryButtonText}>
                    {editingLogId ? 'Update Entry' : 'Add To Day'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.saveMealButton}
                  onPress={handleSaveMealPreset}
                >
                  <Text style={styles.saveMealButtonText}>
                    {editingMealId ? 'Update Saved Meal' : 'Save As Meal'}
                  </Text>
                </Pressable>

                {(editingLogId || editingMealId) && (
                  <Pressable style={styles.cancelButton} onPress={resetForm}>
                    <Text style={styles.cancelButtonText}>Cancel Editing</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>Saved Meals</Text>
                    <Text style={styles.helperText}>
                      Quick add meals to the selected day.
                    </Text>
                  </View>
                </View>

                {mealPresets.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.mealPresetRow}
                  >
                    {mealPresets.map((meal) => (
                      <View key={meal.id} style={styles.mealPresetCard}>
                        <Text style={styles.mealCategoryLabel}>
                          {meal.category || 'Meal'}
                        </Text>
                        <Text style={styles.mealPresetTitle}>{meal.name}</Text>
                        <Text style={styles.mealPresetMeta}>
                          {meal.calories || 0} cal | {meal.protein || 0}g protein
                        </Text>
                        <Pressable
                          style={styles.mealQuickAddButton}
                          onPress={() => handleQuickAddMeal(meal)}
                        >
                          <Text style={styles.mealQuickAddButtonText}>
                            Quick Add
                          </Text>
                        </Pressable>
                        <View style={styles.mealActionRow}>
                          <Pressable onPress={() => handleEditMealPreset(meal)}>
                            <Text style={styles.mealEditText}>Edit</Text>
                          </Pressable>
                          <Pressable onPress={() => handleDeleteMealPreset(meal)}>
                            <Text style={styles.mealDeleteText}>Delete</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.emptyText}>
                    No saved meals yet. Type calories/protein above, name the
                    meal, then save it as a preset.
                  </Text>
                )}
              </View>

              <Text style={styles.sectionTitle}>
                {formatSelectedDate(selectedDateOffset, selectedDate)} Entries
              </Text>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.logTitleWrap}>
                  <Text style={styles.logTime}>
                    {new Date(item.loggedAt).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                  {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
                </View>

                <View style={styles.logActionRow}>
                  <Pressable onPress={() => handleEditLog(item)}>
                    <Text style={styles.editText}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDeleteLog(item)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.macroRow}>
                <Text style={styles.macroPill}>{item.calories || 0} cal</Text>
                <Text style={styles.macroPill}>{item.protein || 0}g protein</Text>
                {showAdvancedMacros ? (
                  <>
                    <Text style={styles.macroPill}>{item.carbs || 0}g carbs</Text>
                    <Text style={styles.macroPill}>{item.fat || 0}g fat</Text>
                    <Text style={styles.macroPill}>{item.water || 0}oz water</Text>
                  </>
                ) : null}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No nutrition entries for this day yet.
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
  },
  dateSwitcherCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateButtonDisabled: {
    opacity: 0.35,
  },
  dateButtonText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '900',
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  dateSubLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  helperText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  smallToggle: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallToggleText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '900',
  },
  progressGrid: {
    gap: 10,
  },
  progressItem: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  progressLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  progressPercent: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '900',
  },
  progressValue: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#171717',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4da6ff',
    borderRadius: 999,
  },
  weeklyChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 7,
  },
  weeklyChartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyChartValue: {
    color: '#7e7e7e',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
  },
  weeklyChartTrack: {
    width: 22,
    height: 92,
    borderRadius: 999,
    backgroundColor: '#101010',
    justifyContent: 'flex-end',
    padding: 3,
  },
  weeklyChartFill: {
    width: '100%',
    backgroundColor: '#4da6ff',
    borderRadius: 999,
  },
  weeklyChartLabel: {
    color: '#aaaaaa',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 7,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
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
  },
  fullInput: {
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
  categoryRow: {
    gap: 8,
    paddingBottom: 12,
  },
  categoryChip: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#4da6ff',
    borderColor: '#4da6ff',
  },
  categoryChipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  categoryChipTextSelected: {
    color: '#111111',
  },
  noteInput: {
    backgroundColor: '#101010',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    minHeight: 78,
    paddingHorizontal: 12,
    paddingVertical: 11,
    textAlignVertical: 'top',
    fontSize: 15,
    marginBottom: 12,
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
  saveMealButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveMealButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#aaaaaa',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryButton: {
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
    fontWeight: '800',
  },
  logCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  mealPresetRow: {
    gap: 10,
    paddingRight: 4,
  },
  mealPresetCard: {
    width: 194,
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 14,
    padding: 12,
  },
  mealCategoryLabel: {
    color: '#4da6ff',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  mealPresetTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 5,
  },
  mealPresetMeta: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 10,
  },
  mealQuickAddButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    marginBottom: 9,
  },
  mealQuickAddButtonText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '900',
  },
  mealActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  mealEditText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '800',
  },
  mealDeleteText: {
    color: '#ff8a8a',
    fontSize: 12,
    fontWeight: '800',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  logTitleWrap: {
    flex: 1,
  },
  logTime: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  logActionRow: {
    alignItems: 'flex-end',
    gap: 8,
  },
  editText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '800',
  },
  deleteText: {
    color: '#ff8a8a',
    fontSize: 12,
    fontWeight: '800',
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroPill: {
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
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 14,
    lineHeight: 20,
  },
});
