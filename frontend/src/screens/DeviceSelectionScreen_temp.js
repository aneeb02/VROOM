import React, { useContext, useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator,
    SafeAreaView,
    ScrollView // Import ScrollView for the log area
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
        disconnect, // Use the proper disconnect function
        log // New: Access the connection log
    } = useContext(OBDContext);

    const [connectingId, setConnectingId] = useState(null);

    const devicesArray = Object.values(scannedDevices).sort((a, b) => 
        (a.name || 'Unknown').localeCompare(b.name || 'Unknown')
    );

    useEffect(() => {
        if (!isConnected) scanForDevices();
        // Clear connecting status if connection fails or is disconnected externally
        if (!isConnected && connectingId) {
            setConnectingId(null);
        }
    }, [isConnected]);

    const handleConnect = async (item) => {
        setConnectingId(item.id);
        await connectToDevice(item);
        // Note: connectingId is cleared by the useEffect if connection succeeds/fails
    };
    
    const handleDisconnect = () => {
        disconnect(); // Call the robust disconnect function
        setConnectingId(null);
    };

    const renderDeviceItem = ({ item }) => {
        const isConnectedDevice = item.id === device?.id;
        const isCurrentlyConnecting = connectingId === item.id;

        return (
            <TouchableOpacity 
                style={[styles.deviceItem, isConnectedDevice && styles.deviceItemConnected]}
                onPress={() => handleConnect(item)}
                disabled={isConnectedDevice || isCurrentlyConnecting}
            >
                <View style={styles.deviceIconBox}>
                    {isCurrentlyConnecting ? (
                        <ActivityIndicator size="small" color="#FACC15" />
                    ) : (
                        <Ionicons name="bluetooth" size={20} color="#9ca3af" />
                    )}
                </View>
                <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                    <Text style={styles.deviceStatus}>
                        {isConnectedDevice ? 'Connected' : isCurrentlyConnecting ? 'Connecting...' : item.id}
                    </Text>
                </View>
                {isConnectedDevice && (
                    <Ionicons name="checkmark-circle" size={24} color="#00E676" />
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

                <View style={styles.heroContainer}>
                    <View style={styles.heroCircle}>
                        <Ionicons name="hardware-chip-outline" size={80} color="#64748b" />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Available Adapters</Text>

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
                        ListEmptyComponent={!isScanning && (
                            <Text style={styles.emptyText}>No devices found. Ensure Bluetooth is on.</Text>
                        )}
                    />
                </View>

                {/* Connection Log Area (Integrated from temp file) */}
                <View style={styles.logArea}>
                    <Text style={styles.logTitle}>Connection Log</Text>
                    <ScrollView 
                        style={styles.logScroll} 
                        contentContainerStyle={{ justifyContent: 'flex-end' }} 
                        ref={ref => { this.scrollView = ref; }}
                        onContentSizeChange={() => this.scrollView.scrollToEnd({ animated: true })}
                    >
                        {log.map((msg, index) => (
                            <Text key={index} style={styles.logText}>{msg}</Text>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={styles.retryButton} 
                        onPress={() => scanForDevices()}
                        disabled={isScanning || isConnected}
                    >
                        <Text style={styles.retryButtonText}>
                            {isScanning ? 'Scanning...' : 'Rescan'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={isConnected ? styles.disconnectButton : [styles.disconnectButton, {backgroundColor: '#374151'}]} 
                        onPress={handleDisconnect}
                        disabled={!isConnected}
                    >
                        <Text style={isConnected ? styles.disconnectButtonText : [styles.disconnectButtonText, {color: '#9ca3af'}]}>
                            {isConnected ? 'Disconnect' : 'Connected'}
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
        // fontFamily: 'SpaceGrotesk_700Bold',
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
        marginBottom: 20, // Reduced space for log
        // fontFamily: 'SpaceGrotesk_400Regular',
        lineHeight: 20,
    },
    heroContainer: {
        alignItems: 'center',
        marginBottom: 30,
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
        // fontFamily: 'SpaceGrotesk_700Bold',
    },
    listContainer: {
        flex: 1,
        minHeight: 150, // Ensure minimum height for list
        marginBottom: 10,
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
        borderColor: '#00E676', // Green for connected
        backgroundColor: '#0f172a',
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
        // fontFamily: 'SpaceGrotesk_700Bold',
    },
    deviceStatus: {
        color: '#9ca3af',
        fontSize: 12,
        // fontFamily: 'SpaceGrotesk_400Regular',
    },
    emptyText: {
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 20,
        // fontFamily: 'SpaceGrotesk_400Regular',
    },
    // --- New Log Styles ---
    logArea: { 
        height: 120, 
        backgroundColor: '#0f172a', 
        padding: 10, 
        borderRadius: 8, 
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    logTitle: { 
        color: '#FACC15', 
        fontWeight: 'bold', 
        marginBottom: 5,
        fontSize: 12,
    },
    logScroll: {
        flex: 1,
    },
    logText: { 
        color: '#ddd', 
        fontSize: 10,
        fontFamily: 'monospace',
    },
    // --- End New Log Styles ---
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
        // fontFamily: 'SpaceGrotesk_700Bold',
    },
    disconnectButton: {
        flex: 1,
        backgroundColor: '#FF3D00', // Red for Disconnect
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    disconnectButtonText: {
        color: '#fff',
        fontSize: 16,
        // fontFamily: 'SpaceGrotesk_700Bold',
    },
});