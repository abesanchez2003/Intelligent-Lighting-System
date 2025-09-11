import { Image, StyleSheet, Platform, Touchable, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import { View, Button, Pressable, Text } from 'react-native';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { doc, getDocs, collection, getDoc } from "firebase/firestore";
import { Modal as RNModal } from 'react-native';
import { db } from "../(component)/api/firebase";
import { auth } from "../(component)/api/firebase";
import { Alert } from 'react-native';
import { useNavigation } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanResponder } from 'react-native';
import { useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Menu, Provider } from 'react-native-paper';
import { router } from 'expo-router';


const screenWidth = Dimensions.get('window').width;

export default function MainScreen() {
  const [offOnPress, setOffOnPress] = useState(0);
  const [userInfo, setUserInfo] = useState<any | undefined>(null);
  const [userName, setUserName] = useState<any | undefined>(null);
  const [tempValue, setTempValue] = useState(0);
  const gradientWidth = 300;
  const { roomName } = useLocalSearchParams();
  const roomKey = Array.isArray(roomName) ? roomName[0] : roomName;
  const [rooms, setRooms] = useState<{ [roomName: string]: { brightness: number; temperature: number; on: boolean } }>({});
  const [brightness, setBrightness] = useState(50);
  const [temperature, setTemperature] = useState(50);
  const [isOn, setIsOn] = useState(false);

  // Remove Mode type and use string keys for modes
  const [currentMode, setCurrentMode] = useState<string | null>(null);
  const [customModes, setCustomModes] = useState<Record<string, { brightness: number; temperature: number; on: boolean }>>({
    movieNight: { brightness: 30, temperature: 90, on: true },
    work: { brightness: 70, temperature: 50, on: false },
  });
  const [previousValue, setPreviousValue] = useState<{ brightness: number; temperature: number; on: boolean }>({ brightness: 50, temperature: 50, on: false });
  const navigation = useNavigation();
  const gradientRef = useRef<View>(null);
  const [isGradientActive, setIsGradientActive] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt) => {
      gradientRef.current?.measure((fx, fy, width, height, px, py) => {
        const x = evt.nativeEvent.pageX - px;
        const clampedX = Math.max(0, Math.min(x, gradientWidth));
        const value = Math.round((clampedX / gradientWidth) * 100);
        setTemperature(value); // <-- Link to temperature
      });
    },
    onPanResponderRelease: (evt) => {
      gradientRef.current?.measure((fx, fy, width, height, px, py) => {
        const x = evt.nativeEvent.pageX - px;
        const clampedX = Math.max(0, Math.min(x, gradientWidth));
        const value = Math.round((clampedX / gradientWidth) * 100);
        setTemperature(value); // <-- Link to temperature
      });
    },
  });
  
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

  const getData = async () => {
    if (!userInfo || !roomName) return;
    try {
      const docRef = doc(db, "users", userInfo.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setRooms(data.rooms || {});
        if (data.rooms && roomKey) {
          setBrightness(data.rooms[roomKey]?.brightness ?? 50);
          setTemperature(data.rooms[roomKey]?.temperature ?? 50);
          setIsOn(data.rooms[roomKey]?.on ?? false);
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const saveRoomSettings = async () => {
    if (!userInfo || !roomKey) return;
    try {
      const updatedRooms = {
        ...rooms,
        [roomKey]: { brightness, temperature, on: isOn }
      };
      setRooms(updatedRooms);
      const docRef = doc(db, "users", userInfo.uid);
      await updateDoc(docRef, { rooms: updatedRooms });
      console.log("Room settings saved:", updatedRooms[roomKey]);
    } catch (error) {
      console.error("Error saving room settings:", error);
    }
  };

  const saveCustomModes = async (modes: Record<string, { brightness: number; temperature: number; on: boolean }>) => {
    if (!userInfo) {
      console.error("User info is not available.");
      return;
    }
  
    try {
      const docRef = doc(db, "users", userInfo.uid);
      await updateDoc(docRef, { customModes: modes });
      console.log("Custom modes saved:", modes);
    } catch (error) {
      console.error("Error saving custom modes:", error);
    }
  };

  const toggleMode = (mode: string) => {
    if (currentMode === mode) {
      setCurrentMode(null);
      setBrightness(previousValue.brightness);
      setTemperature(previousValue.temperature);
    } else {
      setPreviousValue({
        brightness: brightness,
        temperature: temperature,
        on: isOn,
      });
      
      setCurrentMode(mode);
      setBrightness(customModes[mode].brightness);
      setTemperature(customModes[mode].temperature);
    }
  };
  
  useEffect(() => {
    if (userInfo) {
      getData();
    }
  }, [userInfo]);

  useEffect(() => {
    if (currentMode) {
      setCustomModes((prevModes) => ({
        ...prevModes,
        [currentMode]: {
          brightness: brightness,
          temperature: temperature,
          on: isOn,
        },
      }));
    }
  }, [brightness, temperature, currentMode]);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push({ pathname: '/(component)/(auth)/login' });
  };

  // Renamed to avoid conflict with RN Modal
  const SignOutAlert = () => {
    Alert.alert(
      "Auth App",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: handleSignOut,
        },
      ]
    );
  };

  // --- Mode CRUD State ---
  const [addModeModalVisible, setAddModeModalVisible] = useState(false);
  const [newModeName, setNewModeName] = useState('');
  const [renameModeModalVisible, setRenameModeModalVisible] = useState(false);
  const [renameModeOldName, setRenameModeOldName] = useState<string | null>(null);
  const [renameModeValue, setRenameModeValue] = useState('');
  // --- Mode CRUD Functions ---
  const addMode = async () => {
    if (!newModeName.trim() || customModes[newModeName]) return;
    const updatedModes = {
      ...customModes,
      [newModeName]: { brightness: 50, temperature: 50, on: false },
    };
    setCustomModes(updatedModes);
    setNewModeName('');
    setAddModeModalVisible(false);
    await saveCustomModes(updatedModes);
  };

  const removeMode = async (modeName: string) => {
    if (!customModes[modeName]) return;
    const updatedModes = { ...customModes };
    delete updatedModes[modeName];
    setCustomModes(updatedModes);
    if (currentMode === modeName) setCurrentMode(null);
    await saveCustomModes(updatedModes);
  };

  const handleRenameMode = (modeName: string) => {
    setRenameModeOldName(modeName);
    setRenameModeValue(modeName);
    setRenameModeModalVisible(true);
  };

  const confirmRenameMode = async () => {
    if (
      renameModeOldName &&
      renameModeValue.trim() !== '' &&
      renameModeValue !== renameModeOldName &&
      !customModes[renameModeValue]
    ) {
      const updatedModes = { ...customModes };
      updatedModes[renameModeValue] = updatedModes[renameModeOldName];
      delete updatedModes[renameModeOldName];
      setCustomModes(updatedModes);
      if (currentMode === renameModeOldName) setCurrentMode(renameModeValue);
      await saveCustomModes(updatedModes);
      setRenameModeModalVisible(false);
      setRenameModeOldName(null);
      setRenameModeValue('');
    }
  };

  const sendCommandToPi = async (command: string) => {
    try {
      const response = await fetch('http://192.168.5.30:5000/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await response.json();
      console.log('Response from Pi:', data);
    } catch (error) {
      console.error('Error sending command:', error);
    }
  };

// Usage example:
// sendCommandToPi('turn_on_light');

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ marginTop: 10, marginLeft: 8 }}></View>
        <Provider>
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <Pressable onPress={openMenu} style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#c2c2c2ff', marginRight: 4 }}>{roomKey}</Text>
              <Ionicons name="chevron-down" size={22} color="#c2c2c2ff" />
            </Pressable>
          }
        >
          {Object.keys(rooms).map(roomName => (
            <Menu.Item
              key={roomName}
              onPress={() => {
                closeMenu();
                router.push({ pathname: "/(screensRoom)/mainScreen", params: { roomName: roomName } });
              }}
              title={roomName}
            />
          ))}
          <Menu.Item
            onPress={() => {
              closeMenu();
              Alert.alert(
                "Auth App",
                "Are you sure you want to sign out?",
                [
                  {
                    text: "Cancel",
                    onPress: () => console.log("Cancel Pressed"),
                    style: "cancel",
                  },
                  {
                    text: "Logout",
                    onPress: handleSignOut,
                  },
                ]
              );
            }}
            title="Sign Out"
          />
        </Menu>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ScrollView scrollEnabled={!isGradientActive}>
            <ThemedView style={styles.headerContainer}>
              <Pressable
                onPress={() => navigation.navigate('(tabs)' as unknown as never)}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
                <ThemedText type="defaultSemiBold" style={styles.backButtonText}>
                  Back to Home
                </ThemedText>
              </Pressable>
            </ThemedView>

            <ThemedView style={styles.stepContainer}>
              <Button
                title="Save Room Settings"
                onPress={saveRoomSettings}
                color="#007BFF"
              />
            </ThemedView>

            <ThemedView style={styles.stepContainer}>
              <SafeAreaProvider>
                <SafeAreaView>
                  <Pressable
                    onPress={() => {
                      setIsOn(current => !current);
                      sendCommandToPi(isOn ? 'turn_off_light' : 'turn_on_light');
                    }}
                    style={({pressed}) => [
                      {
                        backgroundColor: pressed ? 'rgb(56, 58, 60)' : 'black',
                      },
                    ]}
                  >
                    <ThemedText type="defaultSemiBold">{isOn ? 'ON' : 'OFF'}</ThemedText>
                  </Pressable>

                </SafeAreaView>
              </SafeAreaProvider>
            </ThemedView>

            <ThemedView style={styles.stepContainer}>
              <ThemedText style={{ marginLeft: 12 }}>{brightness.toString()}</ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="bulb-outline" size={24} color="#888" style={{ marginRight: 8 }} />
                <Slider
                  style={{ flex: 1, height: 40 }}
                  minimumValue={0}
                  maximumValue={100}
                  onValueChange={(value) => setBrightness(value)}
                  step={1}
                  value={brightness}
                />
                <Ionicons name="bulb" size={24} color="#FFD600" style={{ marginLeft: 8 }} />
              </View>
            </ThemedView>

            <ThemedView style={styles.stepContainer}>
              <ThemedText style={{ marginLeft: 12 }}>{temperature.toString()}</ThemedText>
              <View style={{ alignItems: 'center' }}>
                <View
                  ref={gradientRef}
                  style={{ width: gradientWidth, height: 40, borderRadius: 20, overflow: 'hidden' }}
                  onTouchStart={() => setIsGradientActive(true)}
                  onTouchEnd={() => setIsGradientActive(false)}
                >
                  <LinearGradient
                    colors={['#FFFDE4', '#FFD600']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: '100%', height: '100%' }}
                  />
                  <View
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                    {...panResponder.panHandlers}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      left: Math.max(0, Math.min((temperature / 100) * gradientWidth - 10, gradientWidth - 20)),
                      top: 10,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: '#FFD600',
                      borderWidth: 2,
                      borderColor: '#FFFDE4',
                    }}
                  />
                </View>
              </View>
            </ThemedView>

            <ThemedView style={styles.stepContainer}>
              <ThemedText type="subtitle">Modes</ThemedText>
              {Object.keys(customModes).length === 0 && (
                <ThemedText>No modes yet. Add one below!</ThemedText>
              )}
              {Object.keys(customModes).map((modeName) => (
                <View key={modeName} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Pressable
                    onPress={() => toggleMode(modeName)}
                    style={({ pressed }) => [
                      {
                        backgroundColor: pressed
                          ? 'rgb(56, 58, 60)'
                          : currentMode === modeName ? 'blue' : 'black',
                        flex: 1,
                        padding: 8,
                        borderRadius: 8,
                        marginRight: 8,
                      },
                    ]}
                  >
                    <ThemedText type="defaultSemiBold">
                      {currentMode === modeName ? `${modeName} (Active)` : modeName}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={{ backgroundColor: '#FFD600', padding: 8, borderRadius: 8, marginRight: 4 }}
                    onPress={() => handleRenameMode(modeName)}
                  >
                    <Text style={{ color: '#333', fontSize: 16 }}>✏️</Text>
                  </Pressable>
                  <Pressable
                    style={{ backgroundColor: '#FF5252', padding: 8, borderRadius: 8 }}
                    onPress={() => removeMode(modeName)}
                  >
                    <Text style={{ color: '#fff', fontSize: 16 }}>🗑️</Text>
                  </Pressable>
                </View>
              ))}
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <Button title="Add Mode" onPress={() => setAddModeModalVisible(true)} />
              </View>
              {/* Add Mode Modal */}
              <RNModal
                visible={addModeModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setAddModeModalVisible(false)}
              >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, marginBottom: 10 }}>Add Mode</Text>
                    <TextInput
                      value={newModeName}
                      onChangeText={setNewModeName}
                      style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, width: '100%', marginBottom: 20 }}
                      placeholder="Enter new mode name"
                    />
                    <Button title="Save" onPress={addMode} />
                    <Button title="Cancel" color="#FF5252" onPress={() => setAddModeModalVisible(false)} />
                  </View>
                </View>
              </RNModal>
              {/* Rename Mode Modal */}
              <RNModal
                visible={renameModeModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setRenameModeModalVisible(false)}
              >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, marginBottom: 10 }}>Rename Mode</Text>
                    <TextInput
                      value={renameModeValue}
                      onChangeText={setRenameModeValue}
                      style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, width: '100%', marginBottom: 20 }}
                      placeholder="Enter new mode name"
                    />
                    <Button title="Save" onPress={confirmRenameMode} />
                    <Button title="Cancel" color="#FF5252" onPress={() => setRenameModeModalVisible(false)} />
                  </View>
                </View>
              </RNModal>
            </ThemedView>
          
          </ScrollView>
        </GestureHandlerRootView>
      </Provider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 300,
    width: screenWidth,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  input: {
    margin: 8,
    borderColor: "#000000",
    borderWidth: 1,
    alignSelf: 'center',
  },
  text: {
    fontSize: 16,
  },
  logBox: {
    padding: 20,
    margin: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  button: {
    padding: 10,
    borderRadius: 8,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    width: 200,
    marginTop: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 8, // less vertical padding
  paddingHorizontal: 16, // keep horizontal padding
  backgroundColor: '#007BFF', // Background color for the header
  minHeight: 48, // Optional: set a minimum height
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
});
