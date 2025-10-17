import { StyleSheet, Text, TextInput, View, Alert } from "react-native";
import React, { useState } from "react";
import Ripple from "react-native-material-ripple";
import { useNavigation } from "expo-router";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app } from '../api/firebase';
import { useColorScheme } from "react-native";

const auth = getAuth(app);

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
    const colorScheme = useColorScheme();

    const handleReset = async () => {
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert("Success", "Password reset email sent!");
            navigation.goBack();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to send reset email.");
        }
        setIsLoading(false);
    };

    return (
        <View style={[styles.container, {backgroundColor : colorScheme === 'dark' ? '#000' : '#fff'}]}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={{marginBottom: 20, color: "#555", textAlign: "center"}}>
                Enter your email address and we'll send you a link to reset your password.
            </Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <Ripple
                style={styles.button}
                onPress={handleReset}
                disabled={isLoading}
            >
                <Text style={{ color: '#fff', fontSize: 16 }}>
                    {isLoading ? 'Sending...' : 'Send Reset Email'}
                </Text>
            </Ripple>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        paddingHorizontal: 10,
        marginBottom: 20,
        backgroundColor: '#f7f9ef',
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
});