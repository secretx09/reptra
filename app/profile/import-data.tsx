import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { importAppData, parseAppDataImport } from '../../utils/importAppData';

export default function ImportDataScreen() {
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = () => {
    const trimmedInput = jsonInput.trim();

    if (!trimmedInput) {
      Alert.alert('Missing backup', 'Paste your exported JSON backup first.');
      return;
    }

    try {
      parseAppDataImport(trimmedInput);
    } catch (error) {
      Alert.alert(
        'Invalid backup',
        error instanceof Error
          ? error.message
          : 'This backup could not be validated.'
      );
      return;
    }

    Alert.alert(
      'Import backup?',
      'This will replace your current local Reptra data on this device with the pasted backup.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsImporting(true);
              await importAppData(trimmedInput);
              Alert.alert('Import complete', 'Your backup has been restored.', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              Alert.alert(
                'Import failed',
                error instanceof Error
                  ? error.message
                  : 'We could not restore that backup.'
              );
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Import Data' }} />

      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Import Data</Text>
            <Text style={styles.subtitle}>
              Paste a Reptra JSON export below to restore it on this device.
            </Text>

            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Backup JSON</Text>
              <TextInput
                style={styles.input}
                placeholder="Paste exported JSON here..."
                placeholderTextColor="#777777"
                multiline
                scrollEnabled
                value={jsonInput}
                onChangeText={setJsonInput}
                editable={!isImporting}
              />
              <Text style={styles.inputMeta}>
                {jsonInput.length.toLocaleString()} characters pasted
              </Text>
            </View>

            <Text style={styles.warningText}>
              Import replaces your current local data, so export first if you want a safety copy.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
          <Pressable
            style={[styles.importButton, isImporting && styles.importButtonDisabled]}
            onPress={handleImport}
            disabled={isImporting}
          >
            <Text style={styles.importButtonText}>
              {isImporting ? 'Importing...' : 'Import Backup'}
            </Text>
          </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  keyboardWrap: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 18,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#aaaaaa',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  inputCard: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  input: {
    maxHeight: 320,
    minHeight: 260,
    backgroundColor: '#0f0f0f',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#252525',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  inputMeta: {
    color: '#aaaaaa',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  footer: {
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: '#252525',
    padding: 16,
  },
  importButton: {
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#4da6ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  importButtonDisabled: {
    opacity: 0.6,
  },
  importButtonText: {
    color: '#4da6ff',
    fontSize: 15,
    fontWeight: '700',
  },
  warningText: {
    color: '#aaaaaa',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
});
