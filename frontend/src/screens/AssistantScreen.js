import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from "react-native";

export default function AssistantScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: "1", text: "Hey there! How can I help you today?", sender: "bot" },
    { id: "2", text: "My car is making a strange noise when I brake. What could it be?", sender: "user" },
    { id: "3", text: "That's not ideal! It could be a few things, like worn brake pads, a problem with the rotors, or even an issue with the brake fluid. Let's run a quick diagnostic to pinpoint the exact cause. Would you like me to guide you through it?", sender: "bot" },
  ]);

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.sender === "user" && styles.userMessageContainer]}>
      {item.sender === "bot" && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🤖</Text>
        </View>
      )}
      <View style={[styles.messageBubble, item.sender === "user" ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.messageText, item.sender === "user" && styles.userMessageText]}>
          {item.text}
        </Text>
      </View>
      {item.sender === "user" && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
      )}
    </View>
  );

  const sendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { id: Date.now().toString(), text: message, sender: "user" }]);
      setMessage("");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <Text style={styles.header}>Ustaad</Text>
      
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
          placeholderTextColor="#666"
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>🎤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a3a",
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  userMessageContainer: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  avatarText: {
    fontSize: 20,
  },
  messageBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: "#2a2a2a",
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#FFC107",
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 20,
  },
  userMessageText: {
    color: "#000",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#3a3a3a",
    backgroundColor: "#1a1a1a",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFC107",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    fontSize: 24,
  },
});