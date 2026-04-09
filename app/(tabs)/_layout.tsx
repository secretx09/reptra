import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home' }}
      />

      <Tabs.Screen
        name="exercises"
        options={{ title: 'Exercises' }}
      />
      
      <Tabs.Screen
        name="routines"
        options={{ title: 'Routines' }}
      />

      <Tabs.Screen
        name="history"
        options={{ title: 'History' }}
      />

      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress' }}
      />

      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings' }}
      />
    </Tabs>
  );
}