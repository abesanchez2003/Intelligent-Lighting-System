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
import { View, Text, Button, Pressable, FlatList, Alert } from 'react-native';
import { useEffect } from 'react';
import { app } from '../(component)/api/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Menu, Provider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native';


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
  const [menuVisible, setMenuVisible] = useState(false);
  const [roomKey, setRoomKey] = useState<string>('Home');
  const [syncingVisible, setSyncingVisible] = useState(false);
  const [syncingDone, setSyncingDone] = useState(false);
  const [syncingError, setSyncingError] = useState<string | null>(null);
  const REQUIRED_BOARD_ID = '8DNYTXQGVI';

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
        const keys = Object.keys(data.rooms || {});
        if (keys.length && !roomKey) setRoomKey(keys[0]);
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const addRoom = async () => {
    try {
      const newRoomName = `Room`;
      const updatedRooms = { ...rooms, [newRoomName]: { brightness: 50, temperature: 50, boardId: '' } };
      setRooms(updatedRooms);
      const docRef = doc(db, "users", userInfo.uid);
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

  const handleSignOut = async () => {
    Alert.alert(
      'Auth App',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await auth.signOut();
              router.push({ pathname: '/(component)/(auth)/login' });
            } catch (e) {
              console.warn('Sign out failed', e);
            }
          },
        },
      ]
    );
  };

  const confirmRenameRoom = async () => {
    if (renameRoomOldName && renameRoomValue.trim() !== '' && renameRoomValue !== renameRoomOldName) {
      const updatedRooms: any = { ...rooms };
      // preserve brightness/temperature/boardId
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
    <Provider>
    <SafeAreaView style={styles.container}>
      <FlatList
        data={Object.keys(rooms)}
        keyExtractor={(item) => item}
        ListHeaderComponent={
          <>
              <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 }}>
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                      <Pressable onPress={() => setMenuVisible(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginRight: 4 }}>{roomKey}</Text>
                        <Ionicons name="chevron-down" size={22} color="#4CAF50" />
                      </Pressable>
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      setMenuVisible(false);
                      handleSignOut();
                    }}
                    title="Sign Out"
                  />
                </Menu>
              </View>
            <Text style={[styles.title, { marginTop: 8 } ]}>Welcome, {userName || "User"}</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.roomRow}>
            <Pressable
              style={styles.roomButton}
              onPress={() => router.push({ pathname: '/(screensRoom)/mainScreen', params: { roomName: item } })}
            >
              <Text style={styles.roomButtonText}>{item}</Text>
            </Pressable>
            {/* Inline Board ID editor */}
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ fontSize: 12, color: '#555' }}>Board ID</Text>
              <TextInput
                value={(rooms as any)[item]?.boardId ?? ''}
                onChangeText={async (txt) => {
                  const updatedRooms: any = { ...rooms, [item]: { ...(rooms as any)[item], boardId: txt } };
                  setRooms(updatedRooms);
                }}
                onEndEditing={async () => {
                  const docRef = doc(db, "users", userInfo.uid);
                  await updateDoc(docRef, { rooms });
                  setSyncingDone(false);
                  setSyncingError(null);
                  setSyncingVisible(true);
                  setTimeout(() => {
                    const currentId = ((rooms as any)[item]?.boardId || '').trim();
                    if (currentId === REQUIRED_BOARD_ID) {
                      setSyncingDone(true);
                      setSyncingError(null);
                    } else {
                      setSyncingDone(true);
                      setSyncingError('Invalid Board ID. Please check and try again.');
                    }
                  }, 3000);
                }}
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  height: 36,
                  color: '#ffffff',          // white text
                  backgroundColor: '#000000' // optional dark background for contrast
                }}
                placeholder="e.g. room1, lab-01"
                placeholderTextColor="#aaaaaa"
              />
            </View>
            <Pressable style={styles.renameButton} onPress={() => handleRenameRoom(item)}>
              <Text style={styles.renameButtonText}>✏️</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={() => handleDeleteRoom(item)}>
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </Pressable>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.actions}>
            <Button title="Add Room" onPress={addRoom} />
          </View>
        }
      />
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
      <Modal
        visible={syncingVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSyncingVisible(false);
          setSyncingDone(false);
          setSyncingError(null);
        }}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#1f1f1f', padding: 20, borderRadius: 12, width: '80%', alignItems: 'center' }}>
            {!syncingDone ? (
              <>
                <Text style={{ color: '#fff', fontSize: 18, marginBottom: 12 }}>Syncing…</Text>
                <ActivityIndicator size="large" color="#4CAF50" />
              </>
            ) : (
              <>
                {syncingError ? (
                  <>
                    <Text style={{ color: '#ff6b6b', fontSize: 18, marginBottom: 12 }}>Sync failed</Text>
                    <Text style={{ color: '#ddd', fontSize: 14, marginBottom: 12, textAlign: 'center' }}>
                      {syncingError}
                    </Text>
                    <Pressable
                      style={{ marginTop: 8, backgroundColor: '#ff6b6b', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 }}
                      onPress={() => {
                        setSyncingVisible(false);
                        setSyncingDone(false);
                        setSyncingError(null);
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 16 }}>✖ Close</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Text style={{ color: '#fff', fontSize: 18, marginBottom: 12 }}>Syncing Complete!</Text>
                    <Pressable
                      style={{ marginTop: 8, backgroundColor: '#4CAF50', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 }}
                      onPress={() => {
                        setSyncingVisible(false);
                        setSyncingDone(false);
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 16 }}>✔ Close</Text>
                    </Pressable>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 32, // Add some bottom padding
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'left',
    marginTop: 8,
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
