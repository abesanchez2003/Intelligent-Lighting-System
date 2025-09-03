import { StyleSheet, Image, Platform } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Dimensions } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';
import { Alert } from 'react-native';
import { auth } from '../(component)/api/firebase';

const screenWidth = Dimensions.get('window').width;

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
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <Image
          source={require('@/assets/images/concept403.png')}
          style={styles.reactLogo}
        />
      }>
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
