import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VROOM</Text>
      <Text style={styles.subtitle}>Vehicle Diagnostic Assistant</Text>
      <Text style={styles.description}>
        Scan and understand your vehicle's diagnostic trouble codes with ease.
      </Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("Scan")}
      >
        <Text style={styles.btnText}>Start Scan</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.secondary]}
        onPress={() => navigation.navigate("History")}
      >
        <Text style={styles.btnText}>View History</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Quick Start</Text>
        <Text style={styles.infoText}>
          1. Tap the "Scan" tab to enter a DTC code{"\n"}
          2. Get instant explanations and solutions{"\n"}
          3. View your scan history anytime
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f6f8fa",
  },
  title: {
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#57606a",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#57606a",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  infoBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d0d7de",
    width: "90%",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#57606a",
    lineHeight: 22,
  },
  btn: {
    width: "80%",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#1f6feb",
    marginTop: 12,
    alignItems: "center",
  },
  secondary: {
    backgroundColor: "#2da44e",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
