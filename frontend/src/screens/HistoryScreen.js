import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";

export default function HistoryScreen() {
  const [items, setItems] = useState([
    { id:"1", code:"P0171", when:"2025-10-20 12:10" },
    { id:"2", code:"P0300", when:"2025-10-20 12:20" },
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>History</Text>
      <FlatList
        data={items}
        keyExtractor={i=>i.id}
        renderItem={({item})=>(
          <View style={styles.row}>
            <Text style={styles.code}>{item.code}</Text>
            <Text style={styles.time}>{item.when}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No scans yet.</Text>}
      />
      <TouchableOpacity style={styles.clear} onPress={()=>setItems([])}>
        <Text style={{color:"#fff",fontWeight:"600"}}>Clear</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container:{flex:1,padding:20},
  h1:{fontSize:22,fontWeight:"700",marginBottom:10},
  row:{padding:14,borderRadius:10,borderWidth:1,borderColor:"#d0d7de",marginBottom:10,backgroundColor:"#fff"},
  code:{fontWeight:"800"},
  time:{color:"#57606a"},
  clear:{position:"absolute",right:20,bottom:20,backgroundColor:"#d1242f",padding:14,borderRadius:999}
});
