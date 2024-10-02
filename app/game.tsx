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
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function GameScreen() {
  // Use useLocalSearchParams to get the parameters
  const { categoryId, categoryName } = useLocalSearchParams();
  const router = useRouter();

  interface Word {
    id: number;
    word: string;
    description: string; // Added description here
  }

  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordInput, setWordInput] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [wordGuessedCorrectly, setWordGuessedCorrectly] = useState(false); // New state variable

  interface ExampleSentence {
    sentence: string;
  }

  const [exampleSentences, setExampleSentences] = useState<ExampleSentence[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const backendUrl = "https://english-app-backend-o83c.onrender.com"; // Update with your backend URL

  useEffect(() => {
    if (categoryId) {
      // Fetch words for the selected category
      axios
        .get(`${backendUrl}/api/words/${categoryId}`)
        .then((response) => {
          setWords(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching words:", error);
          setLoading(false);
          Alert.alert("Error", "Unable to fetch words. Please try again.");
        });
    }
  }, [categoryId]);

  const checkWord = () => {
    const currentWord = words[currentWordIndex];
    if (wordInput.trim().toLowerCase() === currentWord.word.toLowerCase()) {
      setFeedbackMessage("Correct! Well done.");
      setWordGuessedCorrectly(true); // Set to true when guessed correctly

      // Fetch example sentences
      axios
        .get(`${backendUrl}/api/examples/${currentWord.id}/${categoryId}`)
        .then((response) => {
          setExampleSentences(response.data);
        })
        .catch((error) => {
          console.error("Error fetching examples:", error);
        });

      // Save user progress
      axios.post(`${backendUrl}/api/user-progress`, {
        categoryId: categoryId,
        lastWordId: currentWord.id,
      });
    } else {
      setFeedbackMessage("Oops, try again.");
      setExampleSentences([]);
    }
  };

  const nextWord = () => {
    if (currentWordIndex + 1 < words.length) {
      setCurrentWordIndex(currentWordIndex + 1);
      setWordInput("");
      setFeedbackMessage("");
      setExampleSentences([]);
      setWordGuessedCorrectly(false); // Reset for the next word
    } else {
      Alert.alert(
        "Congratulations!",
        "You have completed all words in this category."
      );
      // navigate back to the categories screen or reset the game state
      router.push("/"); // Navigate to the Category Selection screen
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
  // ... existing styles ...
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
    color: "#6b7280", // Grey color for description
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
