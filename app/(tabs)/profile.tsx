import { useCallback, useMemo, useState } from 'react';
import { Text, StyleSheet, FlatList, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { loadWorkouts } from '../../storage/workouts';
import { SavedWorkoutSession } from '../../types/workout';
import WorkoutHistoryCard from '../../components/WorkoutHistoryCard';
import { calculateExercisePRs } from '../../utils/calculatePRs';
import { calculateWeeklyStats } from '../../utils/calculateWeeklyStats';
import { calculateProfileStats } from '../../utils/calculateProfileStats';
import { formatWorkoutDuration } from '../../utils/formatDuration';
import { calculateWeeklyChart } from '../../utils/calculateWeeklyChart';

export default function ProfileScreen() {
  const [workouts, setWorkouts] = useState<SavedWorkoutSession[]>([]);

  const fetchWorkouts = async () => {
    const savedWorkouts = await loadWorkouts();
    setWorkouts(savedWorkouts);
  };

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const totalWorkouts = workouts.length;

  const exercisePRs = useMemo(() => {
    return calculateExercisePRs(workouts);
  }, [workouts]);

  const weeklyStats = useMemo(() => {
    return calculateWeeklyStats(workouts);
  }, [workouts]);

  const profileStats = useMemo(() => {
    return calculateProfileStats(workouts);
  }, [workouts]);

  const weeklyChart = useMemo(() => {
    return calculateWeeklyChart(workouts);
  }, [workouts]);

  const totalTrainingTime = formatWorkoutDuration(
    profileStats.totalDurationMinutes
  );
  const averageWorkoutTime = formatWorkoutDuration(
    profileStats.averageDurationMinutes
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WorkoutHistoryCard
            workout={item}
            onPress={() => router.push(`/workout/history/${item.id}`)}
          />
        )}
        ListHeaderComponent={
          <>
            <View style={styles.headerCard}>
              <View style={styles.headerTopRow}>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.title}>Profile</Text>
                  <Text style={styles.subtitle}>Your training summary in Reptra</Text>
                </View>

                <Pressable
                  style={styles.settingsButton}
                  onPress={() => router.push('/profile/settings')}
                >
                  <Text style={styles.settingsButtonText}>Settings</Text>
                </Pressable>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryPill}>
                  <Text style={styles.summaryPillValue}>{totalWorkouts}</Text>
                  <Text style={styles.summaryPillLabel}>Workouts</Text>
                </View>

                <View style={styles.summaryPill}>
                  <Text style={styles.summaryPillValue}>
                    {weeklyStats.workoutsThisWeek}
                  </Text>
                  <Text style={styles.summaryPillLabel}>This Week</Text>
                </View>

                <View style={styles.summaryPill}>
                  <Text style={styles.summaryPillValue}>{exercisePRs.length}</Text>
                  <Text style={styles.summaryPillLabel}>PRs</Text>
                </View>
              </View>

              <View style={styles.detailStatsCard}>
                <Text style={styles.detailStatsTitle}>Lifetime Stats</Text>

                <View style={styles.detailStatsGrid}>
                  <View style={styles.detailStatItem}>
                    <Text style={styles.detailStatValue}>
                      {profileStats.totalSets}
                    </Text>
                    <Text style={styles.detailStatLabel}>Sets Logged</Text>
                  </View>

                  <View style={styles.detailStatItem}>
                    <Text style={styles.detailStatValue}>
                      {profileStats.totalExercisesLogged}
                    </Text>
                    <Text style={styles.detailStatLabel}>Exercises Logged</Text>
                  </View>

                  <View style={styles.detailStatItem}>
                    <Text style={styles.detailStatValue}>
                      {totalTrainingTime || '--'}
                    </Text>
                    <Text style={styles.detailStatLabel}>Time Trained</Text>
                  </View>

                  <View style={styles.detailStatItem}>
                    <Text style={styles.detailStatValue}>
                      {averageWorkoutTime || '--'}
                    </Text>
                    <Text style={styles.detailStatLabel}>Avg Workout</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.quickActionsRow}>
              <Pressable
                style={styles.primaryActionButton}
                onPress={() => router.push('/profile/prs')}
              >
                <Text style={styles.primaryActionButtonText}>View PRs</Text>
              </Pressable>
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeaderRow}>
                <View>
                  <Text style={styles.chartTitle}>Weekly Activity</Text>
                  <Text style={styles.chartSubtitle}>
                    Your workouts across this week
                  </Text>
                </View>

                <View style={styles.chartBadge}>
                  <Text style={styles.chartBadgeValue}>
                    {weeklyStats.workoutsThisWeek}
                  </Text>
                  <Text style={styles.chartBadgeLabel}>Workouts</Text>
                </View>
              </View>

              <View style={styles.chartBarsRow}>
                {weeklyChart.days.map((day, index) => {
                  const barHeight =
                    weeklyChart.maxWorkouts > 0
                      ? Math.max(
                          18,
                          Math.round(
                            (day.workouts / weeklyChart.maxWorkouts) * 110
                          )
                        )
                      : 10;

                  const isToday = weeklyChart.todayIndex === index;
                  const isActive = day.workouts > 0;

                  return (
                    <View key={`${day.label}-${index}`} style={styles.chartBarColumn}>
                      <Text
                        style={[
                          styles.chartBarValue,
                          isToday && styles.chartBarValueToday,
                        ]}
                      >
                        {day.workouts}
                      </Text>

                      <View
                        style={[
                          styles.chartBarTrack,
                          isToday && styles.chartBarTrackToday,
                        ]}
                      >
                        <View
                          style={[
                            styles.chartBarFill,
                            { height: barHeight },
                            isActive && styles.chartBarFillActive,
                            isToday && styles.chartBarFillToday,
                          ]}
                        />
                      </View>

                      <Text
                        style={[
                          styles.chartBarLabel,
                          isToday && styles.chartBarLabelToday,
                        ]}
                      >
                        {day.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.chartFooterRow}>
                <View style={styles.chartFooterPill}>
                  <Text style={styles.chartFooterValue}>
                    {weeklyStats.setsThisWeek}
                  </Text>
                  <Text style={styles.chartFooterLabel}>Sets This Week</Text>
                </View>

                <View style={styles.chartFooterPill}>
                  <Text style={styles.chartFooterValue}>
                    {weeklyStats.exercisesThisWeek}
                  </Text>
                  <Text style={styles.chartFooterLabel}>Exercises This Week</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Workout History</Text>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No workouts yet. Finish a workout to see it here.
          </Text>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    paddingHorizontal: 14,
    paddingTop: 4,
    overflow: 'hidden',
  },
  headerCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 13,
  },
  settingsButton: {
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryPillValue: {
    color: '#4da6ff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
  },
  summaryPillLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '600',
  },
  detailStatsCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  detailStatsTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  detailStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailStatItem: {
    width: '48%',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  detailStatValue: {
    color: '#4da6ff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailStatLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '600',
  },
  quickActionsRow: {
    marginBottom: 18,
  },
  primaryActionButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryActionButtonText: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  chartTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  chartSubtitle: {
    color: '#aaaaaa',
    fontSize: 12,
  },
  chartBadge: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 76,
  },
  chartBadgeValue: {
    color: '#4da6ff',
    fontSize: 17,
    fontWeight: '700',
  },
  chartBadgeLabel: {
    color: '#aaaaaa',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  chartBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  chartBarColumn: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarValue: {
    color: '#7e7e7e',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  chartBarValueToday: {
    color: '#ffffff',
  },
  chartBarTrack: {
    width: 24,
    height: 110,
    borderRadius: 999,
    backgroundColor: '#121212',
    justifyContent: 'flex-end',
    padding: 3,
  },
  chartBarTrackToday: {
    borderWidth: 1,
    borderColor: '#24496d',
  },
  chartBarFill: {
    width: '100%',
    minHeight: 10,
    borderRadius: 999,
    backgroundColor: '#2a2a2a',
  },
  chartBarFillActive: {
    backgroundColor: '#4da6ff',
  },
  chartBarFillToday: {
    backgroundColor: '#7fc0ff',
  },
  chartBarLabel: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  chartBarLabelToday: {
    color: '#ffffff',
  },
  chartFooterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chartFooterPill: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  chartFooterValue: {
    color: '#4da6ff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  chartFooterLabel: {
    color: '#aaaaaa',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
  },
  listContent: {
    paddingBottom: 24,
  },
});
