import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OilChangeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Oil Change</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Cards */}
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="water-outline" size={24} color="#bab59c" />
          </View>
          <View>
            <Text style={styles.cardValue}>12/15/2023</Text>
            <Text style={styles.cardLabel}>Last oil change</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="speedometer-outline" size={24} color="#bab59c" />
          </View>
          <View>
            <Text style={styles.cardValue}>12,345 miles</Text>
            <Text style={styles.cardLabel}>Current odometer</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="calendar-outline" size={24} color="#bab59c" />
          </View>
          <View>
            <Text style={styles.cardValue}>15,000 miles</Text>
            <Text style={styles.cardLabel}>Next oil change</Text>
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>You're 75% through your oil cycle</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '75%' }]} />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logButton} onPress={() => alert('Log feature coming soon!')}>
          <Text style={styles.logButtonText}>Log new oil change</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Updated background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#111827', // Updated card background
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1f2937', // Updated icon bg
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  cardLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  progressSection: {
    marginTop: 24,
  },
  progressTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#1f2937',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FACC15',
    borderRadius: 4,
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
  },
  logButton: {
    backgroundColor: '#FACC15',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#020617',
    fontSize: 16,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
});

export default OilChangeScreen;
