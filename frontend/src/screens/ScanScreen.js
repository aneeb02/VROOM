import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";

export default function ScanScreen() {
  const [code, setCode] = useState("P0300");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const mockExplain = async () => {
    // Placeholder until backend is ready
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setResult({
      code,
      summary: "Random/multiple cylinder misfire detected.",
      severity: "Medium",
      causes: ["Worn spark plugs", "Vacuum leak", "Fuel delivery issue"],
      checks: ["Inspect plugs/coils", "Smoke-test intake", "Fuel pressure test"],
    });
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Scan</Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="Enter DTC e.g., P0300"
        autoCapitalize="characters"
      />

      <TouchableOpacity style={styles.btn} onPress={mockExplain} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Explain Code</Text>}
      </TouchableOpacity>

      {result && (
        <View style={styles.card}>
          <Text style={styles.code}>{result.code}</Text>
          <Text style={styles.summary}>{result.summary}</Text>
          <Text style={styles.label}>Severity: <Text style={styles.badge}>{result.severity}</Text></Text>
          <Text style={styles.label}>Likely causes:</Text>
          {result.causes.map((c,i)=><Text key={i}>• {c}</Text>)}
          <Text style={[styles.label,{marginTop:8}]}>Checks:</Text>
          {result.checks.map((c,i)=><Text key={i}>• {c}</Text>)}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container:{flex:1,padding:20,gap:12},
  h1:{fontSize:22,fontWeight:"700",marginBottom:4},
  input:{borderWidth:1,borderColor:"#d0d7de",borderRadius:10,padding:12},
  btn:{backgroundColor:"#1f6feb",padding:14,borderRadius:10,alignItems:"center"},
  btnText:{color:"#fff",fontWeight:"600"},
  card:{marginTop:16,padding:16,borderRadius:12,borderWidth:1,borderColor:"#d0d7de",backgroundColor:"#fff"},
  code:{fontWeight:"800",fontSize:18,marginBottom:4},
  summary:{marginBottom:8},
  label:{fontWeight:"700",marginTop:6},
  badge:{fontWeight:"800"}
});
