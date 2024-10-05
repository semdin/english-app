import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase"; // Import supabase

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

  // Fetch categories from Supabase
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
      // 1. Fetch word counts for all categories from word_categories
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

      // Create a map to store the total number of words per category
      const categoryWordCountMap: { [key: number]: number } = {};
      categoryWordCounts.forEach((item: { category_id: number }) => {
        if (!categoryWordCountMap[item.category_id]) {
          categoryWordCountMap[item.category_id] = 1;
        } else {
          categoryWordCountMap[item.category_id] += 1;
        }
      });

      // 2. Fetch user progress
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

      // 3. Calculate the completed count for each category
      userProgressData.forEach((progress: any) => {
        const last_word_id = progress.last_word_id;
        const total_words = categoryWordCountMap[progress.category_id] || 0;

        // Count how many words have been completed by comparing word_id <= last_word_id
        const completed_count = categoryWordCounts.filter(
          (item) =>
            item.category_id === progress.category_id &&
            item.word_id <= last_word_id
        ).length;

        progressData[progress.category_id] = {
          category_id: progress.category_id,
          completed_count,
          total_words, // Use the word count from the word_categories table
        };
      });

      // 4. Ensure that all categories have their word count even if there's no user progress
      Object.keys(categoryWordCountMap).forEach((categoryId) => {
        const id = parseInt(categoryId); // Convert categoryId from string to number
        if (!progressData[id]) {
          progressData[id] = {
            category_id: id,
            completed_count: 0, // No progress
            total_words: categoryWordCountMap[id], // Word count for the category
          };
        }
      });

      setUserProgress(progressData);
    } catch (error) {
      console.error("Error fetching user progress and word counts:", error);
    }
  };

  // Fetch categories and user progress
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
        renderItem={({ item }) => {
          const progress = userProgress[item.id];
          const progressText = progress
            ? `${progress.completed_count}/${progress.total_words}`
            : "0/0"; // Default if no progress found

          return (
            <Pressable
              style={styles.categoryButton}
              onPress={() => selectCategory(item.id, item.name)}
            >
              {renderIcon(item.icon)}
              <Text style={styles.categoryButtonText}>{item.name}</Text>
              <Text style={styles.progressText}>{progressText}</Text>
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
  categoryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  progressText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "400",
    marginTop: 4,
  },
});
