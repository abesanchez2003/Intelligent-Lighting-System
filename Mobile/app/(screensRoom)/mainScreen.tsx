import { Image, StyleSheet, Platform, Touchable, TouchableOpacity } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import { TextInput } from 'react-native-gesture-handler';
import { View, Button, Pressable, Text } from 'react-native';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { doc, getDocs, collection, getDoc } from "firebase/firestore";
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


const screenWidth = Dimensions.get('window').width;

export default function MainScreen() {
  const [offOnPress, setOffOnPress] = useState(0);
  const [userInfo, setUserInfo] = useState<any | undefined>(null);
  const [userName, setUserName] = useState<any | undefined>(null);
  const [tempValue, setTempValue] = useState(0);
  const gradientWidth = 300;
  const { roomName } = useLocalSearchParams();
  const roomKey = Array.isArray(roomName) ? roomName[0] : roomName;
  const [rooms, setRooms] = useState<{ [roomName: string]: { brightness: number; temperature: number } }>({});
  const [brightness, setBrightness] = useState(50);
  const [temperature, setTemperature] = useState(50);

  type Mode = 'movieNight' | 'work';
  const [currentMode, setCurrentMode] = useState<Mode | null>(null);
  const [customModes, setCustomModes] = useState<Record<Mode, { brightness: number; temperature: number }>>({
    movieNight: { brightness: 30, temperature: 90 },
    work: { brightness: 70, temperature: 50 },
  });
  const [previousValue, setPreviousValue] = useState<{ brightness: number; temperature: number }>({ brightness: 50, temperature: 50 });
  const navigation = useNavigation();
  const gradientRef = useRef<View>(null);
  

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
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  // const saveUserSettings = async (brightness: number, temperature: number) => {
  //   if (!userInfo) {
  //     console.error("User info is not available.");
  //     return;
  //   }
  
  //   try {
  //     const docRef = doc(db, "users", userInfo.uid);
  //     await updateDoc(docRef, { brightness, temperature });
  //     console.log("User settings saved:", { brightness, temperature });
  //   } catch (error) {
  //     console.error("Error saving user settings:", error);
  //   }
  // };

  const saveRoomSettings = async () => {
    if (!userInfo || !roomKey) return;
    try {
      const updatedRooms = {
        ...rooms,
        [roomKey]: { brightness, temperature }
      };
      setRooms(updatedRooms);
      const docRef = doc(db, "users", userInfo.uid);
      await updateDoc(docRef, { rooms: updatedRooms });
      console.log("Room settings saved:", updatedRooms[roomKey]);
    } catch (error) {
      console.error("Error saving room settings:", error);
    }
  };

  const saveCustomModes = async (modes: Record<Mode, { brightness: number; temperature: number }>) => {
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

  const toggleMode = (mode: Mode) => {
    if (currentMode === mode) {
      setCurrentMode(null);
      setBrightness(previousValue.brightness);
      setTemperature(previousValue.temperature);
    } else {
      setPreviousValue({
        brightness: brightness,
        temperature: temperature,
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

  // useEffect(() => {
  //   if (userInfo) {
  //     saveUserSettings(sliderValueBrightness, sliderValueTemp);
  //     saveCustomModes(customModes);
  //   }
  // }, [sliderValueBrightness, sliderValueTemp, customModes]);

  useEffect(() => {
    if (currentMode) {
      setCustomModes((prevModes) => ({
        ...prevModes,
        [currentMode]: {
          brightness: brightness,
          temperature: temperature,
        },
      }));
    }
  }, [brightness, temperature, currentMode]);

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


  let textlog = '';
  if (offOnPress % 2 == 1){
    textlog = 'ON';
  } else if (offOnPress % 2 == 0){
    textlog = 'OFF';
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/concept403.png')}
          style={styles.reactLogo}
        />
      }>
    {/* Back Button */}
    <ThemedView style={styles.headerContainer}>
        <Pressable
          onPress={() => navigation.navigate('(tabs)' as unknown as never)} // Navigate back to the Rooms screen
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
        <ThemedText type="subtitle">ON/OFF Switch</ThemedText>
        <SafeAreaProvider>
          <SafeAreaView>
            <Pressable
              onPress={() => {
                setOffOnPress(current => current + 1);
              }}
              style={({pressed}) => [
                {
                  backgroundColor: pressed ? 'rgb(56, 58, 60)' : 'black',
                },
                ]}>
              {({pressed}) => (
                <ThemedText type="defaultSemiBold">{pressed ? 'Pressed!' : 'ON/OFF Button'}</ThemedText>
              )}
            </Pressable>
            <ThemedText type="defaultSemiBold">{textlog}</ThemedText>
          </SafeAreaView>
        </SafeAreaProvider>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Brightness Controller</ThemedText>
        <ThemedText>{brightness}</ThemedText>
        <Slider style={{ width: '100%', height: 40 }} 
          minimumValue={0} 
          maximumValue={100}
          onValueChange={(value) => setBrightness(value)}
          step={1}
          value={brightness}
        />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Temperature Controller</ThemedText>
        <ThemedText>{temperature}</ThemedText>
        <View
          ref={gradientRef}
          style={{ width: gradientWidth, height: 40, borderRadius: 20, overflow: 'hidden' }}
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
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
      <ThemedText type="subtitle">Modes</ThemedText>
        <Pressable
          onPress={() => toggleMode('movieNight')}
          style={({pressed}) => [
            {
              backgroundColor: pressed
                ? 'rgb(56, 58, 60)'
                : currentMode === 'movieNight' ? 'blue' : 'black',
            },
          ]}
        >
          <ThemedText type="defaultSemiBold">
            {currentMode === 'movieNight' ? 'Movie Night (Active)' : 'Movie Night'}
          </ThemedText>
        </Pressable>
        
        <Pressable
          onPress={() => toggleMode('work')}
          style={({pressed}) => [
            {
              backgroundColor: pressed
                ? 'rgb(56, 58, 60)'
                : currentMode === 'work' ? 'blue' : 'black',
            },
          ]}
        >
          <ThemedText type="defaultSemiBold">
            {currentMode === 'work' ? 'Work (Active)' : 'Work'}
          </ThemedText>
        </Pressable>
      </ThemedView>
      
      <ThemedView style={styles.stepContainer}>
      <ThemedText type="subtitle">Sign Out</ThemedText>
          <TouchableOpacity style={styles.button} onPress={Modal}>
            <ThemedText type="defaultSemiBold">Sign Out</ThemedText>
          </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
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
    padding: 16,
    backgroundColor: '#007BFF', // Background color for the header
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
});
