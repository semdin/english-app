import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  useColorScheme,
} from "react-native"; // Add useColorScheme here
import { useRouter } from "expo-router";
import Auth from "../components/Auth";
import { supabase } from "../lib/supabase";
import { StatusBar } from "expo-status-bar";
import { GoogleSignin } from "@react-native-google-signin/google-signin"; // Import Google Signin

export default function StartGameScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const colorScheme = useColorScheme(); // Get current theme

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const startGame = () => {
    router.push("/categories");
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await GoogleSignin.signOut();
      setUser(null);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  return (
    <View
      style={[
        styles.container,
        colorScheme === "dark" && styles.darkContainer, // Apply dark theme styling
      ]}
    >
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text
        style={[
          styles.title,
          colorScheme === "dark" && styles.darkTitle, // Apply dark theme text color
        ]}
      >
        Word Game
      </Text>

      <Text
        style={[
          styles.subtitle,
          colorScheme === "dark" && styles.darkSubtitle, // Apply dark theme subtitle color
        ]}
      >
        Test your vocabulary! Sign in to start.
      </Text>

      {user ? (
        <>
          <Pressable style={styles.button} onPress={startGame}>
            <Text style={styles.buttonText}>Start Game</Text>
          </Pressable>

          <View style={styles.userInfo}>
            <Image
              source={{ uri: user?.user_metadata?.avatar_url }}
              style={styles.profileImage}
            />
            <Text
              style={[
                styles.welcomeText,
                colorScheme === "dark" && styles.darkWelcomeText, // Apply dark theme text color
              ]}
            >
              Welcome, {user?.user_metadata?.full_name || "User"}!
            </Text>

            <Pressable style={styles.signOutButton} onPress={signOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={{ marginTop: 32, marginBottom: 16 }}>
            Or sign in with:
          </Text>
          <Auth />
        </>
      )}
      <StatusBar style="auto" />
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
  darkContainer: {
    backgroundColor: "#121212", // Dark background color
  },
  lightContainer: {
    backgroundColor: "#f5f5f5", // Light theme background color
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
  darkTitle: {
    color: "#fff", // Light text for dark theme
  },
  subtitle: {
    fontSize: 18,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
  },
  darkSubtitle: {
    color: "#d1d5db", // Lighter subtitle text for dark theme
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
  userInfo: {
    alignItems: "center",
    marginTop: 32,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 18,
    color: "#000",
    fontWeight: "600",
  },
  darkWelcomeText: {
    color: "#fff", // Light text for dark theme
  },
  signOutButton: {
    marginTop: 16,
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 9999,
  },
  signOutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
