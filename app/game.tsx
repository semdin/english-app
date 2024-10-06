import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableWithoutFeedback, // Import TouchableWithoutFeedback
  Keyboard, // Import Keyboard
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { supabase } from "../lib/supabase";

export default function GameScreen() {
  const { categoryId, categoryName } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme(); // Detect theme

  interface Word {
    id: number;
    word: string;
    description: string;
  }

  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [letterInputs, setLetterInputs] = useState<string[]>([]);
  const [disabledInputs, setDisabledInputs] = useState<boolean[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [wordGuessedCorrectly, setWordGuessedCorrectly] = useState(false);
  const [categoryCompleted, setCategoryCompleted] = useState(false);
  const navigation = useNavigation<any>();
  interface ExampleSentence {
    sentence: string;
  }

  const [exampleSentences, setExampleSentences] = useState<ExampleSentence[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (categoryId) {
      const fetchWordsAndCheckCompletion = async () => {
        setLoading(true);
        try {
          const userId = (await supabase.auth.getSession()).data.session?.user
            .id;

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

          const { data: progressData, error: progressError } = await supabase
            .from("user_progress")
            .select("last_word_id")
            .eq("category_id", categoryId)
            .eq("user_id", userId)
            .maybeSingle();

          if (progressError) throw progressError;

          if (progressData && progressData.last_word_id) {
            const lastWordIndex = wordIds.findIndex(
              (wordId: number) => wordId === progressData.last_word_id
            );

            if (lastWordIndex === wordIds.length - 1) {
              setCategoryCompleted(true);
              setLoading(false);
              return;
            }
          }

          const { data: wordData, error: wordError } = await supabase
            .from("words")
            .select("id, word, description")
            .in("id", wordIds);

          if (wordError) throw wordError;

          setWords(wordData || []);

          if (progressData && progressData.last_word_id) {
            const lastWordIndex = wordData.findIndex(
              (word: Word) => word.id === progressData.last_word_id
            );
            if (lastWordIndex !== -1) {
              setCurrentWordIndex(lastWordIndex + 1);
            }
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          Alert.alert("Error", "Unable to fetch words or progress.");
        } finally {
          setLoading(false);
        }
      };

      fetchWordsAndCheckCompletion();
    }
  }, [categoryId]);

  useEffect(() => {
    if (words.length > 0) {
      const currentWord = words[currentWordIndex];
      setLetterInputs(Array(currentWord.word.length).fill(""));
      setDisabledInputs(Array(currentWord.word.length).fill(false)); // Initialize disabled states
    }
  }, [currentWordIndex, words]);

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

  const checkWord = () => {
    const currentWord = words[currentWordIndex];
    const userGuess = letterInputs.join("").toLowerCase();
    if (userGuess === currentWord.word.toLowerCase()) {
      setFeedbackMessage("Correct! Well done.");
      setWordGuessedCorrectly(true);
      fetchExampleSentences(currentWord.id);
      updateUserProgress(currentWord.id);
    } else {
      setFeedbackMessage("Oops, try again.");
      setExampleSentences([]);
    }
  };

  const updateUserProgress = async (lastWordId: number) => {
    try {
      const userId = (await supabase.auth.getSession()).data.session?.user.id;

      const { data: progressData, error: progressFetchError } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("category_id", categoryId)
        .single();

      if (progressFetchError && progressFetchError.code !== "PGRST116") {
        throw progressFetchError;
      }

      if (progressData) {
        const { error: updateError } = await supabase
          .from("user_progress")
          .update({ last_word_id: lastWordId })
          .eq("user_id", userId)
          .eq("category_id", categoryId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("user_progress")
          .insert({
            user_id: userId,
            category_id: categoryId,
            last_word_id: lastWordId,
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error updating user progress:", error);
    }
  };

  const nextWord = () => {
    if (currentWordIndex + 1 < words.length) {
      setCurrentWordIndex(currentWordIndex + 1);
      setLetterInputs(Array(words[currentWordIndex + 1].word.length).fill(""));
      setDisabledInputs(
        Array(words[currentWordIndex + 1].word.length).fill(false)
      ); // Reset disabled inputs
      setFeedbackMessage("");
      setExampleSentences([]);
      setWordGuessedCorrectly(false);
    } else {
      Alert.alert(
        "Congratulations!",
        "You have completed all words in this category.",
        [
          {
            text: "View Word List",
            onPress: () => {
              router.push({
                pathname: "/wordList",
                params: { categoryId, categoryName },
              });
            },
          },
        ]
      );
    }
  };

  const handleLetterInput = (value: string, index: number) => {
    if (disabledInputs[index]) return; // Prevent input in disabled fields
    const updatedInputs = [...letterInputs];
    updatedInputs[index] = value.toUpperCase(); // Force uppercase
    setLetterInputs(updatedInputs);

    if (value.length === 1 && index < letterInputs.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && letterInputs[index] === "") {
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const giveHint = () => {
    const currentWord = words[currentWordIndex].word.split("");
    const emptyIndices = letterInputs
      .map((letter, index) => (letter === "" ? index : null))
      .filter((index) => index !== null);

    if (emptyIndices.length > 0) {
      const randomIndex =
        emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      const updatedInputs = [...letterInputs];
      const updatedDisabled = [...disabledInputs];

      updatedInputs[randomIndex!] = currentWord[randomIndex!].toUpperCase(); // Fill hint in uppercase
      updatedDisabled[randomIndex!] = true; // Disable the hint input

      setLetterInputs(updatedInputs);
      setDisabledInputs(updatedDisabled);
    }
  };

  // Define emptyIndices inside the render logic for disabling the button
  const emptyIndices = letterInputs
    .map((letter, index) => (letter === "" ? index : null))
    .filter((index) => index !== null);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          colorScheme === "dark" ? styles.darkContainer : styles.lightContainer, // Dynamically change background
        ]}
      >
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  const resetProgress = async () => {
    try {
      const userId = (await supabase.auth.getSession()).data.session?.user.id;

      const { error } = await supabase
        .from("user_progress")
        .delete()
        .eq("user_id", userId)
        .eq("category_id", categoryId);

      if (error) throw error;

      setCurrentWordIndex(0); // Reset the current word index to the beginning
      setFeedbackMessage("");
      setWordGuessedCorrectly(false);

      Alert.alert(
        "Progress Reset",
        "Your progress has been reset. The game will restart.",
        [
          {
            text: "OK",
            onPress: () => {
              // Pop the current screen and push it back to reset it
              navigation.pop();
              navigation.push("game", { categoryId, categoryName });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error resetting progress:", error);
      Alert.alert("Error", "Unable to reset progress. Please try again.");
    }
  };

  const handlePlayAgain = () => {
    Alert.alert(
      "Reset Progress",
      "If you confirm, the words in this category will start from the beginning and your progress will be lost. Do you want to continue?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: resetProgress,
        },
      ]
    );
  };

  if (categoryCompleted) {
    return (
      <View
        style={[
          styles.container,
          colorScheme === "dark" && styles.darkContainer,
        ]}
      >
        <Text
          style={[styles.heading, colorScheme === "dark" && styles.darkHeading]}
        >
          You've already completed this category!
        </Text>
        <Pressable
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/wordList",
              params: { categoryId, categoryName },
            })
          }
        >
          <Text style={styles.buttonText}>View Word List</Text>
        </Pressable>

        {/* Play Again Button */}
        <Pressable style={styles.button} onPress={handlePlayAgain}>
          <Text style={styles.buttonText}>Play Again</Text>
        </Pressable>
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View
        style={[
          styles.container,
          colorScheme === "dark" && styles.darkContainer,
        ]}
      >
        <Text
          style={[styles.heading, colorScheme === "dark" && styles.darkHeading]}
        >
          No words found in this category.
        </Text>
      </View>
    );
  }

  const currentWord = words[currentWordIndex];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={[
          styles.container,
          colorScheme === "dark" && styles.darkContainer,
        ]}
      >
        <Text
          style={[styles.heading, colorScheme === "dark" && styles.darkHeading]}
        >
          Category: {categoryName}
        </Text>

        <View
          style={[
            styles.descriptionBox,
            colorScheme === "dark" && styles.darkDescriptionBox,
          ]}
        >
          <Text
            style={[
              styles.descriptionText,
              colorScheme === "dark" && styles.darkDescriptionText,
            ]}
          >
            {currentWord.description}
          </Text>
        </View>

        {!wordGuessedCorrectly && (
          <>
            <View style={styles.letterInputContainer}>
              {letterInputs.map((letter, index) => (
                <TextInput
                  key={index}
                  style={[
                    styles.letterInput,
                    disabledInputs[index] && styles.disabledLetterInput, // Apply disabled style
                    colorScheme === "dark" && styles.darkLetterInput,
                  ]}
                  value={letter}
                  onChangeText={(value) => handleLetterInput(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  maxLength={1}
                  ref={(el) => (inputRefs.current[index] = el)}
                  editable={!disabledInputs[index]} // Disable input if hint is filled
                />
              ))}
            </View>

            {/* Buttons Section */}
            <View style={styles.buttonRow}>
              {/* Submit Guess Button */}
              <Pressable style={styles.button} onPress={checkWord}>
                <Text style={styles.buttonText}>Submit Guess</Text>
              </Pressable>

              {/* Hint Button */}
              <Pressable
                style={[
                  styles.hintButton,
                  {
                    backgroundColor:
                      emptyIndices.length === 0 ? "#aaa" : "#3498db",
                  },
                ]}
                onPress={giveHint}
                disabled={emptyIndices.length === 0}
              >
                <Ionicons name="help-circle-outline" size={24} color="white" />
                <Text style={styles.hintButtonText}>Hint</Text>
              </Pressable>
            </View>
          </>
        )}

        {wordGuessedCorrectly && (
          <Pressable style={styles.button} onPress={nextWord}>
            <Text style={styles.buttonText}>
              {currentWordIndex + 1 < words.length ? "Next Word" : "Finish"}
            </Text>
          </Pressable>
        )}

        {feedbackMessage ? (
          <Text
            style={[
              styles.feedback,
              colorScheme === "dark" && styles.darkFeedback,
            ]}
          >
            {feedbackMessage}
          </Text>
        ) : null}

        {exampleSentences.length > 0 && (
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.examplesHeading,
                colorScheme === "dark" && styles.darkExamplesHeading,
              ]}
            >
              Example Sentences:
            </Text>

            <FlatList
              data={exampleSentences}
              keyExtractor={(item, index) => `${index}`}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.exampleSentenceBox,
                    colorScheme === "dark" && styles.darkExampleSentenceBox,
                  ]}
                >
                  <Text
                    style={[
                      styles.exampleSentence,
                      colorScheme === "dark" && styles.darkExampleSentence,
                    ]}
                  >
                    {item.sentence}
                  </Text>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  lightContainer: {
    backgroundColor: "#f5f5f5", // Light theme background color
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    color: "#000",
  },
  darkHeading: {
    color: "#fff",
  },
  descriptionBox: {
    backgroundColor: "#fff",
    borderColor: "#000",
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  darkDescriptionBox: {
    backgroundColor: "#333",
    borderColor: "#fff",
  },
  descriptionText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
  },
  darkDescriptionText: {
    color: "#fff",
  },
  letterInputContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 24,
  },
  letterInput: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: "center",
    width: 48,
    margin: 4,
    color: "#000",
  },
  darkLetterInput: {
    backgroundColor: "#333",
    borderColor: "#555",
    color: "#fff",
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
  darkFeedback: {
    color: "#d1d5db",
  },
  examplesHeading: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#000",
  },
  darkExamplesHeading: {
    color: "#fff",
  },
  exampleSentenceBox: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  darkExampleSentenceBox: {
    backgroundColor: "#333",
    borderColor: "#555",
  },
  exampleSentence: {
    fontSize: 16,
    color: "#333",
  },
  darkExampleSentence: {
    color: "#ddd",
  },
  hintButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 9999,
    alignSelf: "center",
    marginBottom: 16,
  },
  hintButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  disabledLetterInput: {
    backgroundColor: "#d1d5db",
    color: "#888",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
    marginBottom: 16,
  },
});
