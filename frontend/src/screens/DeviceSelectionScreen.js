import React, { useContext, useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Image,
    ActivityIndicator,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OBDContext } from '../navigation/OBDContext';

export default function DeviceSelectionScreen({ navigation }) {
    const { 
        scannedDevices, 
        isScanning, 
        isConnected,
        scanForDevices, 
        connectToDevice,
        device,
        disconnectDevice // Assuming this exists or we simulate it
    } = useContext(OBDContext);

    const [connectingId, setConnectingId] = useState(null);

    const devicesArray = Object.values(scannedDevices).sort((a, b) => 
        (a.name || 'Unknown').localeCompare(b.name || 'Unknown')
    );

    useEffect(() => {
        if (!isConnected) scanForDevices();
    }, []);

    const handleConnect = async (item) => {
        setConnectingId(item.id);
        await connectToDevice(item);
        setConnectingId(null);
    };

    const renderDeviceItem = ({ item }) => {
        const isConnectedDevice = item.id === device?.id;
        const isConnecting = connectingId === item.id;

        return (
            <TouchableOpacity 
                style={[styles.deviceItem, isConnectedDevice && styles.deviceItemConnected]}
                onPress={() => handleConnect(item)}
                disabled={isConnectedDevice || isConnecting}
            >
                <View style={styles.deviceIconBox}>
                    <Ionicons name="bluetooth" size={20} color="#9ca3af" />
                </View>
                <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                    <Text style={styles.deviceStatus}>
                        {isConnectedDevice ? 'Connected' : isConnecting ? 'Connecting...' : 'Tap to pair'}
                    </Text>
                </View>
                {isConnectedDevice && (
                    <Ionicons name="checkmark-circle" size={24} color="#FACC15" />
                )}
                {isConnecting && (
                    <ActivityIndicator size="small" color="#FACC15" />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Connect to your car</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.instructionText}>
                    To get started, plug in your ELM327 OBD-II dongle and turn on your car's ignition.
                </Text>

                {/* Hero Image Placeholder */}
                <View style={styles.heroContainer}>
                    <View style={styles.heroCircle}>
                        <Ionicons name="hardware-chip-outline" size={80} color="#64748b" />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Connection</Text>

                <View style={styles.listContainer}>
                    {isScanning && (
                        <View style={styles.deviceItem}>
                            <View style={styles.deviceIconBox}>
                                <ActivityIndicator size="small" color="#FACC15" />
                            </View>
                            <View style={styles.deviceInfo}>
                                <Text style={styles.deviceName}>Scanning...</Text>
                                <Text style={styles.deviceStatus}>Searching for devices</Text>
                            </View>
                        </View>
                    )}

                    <FlatList
                        data={devicesArray}
                        keyExtractor={(item) => item.id}
                        renderItem={renderDeviceItem}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={!isScanning && (
                            <Text style={styles.emptyText}>No devices found. Try rescanning.</Text>
                        )}
                    />
                </View>

                {/* Connecting Progress (Visual Only for now if not tied to real progress) */}
                {(connectingId || isScanning) && (
                    <View style={styles.progressContainer}>
                        <Text style={styles.progressLabel}>
                            {connectingId ? 'Connecting...' : 'Scanning...'}
                        </Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: '40%' }]} />
                        </View>
                    </View>
                )}

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={styles.retryButton} 
                        onPress={() => scanForDevices()}
                        disabled={isScanning}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.disconnectButton} 
                        onPress={() => {
                            // If we have a disconnect function, use it. 
                            // Otherwise, we can just stop scanning or navigate back.
                            if (disconnectDevice) disconnectDevice();
                            navigation.goBack();
                        }}
                    >
                        <Text style={styles.disconnectButtonText}>
                            {isConnected ? 'Disconnect' : 'Cancel'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 18,
        color: '#fff',
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    instructionText: {
        color: '#9ca3af',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 30,
        fontFamily: 'SpaceGrotesk_400Regular',
        lineHeight: 20,
    },
    heroContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    heroCircle: {
        width: 160,
        height: 120,
        borderRadius: 20,
        backgroundColor: '#111827',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    sectionTitle: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 12,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    listContainer: {
        flex: 1,
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    deviceItemConnected: {
        borderColor: '#FACC15',
        backgroundColor: '#1f2937',
    },
    deviceIconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    deviceStatus: {
        color: '#9ca3af',
        fontSize: 12,
        fontFamily: 'SpaceGrotesk_400Regular',
    },
    emptyText: {
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 20,
        fontFamily: 'SpaceGrotesk_400Regular',
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressLabel: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#1f2937',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FACC15',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    retryButton: {
        flex: 1,
        backgroundColor: '#1f2937',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
    disconnectButton: {
        flex: 1,
        backgroundColor: '#FACC15',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    disconnectButtonText: {
        color: '#020617',
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_700Bold',
    },
});
