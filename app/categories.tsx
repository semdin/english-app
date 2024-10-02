// categories.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons"; // Assuming you are using MaterialIcons

export default function CategoriesScreen() {
  interface Category {
    id: number;
    name: string;
    icon: string; // Icon name fetched from the backend
  }

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const backendUrl = "https://english-app-backend-o83c.onrender.com"; // Update with your backend URL

  useEffect(() => {
    axios
      .get(`${backendUrl}/api/categories`)
      .then((response) => {
        setCategories(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
        setLoading(false);
      });
  }, []);

  const selectCategory = (categoryId: number, categoryName: string) => {
    // Navigate to the game screen with the selected category
    router.push({
      pathname: "/game",
      params: { categoryId, categoryName },
    });
  };

  // Ensure icons are properly rendered
  const renderIcon = (iconName: string) => {
    if (!iconName) {
      return null; // If no icon name is provided, return null
    }
    return (
      <MaterialIcons
        name={iconName as keyof typeof MaterialIcons.glyphMap}
        size={24}
        color="#fff"
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Select a Category</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Pressable
            style={styles.categoryButton}
            onPress={() => selectCategory(item.id, item.name)}
          >
            {renderIcon(item.icon)}
            <Text style={styles.categoryButtonText}>{item.name}</Text>
          </Pressable>
        )}
        numColumns={2} // Display 2 categories per row
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row} // Align items in the row
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  heading: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  listContainer: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: "space-between", // Distribute buttons evenly in a row
    marginBottom: 16, // Space between rows
  },
  categoryButton: {
    backgroundColor: "#1e40af",
    flex: 1,
    margin: 8, // Add margin for spacing
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row", // Align icon and text in the same row
  },
  categoryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8, // Space between icon and text
  },
});
