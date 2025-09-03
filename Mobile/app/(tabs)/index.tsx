import { StyleSheet, Image, Platform } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { doc, updateDoc } from "firebase/firestore";
import { setDoc } from "firebase/firestore";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../(component)/api/firebase";
import { useState } from 'react';
import { getDoc } from 'firebase/firestore';
import { View, Text, Button, Pressable, FlatList } from 'react-native';
import { useEffect } from 'react';
import { app } from '../(component)/api/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

const auth = getAuth(app);


export default function HomeScreen() {
  const [rooms, setRooms] = useState<string[]>([]);
  const [userInfo, setUserInfo] = useState<any | undefined>(null);
  const [userName, setUserName] = useState<any | undefined>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserInfo(user); // Set the user object
        console.log("User logged in:", user.uid);
      } else {
        console.log("No user is logged in.");
      }
    });

    return () => unsubscribe(); // Cleanup the listener
  }, []);

  const fetchRooms = async () => {
    if (!userInfo) {
      console.log("User info not available");
      return; // Ensure userInfo is available
    }
    try {
      const docRef = doc(db, "users", userInfo.uid); // Assuming userInfo contains uid
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setRooms(data.rooms || []); // Set rooms from Firestore or default to an empty array
        setUserName(data.Name); // Set userName from Firestore
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const addRoom = async () => {
    try {
      const newRoom = `Room ${rooms.length + 1}`;
      const updatedRooms = [...rooms, newRoom];
      setRooms(updatedRooms);

      // Update Firestore
      const docRef = doc(db, "users", userInfo.uid); // Assuming userInfo contains uid
      await updateDoc(docRef, { rooms: updatedRooms });
    } catch (error) {
      console.error("Error adding room:", error);
    }
  };

  const removeRoom = async () => {
    try {
      if (rooms.length === 0) return;

      const updatedRooms = rooms.slice(0, -1);
      setRooms(updatedRooms);

      // Update Firestore
      const docRef = doc(db, "users", userInfo.uid);
      await updateDoc(docRef, { rooms: updatedRooms });
    } catch (error) {
      console.error("Error removing room:", error);
    }
  };

  useEffect(() => {
    if (userInfo) {
      fetchRooms(); // Fetch rooms when userInfo is available
    }
  }, [userInfo]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome, {userName || "User"}</Text>
      <FlatList
        data={rooms}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Pressable style={styles.roomButton}
          onPress={() => {navigation.navigate("(screensRoom)" as unknown as never)}}
          >
            <Text style={styles.roomButtonText}>{item}</Text>
          </Pressable>
        )}
      />
      <View style={styles.actions}>
        <Button title="Add Room" onPress={addRoom} />
        <Button title="Remove Room" onPress={removeRoom} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32, // Add some bottom padding
    justifyContent: 'space-between', // Push content down
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'left',
    marginTop: 40,
},
  roomButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  roomButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Space buttons evenly
    alignItems: 'center', // Center buttons vertically
    paddingHorizontal: 16, // Add padding to ensure buttons are not cut off
    marginBottom: 16, // Add some bottom margin
  },
});
