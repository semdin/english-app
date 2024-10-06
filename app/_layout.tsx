import React, { useEffect, useState } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router"; // Import `useRouter` for navigation
import * as SplashScreen from "expo-splash-screen";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, View, Alert } from "react-native"; // Import Alert
import { supabase } from "../lib/supabase"; // Supabase client
import { useColorScheme } from "@/hooks/useColorScheme";
import { GoogleSignin } from "@react-native-google-signin/google-signin"; // Import Google Signin

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    // Supabase auth check
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    getSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Function to handle the actual logout
  const handleLogout = async () => {
    try {
      // Logout from Supabase
      await supabase.auth.signOut();

      // Logout from Google if the user was signed in via Google
      await GoogleSignin.signOut();

      // Clear the user state and redirect to the home page
      setUser(null);

      // Use router.replace() to ensure the user can't go back to previous pages after logout
      router.replace("/"); // Replace the current page with home page
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  // Function to show logout confirmation
  const confirmLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: handleLogout, // Call the logout function if confirmed
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  if (!loaded) {
    return null;
  }

  const renderHeaderRight = () => {
    return user ? (
      <Pressable onPress={confirmLogout} style={{ marginRight: 10 }}>
        <MaterialIcons name="logout" size={24} color="black" />
      </Pressable>
    ) : null;
  };

  // Render both back and home buttons
  const renderHeaderLeft = () => {
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* Back button (only shown if the user can go back) */}
        {router.canGoBack() && (
          <Pressable onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <MaterialIcons name="arrow-back" size={24} color="black" />
          </Pressable>
        )}

        {/* Home button (always shown) */}
        <Pressable onPress={() => router.push("/")} style={{ marginLeft: 10 }}>
          <MaterialIcons name="home" size={24} color="black" />
        </Pressable>
      </View>
    );
  };

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerRight: renderHeaderRight,
          headerLeft: renderHeaderLeft, // Show both back and home buttons
          headerTitleAlign: "center", // This centers the title
        }}
      >
        {/* Home screen */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Category selection screen */}
        <Stack.Screen
          name="categories"
          options={{ title: "Select Category" }}
        />
        {/* Game screen */}
        <Stack.Screen name="game" options={{ title: "Word Game" }} />
        {/* Not found screen */}
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
