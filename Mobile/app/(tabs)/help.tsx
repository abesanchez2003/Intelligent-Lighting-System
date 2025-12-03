import { StyleSheet, Image, Platform, View, Text, Pressable, ScrollView } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
// Removed ParallaxScrollView in favor of a standard layout with a dropdown header
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Dimensions } from 'react-native';
import { useNavigation, router } from 'expo-router';
import { Alert } from 'react-native';
import { auth } from '../(component)/api/firebase';
import { TouchableOpacity } from 'react-native';
import StepIndicator from 'react-native-step-indicator';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Provider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../(component)/api/firebase';
import { onAuthStateChanged } from 'firebase/auth';


const screenWidth = Dimensions.get('window').width;
const labels = [
  'Plug in the system',
  'Connect to Wi-Fi',
  'Place sensors',
  'Set preferences',
  'Enable notifications',
  'Run a test',
];

const customStyles = {
  stepIndicatorSize: 30,
  currentStepIndicatorSize: 40,
  separatorStrokeWidth: 2,
  currentStepStrokeWidth: 3,
  stepStrokeCurrentColor: '#4aae4f',
  stepStrokeWidth: 3,
  stepStrokeFinishedColor: '#4aae4f',
  stepStrokeUnFinishedColor: '#aaaaaa',
  separatorFinishedColor: '#4aae4f',
  separatorUnFinishedColor: '#aaaaaa',
  stepIndicatorFinishedColor: '#4aae4f',
  stepIndicatorUnFinishedColor: '#ffffff',
  stepIndicatorCurrentColor: '#ffffff',
  stepIndicatorLabelFontSize: 12,
  currentStepIndicatorLabelFontSize: 12,
  stepIndicatorLabelCurrentColor: '#4aae4f',
  stepIndicatorLabelFinishedColor: '#ffffff',
  stepIndicatorLabelUnFinishedColor: '#aaaaaa',
  labelColor: '#999999',
  labelSize: 13,
  currentStepLabelColor: '#4aae4f',
};

export default function TabThreeScreen() {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [rooms, setRooms] = useState<{ [roomName: string]: { brightness: number; temperature: number } }>({});
  const [userInfo, setUserInfo] = useState<any | undefined>(null);
  const [roomKey, setRoomKey] = useState<string>('Help');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserInfo(user);
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

  

  const [currentPosition, setCurrentPosition] = useState(0);

  return (
    <Provider>
    <SafeAreaView style={{ flex: 1 }}>
  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
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
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4aae4f' }}>
          Setup Instructions:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <StepIndicator
            customStyles={customStyles}
            currentPosition={currentPosition}
            stepCount={labels.length} // Total number of steps
            labels={labels} // Pass all labels directly to StepIndicator
            onPress={(position) => setCurrentPosition(position)} // Handle step clicks
          />
        </ScrollView>
        <View style={{ marginTop: 20 }}>
          {currentPosition === 0 && (
            <Text style={styles.descriptionText}>Ensure the system is plugged into a power outlet and verify that the device is powered on.</Text>
          )}
          {currentPosition === 1 && (
            <Text style={styles.descriptionText}>Follow on-screen instructions to connect the system to a Wi-Fi network.</Text>
          )}
          {currentPosition === 2 && (
            <Text style={styles.descriptionText}>Place the motion sensor, camera, and ambient light sensor in their respective locations.</Text>
          )}
          {currentPosition === 3 && (
            <Text style={styles.descriptionText}>Set brightness preferences based on detected motion and ambient light levels.</Text>
          )}
          {currentPosition === 4 && (
            <Text style={styles.descriptionText}>Enable notifications for detected movement.</Text>
          )}
          {currentPosition === 5 && (
            <Text style={styles.descriptionText}>Run a test to ensure all sensors and automation features work correctly.</Text>
          )}
        </View>

        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">How to use the app:</ThemedText>
          <ThemedText type="default">Adding and Deleting Rooms:</ThemedText>
          <Image
            source={require('@/assets/images/trim.D84CB4B8-4CE7-4AB7-9EB7-EF226F1301A0.gif')} // Replace with your GIF path
            style={styles.gifStyle}
          />
          <ThemedText type="default">Using the Sliders and Buttons to Control the Lights:</ThemedText>
          <Image
            source={require('@/assets/images/trim.7049299E-D081-42A3-9EF2-0DBD27A0596F.gif')} // Replace with your GIF path
            style={styles.gifStyle}
          />
          <ThemedText type="default">Navigate to the Power Efficiency Tab on the bottom tabs to learn how much power you saved using our system.</ThemedText>
        </ThemedView>
      </ScrollView>
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
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  reactLogo: {
    height: 300,
    width: screenWidth,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  stepContainer: {
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
  },
  stepContainer2: {
    gap: 8,
    marginTop: 20,
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
  stepLabel: {
    textAlign: 'center', // Center-align the text
    flexWrap: 'wrap', // Allow text to wrap to the next line
    fontSize: 14, // Adjust font size for readability
    color: '#666666', // Default label color
    width: 100, // Set a fixed width to prevent awkward wrapping
    marginTop: 8, // Add spacing between the label and the step indicator
  },
  currentStepLabel: {
    color: '#4aae4f', // Highlight the current step label
    fontWeight: 'bold', // Make the current step label bold
  },
  descriptionText: {
    fontSize: 16, // Adjust font size for readability
    color: '#fff', // Set the desired text color (green in this case)
    lineHeight: 24, // Add spacing between lines for better readability
    textAlign: 'left', // Align text to the left
  },
  gifStyle: {
    width: '100%', // Full width
    height: 400, // Adjust height as needed
    resizeMode: 'contain', // Ensure the GIF fits within the container
    marginVertical: 20, // Add spacing around the GIF
  },
});
