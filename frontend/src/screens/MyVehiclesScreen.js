import { useFocusEffect } from "@react-navigation/native";
import React, { useState, useContext, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { AuthContext } from "../navigation/AuthContext";

export default function MyVehiclesScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const { user } = useContext(AuthContext);

  const fetchVehicles = async () => {
    try {
      const res = await fetch(`http://192.168.18.5:8000/vehicles?user_id=${user.id}`);
      const data = await res.json();
      if (data.success) setVehicles(data.vehicles);
    } catch (err) {
      console.error("Fetch vehicles error:", err);
    }
  };

   
  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [])
  );

  const deleteVehicle = async (id) => {
    try {
      await fetch(`http://192.168.18.5:8000/vehicles/${id}`, { method: "DELETE" });
      fetchVehicles();  
    } catch (err) {
      console.error("Delete vehicle error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddVehicle")}
      >
        <Text style={styles.addText}>+ Add Vehicle</Text>
      </TouchableOpacity>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>
              {item.make} {item.model} ({item.year})
            </Text>
            <TouchableOpacity onPress={() => deleteVehicle(item.id)}>
              <Text style={styles.remove}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#111" },
  addButton: { backgroundColor: "#FFC107", borderRadius: 10, padding: 14, marginBottom: 20 },
  addText: { color: "#000", fontWeight: "bold", textAlign: "center" },
  card: { backgroundColor: "#222", padding: 15, borderRadius: 12, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#fff", fontSize: 16 },
  remove: { color: "#FF4444", fontWeight: "bold" },
});
