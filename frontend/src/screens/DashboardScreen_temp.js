import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import { OBDContext } from '../navigation/OBDContext'; 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  
  // BUTTONS
  connectBtn: { backgroundColor: '#FFD700', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  connectText: { color: '#000', fontWeight: '900', fontSize: 18 },
  scanBtn: { backgroundColor: '#333', padding: 16, borderRadius: 10, alignItems: 'center', marginVertical: 10, borderWidth:1, borderColor:'#555' },

  // STATUS & PROGRESS
  statusBox: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  statusText: { color: '#ddd', fontSize: 16 },
  statusLight: (c) => ({ width: 12, height: 12, borderRadius: 6, backgroundColor: c ? '#00E676' : '#FF3D00', marginLeft: 10 }),
  progressContainer: { marginTop: 10, marginBottom: 20 },
  progressBar: { height: 10, backgroundColor: '#333', borderRadius: 5, overflow: 'hidden' },
  progressFill: (pct) => ({ height: '100%', width: `${pct}%`, backgroundColor: '#FFD700' }),
  progressText: { color: '#aaa', textAlign: 'center', marginTop: 5, fontSize: 12 },

  // GRIDS & LISTS
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: '#1E1E1E', borderRadius: 10, padding: 15, marginBottom: 15, width: '48%', borderWidth: 1, borderColor: '#333' },
  cardTitle: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 5 },
  cardValue: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  sectionHeader: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  listContainer: { backgroundColor: '#1E1E1E', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  
  // CARDS
  dtcCard: { backgroundColor: '#2C1A1A', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#FF3D00' },
  moduleCard: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#00E676' },

  ok: { color: '#00E676', fontWeight: 'bold' },     
  inc: { color: '#FF9100', fontWeight: 'bold' },    
  na: { color: '#555', fontStyle: 'italic' }, 
  fail: { color: '#FF3D00', fontWeight: 'bold' },

  debugBox: { marginTop: 20, marginBottom: 40, padding: 10, backgroundColor: '#000', borderRadius: 5 },
  debugText: { color: '#0f0', fontFamily: 'monospace', fontSize: 10 }
});

const DashboardScreen = ({ navigation }) => {
  const context = useContext(OBDContext);
  
  // 1. SAFETY: Prevent crash if Context is null
  if (!context) return <View style={styles.container}><Text style={{color:'red', marginTop:50}}>Loading Context...</Text></View>;

  const { isConnected, obdData, isScanning, runDiagnostics, dtcCodes, scanStatus, disconnect, lastRawData } = context;
  const em = obdData?.Emissions || {};
  
  // 2. SAFETY: Handle Progress Math
  const progressPercent = (scanStatus?.total > 0) ? (scanStatus.current / scanStatus.total) * 100 : 0;

  const handleScan = async () => {
    if(!isConnected) { Alert.alert("Connect First"); return; }
    await runDiagnostics();
  };

  const getStatusStyle = (s) => s === 'OK' ? styles.ok : (s === 'INC' ? styles.inc : styles.na);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View><Text style={{color:'#FFD700'}}>PROJECT VROOM</Text><Text style={styles.title}>Diagnostics</Text></View>
          <Ionicons name="car-sport" size={32} color="#FFD700" />
        </View>

        {/* CONNECTION BUTTON */}
        {!isConnected ? (
            <TouchableOpacity style={styles.connectBtn} onPress={() => navigation.navigate('DeviceSelection')}>
                <Text style={styles.connectText}>CONNECT OBD ADAPTER</Text>
            </TouchableOpacity>
        ) : (
            <TouchableOpacity style={[styles.connectBtn, {backgroundColor:'#333'}]} onPress={disconnect}>
                <Text style={{color:'#FF3D00', fontWeight:'bold'}}>DISCONNECT</Text>
            </TouchableOpacity>
        )}

        <View style={styles.statusBox}>
            <Text style={styles.statusText}>{isConnected ? "SYSTEM ONLINE" : "OFFLINE"}</Text>
            <View style={styles.statusLight(isConnected)} />
        </View>

        {/* LIVE SENSORS (Dynamic from Decoder) */}
        <Text style={styles.sectionHeader}>Live Sensors</Text>
        <View style={styles.cardGrid}>
          {obdData?.liveData && Object.keys(obdData.liveData).length > 0 ? (
            Object.values(obdData.liveData).map((pidData, index) => (
              <View key={index} style={styles.card}>
                <Text style={styles.cardTitle}>{pidData.name}</Text>
                <Text style={styles.cardValue}>
                  {pidData.value} <Text style={{fontSize: 14, fontWeight: 'normal'}}>{pidData.unit}</Text>
                </Text>
              </View>
            ))
          ) : (
             <View style={[styles.card, {width: '100%'}]}><Text style={{color: '#777'}}>Waiting for data...</Text></View>
          )}
        </View>

        {/* SCANNER CONTROLS */}
        <Text style={styles.sectionHeader}>Full System Scan</Text>
        {scanStatus?.stage !== 'Idle' && (
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}><View style={styles.progressFill(progressPercent)} /></View>
                <Text style={styles.progressText}>{scanStatus?.stage} ({scanStatus?.current}/{scanStatus?.total})</Text>
            </View>
        )}
        
        <TouchableOpacity style={styles.scanBtn} onPress={handleScan}>
          <Text style={{color:'#fff', fontWeight:'bold'}}>
            {scanStatus?.stage === 'Idle' ? "START FULL SCAN (200+ MODULES)" : "SCANNING..."}
          </Text>
        </TouchableOpacity>

        {/* 3. SAFETY: FAULT CODES (Prevents .map crash) */}
        {Array.isArray(dtcCodes) && dtcCodes.length > 0 && (
            <View>
                <Text style={{color:'#FF3D00', fontWeight:'bold', marginBottom:10}}>⚠️ FAULTS FOUND</Text>
                {dtcCodes.map((item, i) => (
                    <View key={i} style={styles.dtcCard}>
                        <Text style={{color:'#FF3D00', fontWeight:'bold', fontSize:16}}>⚠️ {item.codes.join(', ')}</Text>
                        <Text style={{color:'#ccc'}}>Module: {item.module} ({item.type})</Text>
                    </View>
                ))}
            </View>
        )}

        {/* 4. SAFETY: MODULES LIST (Prevents .map crash) */}
        {Array.isArray(obdData?.modulesFound) && obdData.modulesFound.length > 0 && (
            <View>
                <Text style={{color:'#00E676', fontWeight:'bold', marginTop:10, marginBottom:5}}>Detected Modules ({obdData.modulesFound.length})</Text>
                {obdData.modulesFound.map((mod, i) => (
                    <View key={i} style={styles.moduleCard}>
                        <Text style={{color:'#fff', fontWeight:'bold'}}>{mod.name || 'Unknown'}</Text>
                        <Text style={{color:'#aaa'}}>ID: {mod.id}</Text>
                    </View>
                ))}
            </View>
        )}

        {/* EMISSIONS */}
        <Text style={styles.sectionHeader}>Emissions Readiness</Text>
        <View style={styles.listContainer}>
            <View style={styles.row}>
                <Text style={[styles.rowLabel, {fontWeight:'bold', color:'#fff'}]}>MIL (Check Engine)</Text>
                <Text style={em.MIL ? styles.fail : styles.ok}>{em.MIL ? "ON" : "OFF"}</Text>
            </View>
            {Object.keys(em).filter(k => k !== 'MIL').map((key) => (
                <View key={key} style={styles.row}><Text style={styles.rowLabel}>{key}</Text><Text style={getStatusStyle(em[key])}>{em[key]}</Text></View>
            ))}
        </View>

        {/* 5. SAFETY: MODE 06 (Prevents .map crash) */}
        {Array.isArray(obdData?.mode06) && obdData.mode06.length > 0 && (
            <>
            <Text style={styles.sectionHeader}>Mode 06 Monitors</Text>
            <View style={styles.listContainer}>
                {obdData.mode06.map((m, i) => (
                    <View key={i} style={styles.row}>
                        <Text style={{color:'#fff'}}>TID:${m.tid.toString(16)} CID:${m.cid.toString(16)}</Text>
                        <Text style={{color: m.status==='Pass' ? '#00E676' : '#FF3D00'}}>{m.val} [{m.min}-{m.max}]</Text>
                    </View>
                ))}
            </View>
            </>
        )}

        {isConnected && (
            <View style={styles.debugBox}>
                <Text style={{color:'#555', fontSize:10, marginBottom:5}}>RAW STREAM</Text>
                <Text style={styles.debugText}>{lastRawData}</Text>
            </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;