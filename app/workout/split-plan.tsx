import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  loadTrainingSplitPlan,
  saveTrainingSplitPlan,
} from '../../storage/trainingSplit';
import {
  TrainingCategoryId,
  TrainingDayPlan,
  TrainingSplitPlan,
  WeekdayId,
} from '../../types/trainingSplit';
import {
  defaultTrainingSplitPlan,
  getTrainingCategory,
  trainingCategories,
  weekdays,
} from '../../utils/trainingSplit';

export default function SplitPlanScreen() {
  const [plan, setPlan] = useState<TrainingSplitPlan>(defaultTrainingSplitPlan);

  useFocusEffect(
    useCallback(() => {
      const fetchPlan = async () => {
        const savedPlan = await loadTrainingSplitPlan();
        setPlan(savedPlan);
      };

      fetchPlan();
    }, [])
  );

  const updateDay = (day: WeekdayId, categoryId: TrainingCategoryId) => {
    setPlan((currentPlan) => ({
      ...currentPlan,
      days: currentPlan.days.map((item): TrainingDayPlan =>
        item.day === day ? { ...item, categoryId } : item
      ),
    }));
  };

  const handleSave = async () => {
    await saveTrainingSplitPlan({
      ...plan,
      updatedAt: new Date().toISOString(),
    });

    Alert.alert('Split saved', 'Your weekly training split has been updated.', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset split?',
      'This sets every day back to Mixed. Your routines will not be changed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => setPlan(defaultTrainingSplitPlan),
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Training Split' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.topRow}>
          <View style={styles.topText}>
            <Text style={styles.title}>Weekly Split</Text>
            <Text style={styles.subtitle}>
              Assign each day to a training focus or rest day.
            </Text>
          </View>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {weekdays.map((weekday) => {
            const selectedDay =
              plan.days.find((day) => day.day === weekday.id) ||
              defaultTrainingSplitPlan.days.find(
                (day) => day.day === weekday.id
              ) ||
              defaultTrainingSplitPlan.days[0];
            const selectedCategory = getTrainingCategory(
              selectedDay.categoryId
            );

            return (
              <View key={weekday.id} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{weekday.label}</Text>
                  <Text style={styles.selectedCategory}>
                    {selectedCategory.label}
                  </Text>
                </View>
                <Text style={styles.dayDescription}>
                  {selectedCategory.description}
                </Text>

                <View style={styles.categoryGrid}>
                  {trainingCategories.map((category) => {
                    const isActive = selectedDay.categoryId === category.id;

                    return (
                      <Pressable
                        key={category.id}
                        style={[
                          styles.categoryChip,
                          isActive && styles.categoryChipActive,
                        ]}
                        onPress={() => updateDay(weekday.id, category.id)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            isActive && styles.categoryChipTextActive,
                          ]}
                        >
                          {category.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}

          <Pressable style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset To Mixed</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  topText: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
  },
  saveButton: {
    backgroundColor: '#4da6ff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveButtonText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '800',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  dayCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  dayHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  dayTitle: {
    color: '#ffffff',
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  selectedCategory: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '800',
  },
  dayDescription: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipActive: {
    backgroundColor: '#16324d',
    borderColor: '#4da6ff',
  },
  categoryChipText: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '800',
  },
  categoryChipTextActive: {
    color: '#4da6ff',
  },
  resetButton: {
    alignItems: 'center',
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 12,
    paddingVertical: 13,
  },
  resetButtonText: {
    color: '#ff8a8a',
    fontSize: 14,
    fontWeight: '800',
  },
});
