// src/screens/DiagnosticsScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";

function DiagnosticsScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState("dtc");

  const defaultDtcCodes = [
    { id: "1", code: "P0301", description: "P0301 Engine Control Module (ECM)", active: true },
    { id: "2", code: "P0700", description: "P0700 Transmission Control Module (TCM)", active: true },
    { id: "3", code: "P0019", description: "P0019 - Crankshaft Position - Camshaft Position Correlation (Bank 2 Sensor B)", active: true },
    { id: "4", code: "P001A", description: "P001A A Camshaft Profile Control Circuit/Open Bank 1", active: true },
  ];

  const dtcCodes = route?.params?.dtcCodes || defaultDtcCodes;

  const renderDTCItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dtcItem}
      onPress={() =>
        navigation.navigate("DTCDetail", {
          code: item.code,
          description: item.description,
        })
      }
    >
      <View style={styles.dtcInfo}>
        <Text style={styles.dtcCode}>{item.code}</Text>
        <Text style={styles.dtcDesc}>{item.description}</Text>
      </View>
      <View style={[styles.statusDot, item.active && styles.statusActive]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "dtc" && styles.tabActive]}
          onPress={() => setActiveTab("dtc")}
        >
          <Text style={[styles.tabText, activeTab === "dtc" && styles.tabTextActive]}>
            DTC Scan Results
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "live" && styles.tabActive]}
          onPress={() => setActiveTab("live")}
        >
          <Text style={[styles.tabText, activeTab === "live" && styles.tabTextActive]}>
            Live Data (PIDs)
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "dtc" ? (
        <>
          <FlatList
            data={dtcCodes}
            renderItem={renderDTCItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
          
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Live data monitoring coming soon</Text>
        </View>
      )}
    </View>
  );
}

export default DiagnosticsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    backgroundColor: "#020617",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#FACC15",
  },
  tabText: {
    color: "#6b7280",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  tabTextActive: {
    color: "#f9fafb",
  },

  // DTC list
  list: {
    padding: 16,
  },
  dtcItem: {
    backgroundColor: "#020617",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#111827",
  },
  dtcInfo: {
    flex: 1,
  },
  dtcCode: {
    fontSize: 18,
    color: "#f9fafb",
    marginBottom: 4,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  dtcDesc: {
    fontSize: 13,
    color: "#9ca3af",
    fontFamily: "SpaceGrotesk_400Regular",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4b5563",
  },
  statusActive: {
    backgroundColor: "#22c55e",
  },
  explainButton: {
    backgroundColor: "#FACC15",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  explainButtonText: {
    fontSize: 16,
    color: "#000",
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