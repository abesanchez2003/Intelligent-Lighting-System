import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Alert, View, Button } from 'react-native';

function SignOutButton() {
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', onPress: () => console.log('User signed out') },
    ]);
  };

  return (
    <View style={{ padding: 10 }}>
      <Button title="Sign Out" onPress={handleSignOut} color='#ffffff'/>
    </View>
  )

};

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="power"
        options={{
          title: 'Data',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="light.panel.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: 'Help Page',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="info" color={color} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About Us',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="questionmark.app.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
