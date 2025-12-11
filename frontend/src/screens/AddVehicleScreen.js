import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { AuthContext } from "../navigation/AuthContext";

export default function AddVehicleScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");

  const handleSubmit = async () => {
    const res = await fetch("http://192.168.18.5:8000/vehicles/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, make, model, variant, year: parseInt(year), vin }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Vehicle added!");
      navigation.goBack();
    } else {
      alert("Failed to add vehicle");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Vehicle</Text>
      <TextInput style={styles.input} placeholder="Make" value={make} onChangeText={setMake} />
      <TextInput style={styles.input} placeholder="Model" value={model} onChangeText={setModel} />
      <TextInput style={styles.input} placeholder="Variant" value={variant} onChangeText={setVariant} />
      <TextInput style={styles.input} placeholder="Year" keyboardType="numeric" value={year} onChangeText={setYear} />
      <TextInput style={styles.input} placeholder="VIN" value={vin} onChangeText={setVin} />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Add Vehicle</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#111" },
  title: { fontSize: 24, color: "#fff", marginBottom: 20 },
  input: { backgroundColor: "#222", color: "#fff", borderRadius: 10, padding: 12, marginBottom: 12 },
  button: { backgroundColor: "#FFC107", borderRadius: 10, padding: 14, marginTop: 10 },
  buttonText: { color: "#000", textAlign: "center", fontWeight: "bold" },
});
