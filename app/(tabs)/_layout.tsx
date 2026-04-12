import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#111111',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor: '#2e2e2e',
        },
        tabBarActiveTintColor: '#4da6ff',
        tabBarInactiveTintColor: '#888888',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', headerTitle: 'Reptra' }}
      />
      <Tabs.Screen
        name="workout"
        options={{ title: 'Workout', headerTitle: 'Reptra' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', headerTitle: 'Reptra' }}
      />
    </Tabs>
  );
}