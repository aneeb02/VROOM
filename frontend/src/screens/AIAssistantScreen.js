import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  LiveKitRoom,
  useRoomContext,
  useConnectionState,
  ConnectionState,
  RoomAudioRenderer,
  AudioSession,
} from '@livekit/react-native';

const API_BASE_URL = "https://lavina-oilfired-possessively.ngrok-free.dev";

// Generate a random ID for testing if no auth system is present
const USER_ID = "user_" + Math.floor(Math.random() * 10000);
const ROOM_NAME = "room_" + USER_ID;

export default function AIAssistantScreen({ navigation }) {
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchToken = async () => {
      try {
        setLoading(true);
        console.log("Fetching token for:", USER_ID, ROOM_NAME);
        
        const response = await fetch(`${API_BASE_URL}/livekit/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room_name: ROOM_NAME,
            participant_name: USER_ID,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch token: ${response.status}`);
        }

        const data = await response.json();
        if (isMounted) {
          setToken(data.token);
          setUrl(data.url);
        }
      } catch (error) {
        console.error("Error fetching token:", error);
        Alert.alert("Connection Error", "Could not connect to the voice server.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Configure Audio Session for Voice Call
    AudioSession.startAudioSession();
    fetchToken();

    return () => {
      isMounted = false;
      AudioSession.stopAudioSession();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FACC15" />
        <Text style={styles.loadingText}>Connecting to Ustaad...</Text>
      </View>
    );
  }

  if (!token || !url) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load connection details.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect={true}
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: false,
        },
      }}
      audio={true} // Auto-publish microphone
      video={false}
      style={{ flex: 1, backgroundColor: '#181711' }}
    >
      <AssistantView navigation={navigation} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function AssistantView({ navigation }) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = useCallback(() => {
    if (room.localParticipant) {
      const newState = !isMuted;
      room.localParticipant.setMicrophoneEnabled(!newState);
      setIsMuted(newState);
    }
  }, [room, isMuted]);

  const handleDisconnect = useCallback(() => {
    room.disconnect();
    navigation.goBack();
  }, [room, navigation]);

  // Determine status text
  let statusText = "Connecting...";
  let statusColor = "#FACC15"; // Yellow

  if (connectionState === ConnectionState.Connected) {
    statusText = "Ustaad is listening";
    statusColor = "#22c55e"; // Green
  } else if (connectionState === ConnectionState.Disconnected) {
    statusText = "Disconnected";
    statusColor = "#ef4444"; // Red
  } else if (connectionState === ConnectionState.Reconnecting) {
    statusText = "Reconnecting...";
    statusColor = "#FACC15";
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDisconnect} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Assistant</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Visualizer Area */}
      <View style={styles.visualizerContainer}>
        <View style={[styles.avatarContainer, { borderColor: statusColor }]}>
          <Ionicons name="mic" size={48} color={statusColor} />
        </View>
        
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusText}
        </Text>
        
        <Text style={styles.hintText}>
          Speak naturally in Urdu or English.
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, isMuted && styles.mutedButton]} 
          onPress={toggleMute}
        >
          <Ionicons 
            name={isMuted ? "mic-off" : "mic"} 
            size={28} 
            color={isMuted ? "#fff" : "#000"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.hangupButton]} 
          onPress={handleDisconnect}
        >
          <Ionicons name="call" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181711',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#181711',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  visualizerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#27251b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  hintText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    gap: 24,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FACC15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mutedButton: {
    backgroundColor: '#4b5563',
  },
  hangupButton: {
    backgroundColor: '#ef4444',
  },
  closeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
  },
});
