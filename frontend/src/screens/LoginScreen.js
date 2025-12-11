import React, { useState, useContext } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { AuthContext } from "../navigation/AuthContext"; 
import { BASE } from "../navigation/api";
import { Ionicons } from "@expo/vector-icons";

const showMessage = (message) => {
    console.log(`[USER MESSAGE] ${message}`);
};

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { login } = useContext(AuthContext); 

    const handleLogin = async () => {
        try {
            const res = await fetch(`${BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (res.ok && data.session) {
                const userRes = await fetch(`${BASE}/auth/user/${data.session.user_id}`);
                const userData = await userRes.json();

                await login({
                    token: data.session.token,
                    user: userData, 
                });
                
                showMessage("Login successful!");
            } else {
                showMessage(data.detail || data.error || "Invalid credentials");
            }
        } catch (err) {
            console.error("Login error:", err);
            showMessage("Error connecting to server");
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles.header}>
                <View style={{ width: 24 }} /> 
                <Text style={styles.logo}>VROOM</Text>
                <TouchableOpacity style={styles.helpButton}>
                    <Ionicons name="help-circle-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Your car's digital doctor</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholderTextColor="#6b7280"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholderTextColor="#6b7280"
                        secureTextEntry
                    />

                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                        <Text style={styles.loginButtonText}>Log In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity>
                        <Text style={styles.forgotPassword}>Forgot password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.googleButton}>
                        <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.googleButtonText}>Sign in with Google</Text>
                    </TouchableOpacity>

                    <View style={styles.signupContainer}>
                        <Text style={styles.signupText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                            <Text style={styles.signupLink}>Sign up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#020617",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        marginTop: 20,
    },
    logo: {
        fontSize: 16,
        color: "#fff",
        fontFamily: "SpaceGrotesk_700Bold",
        letterSpacing: 1,
    },
    helpButton: {
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 28,
        color: "#fff",
        marginBottom: 40,
        textAlign: "center",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    form: {
        width: "100%",
    },
    label: {
        fontSize: 14,
        color: "#9ca3af",
        marginBottom: 8,
        marginTop: 16,
        fontFamily: "SpaceGrotesk_400Regular",
    },
    input: {
        backgroundColor: "#111827",
        borderRadius: 12,
        padding: 16,
        color: "#fff",
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#1f2937",
        fontFamily: "SpaceGrotesk_400Regular",
    },
    loginButton: {
        backgroundColor: "#FACC15",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginTop: 32,
    },
    loginButtonText: {
        fontSize: 16,
        color: "#020617",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    forgotPassword: {
        color: "#9ca3af",
        textAlign: "center",
        marginTop: 16,
        fontSize: 14,
        fontFamily: "SpaceGrotesk_400Regular",
    },
    googleButton: {
        backgroundColor: "#1f2937",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginTop: 24,
        flexDirection: "row",
        justifyContent: "center",
    },
    googleButtonText: {
        fontSize: 16,
        color: "#fff",
        fontFamily: "SpaceGrotesk_700Bold",
    },
    signupContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 40,
    },
    signupText: {
        color: "#9ca3af",
        fontSize: 14,
        fontFamily: "SpaceGrotesk_400Regular",
    },
    signupLink: {
        color: "#FACC15",
        fontSize: 14,
        fontFamily: "SpaceGrotesk_700Bold",
    },
});