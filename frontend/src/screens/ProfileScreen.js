import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../navigation/AuthContext";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  const MenuItem = ({ icon, title, subtitle, onPress, value }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconBox}>
        <Ionicons name={icon} size={24} color="#bab59c" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      {value ? (
        <Text style={styles.menuValue}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Profile */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
             {/* Placeholder Avatar - Replace with actual user image */}
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?img=11' }} 
              style={styles.avatar} 
            />
          </View>
          <Text style={styles.userName}>{user?.name || "Zain Malik"}</Text>
          <Text style={styles.userStatus}>Premium User</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account</Text>
          <MenuItem 
            icon="car-outline" 
            title="My Vehicles" 
            subtitle="Manage your vehicles"
            onPress={() => navigation.navigate("MyVehicles")}
          />
          <MenuItem 
            icon="bluetooth-outline" 
            title="OBD Dongle" 
            subtitle="Manage your OBD dongle"
            onPress={() => navigation.navigate("DeviceSelection")}
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Preferences</Text>
          <MenuItem 
            icon="shield-checkmark-outline" 
            title="Privacy" 
            subtitle="Manage your privacy settings"
            onPress={() => navigation.navigate("Privacy")}
          />
          <MenuItem 
            icon="mic-outline" 
            title="Voice Assistant" 
            subtitle="Manage your voice assistant"
            onPress={() => navigation.navigate("Assistant")}
          />
           <MenuItem 
            icon="globe-outline" 
            title="Language" 
            subtitle="Change your language"
            value="English"
            onPress={() => {}}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    color: "#fff",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#FACC15",
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#1f2937",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  userName: {
    fontSize: 24,
    color: "#fff",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 14,
    color: "#9ca3af",
    fontFamily: "SpaceGrotesk_400Regular",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  menuIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#111827", // Darker box for icon
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
    fontFamily: "SpaceGrotesk_400Regular",
  },
  menuValue: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "SpaceGrotesk_400Regular",
  },
  logoutButton: {
    marginTop: 10,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ef4444",
    alignItems: "center",
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
  },
});
