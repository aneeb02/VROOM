import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Linking,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { Alert } from "react-native";
import { Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";



// =======================
// SCREEN 1: Diagnostics (list of DTCs)
// =======================
const defaultDtcCodes = [
    { id: "1", code: "P0053", description: "P0053 HO2S Heater Resistance Bank 1 Sensor 1", active: true },
    { id: "2", code: "P0051", description: "P0051 - Oxygen (A/F) Sensor Heater Control Circuit Low (Bank 2 Sensor 1)", active: true },
    { id: "3", code: "P0019", description: "P0019 - Crankshaft Position - Camshaft Position Correlation (Bank 2 Sensor B)", active: true },
    { id: "4", code: "P001A", description: "P001A A Camshaft Profile Control Circuit/Open Bank 1", active: true},
    { id: "8", code: "P0060", description: "P0060 HO2S Heater Resistance Bank 2 Sensor 2", active: true },
    { id: "5", code: "P0049", description: "P0049 Turbo / Supercharger Turbine Overspeed", active: true },
    { id: "6", code: "P0056", description: "P0056 Heated Oxygen Sensor Control Circuit B1S2", active: true },
    { id: "7", code: "P005F", description: "P005F Turbo/Supercharger Boost Control B Voltage High", active:true }
 
  ];
export default function DiagnosticsScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState("dtc");
  const dtcCodes = route?.params?.dtcCodes || defaultDtcCodes;
const rowAnims = useRef(defaultDtcCodes.map(() => new Animated.Value(0))).current;
const pulseAnim = useRef(new Animated.Value(1)).current;

useEffect(() => {
  // reset all to 0 before animating
  rowAnims.forEach(v => v.setValue(0));

  const anims = rowAnims.map((val, index) =>
    Animated.timing(val, {
      toValue: 1,
      duration: 400,
      delay: index * 90,
      useNativeDriver: true,
    })
  );

  Animated.stagger(90, anims).start();
}, [rowAnims]);


  const renderDTCItem = ({ item, index }) => {
  const anim = rowAnims[index] || new Animated.Value(1);

  const animatedStyle = {
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  const dotAnimatedStyle = item.active
    ? {
        transform: [{ scale: pulseAnim }],
        shadowColor: "#22c55e",
        shadowOpacity: 0.7,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
      }
    : {};

  return (
    <Animated.View style={animatedStyle}>
      <LinearGradient
        colors={["#22d3ee", "#4f46e5", "#facc15"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.dtcItemOuter}
      >
        <View style={styles.dtcItemInner}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("DTCDetail", {
                code: item.code,
                description: item.description,
              })
            }
            style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
          >
            <View style={styles.dtcInfo}>
              <Text
                style={styles.dtcCode}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.code}
              </Text>
              <Text
                style={styles.dtcDesc}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.description}
              </Text>
            </View>

            <Animated.View
              style={[
                styles.statusDot,
                item.active && styles.statusActive,
                dotAnimatedStyle,
              ]}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

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
        <FlatList
          data={dtcCodes}
          renderItem={renderDTCItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Live data monitoring coming soon</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },

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
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#f9fafb",
  },

  // DTC list
  list: {
    padding: 16,
  },
 
  dtcInfo: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 12,
  },
  dtcCode: {
  fontSize: 18,
  fontWeight: "800",
  color: "#F9FAFB",
},
dtcDesc: {
  fontSize: 13,
  color: "#CBD5E1", // lighter text instead of gray
},


  // OUTER gradient shell
  dtcItemOuter: {
    borderRadius: 20,
    padding: 2,            // thickness of the glowing border
    marginHorizontal: 12,
    marginBottom: 18,
  },

  // INNER dark card
  dtcItemInner: {
    backgroundColor: "rgba(2, 6, 23, 0.95)",  
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
  shadowOpacity: 0.55,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 4, // Android
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 10,        // keeps it away from text
    backgroundColor: "#4b5563",
  },
  statusActive: {
    backgroundColor: "#22c55e",
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 16,
  },

  // Header & code badge
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    backgroundColor: "#020617",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
    shadowColor: "#38bdf8",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  headerCodeBlock: {
    flexDirection: "column",
  },
  chipSystem: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: "#020617",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    color: "#9CA3AF",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  code: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F9FAFB",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e5e7eb",
  },

  // Generic card
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#020617",
    borderWidth: 1.2,
    borderColor: "rgba(148,163,184,0.9)",
    shadowColor: "#94a3b8",
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  sectionLabel: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#D1D5DB",
    lineHeight: 22,
    marginTop: 4,
  },

  severityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  severityPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FACC15",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  severityPillHigh: {
    backgroundColor: "#FB923C",
  },
  severityText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
  },

  // Possible causes – individual glowing cards
  causeCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#020617",
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1.2,
    borderColor: "rgba(248,113,113,0.9)", // warm red
    shadowColor: "#fb923c",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 9,
  },
  causeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(248,113,113,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#fb923c",
  },
  causeTextWrapper: {
    flex: 1,
  },
  causeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fb923c",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  causeText: {
    fontSize: 14,
    color: "#E5E7EB",
    lineHeight: 21,
  },

  // Effects / Symptoms – glowing cards
  effectCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#020617",
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1.2,
    borderColor: "rgba(59,130,246,0.9)", // blue
    shadowColor: "#3b82f6",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 9,
  },
  effectIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(59,130,246,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  effectTextWrapper: {
    flex: 1,
  },
  effectLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3b82f6",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  effectText: {
    fontSize: 14,
    color: "#E5E7EB",
    lineHeight: 21,
  },

  // Actionable Advice – glowing green/blue
  actionCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#020617",
    borderWidth: 1.2,
    borderColor: "rgba(45,212,191,0.9)",
    shadowColor: "#22c55e",
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  checkIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "rgba(34,197,94,0.15)",
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#93c5fd",
    letterSpacing: 0.7,
  },
  actionStep: {
    color: "#f1f5f9",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 2,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38bdf8",
    textTransform: "uppercase",
    marginLeft: 6,
    letterSpacing: 0.7,
  },
  locationText: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },

  // Reddit section
  redditHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  redditItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
  },
  redditIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  redditLink: {
    color: "#93C5FD",
    fontSize: 13,
    flex: 1,
  },
  redditHint: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 10,
  },

  // Technical terms section
  techHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  techIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0f172a",
    borderWidth: 1.2,
    borderColor: "rgba(56,189,248,0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    shadowColor: "#38bdf8",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  techTermRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#111827",
  },
  techTermChip: {
    alignSelf: "flex-start",
    backgroundColor: "#020617",
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: "rgba(56,189,248,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
    shadowColor: "#38bdf8",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  techTermName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#e0f2fe",
  },
  techTermDescription: {
    fontSize: 13,
    color: "#D1D5DB",
    lineHeight: 20,
  },

  // Footer buttons
  buttonContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  buttonSecondaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: "#FACC15",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonPrimaryText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 6,
  },

  // Loading / error
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#ccc",
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 14,
    marginLeft: 8,
  },
});
