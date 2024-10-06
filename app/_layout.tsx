import React, { useEffect, useState } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useNavigation } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, View, Alert } from "react-native";
import { supabase } from "../lib/supabase";
import { useColorScheme } from "@/hooks/useColorScheme";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const navigation = useNavigation<any>();
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await GoogleSignin.signOut();
      setUser(null);

      navigation.resetRoot({
        index: 0,
        routes: [{ name: "index" }],
      });
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

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
          onPress: handleLogout,
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
        <MaterialIcons
          name="logout"
          size={24}
          color={colorScheme === "dark" ? "white" : "black"}
        />
      </Pressable>
    ) : null;
  };

  const renderHeaderLeft = () => {
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {router.canGoBack() && (
          <Pressable onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={colorScheme === "dark" ? "white" : "black"}
            />
          </Pressable>
        )}
        <Pressable onPress={() => router.push("/")} style={{ marginLeft: 10 }}>
          <MaterialIcons
            name="home"
            size={24}
            color={colorScheme === "dark" ? "white" : "black"}
          />
        </Pressable>
      </View>
    );
  };

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerRight: renderHeaderRight,
          headerLeft: renderHeaderLeft,
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: colorScheme === "dark" ? "#000" : "#fff", // Dynamic background color
          },
          headerTintColor: colorScheme === "dark" ? "#fff" : "#000", // Dynamic text and icon color
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="categories"
          options={{ title: "Select Category" }}
        />
        <Stack.Screen name="game" options={{ title: "Word Game" }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
          name="wordList"
          options={({ route }) => ({
            title: "Word List",
          })}
        />
      </Stack>
    </ThemeProvider>
  );
}
