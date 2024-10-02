import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function StartGameScreen() {
  const router = useRouter();

  const startGame = () => {
    router.push("/categories"); // Navigate to the Category Selection screen
  };

  return (
    <View style={styles.container}>
      {/* Logo / Illustration */}
      <Image
        source={require("../assets/images/logo.png")} // Adjust path to your logo
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Title */}
      <Text style={styles.title}>Word Game</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Test your vocabulary! Tap below to start.
      </Text>

      {/* Start Button */}
      <Pressable style={styles.button} onPress={startGame}>
        <Text style={styles.buttonText}>Start Game</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 50,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#000",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#1e40af",
    paddingVertical: 16,
    paddingHorizontal: 64,
    borderRadius: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
