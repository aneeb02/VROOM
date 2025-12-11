import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
 
import { AuthContext } from "./AuthContext"; 
import { OBDProvider } from "./OBDContext"; 

import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import DashboardScreen from "../screens/DashboardScreen";
import DiagnosticsScreen from "../screens/DiagnosticsScreen";
import MechanicsScreen from "../screens/MechanicsScreen";
import AssistantScreen from "../screens/AssistantScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MyVehiclesScreen from "../screens/MyVehiclesScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import AddVehicleScreen from "../screens/AddVehicleScreen";
import ScanScreen from "../screens/ScanScreen"; 
import HistoryScreen from "../screens/HistoryScreen";
import DTCDetailScreen from "../screens/DTCDetailScreen";
import AnomaliesScreen from "../screens/AnomaliesScreen";
import DeviceSelectionScreen from "../screens/DeviceSelectionScreen";
import TireAnalysisScreen from "../screens/TireAnalysisScreen";
import AIAssistantScreen from "../screens/AIAssistantScreen";
import OilChangeScreen from "../screens/OilChangeScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Dashboard Stack Navigator
function DashboardStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: "#020617" },
                headerTintColor: "#fff",
                headerTitleStyle: { fontFamily: "SpaceGrotesk_700Bold" },
            }}
        >
            <Stack.Screen
                name="DashboardHome"
                component={DashboardScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen   
                name="DeviceSelection" 
                component={DeviceSelectionScreen}
                options={{ headerShown: true }}
            />
            <Stack.Screen   
                name="TireAnalysis" 
                component={TireAnalysisScreen}
            />
            <Stack.Screen name="OilChange" component={OilChangeScreen} />
            <Stack.Screen name="Anomalies" component={AnomaliesScreen} />
            <Stack.Screen name="Scan" component={ScanScreen} />
        </Stack.Navigator>
    );
}

// Diagnostics Stack Navigator
function DiagnosticsStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: "#020617" },
                headerTintColor: "#fff",
                headerTitleStyle: { fontFamily: "SpaceGrotesk_700Bold" },
            }}
        >
            <Stack.Screen
                name="DiagnosticsHome"
                component={DiagnosticsScreen}
                options={{ title: "Diagnostics" }}
            />
            <Stack.Screen
                name="DTCDetail"
                component={DTCDetailScreen}
                options={{ title: "DTC Details" }}
            />
            <Stack.Screen
                name="TireAnalysis"
                component={TireAnalysisScreen}
                options={{ title: "Tire Analysis" }}
            />
        </Stack.Navigator>
    );
}

// Mechanics Stack Navigator
function MechanicsStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: "#020617" },
                headerTintColor: "#fff",
                headerTitleStyle: { fontFamily: "SpaceGrotesk_700Bold" },
            }}
        >
            <Stack.Screen
                name="MechanicsHome"
                component={MechanicsScreen}
                options={{ title: "Mechanics" }}
            />
        </Stack.Navigator>
    );
}

// Assistant Stack Navigator
function AssistantStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: "#020617" },
                headerTintColor: "#fff",
                headerTitleStyle: { fontFamily: "SpaceGrotesk_700Bold" },
            }}
        >
            <Stack.Screen
                name="AssistantHome"
                component={AIAssistantScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

// Profile Stack Navigator
function ProfileStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: "#020617" },
                headerTintColor: "#fff",
                headerTitleStyle: { fontFamily: "SpaceGrotesk_700Bold" },
            }}
        >
            <Stack.Screen
                name="ProfileHome"
                component={ProfileScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="MyVehicles"
                component={MyVehiclesScreen}
                options={{ title: "My Vehicles" }}
            />
            <Stack.Screen
                name="AddVehicle"
                component={AddVehicleScreen}
                options={{ title: "Add Vehicle" }}
            />
            <Stack.Screen
                name="Privacy"
                component={PrivacyScreen}
                options={{ title: "Privacy Settings" }}
            />
            <Stack.Screen
                name="History"
                component={HistoryScreen}
                options={{ title: "History" }}
            />
        </Stack.Navigator>
    );
}
// Main Tab Navigator
function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === "Dashboard") {
                        iconName = focused ? "speedometer" : "speedometer-outline";
                    } else if (route.name === "Diagnostics") {
                        iconName = focused ? "build" : "build-outline";
                    } else if (route.name === "Mechanics") {
                        iconName = focused ? "car" : "car-outline";
                    } else if (route.name === "Assistant") {
                        iconName = focused ? "chatbubbles" : "chatbubbles-outline";
                    } else if (route.name === "Profile") {
                        iconName = focused ? "person" : "person-outline";
                    }

                    // Ionicons is imported from @expo/vector-icons
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: "#FACC15",
                tabBarInactiveTintColor: "#6b7280",
                tabBarStyle: {
                    backgroundColor: "#020617",
                    borderTopColor: "#1f2937",
                    borderTopWidth: 1,
                    paddingBottom: 5, // Reverted
                    paddingTop: 5,
                    height: 60, // Reverted
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontFamily: "SpaceGrotesk_700Bold",
                    marginBottom: 0,
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardStack} />
            <Tab.Screen name="Diagnostics" component={DiagnosticsStack} />
            <Tab.Screen name="Mechanics" component={MechanicsStack} />
            <Tab.Screen name="Assistant" component={AssistantStack} />
            <Tab.Screen name="Profile" component={ProfileStack} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    // Assuming AuthContext is defined and provides isAuthenticated
    const { isAuthenticated } = useContext(AuthContext); 

    return (
       
        <OBDProvider> 
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {/* Authentication Flow */}
                    {false ? (
                        <>
                            <Stack.Screen name="Login" component={LoginScreen} />
                            <Stack.Screen name="Signup" component={SignupScreen} />
                        </>
                    ) : (
                        // Main App Flow
                        <Stack.Screen name="MainTabs" component={MainTabs} />
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </OBDProvider>
    );
}