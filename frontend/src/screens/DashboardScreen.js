import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OBDContext } from '../navigation/OBDContext';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DashboardScreen = ({ navigation }) => {
    const { isConnected, obdData = {}, isScanning } = useContext(OBDContext);
    const [isExpanded, setIsExpanded] = useState(false);

    const speedMph = ((obdData.SpeedKmH ?? 0) * 0.621371).toFixed(0);
    const rpm = obdData.RPM ?? 0;
    const coolantTemp = obdData.CoolantTemp ? `${obdData.CoolantTemp}°C` : 'N/A';
    const fuelLevel = obdData.FuelLevel ?? '75%';

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>VROOM</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="settings-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Quick Summary</Text>

                {/* Car Connected Card */}
                <TouchableOpacity 
                    style={styles.card} 
                    onPress={() => {
                        if (isConnected) {
                            toggleExpand();
                        } else {
                            navigation.navigate('DeviceSelection');
                        }
                    }}
                    activeOpacity={0.9}
                >
                    <View style={styles.cardContent}>
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>
                                {isConnected ? 'Car Connected' : 'Connect Car'}
                            </Text>
                            <Text style={styles.cardDescription}>
                                {isConnected 
                                    ? 'Your vehicle is currently connected and providing real-time data.' 
                                    : 'Tap to connect your vehicle via OBD-II adapter.'}
                            </Text>
                        </View>
                        {/* Placeholder Image - Replace with actual asset if available */}
                        <View style={styles.imagePlaceholder}>
                             <Ionicons name="car-sport" size={40} color="#bab59c" />
                        </View>
                    </View>

                    {/* Collapsible Metrics Section */}
                    {isConnected && isExpanded && (
                        <View style={styles.metricsContainer}>
                            <View style={styles.metricRow}>
                                <View style={styles.metricItem}>
                                    <Text style={styles.metricLabel}>Speed</Text>
                                    <Text style={styles.metricValue}>{speedMph} <Text style={styles.unit}>mph</Text></Text>
                                </View>
                                <View style={styles.metricItem}>
                                    <Text style={styles.metricLabel}>RPM</Text>
                                    <Text style={styles.metricValue}>{rpm}</Text>
                                </View>
                            </View>
                            <View style={styles.metricRow}>
                                <View style={styles.metricItem}>
                                    <Text style={styles.metricLabel}>Coolant</Text>
                                    <Text style={styles.metricValue}>{coolantTemp}</Text>
                                </View>
                                <View style={styles.metricItem}>
                                    <Text style={styles.metricLabel}>Fuel</Text>
                                    <Text style={styles.metricValue}>{fuelLevel}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Engine Health Card */}
                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Diagnostics')}>
                    <View style={styles.cardContent}>
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>Engine Health</Text>
                            <Text style={styles.cardDescription}>
                                AI analysis indicates your engine is in optimal condition. No immediate issues detected.
                            </Text>
                        </View>
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="pulse" size={40} color="#bab59c" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Last Oil Change Card */}
                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OilChange')}>
                    <View style={styles.cardContent}>
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>Last Oil Change</Text>
                            <Text style={styles.cardDescription}>
                                Based on your driving patterns, your next oil change is predicted in 3,500 miles.
                            </Text>
                        </View>
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="water" size={40} color="#bab59c" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Anomaly Detection Card */}
                <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TireAnalysis')}>
                    <View style={styles.cardContent}>
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>Tire Analysis</Text>
                            <Text style={styles.cardDescription}>
                                Check the condition of your tires.
                            </Text>
                        </View>
                         <View style={styles.imagePlaceholder}>
                            <Ionicons name="warning" size={40} color="#bab59c" />
                        </View>
                    </View>
                </TouchableOpacity>

            </ScrollView>

            {/* Bottom Action Button */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                        if (isConnected) {
                            navigation.navigate('Diagnostics');
                        } else {
                            navigation.navigate('DeviceSelection');
                        }
                    }}
                >
                    <Text style={styles.actionButtonText}>
                        {isConnected ? 'Scan Vehicle' : 'Connect Car'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    defaultText: {
        fontFamily: 'SpaceGrotesk_400Regular',
        fontSize:20,
    },
    defaultBoldText: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize:20,
    }, 
    container: {
        flex: 1,
        backgroundColor: '#020617', 
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#020617', 
    },
    headerTitle: {
        fontSize: 20,
        color: '#fff',
        letterSpacing: 1,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100, // Space for footer
    },
    sectionTitle: {
        fontSize: 22,
        color: '#fff',
        marginBottom: 20,
        marginTop: 10,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    card: {
        backgroundColor: '#111827', // Updated card background
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1f2937', // Updated border
    },
    cardContent: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        paddingRight: 12,
    },
    cardTitle: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 6,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    cardDescription: {
        fontSize: 13,
        color: '#9ca3af', // Updated text color
        lineHeight: 18,
        fontFamily: 'SpaceGrotesk_400Regular',
    },
    imagePlaceholder: {
        width: 80,
        height: 60,
        backgroundColor: '#1f2937', // Updated placeholder
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    metricsContainer: {
        backgroundColor: '#0f172a', // Updated metrics bg
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#1f2937',
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    metricItem: {
        flex: 1,
    },
    metricLabel: {
        fontSize: 12,
        color: '#9ca3af',
        marginBottom: 2,
        fontFamily: 'SpaceGrotesk_400Regular',
    },
    metricValue: {
        fontSize: 18,
        color: '#fff',
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    unit: {
        fontSize: 12,
        color: '#9ca3af',
        fontFamily: 'SpaceGrotesk_400Regular',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#020617', // Match background
        borderTopWidth: 1,
        borderTopColor: '#1f2937',
    },
    actionButton: {
        backgroundColor: '#FACC15', // Yellow accent
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        fontSize: 16,
        color: '#020617', // Dark text on yellow
        fontFamily: 'SpaceGrotesk_700Bold',
    },
});

export default DashboardScreen;
