import { StyleSheet, Text, TextInput, View } from "react-native";
import React, { useState } from "react";
import { Octicons } from "@expo/vector-icons";
import Ripple from "react-native-material-ripple";
import { useNavigation } from "expo-router";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { app } from '../api/firebase';
import { useColorScheme } from "react-native";

import { auth } from '../../(component)/api/firebase';

export default function LoginScreen() {
    // variables
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
    const colorScheme = useColorScheme();

    // functions for login and signup
    const handleLogin = async() => {
        try {
            const res = await signInWithEmailAndPassword(auth, userName, password);
            console.log(res);
        } catch(er: any) {
            alert("Incorrect username or password!");
        }
    }

    return (
        <View style={[styles.container,
            {backgroundColor : colorScheme === 'dark' ? '#000' : '#fff'}
        ]}>
            {/* Title */}
            <Text style={styles.title}>Context-Aware Lighting Control</Text>

            {/* input boxes for username & password */}
            <View style={styles.formInputWrapper}>
                <Octicons name="person" size={20} color="#0005" />
                <TextInput 
                    cursorColor={"#000"}
                    style={styles.input}
                    value={userName}
                    onChangeText={username => setUserName(username)}
                    placeholder='User Name' placeholderTextColor={"#000"}/>
            </View>
            <View style={styles.formInputWrapper}>
                <Octicons name="shield-lock" size={20} color="#0005" />
                <TextInput 
                    cursorColor={"#000"}
                    style={styles.input}
                    value={password}
                    onChangeText={password => setPassword(password)}
                    secureTextEntry={true}
                    placeholder='Password' placeholderTextColor={"#000"}/>
            </View>

            {/* Login Button */}
            <Ripple 
                style={{ marginTop : 20, backgroundColor : '#4CAF50', padding : 10, borderRadius : 5 }}
                // onPress={() => {
                //     // setIsLoading(true);
                //     // // Simulate a login process
                //     // setTimeout(() => {
                //     //     setIsLoading(false);
                //     //     alert('Login Successful!');
                //     // }, 2000);
                //     navigation.navigate('(tabs)' as unknown as never); // temporary navigation to the tabs screen
                // }}>
                onPress={handleLogin}>
                <Text style={{ color : '#fff', fontSize : 16 }}>{isLoading ? 'Loading...' : 'Login'}</Text>
            </Ripple>
            {/* Sign Up Button */}
            <Ripple 
                style={{ marginTop : 20, backgroundColor : '#4CAF50', padding : 10, borderRadius : 5 }}
                onPress={() => {
                    navigation.navigate('(component)/(auth)/signup' as unknown as never); // navigation to the signup screen
                }}>
                <Text style={{ color : '#fff', fontSize : 16 }}>{isLoading ? 'Loading...' : 'Sign Up'}</Text>
            </Ripple>
            {/* Forgot Password */}
            <Ripple 
                style={{ marginTop : 20, padding : 10, borderRadius : 5 }}
                onPress={() => {
                    navigation.navigate('(component)/(auth)/forgotpwd' as unknown as never); // navigation to the forgot password screen
                }}>
                <Text style={{ color : '#4CAF50', fontSize : 16 }}>{isLoading ? 'Loading...' : 'Forgot Password?'}</Text>
            </Ripple>
        </View>
    );
}

const styles = StyleSheet.create({
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
        textAlign: 'center',
    },
});