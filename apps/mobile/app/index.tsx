import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PMOSense</Text>
      <Text style={styles.subtitle}>AI-Assisted PMOS/PCOS Longitudinal Monitoring</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#090d16',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#c084fc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
