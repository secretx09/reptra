import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>App settings will go here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.text,
  },
  
  subtitle: {
    fontSize: 16,
    color: colors.text,
  },
});
//whattup