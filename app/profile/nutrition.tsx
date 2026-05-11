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
  deleteCustomNutritionFoodById,
  deleteSavedMealPresetById,
  loadCustomNutritionFoods,
  loadDailyNutritionLogs,
  loadNutritionTargets,
  loadSavedMealPresets,
  saveCustomNutritionFoods,
  saveDailyNutritionLogs,
  saveNutritionTargets,
  saveSavedMealPresets,
} from '../../storage/nutrition';
import { commonFoods } from '../../data/commonFoods';
import {
  DailyNutritionLog,
  NutritionFood,
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
const mealCategoryFilters = ['All', ...mealCategories];

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
  const [customFoods, setCustomFoods] = useState<NutritionFood[]>([]);
  const [selectedDateOffset, setSelectedDateOffset] = useState(0);
  const [selectedMealCategory, setSelectedMealCategory] = useState('All');
  const [foodSearch, setFoodSearch] = useState('');
  const [servingMultiplier, setServingMultiplier] = useState('1');
  const [showAdvancedMacros, setShowAdvancedMacros] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [form, setForm] = useState(blankLogFields);

  const selectedDate = useMemo(
    () => getDateFromOffset(selectedDateOffset),
    [selectedDateOffset]
  );

  const fetchNutrition = useCallback(async () => {
    const [savedTargets, savedLogs, savedMeals, savedCustomFoods] =
      await Promise.all([
      loadNutritionTargets(),
      loadDailyNutritionLogs(),
      loadSavedMealPresets(),
      loadCustomNutritionFoods(),
    ]);

    setTargets(savedTargets);
    setLogs(savedLogs);
    setMealPresets(savedMeals);
    setCustomFoods(savedCustomFoods);
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
  const filteredMealPresets = useMemo(() => {
    if (selectedMealCategory === 'All') {
      return mealPresets;
    }

    return mealPresets.filter(
      (meal) => (meal.category || 'Meal') === selectedMealCategory
    );
  }, [mealPresets, selectedMealCategory]);
  const searchableFoods = useMemo(
    () => [...customFoods, ...commonFoods],
    [customFoods]
  );
  const filteredFoods = useMemo(() => {
    const normalizedSearch = foodSearch.trim().toLowerCase();

    return searchableFoods
      .filter((food) => {
        if (!normalizedSearch) {
          return true;
        }

        return `${food.name} ${food.brand} ${food.category}`
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .slice(0, 12);
  }, [foodSearch, searchableFoods]);
  const primaryFields = showAdvancedMacros
    ? [...primaryTargetFields, ...advancedTargetFields]
    : primaryTargetFields;
  const calorieTarget = Number(targets.calories) || 0;
  const proteinTarget = Number(targets.protein) || 0;
  const caloriesRemaining = calorieTarget - selectedTotals.calories;
  const proteinRemaining = proteinTarget - selectedTotals.protein;
  const multiplier = Math.max(Number(servingMultiplier) || 1, 0.25);

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

  const handleDuplicateLog = async (log: DailyNutritionLog) => {
    const duplicatedLog: DailyNutritionLog = {
      ...log,
      id: `nutrition-${Date.now()}`,
      loggedAt: getLogDateTime(selectedDate),
    };

    await saveDailyNutritionLogs([duplicatedLog, ...logs]);
    await fetchNutrition();
  };

  const handleCopyPreviousDay = async () => {
    const previousDate = new Date(selectedDate);
    previousDate.setDate(selectedDate.getDate() - 1);
    const previousLogs = getNutritionLogsForDate(logs, previousDate);

    if (previousLogs.length === 0) {
      Alert.alert(
        'Nothing to copy',
        'The previous day does not have any nutrition entries yet.'
      );
      return;
    }

    const copiedLogs = previousLogs.map((log, index) => ({
      ...log,
      id: `nutrition-copy-${Date.now()}-${index}`,
      loggedAt: getLogDateTime(selectedDate),
    }));

    await saveDailyNutritionLogs([...copiedLogs, ...logs]);
    await fetchNutrition();
    Alert.alert(
      'Day copied',
      `${previousLogs.length} entr${
        previousLogs.length === 1 ? 'y was' : 'ies were'
      } copied.`
    );
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

  const handleQuickAddFood = async (food: NutritionFood) => {
    const newLog: DailyNutritionLog = {
      id: `nutrition-${Date.now()}`,
      loggedAt: getLogDateTime(selectedDate),
      calories: String(Math.round((Number(food.calories) || 0) * multiplier)),
      protein: String(Math.round((Number(food.protein) || 0) * multiplier)),
      carbs: '',
      fat: '',
      water: '',
      note: `${food.name} (${servingMultiplier || '1'} x ${food.serving})`,
    };

    await saveDailyNutritionLogs([newLog, ...logs]);
    await fetchNutrition();
  };

  const handleUseFoodInForm = (food: NutritionFood) => {
    setForm((current) => ({
      ...current,
      mealName: food.name,
      calories: String(Math.round((Number(food.calories) || 0) * multiplier)),
      protein: String(Math.round((Number(food.protein) || 0) * multiplier)),
      note: `${food.brand} - ${servingMultiplier || '1'} x ${food.serving}`,
    }));
  };

  const handleSaveCustomFood = async () => {
    const trimmedName = form.mealName.trim();

    if (!trimmedName || (!form.calories.trim() && !form.protein.trim())) {
      Alert.alert(
        'Missing food',
        'Enter a food name plus calories or protein before saving it.'
      );
      return;
    }

    const newFood: NutritionFood = {
      id: `custom-food-${Date.now()}`,
      name: trimmedName,
      brand: form.note.trim() || 'Custom',
      serving: '1 serving',
      calories: form.calories.trim(),
      protein: form.protein.trim(),
      category: form.mealCategory,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    await saveCustomNutritionFoods([newFood, ...customFoods]);
    setFoodSearch(trimmedName);
    await fetchNutrition();
    Alert.alert('Food saved', `${newFood.name} was added to your food lookup.`);
  };

  const handleDeleteCustomFood = (food: NutritionFood) => {
    Alert.alert('Delete custom food', `Remove "${food.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomNutritionFoodById(food.id);
          await fetchNutrition();
        },
      },
    ]);
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

                <View style={styles.remainingRow}>
                  <View style={styles.remainingCard}>
                    <Text style={styles.remainingLabel}>Calories Left</Text>
                    <Text
                      style={[
                        styles.remainingValue,
                        caloriesRemaining < 0 && styles.remainingValueOver,
                      ]}
                    >
                      {calorieTarget ? Math.round(caloriesRemaining) : '--'}
                    </Text>
                    <Text style={styles.remainingMeta}>
                      {caloriesRemaining < 0 ? 'over target' : 'remaining'}
                    </Text>
                  </View>

                  <View style={styles.remainingCard}>
                    <Text style={styles.remainingLabel}>Protein Left</Text>
                    <Text
                      style={[
                        styles.remainingValue,
                        proteinRemaining < 0 && styles.remainingValueOver,
                      ]}
                    >
                      {proteinTarget ? `${Math.round(proteinRemaining)}g` : '--'}
                    </Text>
                    <Text style={styles.remainingMeta}>
                      {proteinRemaining < 0 ? 'over target' : 'remaining'}
                    </Text>
                  </View>
                </View>

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

                <Pressable
                  style={styles.copyDayButton}
                  onPress={handleCopyPreviousDay}
                >
                  <Text style={styles.copyDayButtonText}>
                    Copy Previous Day Into{' '}
                    {formatSelectedDate(selectedDateOffset, selectedDate)}
                  </Text>
                </Pressable>
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
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>Food Lookup</Text>
                    <Text style={styles.helperText}>
                      Search common foods or your custom foods, then quick add
                      calories and protein.
                    </Text>
                  </View>
                </View>

                <View style={styles.foodSearchRow}>
                  <TextInput
                    style={styles.foodSearchInput}
                    placeholder="Search chicken, oats, protein..."
                    placeholderTextColor="#777777"
                    value={foodSearch}
                    onChangeText={setFoodSearch}
                  />

                  <TextInput
                    style={styles.servingInput}
                    placeholder="1"
                    placeholderTextColor="#777777"
                    keyboardType="numeric"
                    value={servingMultiplier}
                    onChangeText={setServingMultiplier}
                  />
                </View>

                <Text style={styles.lookupHint}>
                  Serving multiplier: {servingMultiplier || '1'}x
                </Text>

                <View style={styles.foodList}>
                  {filteredFoods.map((food) => (
                    <View key={food.id} style={styles.foodCard}>
                      <View style={styles.foodTextWrap}>
                        <Text style={styles.foodTitle}>{food.name}</Text>
                        <Text style={styles.foodMeta}>
                          {food.brand} | {food.serving} | {food.calories} cal |{' '}
                          {food.protein}g protein
                        </Text>
                        <Text style={styles.foodCategory}>
                          {food.isCustom ? 'Custom' : food.category}
                        </Text>
                      </View>

                      <View style={styles.foodActionColumn}>
                        <Pressable
                          style={styles.foodSmallButton}
                          onPress={() => handleQuickAddFood(food)}
                        >
                          <Text style={styles.foodSmallButtonText}>Add</Text>
                        </Pressable>
                        <Pressable onPress={() => handleUseFoodInForm(food)}>
                          <Text style={styles.foodFillText}>Fill</Text>
                        </Pressable>
                        {food.isCustom ? (
                          <Pressable onPress={() => handleDeleteCustomFood(food)}>
                            <Text style={styles.foodDeleteText}>Delete</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
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

                <Pressable
                  style={styles.customFoodButton}
                  onPress={handleSaveCustomFood}
                >
                  <Text style={styles.customFoodButtonText}>
                    Save As Custom Food
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

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryRow}
                >
                  {mealCategoryFilters.map((category) => {
                    const isSelected = selectedMealCategory === category;

                    return (
                      <Pressable
                        key={category}
                        style={[
                          styles.categoryChip,
                          isSelected && styles.categoryChipSelected,
                        ]}
                        onPress={() => setSelectedMealCategory(category)}
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

                {filteredMealPresets.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.mealPresetRow}
                  >
                    {filteredMealPresets.map((meal) => (
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
                    No saved meals match this filter yet.
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
                  <Pressable onPress={() => handleDuplicateLog(item)}>
                    <Text style={styles.editText}>Duplicate</Text>
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
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  smallToggleText: {
    color: '#4da6ff',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },
  remainingRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  remainingCard: {
    flex: 1,
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 14,
    padding: 12,
  },
  remainingLabel: {
    color: '#9dbbda',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  remainingValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 3,
  },
  remainingValueOver: {
    color: '#ff8a8a',
  },
  remainingMeta: {
    color: '#aaaaaa',
    fontSize: 11,
    fontWeight: '800',
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
  copyDayButton: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    marginTop: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },
  copyDayButtonText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '900',
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
  customFoodButton: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  customFoodButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  foodSearchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  foodSearchInput: {
    flex: 1,
    backgroundColor: '#101010',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  servingInput: {
    width: 72,
    backgroundColor: '#101010',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    textAlign: 'center',
  },
  lookupHint: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  foodList: {
    gap: 10,
  },
  foodCard: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  foodTextWrap: {
    flex: 1,
  },
  foodTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  foodMeta: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 5,
  },
  foodCategory: {
    color: '#4da6ff',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  foodActionColumn: {
    alignItems: 'flex-end',
    gap: 8,
  },
  foodSmallButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  foodSmallButtonText: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '900',
  },
  foodFillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  foodDeleteText: {
    color: '#ff8a8a',
    fontSize: 12,
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
