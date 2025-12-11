import React from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from "react-native";

export default function MechanicsScreen() {
  const mechanics = [
    { id: "1", name: "AutoCare Specialists", distance: "0.5 mi", rating: "4.8", available: true },
    { id: "2", name: "Precision Auto Repair", distance: "1.2 mi", rating: "4.7", available: true },
    { id: "3", name: "Golden Gate Auto Service", distance: "2.1 mi", rating: "4.6", available: true },
  ];

  const renderMechanic = ({ item }) => (
    <View style={styles.mechanicCard}>
      <View style={styles.mechanicIcon}>
        <Text style={styles.mechanicIconText}>🔧</Text>
      </View>
      <View style={styles.mechanicInfo}>
        <Text style={styles.mechanicName}>{item.name}</Text>
        <Text style={styles.mechanicMeta}>{item.distance} · {item.rating} ★</Text>
      </View>
      <View style={[styles.statusDot, item.available && styles.statusAvailable]} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for mechanics"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Service Type ▼</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Rating ▼</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>📍 Map View</Text>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Top Rated Mechanics</Text>
        <FlatList
          data={mechanics}
          renderItem={renderMechanic}
          keyExtractor={(item) => item.id}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  filterButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: "#2a2a2a",
    marginHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  mapText: {
    fontSize: 32,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  mechanicCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  mechanicIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#3a3a3a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mechanicIconText: {
    fontSize: 24,
  },
  mechanicInfo: {
    flex: 1,
  },
  mechanicName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  mechanicMeta: {
    fontSize: 13,
    color: "#999",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#666",
  },
  statusAvailable: {
    backgroundColor: "#4ade80",
  },
});