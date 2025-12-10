import React, { useState, useContext } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { AuthContext } from "../navigation/AuthContext";
import { BASE } from "../navigation/api";
import { Ionicons } from "@expo/vector-icons";

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { login } = useContext(AuthContext);

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch(`${BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
          name: fullName,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const session = {
          token: "dummy-token",
          user: data.user,
        };
        await login(session);
        alert("Signup successful!");
      } else {
        alert(data.detail || data.error || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Error connecting to server");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
            <View style={{ width: 24 }} /> 
            <Text style={styles.logo}>VROOM</Text>
            <TouchableOpacity style={styles.helpButton}>
                <Ionicons name="help-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Create your account</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor="#6b7280"
            />

            <Text style={styles.label}>Email address</Text>
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

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor="#6b7280"
              secureTextEntry
            />

            <TouchableOpacity style={styles.createButton} onPress={handleSignup}>
              <Text style={styles.createButtonText}>Create account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.googleButton}>
                <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.googleButtonText}>Sign up with Google</Text>
            </TouchableOpacity>

            <Text style={styles.terms}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
            
            <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                    <Text style={styles.loginLink}>Log in</Text>
                </TouchableOpacity>
            </View>

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  scrollContent: { flexGrow: 1 },
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
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 40 },
  title: { 
      fontSize: 28, 
      color: "#fff", 
      marginBottom: 32, 
      textAlign: "center",
      fontFamily: "SpaceGrotesk_700Bold",
  },
  form: { width: "100%" },
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
  createButton: { 
      backgroundColor: "#FACC15", 
      borderRadius: 12, 
      padding: 16, 
      alignItems: "center", 
      marginTop: 32,
  },
  createButtonText: { 
      fontSize: 16, 
      color: "#020617",
      fontFamily: "SpaceGrotesk_700Bold",
  },
  googleButton: { 
      backgroundColor: "#1f2937", 
      borderRadius: 12, 
      padding: 16, 
      alignItems: "center", 
      marginTop: 16,
      flexDirection: "row",
      justifyContent: "center",
  },
  googleButtonText: { 
      fontSize: 16, 
      color: "#fff",
      fontFamily: "SpaceGrotesk_700Bold",
  },
  terms: { 
      color: "#9ca3af", 
      fontSize: 12, 
      textAlign: "center", 
      marginTop: 24,
      fontFamily: "SpaceGrotesk_400Regular",
      lineHeight: 18,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#9ca3af",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  loginLink: {
    color: "#FACC15",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_700Bold",
  },
});
