import React, { createContext, useState, useRef, useEffect, useCallback } from 'react';
import { BleManager } from 'react-native-ble-plx';
import base64 from 'react-native-base64'; 
import { Buffer } from 'buffer'; 
import { PermissionsAndroid, Platform } from 'react-native';

export const OBDContext = createContext();

export function OBDProvider({ children }) {
    const manager = useRef(new BleManager()).current;

    // State
    const [isConnected, setIsConnected] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [device, setDevice] = useState(null);
    const [scannedDevices, setScannedDevices] = useState({});
    const [log, setLog] = useState([]);

    // Connection Stability Refs
    const isConnecting = useRef(false);
    
    // Dynamic UUID & Capability Refs (Populated upon connection)
    const activeServiceUUID = useRef(null);
    const activeCharacteristicUUID = useRef(null);
    const canWriteWithoutResponse = useRef(false);
    const canWriteWithResponse = useRef(false);
    const canNotify = useRef(false);

    const addLog = useCallback((msg) => {
        const timestampedMsg = `[${new Date().toLocaleTimeString()}] ${msg}`;
        setLog(prev => [...prev.slice(-49), timestampedMsg]);
        console.log('[OBD LOG]', timestampedMsg);
    }, []);

    // --- Utility to handle unexpected disconnects ---
    useEffect(() => {
        if (device) {
            const subscription = device.onDisconnected((error) => {
                if (error) {
                    addLog(`Device disconnected unexpectedly: ${error.message}`);
                } else {
                    addLog('Device disconnected.');
                }
                setIsConnected(false);
                setDevice(null);
                isConnecting.current = false;
                
                // Reset refs
                activeServiceUUID.current = null;
                activeCharacteristicUUID.current = null;
            });
            return () => subscription.remove();
        }
    }, [device, addLog]);


    const requestAndroidPermissions = async () => {
    if (Platform.OS === 'android') {
        const apiLevel = Platform.Version; // This should be retrieved correctly in a real RN app

        // BLUETOOTH_SCAN/CONNECT are needed for API 31+
        if (apiLevel >= 31) { 
            const permissionsToRequest = [
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, // Still needed for discovery
            ];

            const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);
            
            if (results['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                results['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
                results['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED) {
                addLog('All Android BLE permissions granted.');
                return true;
            } else {
                addLog('Permission denied. Cannot scan.');
                return false;
            }
        } 
        // For older Android versions (API < 31), only ACCESS_FINE_LOCATION is required for scanning
        else {
             const granted = await PermissionsAndroid.request(
                 PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
             );
             if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                 addLog('Location permission granted (legacy Android).');
                 return true;
             }
             addLog('Location permission denied.');
             return false;
        }
    }
    return true; // Assume success for non-Android platforms
};

    // -------------------------
    // Scan for devices
    // -------------------------
    const scanForDevices = async (stop = false) => {
        if (stop) {
            manager.stopDeviceScan();
            setIsScanning(false);
            addLog('Scan stopped.');
            return;
        }
        const permissionGranted = await requestAndroidPermissions();
        if (!permissionGranted) {
            setIsScanning(false);
            addLog('Cannot start scan: Permissions not granted.');
            return;
        }
        setIsScanning(true);
        addLog('Scanning for BLE OBD devices...');
        setScannedDevices({});

        manager.startDeviceScan(null, null, (error, dev) => {
            if (error) {
                addLog(`Scan error: ${error}`);
                setIsScanning(false);
                return;
            }

            if (dev && dev.id) {
                setScannedDevices(prev => {
                    if (!prev[dev.id]) {
                        addLog(`Found device: ${dev.name || 'N/A'} (${dev.id})`);
                    }
                    return { ...prev, [dev.id]: dev };
                });
            }
        });

        setTimeout(() => {
            manager.stopDeviceScan();
            setIsScanning(false);
            addLog('Scan finished.');
        }, 10000); 
    };

    // -------------------------
    // HELPER: Auto-Detect OBD Characteristics
    // -------------------------
    const findWritableCharacteristic = async (connectedDevice) => {
        try {
            const servicesObj = await connectedDevice.services();
            const services = Object.values(servicesObj); // Array of Service objects
            
            for (const service of services) {
                const characteristics = await connectedDevice.characteristicsForService(service.uuid);
                
                for (const char of characteristics) {
                    // Check for Write capabilities
                    if (char.isWritableWithoutResponse) {
                        addLog(`Found WriteNoResp Char: ${char.uuid}`);
                        activeServiceUUID.current = service.uuid;
                        activeCharacteristicUUID.current = char.uuid;
                        canWriteWithoutResponse.current = true;
                        canWriteWithResponse.current = false;
                        return true;
                    }
                    
                    if (char.isWritableWithResponse) {
                        addLog(`Found WriteResp Char: ${char.uuid}`);
                        activeServiceUUID.current = service.uuid;
                        activeCharacteristicUUID.current = char.uuid;
                        canWriteWithResponse.current = true;
                        canWriteWithoutResponse.current = false;
                        return true;
                    }
                }
            }
        } catch (e) {
            addLog(`Error finding characteristics: ${e.message}`);
        }
        return false;
    };
    
    // -------------------------
    // Execute synchronous ELM327 command
    // -------------------------
    const executeElmCommand = async (command, targetDevice = null) => {
        const currentDevice = targetDevice || device;
        if (!currentDevice) {
            addLog(`Error: Cannot send ${command}. No device reference.`);
            return null;
        }
        
        if (!activeServiceUUID.current || !activeCharacteristicUUID.current) {
             addLog(`Error: No writable characteristic detected.`);
             return null;
        }

        const elmCommand = command + '\r'; 
        const base64Command = base64.encode(elmCommand);
        
        const MAX_RETRIES = 2;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                addLog(`Sending ${command} (Att ${attempt})...`);

                // 1. Write based on detected capability
                if (canWriteWithoutResponse.current) {
                    await currentDevice.writeCharacteristicWithoutResponseForService(
                        activeServiceUUID.current,
                        activeCharacteristicUUID.current,
                        base64Command
                    );
                } else {
                     await currentDevice.writeCharacteristicWithResponseForService(
                        activeServiceUUID.current,
                        activeCharacteristicUUID.current,
                        base64Command
                    );
                }
                
                // 2. Wait for processing (ELM327 needs time)
                await new Promise(resolve => setTimeout(resolve, 300)); 

                // 3. Read response
                const readCharacteristic = await currentDevice.readCharacteristicForService(
                    activeServiceUUID.current, 
                    activeCharacteristicUUID.current
                );
                
                const rawResponse = base64.decode(readCharacteristic.value).trim();
                addLog(`Response: ${rawResponse}`);
                
                return rawResponse; 

            } catch (error) {
                addLog(`CMD Failed: ${error.message}`);
                if (attempt === MAX_RETRIES) return null;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        return null;
    };

    // -------------------------
    // Connect to device
    // -------------------------
    const connectToDevice = async (dev) => {
        if (!dev) return;
        if (isConnecting.current) return;

        manager.stopDeviceScan(); 
        setIsScanning(false);
        isConnecting.current = true;
        addLog(`Connecting to ${dev.name || dev.id}...`);

        try {
            // 1. Connect
            const connectedDevice = await dev.connect();
            
            // 2. Discover & Request MTU
            await connectedDevice.discoverAllServicesAndCharacteristics();
            try { await connectedDevice.requestMTU(512); } catch(e) {}
            
            await new Promise(resolve => setTimeout(resolve, 1000)); 

            // 3. Auto-Detect Services (CRITICAL FIX)
            const found = await findWritableCharacteristic(connectedDevice);
            
            if (!found) {
                throw new Error("No writable OBD characteristic found on this device.");
            }

            // 4. Set state
            setDevice(connectedDevice);
            setIsConnected(true);
            addLog(`Connected! UUID: ${activeCharacteristicUUID.current}`);
            
            // 5. Send ATZ
            const atzResponse = await executeElmCommand('ATZ', connectedDevice);
            
            if (atzResponse && (atzResponse.includes('ELM') || atzResponse.includes('?'))) {
                addLog('Init Success!');
                
                // Config
                await executeElmCommand('AT E0', connectedDevice);
                await executeElmCommand('AT L0', connectedDevice);
                await executeElmCommand('AT SP 0', connectedDevice);
                
                isConnecting.current = false;
            } else {
                 addLog(`Init Warning. Response: ${atzResponse}`);
                 // Try one recovery command
                 await executeElmCommand('AT E0', connectedDevice);
                 isConnecting.current = false;
            }

        } catch (err) {
            addLog(`Conn Error: ${err.message}`);
            setIsConnected(false);
            setDevice(null);
            manager.cancelDeviceConnection(dev.id).catch(() => {});
            isConnecting.current = false;
        }
    };
    
    const sendCommand = async (command) => {
        return executeElmCommand(command, device);
    };

    return (
        <OBDContext.Provider value={{
            scanForDevices,
            connectToDevice,
            isConnected,
            isScanning,
            device,
            scannedDevices,
            log,
            sendCommand
        }}>
            {children}
        </OBDContext.Provider>
    );
}