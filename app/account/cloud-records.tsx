import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CloudRecordDetail,
  deleteAllCloudRecords,
  formatCloudRecordType,
  getCloudRecordDetails,
} from '../../services/cloudRecords';
import { loadCloudSyncStatus } from '../../storage/cloudSyncStatus';
import { CloudSyncStatus } from '../../types/cloudSync';

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

export default function CloudRecordsScreen() {
  const [records, setRecords] = useState<CloudRecordDetail[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus | null>(null);

  const groupedCounts = useMemo(() => {
    return records.reduce<Record<string, number>>((acc, record) => {
      const label = formatCloudRecordType(record.recordType);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
  }, [records]);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    const [recordResult, savedSyncStatus] = await Promise.all([
      getCloudRecordDetails(),
      loadCloudSyncStatus(),
    ]);
    setIsLoading(false);
    setStatusMessage(recordResult.message);
    setRecords(recordResult.records);
    setSyncStatus(savedSyncStatus);

    if (!recordResult.ok) {
      Alert.alert('Cloud records unavailable', recordResult.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRecords();
    }, [fetchRecords])
  );

  const handleDeleteCloudRecords = () => {
    Alert.alert(
      'Delete cloud backup?',
      'This deletes the Supabase backup records for this account only. It does not delete local workouts, routines, settings, or custom exercises from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Cloud Backup',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            const result = await deleteAllCloudRecords();
            const savedSyncStatus = await loadCloudSyncStatus();
            setIsLoading(false);
            setSyncStatus(savedSyncStatus);
            setStatusMessage(result.message);

            if (!result.ok) {
              Alert.alert('Delete failed', result.message);
              return;
            }

            setRecords([]);
            Alert.alert('Cloud backup deleted', result.message);
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Cloud Records' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Cloud Records</Text>
          <Text style={styles.subtitle}>
            View the records currently stored in Supabase for this account.
          </Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Backup Contents</Text>
            <Text style={styles.summaryValue}>{records.length}</Text>
            <Text style={styles.summaryText}>
              {statusMessage || 'Loading cloud records...'}
            </Text>

            {syncStatus?.lastMessage ? (
              <Text style={styles.syncMessage}>{syncStatus.lastMessage}</Text>
            ) : null}
          </View>

          <View style={styles.countGrid}>
            {Object.entries(groupedCounts).length > 0 ? (
              Object.entries(groupedCounts).map(([label, count]) => (
                <View key={label} style={styles.countCard}>
                  <Text style={styles.countValue}>{count}</Text>
                  <Text style={styles.countLabel}>{label}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No cloud records yet</Text>
                <Text style={styles.emptyText}>
                  Run Backup Local Data from the Account screen to create your
                  first Supabase backup.
                </Text>
              </View>
            )}
          </View>

          <Pressable
            style={styles.secondaryButton}
            onPress={fetchRecords}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#4da6ff" />
            ) : (
              <Text style={styles.secondaryButtonText}>Refresh Records</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.dangerButton}
            onPress={handleDeleteCloudRecords}
            disabled={isLoading || records.length === 0}
          >
            <Text style={styles.dangerButtonText}>Delete Cloud Backup</Text>
          </Pressable>

          <Text style={styles.warningText}>
            This reset only affects Supabase cloud backup records. Your local
            device data stays untouched.
          </Text>

          {records.map((record) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordType}>
                  {formatCloudRecordType(record.recordType)}
                </Text>
                <Text style={styles.recordDate}>
                  {formatDateTime(record.updatedAt)}
                </Text>
              </View>
              <Text style={styles.recordTitle}>{record.title}</Text>
              <Text style={styles.recordId}>Local ID: {record.localId}</Text>
            </View>
          ))}
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
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#101c29',
    borderWidth: 1,
    borderColor: '#294969',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  summaryTitle: {
    color: '#4da6ff',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 4,
  },
  summaryText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
  },
  syncMessage: {
    color: '#4da6ff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 10,
  },
  countGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  countCard: {
    width: '48%',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
  },
  countValue: {
    color: '#4da6ff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  countLabel: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    width: '100%',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 19,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    marginBottom: 10,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#4da6ff',
    fontSize: 14,
    fontWeight: '800',
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: '#2a1111',
    borderWidth: 1,
    borderColor: '#6b1f1f',
    borderRadius: 12,
    paddingVertical: 12,
  },
  dangerButtonText: {
    color: '#ff8a8a',
    fontSize: 14,
    fontWeight: '800',
  },
  warningText: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
    marginTop: 10,
  },
  recordCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  recordHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  recordType: {
    color: '#4da6ff',
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  recordDate: {
    color: '#aaaaaa',
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  recordTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  recordId: {
    color: '#aaaaaa',
    fontSize: 12,
    lineHeight: 18,
  },
});
