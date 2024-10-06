import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  useColorScheme, // Import useColorScheme
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

export default function CategoriesScreen() {
  interface Category {
    id: number;
    name: string;
    icon: string;
  }

  interface UserProgress {
    category_id: number;
    completed_count: number;
    total_words: number;
  }

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<{
    [key: number]: UserProgress;
  }>({});
  const router = useRouter();
  const colorScheme = useColorScheme(); // Detect theme

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("*");

        if (categoryError) {
          console.error("Error fetching categories:", categoryError);
          return;
        }
        setCategories(categoryData || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const fetchUserProgressAndWordCounts = async (userId: string) => {
    try {
      const { data: categoryWordCounts, error: wordCountError } = await supabase
        .from("word_categories")
        .select("category_id, word_id");

      if (wordCountError) {
        console.error(
          "Error fetching word counts for categories:",
          wordCountError
        );
        return;
      }

      const categoryWordCountMap: { [key: number]: number } = {};
      categoryWordCounts.forEach((item: { category_id: number }) => {
        if (!categoryWordCountMap[item.category_id]) {
          categoryWordCountMap[item.category_id] = 1;
        } else {
          categoryWordCountMap[item.category_id] += 1;
        }
      });

      const { data: userProgressData, error: userProgressError } =
        await supabase
          .from("user_progress")
          .select("category_id, last_word_id")
          .eq("user_id", userId);

      if (userProgressError) {
        console.error("Error fetching user progress:", userProgressError);
        return;
      }

      const progressData: { [key: number]: UserProgress } = {};
      userProgressData.forEach((progress: any) => {
        const last_word_id = progress.last_word_id;
        const total_words = categoryWordCountMap[progress.category_id] || 0;

        const completed_count = categoryWordCounts.filter(
          (item) =>
            item.category_id === progress.category_id &&
            item.word_id <= last_word_id
        ).length;

        progressData[progress.category_id] = {
          category_id: progress.category_id,
          completed_count,
          total_words,
        };
      });

      Object.keys(categoryWordCountMap).forEach((categoryId) => {
        const id = parseInt(categoryId);
        if (!progressData[id]) {
          progressData[id] = {
            category_id: id,
            completed_count: 0,
            total_words: categoryWordCountMap[id],
          };
        }
      });

      setUserProgress(progressData);
    } catch (error) {
      console.error("Error fetching user progress and word counts:", error);
    }
  };

  useEffect(() => {
    const getUserSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        fetchUserProgressAndWordCounts(session.user.id);
      }
    };
    getUserSession();
  }, []);

  const selectCategory = (categoryId: number, categoryName: string) => {
    router.push({
      pathname: "/game",
      params: { categoryId, categoryName },
    });
  };

  const renderIcon = (iconName: string) => {
    if (!iconName) {
      return null;
    }
    return (
      <MaterialIcons
        name={iconName as keyof typeof MaterialIcons.glyphMap}
        size={24}
        color={colorScheme === "dark" ? "#fff" : "#000"} // Adjust icon color based on theme
      />
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          colorScheme === "dark" ? styles.darkContainer : styles.lightContainer, // Dynamically change background
        ]}
      >
        <ActivityIndicator size="large" color="#1e40af" />
        {/* Centered loading spinner */}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        colorScheme === "dark" && styles.darkContainer, // Apply dark mode background
      ]}
    >
      <Text
        style={[
          styles.heading,
          colorScheme === "dark" && styles.darkHeading, // Adjust heading text color
        ]}
      >
        Select a Category
      </Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const progress = userProgress[item.id];
          const progressText = progress
            ? `${progress.completed_count}/${progress.total_words}`
            : "0/0";

          return (
            <Pressable
              style={[
                styles.categoryButton,
                colorScheme === "dark" && styles.darkCategoryButton, // Adjust button background for dark mode
              ]}
              onPress={() => selectCategory(item.id, item.name)}
            >
              {renderIcon(item.icon)}
              <Text
                style={[
                  styles.categoryButtonText,
                  colorScheme === "dark" && styles.darkCategoryButtonText, // Adjust text color for dark mode
                ]}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.progressText,
                  colorScheme === "dark" && styles.darkProgressText, // Adjust progress text color for dark mode
                ]}
              >
                {progressText}
              </Text>
            </Pressable>
          );
        }}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
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
  darkContainer: {
    backgroundColor: "#121212", // Dark mode background color
  },
  lightContainer: {
    backgroundColor: "#f5f5f5", // Light theme background color
  },
  heading: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    color: "#000", // Light mode heading color
  },
  darkHeading: {
    color: "#fff", // Dark mode heading color
  },
  listContainer: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: "#1e40af",
    flex: 1,
    margin: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  darkCategoryButton: {
    backgroundColor: "#333", // Dark mode button background color
  },
  categoryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  darkCategoryButtonText: {
    color: "#fff", // Dark mode text color (can remain the same for buttons)
  },
  progressText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "400",
    marginTop: 4,
  },
  darkProgressText: {
    color: "#d1d5db", // Lighter color for progress text in dark mode
  },
});
