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
import { Modal, TextInput } from 'react-native';
import { router } from 'expo-router';


const auth = getAuth(app);


export default function HomeScreen() {
  const [rooms, setRooms] = useState<{ [roomName: string]: { brightness: number; temperature: number } }>({});
  const [userInfo, setUserInfo] = useState<any | undefined>(null);
  const [userName, setUserName] = useState<any | undefined>(null);
  const navigation = useNavigation();
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameRoomIndex, setRenameRoomIndex] = useState<number | null>(null);
  const [renameRoomValue, setRenameRoomValue] = useState('');
  const [renameRoomOldName, setRenameRoomOldName] = useState<string | null>(null);

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
        setRooms(data.rooms || {}); // Set rooms from Firestore or default to an empty array
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
      const newRoomName = `Room ${Object.keys(rooms).length + 1}`;
      const updatedRooms = { ...rooms, [newRoomName]: { brightness: 50, temperature: 50 } };
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
      const roomNames = Object.keys(rooms);
      if (roomNames.length === 0) return;

      // Remove the last room in the list
      const roomToRemove = roomNames[roomNames.length - 1];
      const updatedRooms = { ...rooms };
      delete updatedRooms[roomToRemove];
      setRooms(updatedRooms);

      // Update Firestore
      const docRef = doc(db, "users", userInfo.uid);
      await updateDoc(docRef, { rooms: updatedRooms });
    } catch (error) {
      console.error("Error removing room:", error);
    }
  };

  const handleDeleteRoom = async (roomName: string) => {
    const updatedRooms = { ...rooms };
    delete updatedRooms[roomName];
    setRooms(updatedRooms);
    const docRef = doc(db, "users", userInfo.uid);
    await updateDoc(docRef, { rooms: updatedRooms });
  };

  const handleRenameRoom = (roomName: string) => {
    setRenameRoomOldName(roomName);
    setRenameRoomValue(roomName);
    setRenameModalVisible(true);
  };

  const confirmRenameRoom = async () => {
    if (renameRoomOldName && renameRoomValue.trim() !== '' && renameRoomValue !== renameRoomOldName) {
      const updatedRooms = { ...rooms };
      updatedRooms[renameRoomValue] = updatedRooms[renameRoomOldName];
      delete updatedRooms[renameRoomOldName];
      setRooms(updatedRooms);
      const docRef = doc(db, "users", userInfo.uid);
      await updateDoc(docRef, { rooms: updatedRooms });
      setRenameModalVisible(false);
      setRenameRoomOldName(null);
      setRenameRoomValue('');
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
        data={Object.keys(rooms)}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.roomRow}>
            <Pressable
              style={styles.roomButton}
              onPress={() => router.push({ pathname: '/(screensRoom)/mainScreen', params: { roomName: item } })}
            >
              <Text style={styles.roomButtonText}>{item}</Text>
            </Pressable>
            <Pressable
              style={styles.renameButton}
              onPress={() => handleRenameRoom(item)}
            >
              <Text style={styles.renameButtonText}>✏️</Text>
            </Pressable>
            <Pressable
              style={styles.deleteButton}
              onPress={() => handleDeleteRoom(item)}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </Pressable>
          </View>
        )}
        
      />
      <View style={styles.actions}>
        <Button title="Add Room" onPress={addRoom} />
      </View>
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View style={{
            backgroundColor: '#fff',
            padding: 20,
            borderRadius: 10,
            width: '80%',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Rename Room</Text>
            <TextInput
              value={renameRoomValue}
              onChangeText={setRenameRoomValue}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                padding: 10,
                width: '100%',
                marginBottom: 20
              }}
              placeholder="Enter new room name"
            />
            <Button title="Save" onPress={confirmRenameRoom} />
            <Button title="Cancel" color="#FF5252" onPress={() => setRenameModalVisible(false)} />
          </View>
        </View>
      </Modal>
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
    justifyContent: 'center',
    flex: 1,
  },
  roomButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Space buttons evenly
    alignItems: 'center', // Center buttons vertically
    paddingHorizontal: 16, // Add padding to ensure buttons are not cut off
    marginBottom: 16, // Add some bottom margin
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  deleteButton: {
    marginLeft: 8,
    backgroundColor: '#FF5252',
    padding: 8,
    borderRadius: 8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  renameButton: {
    marginLeft: 8,
    backgroundColor: '#FFD600',
    padding: 8,
    borderRadius: 8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renameButtonText: {
    color: '#333',
    fontSize: 16,
  },
});
