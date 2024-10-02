import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Auth from "../components/Auth";
import { supabase } from "../lib/supabase"; // Supabase'i import et
import { StatusBar } from "expo-status-bar";

export default function StartGameScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null); // Kullanıcı bilgisini tutmak için state

  useEffect(() => {
    // Supabase ile oturum açan kullanıcıyı kontrol et
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user); // Eğer oturum varsa kullanıcıyı ayarla
      }
    };
    getSession();

    // Oturum durumu değişikliklerini dinle
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    // Component unmount olunca dinleyiciyi temizle
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const startGame = () => {
    router.push("/categories"); // Kategori seçim ekranına yönlendir
  };

  return (
    <View style={styles.container}>
      {/* Logo / Illustration */}
      <Image
        source={require("../assets/images/logo.png")} // Logonuzun path'ini ayarlayın
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

      {user ? (
        <View style={styles.userInfo}>
          {/* Kullanıcı profil fotoğrafı */}
          <Image
            source={{ uri: user?.user_metadata?.avatar_url }} // Supabase'deki user_metadata'den avatar url alınıyor
            style={styles.profileImage}
          />
          {/* Welcome mesajı */}
          <Text style={styles.welcomeText}>
            Welcome, {user?.user_metadata?.full_name || "User"}!
          </Text>
        </View>
      ) : (
        <>
          {/* Google Sign In */}
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
});
