import React, { createContext, useState, useRef, useCallback } from 'react';
import { BleManager } from 'react-native-ble-plx';
import base64 from 'react-native-base64';
import { decodePID } from '../utils/OBDDecoder'; // Assumed path for the PID Decoder

export const OBDContext = createContext();

const MODULE_NAMES = {
  '7E0': 'Engine (ECM)', '7E1': 'Transmission', '7E2': 'ABS', '7E8': 'Gateway',
  '7C0': 'Body Control', '7C4': 'HVAC', '7D0': 'Steering', '720': 'Sunroof',
  '730': 'Door LF', '731': 'Door RF', '7A0': 'Park Assist', '750': 'Cluster',
  '758': 'Radar', '790': 'Wipers'
};

export function OBDProvider({ children }) {
  const manager = useRef(new BleManager()).current;

  // --- STATE ---
  const [obdData, setObdData] = useState({
    liveData: {}, // Store decoded PID data here: { '010C': { name: 'RPM', value: 850, unit: 'rpm' } }
    Emissions: { MIL: false, Misfire: 'N/A', FuelSys: 'N/A', Components: 'N/A', Catalyst: 'N/A', HeatedCat: 'N/A', EVAP: 'N/A', SecAir: 'N/A', ACRef: 'N/A', O2: 'N/A', O2Heater: 'N/A', EGR: 'N/A' },
    mode06: [], vin: null, modulesFound: [] 
  });

  const [dtcCodes, setDtcCodes] = useState([]); 
  const [lastRawData, setLastRawData] = useState("Waiting...");
  const [scanStatus, setScanStatus] = useState({ current: 0, total: 0, stage: 'Idle' });
  const [scannedDevices, setScannedDevices] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const [device, setDevice] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [log, setLog] = useState([]); 

  // REFS
  const connectedDeviceRef = useRef(null);
  const serviceUuidRef = useRef(null);
  const writeUuidRef = useRef(null);
  const pollTimer = useRef(null);
  const pollIndex = useRef(0);
  const commandQueue = useRef([]);
  const processingQueue = useRef(false);
  const pendingResponses = useRef([]);

  // SLOWER TIMING TO CATCH SLEEPY MODULES
  const TX_DELAY_MS = 150; 
  const RESPONSE_TIMEOUT_MS = 3000; 

  const addLog = useCallback((msg) => {
    console.log('[OBD]', msg);
    setLog(prev => [...prev.slice(-100), msg]);
  }, []);

  const hexToBytes = (hex) => {
    const out = [];
    for (let i = 0; i < hex.length; i += 2) out.push(parseInt(hex.substring(i, i + 2), 16));
    return out;
  };

  const cleanISO_TP = (raw) => {
      if (raw.includes(':') || raw.includes('\n')) {
          return raw.replace(/[\r\n]+/g, '').replace(/[0-9A-F]:/g, '').replace(/\s+/g, '');
      }
      return raw.replace(/\s+/g, '').replace(/>/g, '');
  };

  const parseDTC = (hexData) => {
    const codes = [];
    let clean = cleanISO_TP(hexData);
    
    // Attempt to remove header if it's a multi-line response (e.g., 7E843...)
    if (/^7[0-9A-F]{2}/.test(clean)) {
        const idx = clean.search(/4[37A]/);
        if(idx !== -1) clean = clean.substring(idx);
    }
    
    // Remove the Mode response header (43, 47, 4A)
    clean = clean.replace(/^(43|47|4A)/, '');

    if (clean === '00' || clean.length < 4) return [];

    for (let i = 0; i < clean.length; i += 4) {
      const A = parseInt(clean.substring(i, i+2), 16);
      const B = parseInt(clean.substring(i+2, i+4), 16);
      if (isNaN(A) || (A === 0 && B === 0)) continue; 
      
      // Decode based on standard DTC encoding
      const type = ['P', 'C', 'B', 'U'][A >> 6] || 'P'; // P: 00, C: 01, B: 10, U: 11
      const secondChar = (A >> 4) & 0x3;
      const rest = ((A & 0xF) << 8) | B;
      codes.push(`${type}${secondChar}${rest.toString(16).padStart(3, '0').toUpperCase()}`);
    }
    return codes;
  };

  // --- QUEUE ---
  const registerPendingResponse = (cmd, matcher, timeoutMs) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        pendingResponses.current = pendingResponses.current.filter(p => p.timeoutId !== timeoutId);
        resolve('TIMEOUT'); 
      }, timeoutMs);
      pendingResponses.current.push({ cmd, matcher, resolve, reject, timeoutId });
    });
  };

  const processQueue = async () => {
    if (processingQueue.current) return;
    processingQueue.current = true;
    while (commandQueue.current.length > 0) {
      const item = commandQueue.current.shift();
      if (!connectedDeviceRef.current) { item.reject(new Error('Disconnected')); continue; }
      
      const encoded = base64.encode(item.cmd + '\r');
      addLog(`TX -> ${item.cmd}`);

      try {
        await connectedDeviceRef.current.writeCharacteristicWithoutResponseForService(serviceUuidRef.current, writeUuidRef.current, encoded);
      } catch (e) {
        // Fallback to writeWithResponse if writeWithoutResponse fails (less common on ELM327s)
        try { await connectedDeviceRef.current.writeCharacteristicWithResponseForService(serviceUuidRef.current, writeUuidRef.current, encoded); }
        catch (e2) { }
      }

      if (item.expectResponse) {
        // Wait for the response from the BLE notification listener
        const res = await registerPendingResponse(item.cmd, item.matcher, item.timeoutMs);
        if (res === 'TIMEOUT') addLog(`RX <- (No Data / Timeout)`);
        item.resolve(res);
      } else {
        await new Promise(r => setTimeout(r, TX_DELAY_MS));
        item.resolve(null);
      }
      // Delay before next command
      await new Promise(r => setTimeout(r, TX_DELAY_MS));
    }
    processingQueue.current = false;
  };

  const sendCommand = (cmd, options = {}) => {
    const expectResponse = options.expectResponse ?? true;
    let matcher = options.matcher || (h => h.length > 1);
    return new Promise((resolve, reject) => {
      commandQueue.current.push({ cmd, matcher, expectResponse, timeoutMs: options.timeoutMs || RESPONSE_TIMEOUT_MS, resolve, reject });
      processQueue();
    });
  };

  const notifyPending = (hex) => {
    if (!pendingResponses.current.length) return;
    const copy = [...pendingResponses.current];
    // Resolve all pending commands that match the incoming response
    copy.forEach(p => {
      if (p.matcher(hex)) {
        p.resolve(hex);
        // Remove the command from the pending list
        pendingResponses.current = pendingResponses.current.filter(x => x.timeoutId !== p.timeoutId);
        // Note: We use timeoutId to remove the correct item after resolution
        clearTimeout(p.timeoutId); 
      }
    });
  };

  const parseOBDResponse = useCallback((hex) => {
    if (!hex) return;
    setLastRawData(hex);
    let clean = cleanISO_TP(hex);
    if (clean.includes('UNABLE')) return;
    
    addLog(`RX <- ${clean}`);
    notifyPending(clean);

    // Live Data
    if (clean.includes('41')) {
        const idx = clean.indexOf('41');
        const data = clean.substring(idx);
        if (data.length >= 4) {
            const pid = data.substring(2, 4);
            const bytes = hexToBytes(data.substring(4));
            
            const pidKey = '01' + pid;
            const decoded = decodePID(pidKey, bytes);
            
            if (decoded) {
                setObdData(p => ({
                    ...p,
                    liveData: {
                        ...p.liveData,
                        [pidKey]: decoded
                    }
                }));
            } else {
                // Corrected PID 0101 decoding (Emissions Readiness)
                if (pid === '01') {
                    const [A, B, C, D] = bytes;
                    
                    // Helper: Checks if monitor is Supported and if it is Complete (0=OK, 1=INC)
                    const getStatus = (supportByte, supportBit, completionByte, completionBit) => {
                        const isSupported = (supportByte & (1 << supportBit)) !== 0;
                        if (!isSupported) return 'N/A';
                        
                        // In completion byte, 0 = Complete, 1 = Incomplete
                        const isComplete = (completionByte & (1 << completionBit)) === 0;
                        return isComplete ? 'OK' : 'INC';
                    };

                    setObdData(p => ({
                        ...p, 
                        Emissions: {
                            MIL: (A & 0x80) !== 0, // Byte A, Bit 7 (MIL status)
                            
                            // Continuous Monitors (Availability is in Byte A, not implemented here for simplicity)
                            Misfire: getStatus(B, 0, D, 0),         
                            FuelSys: getStatus(B, 1, D, 1),
                            Components: getStatus(B, 2, D, 2),
                            
                            // Non-Continuous Monitors (Spark Ignition standard)
                            Catalyst: getStatus(C, 6, D, 6),       
                            HeatedCat: getStatus(C, 7, D, 7),      
                            EVAP: getStatus(D, 0, D, 0),           
                            SecAir: getStatus(D, 1, D, 1),         
                            ACRef: getStatus(D, 2, D, 2),          
                            O2: getStatus(D, 3, D, 3),             
                            O2Heater: getStatus(D, 4, D, 4),       
                            EGR: getStatus(D, 5, D, 5), // Note: Bits D5-D7 are often vehicle-specific/reserved
                        }
                    }));
                }
            }
        }
    }
    // Mode 06 (Test Results)
    if (clean.startsWith('46')) {
        const bytes = hexToBytes(clean.substring(2));
        if(bytes.length >= 8) {
            const result = { 
               tid: bytes[0], cid: bytes[1], val: (bytes[2] << 8) | bytes[3], 
               min: (bytes[4] << 8) | bytes[5], max: (bytes[6] << 8) | bytes[7],
               status: ((bytes[2] << 8) | bytes[3]) >= ((bytes[4] << 8) | bytes[5]) ? 'Pass' : 'Fail'
            };
            setObdData(p => ({...p, mode06: [...p.mode06, result].slice(-50)}));
        }
    }
  }, [addLog]);

  const connectToDevice = async (dev) => {
    manager.stopDeviceScan(); setIsScanning(false);
    try {
      const connected = await dev.connect();
      await connected.discoverAllServicesAndCharacteristics();
      connectedDeviceRef.current = connected;
      
      // Characteristic Discovery Logic
      const services = await connected.services();
      let sUUID, wUUID, nUUID;
      for (const s of services) {
        const chars = await connected.characteristicsForService(s.uuid);
        for (const c of chars) {
           if (c.isNotifiable && !c.uuid.startsWith('00002a')) { sUUID = s.uuid; nUUID = c.uuid; }
           if (c.isWritableWithoutResponse && !c.uuid.startsWith('00002a')) { sUUID = s.uuid; wUUID = c.uuid; }
        }
      }
      if (!sUUID || !wUUID || !nUUID) { 
          addLog('No suitable OBD Service/Characteristic found.'); 
          manager.cancelDeviceConnection(dev.id); 
          return; 
      }
      serviceUuidRef.current = sUUID; writeUuidRef.current = wUUID;
      
      // Start Notification Listener
      connected.monitorCharacteristicForService(sUUID, nUUID, (e, c) => {
        if (c?.value) { 
            const text = base64.decode(c.value).trim().toUpperCase(); 
            if(text) parseOBDResponse(text); 
        }
      });
      
      setDevice(connected); setIsConnected(true);
      
      // ELM327 Initialization Commands
      const init = ['ATZ','ATE0','ATL0','ATS0','ATSP0'];
      for (const cmd of init) { await sendCommand(cmd, { timeoutMs: 1500 }); await new Promise(r=>setTimeout(r,300)); }
      
      // Initial PID 0100 (Supported PIDs) call to kickstart data
      await sendCommand('0100'); 
      
      startPolling();
    } catch (e) { 
      addLog('Connect Error: ' + e.message); 
      manager.cancelDeviceConnection(dev.id).catch(() => {});
      setIsConnected(false);
    }
  };

  const startPolling = () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollIndex.current = 0;
    pollTimer.current = setInterval(() => {
       if (!connectedDeviceRef.current || scanStatus.stage !== 'Idle') return;
       
       // Priority list of PIDs to poll (includes 0101 for constant readiness monitoring)
       const livePids = ['010C', '010D', '0105', '0104', '0110', '0142', '0101', '010F', '0111', '012F', '0133', '0143', '015C']; 
       const pid = livePids[pollIndex.current % livePids.length];
       
       sendCommand(pid, { timeoutMs: 800 });
       pollIndex.current++;
    }, 350); // Polling interval
  };

  const scanForDevices = () => {
    setScannedDevices({}); setIsScanning(true);
    manager.startDeviceScan(null, {allowDuplicates:false}, (e,d) => { if(d?.id) setScannedDevices(p=>({...p,[d.id]:d})); });
    setTimeout(() => { manager.stopDeviceScan(); setIsScanning(false); }, 5000); // 5 second scan limit
  };

  // --- IMPROVED DISCONNECT FUNCTION ---
  const disconnect = () => { 
    if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
    }
    // Clear all pending communication tasks
    commandQueue.current = []; 
    pendingResponses.current.forEach(p => clearTimeout(p.timeoutId));
    pendingResponses.current = []; 
    processingQueue.current = false;
    
    // Cancel the BLE connection
    if(connectedDeviceRef.current) {
        manager.cancelDeviceConnection(connectedDeviceRef.current.id).catch(() => {});
    }
    
    // Reset state
    setIsConnected(false); 
    setDevice(null);
    connectedDeviceRef.current = null;
    addLog('Successfully disconnected and cleaned up.');
  };

  const generateScanList = () => {
      const modules = [];
      // Brute force scan from 0x700 to 0x7FF to find all ECUs
      for (let i = 0x700; i <= 0x7FF; i++) modules.push(i.toString(16).toUpperCase());
      return modules; 
  };

  // --- THE "PATIENT" NUCLEAR SCANNER ---
  const runDiagnostics = async () => {
    if(!isConnected) return;
    if(pollTimer.current) clearInterval(pollTimer.current); // Stop polling during scan
    
    // Reset diagnostic states
    setDtcCodes([]);
    setObdData(p => ({...p, modulesFound: [], mode06: []}));
    
    const modules = generateScanList();
    setScanStatus({ current: 0, total: modules.length, stage: 'Brute Force Scanning...' });

    for (let i = 0; i < modules.length; i++) {
        const header = modules[i];
        setScanStatus(prev => ({ ...prev, current: i + 1 }));
        
        // 0. Set the target header
        await sendCommand(`ATSH${header}`, { timeoutMs: 150 }); 
        
        // 1. PING: Mode 01 PID 00 (Supported PIDs)
        const ping = await sendCommand('0100', { timeoutMs: 400 });
        
        // IF ALIVE
        if (ping && (ping.includes('41') || ping.length > 4) && ping !== 'TIMEOUT') {
             
             const name = MODULE_NAMES[header] || `Module ${header}`;
             setObdData(prev => ({ ...prev, modulesFound: [...prev.modulesFound, {id: header, name: name}] }));
             addLog(`✅ FOUND: ${name}`);

             // 2. Stored Codes (Mode 03)
             const dtcRes = await sendCommand('03', { timeoutMs: 800 });
             if (dtcRes && dtcRes.includes('43')) {
                 const cleanRes = cleanISO_TP(dtcRes);
                 if (!cleanRes.includes('4300') && !cleanRes.includes('430000')) {
                     const codes = parseDTC(cleanRes);
                     if (codes.length > 0) {
                         setDtcCodes(prev => [...prev, { module: name, type: 'Stored', codes }]);
                         addLog(`!!! FAULT: ${codes.join(', ')}`);
                     }
                 }
             }
             
             // 3. Pending Codes (Mode 07)
             const penRes = await sendCommand('07', { timeoutMs: 800 });
             if (penRes && penRes.includes('47')) {
                 const cleanRes = cleanISO_TP(penRes);
                 if (!cleanRes.includes('4700')) {
                     const codes = parseDTC(cleanRes);
                     if (codes.length > 0) {
                         setDtcCodes(prev => [...prev, { module: name, type: 'Pending', codes }]);
                     }
                 }
             }
        }
    }
    
    // Finalization commands (usually directed at the Engine/7E0)
    setScanStatus(p => ({...p, stage: 'Monitors & VIN'}));
    await sendCommand('ATSH7E0'); 
    await sendCommand('05'); // O2 Sensor Monitoring Test Results (Not parsed, but requested)
    await sendCommand('0601', {timeoutMs: 3000}); // Mode 06 Test Results
    await sendCommand('08'); // Mode 08 (Control of On-board System)
    await sendCommand('0902'); // VIN

    setScanStatus({ current: modules.length, total: modules.length, stage: 'Idle' });
    startPolling(); // Resume live data polling
  };

  return (
    <OBDContext.Provider value={{
      scannedDevices, isScanning, device, isConnected, log, obdData, lastRawData, dtcCodes, scanStatus,
      scanForDevices, connectToDevice, disconnect, runDiagnostics
    }}>
      {children}
    </OBDContext.Provider>
  );
}

export default OBDProvider;