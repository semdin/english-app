import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../lib/supabase"; // Import Supabase client

export default function GameScreen() {
  // Use useLocalSearchParams to get the parameters
  const { categoryId, categoryName } = useLocalSearchParams();
  const router = useRouter();

  interface Word {
    id: number;
    word: string;
    description: string;
  }

  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordInput, setWordInput] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [wordGuessedCorrectly, setWordGuessedCorrectly] = useState(false);

  interface ExampleSentence {
    sentence: string;
  }

  const [exampleSentences, setExampleSentences] = useState<ExampleSentence[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Fetch words for the selected category and load the user progress
  useEffect(() => {
    if (categoryId) {
      const fetchWordsAndProgress = async () => {
        setLoading(true);
        try {
          // Step 1: Fetch word_ids from word_categories where category_id matches
          const { data: wordCategoryData, error: wordCategoryError } =
            await supabase
              .from("word_categories")
              .select("word_id")
              .eq("category_id", categoryId);

          if (wordCategoryError) throw wordCategoryError;

          const wordIds = wordCategoryData.map((item: any) => item.word_id);

          if (wordIds.length === 0) {
            throw new Error("No words found for this category.");
          }

          // Step 2: Fetch words from the 'words' table using the word_ids
          const { data: wordData, error: wordError } = await supabase
            .from("words")
            .select("id, word, description")
            .in("id", wordIds); // Fetch words with the matching word_ids

          if (wordError) throw wordError;

          setWords(wordData || []);

          // Fetch user progress to load the last word the user guessed
          const { data: progressData, error: progressError } = await supabase
            .from("user_progress")
            .select("last_word_id")
            .eq("category_id", categoryId)
            .single();

          if (progressError) throw progressError;

          if (progressData && progressData.last_word_id) {
            // Set the current word index based on the user's last word progress
            const lastWordIndex = wordData.findIndex(
              (word: Word) => word.id === progressData.last_word_id
            );
            if (lastWordIndex !== -1) {
              setCurrentWordIndex(lastWordIndex + 1); // Start from the next word
            }
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          Alert.alert("Error", "Unable to fetch words or progress.");
        } finally {
          setLoading(false);
        }
      };

      fetchWordsAndProgress();
    }
  }, [categoryId]);

  // Fetch example sentences
  const fetchExampleSentences = async (wordId: number) => {
    try {
      const { data: sentenceData, error: sentenceError } = await supabase
        .from("example_sentences")
        .select("sentence")
        .eq("word_id", wordId);

      if (sentenceError) throw sentenceError;

      setExampleSentences(sentenceData || []);
    } catch (error) {
      console.error("Error fetching example sentences:", error);
    }
  };

  // Check if the guessed word is correct
  const checkWord = () => {
    const currentWord = words[currentWordIndex];
    if (wordInput.trim().toLowerCase() === currentWord.word.toLowerCase()) {
      setFeedbackMessage("Correct! Well done.");
      setWordGuessedCorrectly(true);

      // Fetch example sentences for the current word
      fetchExampleSentences(currentWord.id);

      // Update user progress in Supabase
      updateUserProgress(currentWord.id);
    } else {
      setFeedbackMessage("Oops, try again.");
      setExampleSentences([]);
    }
  };

  // Update user progress in Supabase
  const updateUserProgress = async (lastWordId: number) => {
    try {
      const { error: updateError } = await supabase
        .from("user_progress")
        .upsert({
          user_id: (await supabase.auth.getSession()).data.session?.user.id,
          category_id: categoryId,
          last_word_id: lastWordId,
        });

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Error updating user progress:", error);
    }
  };

  // Navigate to the next word
  const nextWord = () => {
    if (currentWordIndex + 1 < words.length) {
      setCurrentWordIndex(currentWordIndex + 1);
      setWordInput("");
      setFeedbackMessage("");
      setExampleSentences([]);
      setWordGuessedCorrectly(false);
    } else {
      Alert.alert(
        "Congratulations!",
        "You have completed all words in this category."
      );
      router.push("/"); // Navigate back to the Category Selection screen
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>No words found in this category.</Text>
      </View>
    );
  }

  // Get the current word and description
  const currentWord = words[currentWordIndex];

  return (
    <View style={styles.container}>
      {/* Game Heading */}
      <Text style={styles.heading}>Category: {categoryName}</Text>

      {/* Display the word description */}
      {currentWord && (
        <Text style={styles.description}>
          Description: {currentWord.description}
        </Text>
      )}

      {/* Input Field */}
      {!wordGuessedCorrectly && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter your guess..."
            value={wordInput}
            onChangeText={setWordInput}
          />

          {/* Submit Button */}
          <Pressable style={styles.button} onPress={checkWord}>
            <Text style={styles.buttonText}>Submit Guess</Text>
          </Pressable>
        </>
      )}

      {/* Feedback */}
      {feedbackMessage ? (
        <Text style={styles.feedback}>{feedbackMessage}</Text>
      ) : null}

      {/* Example Sentences */}
      {exampleSentences.length > 0 && (
        <View style={styles.examplesContainer}>
          <Text style={styles.examplesHeading}>Example Sentences:</Text>
          {exampleSentences.map((item, index) => (
            <Text key={index} style={styles.exampleSentence}>
              {item.sentence}
            </Text>
          ))}
        </View>
      )}

      {/* Next Word Button */}
      {wordGuessedCorrectly && (
        <Pressable style={styles.button} onPress={nextWord}>
          <Text style={styles.buttonText}>
            {currentWordIndex + 1 < words.length ? "Next Word" : "Finish"}
          </Text>
        </Pressable>
      )}
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
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  description: {
    fontSize: 18,
    fontStyle: "italic",
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    width: "100%",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#10b981",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 9999,
    alignSelf: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  feedback: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 16,
    textAlign: "center",
  },
  examplesContainer: {
    marginTop: 24,
  },
  examplesHeading: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  exampleSentence: {
    fontSize: 16,
    marginBottom: 8,
  },
});
