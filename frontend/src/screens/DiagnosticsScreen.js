import React, { useState, useContext } from "react"; // <-- ADDED: useContext
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { OBDContext } from '../navigation/OBDContext'; // <-- Import the Context
import { PID_MAP } from '../utils/OBDDecoder'; // <-- Import PID_MAP

function DiagnosticsScreen({ navigation, route }) {
    // FIX: Use useContext to get data from the OBDContext
    const { isConnected, obdData = {}, runDiagnostics } = useContext(OBDContext);
    
    const [activeTab, setActiveTab] = useState("dtc");

    const defaultDtcCodes = [
      { id: "1", code: "P0301", description: "P0301 Engine Control Module (ECM)", active: true },
      { id: "2", code: "P0700", description: "P0700 Transmission Control Module (TCM)", active: true },
      { id: "3", code: "P0019", description: "P0019 - Crankshaft Position - Camshaft Position Correlation (Bank 2 Sensor B)", active: true },
      { id: "4", code: "P001A", description: "P001A A Camshaft Profile Control Circuit/Open Bank 1", active: true },
    ];

    const flatDtcList = (obdData.dtcCodes || []).flatMap(module => 
        module.codes.map(code => ({
            id: `${module.module}-${code}`,
            code: code,
            description: `${module.module} (${module.type})`,
            moduleName: module.module,
            type: module.type,
            active: module.type !== 'Pending'
        }))
    );
    const dtcCodes = flatDtcList.length > 0 ? flatDtcList : defaultDtcCodes;


    const liveDataArray = Object.keys(PID_MAP)
      .map(pidKey => {
        const staticData = PID_MAP[pidKey];
        const liveData = obdData.liveData?.[pidKey];
        
        return {
          pidKey,
          name: staticData.name,
          unit: staticData.unit,
          // FIX: Correctly uses isConnected from context
          value: liveData?.value ?? (isConnected ? 'N/A' : '--'), 
          isLive: !!liveData,
        };
      })
      .sort((a,b) => a.name.localeCompare(b.name));


    const renderDTCItem = ({ item }) => (
      <TouchableOpacity
        style={styles.dtcItem}
        onPress={() =>
          navigation.navigate("DTCDetail", {
            code: item.code,
            description: item.description,
          })
        }
      >
        <View style={styles.dtcInfo}>
          <Text style={styles.dtcCode}>{item.code}</Text>
          <Text style={styles.dtcDesc}>{item.description}</Text>
        </View>
        <View style={[styles.statusDot, item.active && styles.statusActive]} />
      </TouchableOpacity>
    );

    const renderPIDItem = ({ item }) => (
      <View style={[styles.pidItem, item.isLive && styles.pidItemLive]}>
        <View style={styles.pidInfo}>
          <Text style={styles.pidName}>{item.name}</Text>
          <Text style={styles.pidKeyText}>{item.pidKey}</Text>
        </View>
        <View style={styles.pidValueContainer}>
          {item.value === 'N/A' || item.value === '--' ? (
              <Text style={styles.pidValueNA}>{item.value}</Text>
          ) : (
              <Text style={styles.pidValue}>
                {item.value} <Text style={styles.pidUnitText}>{item.unit}</Text>
              </Text>
          )}
        </View>
      </View>
    );
    

    return (
      <View style={styles.container}>
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "dtc" && styles.tabActive]}
            onPress={() => setActiveTab("dtc")}
          >
            <Text style={[styles.tabText, activeTab === "dtc" && styles.tabTextActive]}>
              DTC Scan Results ({flatDtcList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "live" && styles.tabActive]}
            onPress={() => setActiveTab("live")}
          >
            <Text style={[styles.tabText, activeTab === "live" && styles.tabTextActive]}>
              Live Data (PIDs) ({Object.keys(obdData.liveData || {}).length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "dtc" ? (
          <>
            <FlatList
              data={dtcCodes}
              renderItem={renderDTCItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                  <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No Stored or Pending DTCs found.</Text>
                      <TouchableOpacity style={styles.explainButton} onPress={runDiagnostics} disabled={!isConnected}>
                          <Text style={styles.explainButtonText}>
                              {isConnected ? 'Run Full Diagnostic Scan' : 'Connect to Scan'}
                          </Text>
                      </TouchableOpacity>
                  </View>
                }
            />
            
          </>
        ) : (
          <FlatList
            data={liveDataArray}
            renderItem={renderPIDItem}
            keyExtractor={(item) => item.pidKey}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {isConnected ? 'Awaiting first data packet...' : 'Connect to start live data stream.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    );
}

export default DiagnosticsScreen;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#020617",
    },

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
      fontFamily: "SpaceGrotesk_700Bold",
    },
    tabTextActive: {
      color: "#f9fafb",
    },

    // DTC list
    list: {
      padding: 16,
    },
    dtcItem: {
      backgroundColor: "#020617",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#111827",
    },
    dtcInfo: {
      flex: 1,
    },
    dtcCode: {
      fontSize: 18,
      color: "#f9fafb",
      marginBottom: 4,
      fontFamily: "SpaceGrotesk_700Bold",
    },
    dtcDesc: {
      fontSize: 13,
      color: "#9ca3af",
      fontFamily: "SpaceGrotesk_400Regular",
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#4b5563",
    },
    statusActive: {
      backgroundColor: "#FF3D00", // Red for active/stored DTCs
    },
    
    // --- New PID List Styles ---
    pidItem: {
      backgroundColor: "#111827",
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#1f2937",
    },
    pidItemLive: {
      borderColor: "#FACC1580", // Light yellow border for live PIDs
    },
    pidInfo: {
      flexDirection: 'column',
      flex: 1,
      marginRight: 10,
    },
    pidName: {
      fontSize: 15,
      color: "#f9fafb",
      fontFamily: "SpaceGrotesk_700Bold",
    },
    pidKeyText: {
      fontSize: 10,
      color: "#6b7280",
      marginTop: 2,
      fontFamily: "SpaceGrotesk_700Bold",
    },
    pidValueContainer: {
      alignItems: 'flex-end',
    },
    pidValue: {
      fontSize: 18,
      color: "#00E676", // Green for good data flow
      fontFamily: "SpaceGrotesk_700Bold",
    },
    pidValueNA: {
      fontSize: 18,
      color: "#9ca3af",
      fontFamily: "SpaceGrotesk_700Bold",
    },
    pidUnitText: {
      fontSize: 12,
      color: "#9ca3af",
      fontFamily: "SpaceGrotesk_400Regular",
    },
    // --- End New PID List Styles ---

    explainButton: {
      backgroundColor: "#FACC15",
      marginTop: 20,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      width: '80%',
    },
    explainButtonText: {
      fontSize: 16,
      color: "#000",
      fontFamily: "SpaceGrotesk_700Bold",
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      color: "#6b7280",
      fontSize: 16,
      fontFamily: "SpaceGrotesk_400Regular",
      textAlign: 'center',
    },
});