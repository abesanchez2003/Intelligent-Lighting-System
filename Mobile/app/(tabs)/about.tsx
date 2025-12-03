import React from 'react';
import { StyleSheet, Image, Platform, View, Text, ScrollView as RNScrollView } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Dimensions } from 'react-native';
import { TouchableOpacity, Pressable } from 'react-native';
import { useNavigation, router } from 'expo-router';
import { Alert } from 'react-native';
import { auth } from '../(component)/api/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Provider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../(component)/api/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const screenWidth = Dimensions.get('window').width;

export default function TabThreeScreen() {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [rooms, setRooms] = useState<{ [roomName: string]: { brightness: number; temperature: number } }>({});
  const [userInfo, setUserInfo] = useState<any | undefined>(null);
  const [roomKey, setRoomKey] = useState<string>('About Us');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserInfo(user);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!userInfo) return;
      try {
        const docRef = doc(db, 'users', userInfo.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          const r = data.rooms || {};
          setRooms(r);
          const keys = Object.keys(r);
          if (keys.length && !roomKey) setRoomKey(keys[0]);
        }
      } catch (e) {
        console.warn('Failed to fetch rooms', e);
      }
    };
    fetchRooms();
  }, [userInfo]);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);
  const handleSignOut = async () => {
    await auth.signOut();
    navigation.navigate('(component)/(auth)/login' as unknown as never);

  };

  const Modal = () => {
    Alert.alert(
      "Auth App",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel", // Optional: Adds a "cancel" style to the button
        },
        {
          text: "Logout",
          onPress: handleSignOut, // Calls the handleSignOut function
        },
      ]
    );
  };
  return (
    <Provider>
    <SafeAreaView style={{ flex: 1 }}>
  <RNScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 }}>
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={
                <Pressable onPress={openMenu} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginRight: 4 }}>{roomKey}</Text>
                  <Ionicons name="chevron-down" size={22} color="#4CAF50" />
                </Pressable>
            }
          >
            <Menu.Item
              onPress={() => {
                closeMenu();
                Modal();
              }}
              title="Sign Out"
            />
          </Menu>
        </View>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">About Us</ThemedText>
        </ThemedView>
        <Collapsible title="Jackson Givens">
          <ThemedText>
            Senior electrical engineering student at Texas A&M University. Power-Delivery Subsystem lead for the Context-Aware Lighting Control Power-Delivery Subsystem.
          </ThemedText>
          <ThemedText>
            Experience: Electrical Design Intern at M&E Consulting
          </ThemedText>
        </Collapsible>
        <Collapsible title="Abraham Sanchez">
          <ThemedText>
            Senior electrical engineering student at Texas A&M University. Microcontroller/Machine Learning lead for the Context-Aware Lighting Control Microcontroller and Machine Learning Subsystems.
          </ThemedText>
          <ThemedText>
            Experience: Electrical Engineer Intern at CMC, Tech Ops Engineer at Amazon
          </ThemedText>
        </Collapsible>
        <Collapsible title="Austin Ngo">
          <ThemedText>
            Senior electrical engineering student at Texas A&M University. App lead for the Context-Aware Lighting Control App Subsystem.
          </ThemedText>
          <ThemedText>
            Experience: Software Engineer Intern at Raytheon Technologies, Supply Chain Engineer Intern at General Motors
          </ThemedText>
        </Collapsible>
  </RNScrollView>
    </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  reactLogo: {
    height: 300,
    width: screenWidth,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 0,
  },
  button: {
    padding: 10,
    borderRadius: 8,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    width: 200,
    marginTop: 0,
  },
});
