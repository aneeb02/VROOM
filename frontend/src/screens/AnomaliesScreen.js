import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

export default function AnomaliesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Anomaly Detection</Text>

      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardTitle}>Coolant temperature rising unusually fast</Text>
          <Text style={styles.cardTime}>10:30 AM</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={styles.gauge}>
            <Text style={styles.gaugeText}>🌡️</Text>
          </View>
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No other anomalies detected</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617", // Updated background
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 20,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  card: {
    backgroundColor: "#111827", // Updated card background
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#1f2937", // Updated border
  },
  cardLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  cardTime: {
    fontSize: 13,
    color: "#9ca3af", // Updated text color
    fontFamily: "SpaceGrotesk_400Regular",
  },
  cardRight: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  gauge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1f2937", // Updated gauge bg
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  gaugeText: {
    fontSize: 28,
  },
  viewButton: {
    backgroundColor: "#FACC15", // Yellow accent
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewButtonText: {
    color: "#020617",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 16,
    fontFamily: "SpaceGrotesk_400Regular",
  },
});