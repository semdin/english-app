import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { supabase } from "../lib/supabase";
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function Auth() {
  GoogleSignin.configure({
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    webClientId:
      "691183788881-ihsl30r4rhqejj61a84g80fofgt7cv3n.apps.googleusercontent.com", // Bunu Google Console'dan aldığınız client ID ile değiştirmelisiniz
    iosClientId:
      "691183788881-nv7eq9g5nb0ijj61haa8cf6nn2v2c4b4.apps.googleusercontent.com",
  });

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (userInfo.data?.idToken) {
        // Supabase ile oturum açma işlemi
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: userInfo.data?.idToken,
        });
      } else {
        //throw new Error("No ID token present!");
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      } else if (error.code === statusCodes.IN_PROGRESS) {
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      } else {
        console.error("Something went wrong:", error);
      }
    }
  };

  return (
    <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
      <Text style={styles.buttonText}>Sign in with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleButton: {
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
