import { StyleSheet, Text, TextInput, View } from "react-native";
import React, { useState } from "react";
import { Octicons } from "@expo/vector-icons";
import Ripple from "react-native-material-ripple";
import { useNavigation } from "expo-router";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from '../api/firebase';
import { useColorScheme } from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../api/firebase";
import { Dimensions } from "react-native";
import { KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

const auth = getAuth(app);

const screenWidth = Dimensions.get('window').width;

export default function SignUpScreen() {
    // variables
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState<number | string>('');
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
    const colorScheme = useColorScheme();

    // function for signup

    const handleIsSignup = async() => {
        const res = await createUserWithEmailAndPassword(auth, userName, password)
        .then((userCredential) => {
            const user = userCredential.user;
            setDoc(doc(db, "users", user.uid), {
                Name: name,
                Username: userName,
                Phone: phone,
            })
        }).then(() => alert("Account created successfully!"))
        .catch((error) => {
            alert(error.message);
        });
        console.log(res);
    }

    return (
        <View style={[styles.container,
            {backgroundColor : colorScheme === 'dark' ? '#000' : '#fff'}
        ]}>
            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()} // Navigate back to the login screen
            >
                <Ionicons name="arrow-back" size={24} color="#4CAF50" />
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            
            {/* Title */}
            <Text style={styles.title}>Sign Up</Text>
            <KeyboardAvoidingView behavior="padding" style={{ width: '100%' }}>
                {/* input boxes */}
                <View style={styles.emailContainer}>
                    <Text style={styles.emailText}>Name</Text>
                    <TextInput
                        style={styles.emailInput}
                        placeholder="Enter your name"
                        placeholderTextColor={"#000"}
                        value={name}
                        onChangeText={(text) => setName(text)}
                    />
                </View>

                <View style={styles.emailContainer}>
                    <Text style={styles.emailText}>Email</Text>
                    <TextInput
                        style={styles.emailInput}
                        placeholder="Enter your email"
                        placeholderTextColor={"#000"}
                        value={userName}
                        onChangeText={(text) => setUserName(text)}
                    />
                </View>

                <View style={styles.emailContainer}>
                    <Text style={styles.emailText}>Phone Number</Text>
                    <TextInput
                        style={styles.emailInput}
                        placeholder="Enter your phone number"
                        placeholderTextColor={"#000"}
                        value={phone?.toString()}
                        keyboardType="numeric"
                        onChangeText={(text) => setPhone(text)}
                    />
                </View>

                <View style={styles.emailContainer}>
                    <Text style={styles.emailText}>Password</Text>
                    <TextInput
                        style={styles.emailInput}
                        placeholder="Enter your password"
                        placeholderTextColor={"#000"}
                        secureTextEntry={true}
                        value={password}
                        onChangeText={(text) => setPassword(text)}
                    />
                </View>

                {/* Sign Up Button */}
                <Ripple 
                    style={{ marginTop : 20, backgroundColor : '#4CAF50', padding : 10, borderRadius : 5 }}
                    onPress={handleIsSignup}>
                    <Text style={{ color : '#fff', fontSize : 16 }}>{isLoading ? 'Loading...' : 'Sign Up'}</Text>
                </Ripple>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        position: "absolute",
        top: 50, // Adjust based on your layout
        left: 20,
    },
    backButtonText: {
        fontSize: 16,
        color: "#4CAF50",
        marginLeft: 8,
    },
    container : {
        flex : 1,
        width : '100%',
        justifyContent : 'center',
        alignItems : 'center'
    },
    formInputWrapper : {
        width : '90%',
        height : 55,
        backgroundColor : '#f7f9ef',
        borderWidth : 1,
        borderColor : '#0005',
        borderRadius : 6,
        flexDirection : 'row',
        alignItems : 'center',
        paddingLeft : 8
    },
    input : {
        width : '90%',
        height : '100%',
        marginLeft : 8,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 20,
        textAlign: 'left',
    },
    emailContainer: {
        marginTop: 20,
    },
    emailText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    },
    emailInput: {
        marginTop: 10,
        width: screenWidth,
        height: 50,
        backgroundColor: "#fff",
        borderColor: "#fff",
        borderWidth: 1,
        borderRadius: 8,
        paddingLeft: 10,
      },
});