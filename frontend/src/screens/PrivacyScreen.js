import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { AuthContext } from "../navigation/AuthContext";

export default function PrivacyScreen({ route }) {
  const { user, updateUser } = useContext(AuthContext); // ✅ get user from context
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const updateProfile = async () => {
    try {
      const res = await fetch(`http://192.168.18.5:8000/auth/update/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Profile updated!");
        updateUser({ name, email }); // ✅ update context too
      } else {
        alert(data.detail || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Privacy Settings</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Name"
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#888"
      />
      <TouchableOpacity style={styles.button} onPress={updateProfile}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#111" },
  title: { color: "#FFC107", fontSize: 22, marginBottom: 20 },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
  },
  button: { backgroundColor: "#FFC107", padding: 10, borderRadius: 10 },
  buttonText: { textAlign: "center", fontWeight: "bold" },
});
