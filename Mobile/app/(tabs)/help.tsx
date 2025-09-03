import { StyleSheet, Image, Platform } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Dimensions } from 'react-native';
import { useNavigation } from 'expo-router';
import { Alert } from 'react-native';
import { auth } from '../(component)/api/firebase';
import { TouchableOpacity } from 'react-native';
import StepIndicator from 'react-native-step-indicator';
import { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { ScrollView } from 'react-native';


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
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <Image
          source={require('@/assets/images/concept403.png')}
          style={styles.reactLogo}
        />
      }>
      <View style={{ flex: 1, padding: 20 }}>
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

        <ThemedView style={styles.stepContainer2}>
          <ThemedText type="subtitle">Sign Out</ThemedText>
          <TouchableOpacity style={styles.button} onPress={Modal}>
            <ThemedText type="defaultSemiBold">Sign Out</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </ParallaxScrollView>
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
