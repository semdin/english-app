import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback, // Import TouchableWithoutFeedback
  useColorScheme,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";

export default function WordListScreen() {
  const { categoryId, categoryName } = useLocalSearchParams();
  const colorScheme = useColorScheme(); // Detect theme

  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<any>(null);
  const [exampleSentences, setExampleSentences] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchWords = async () => {
      setLoading(true);
      try {
        const { data: wordCategoryData, error: wordCategoryError } =
          await supabase
            .from("word_categories")
            .select("word_id, words (id, word, description)")
            .eq("category_id", categoryId);

        if (wordCategoryError) throw wordCategoryError;

        const formattedWords = wordCategoryData.map((item) => item.words);
        setWords(formattedWords || []);
      } catch (error) {
        console.error("Error fetching words:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, [categoryId]);

  const showWordDetail = async (word: any) => {
    setModalLoading(true);
    setSelectedWord(word);

    try {
      const { data: sentenceData, error: sentenceError } = await supabase
        .from("example_sentences")
        .select("sentence")
        .eq("word_id", word.id);

      if (sentenceError) throw sentenceError;
      setExampleSentences(sentenceData || []);
    } catch (error) {
      console.error("Error fetching example sentences:", error);
    } finally {
      setModalLoading(false);
      setModalVisible(true);
    }
  };

  const navigateToWord = (direction: "next" | "previous") => {
    const currentIndex = words.findIndex((w) => w.id === selectedWord.id);
    if (direction === "next" && currentIndex + 1 < words.length) {
      showWordDetail(words[currentIndex + 1]);
    } else if (direction === "previous" && currentIndex - 1 >= 0) {
      showWordDetail(words[currentIndex - 1]);
    }
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

  return (
    <View
      style={[styles.container, colorScheme === "dark" && styles.darkContainer]}
    >
      <Text
        style={[styles.heading, colorScheme === "dark" && styles.darkHeading]}
      >
        Words in {categoryName}
      </Text>
      <FlatList
        data={words}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.wordButton,
              colorScheme === "dark" && styles.darkWordButton,
            ]}
            onPress={() => showWordDetail(item)}
          >
            <Text
              style={[
                styles.wordText,
                colorScheme === "dark" && styles.darkWordText,
              ]}
            >
              {item.word}
            </Text>
          </Pressable>
        )}
        contentContainerStyle={styles.wordList}
      />

      {/* Modal for displaying word details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.modalContent,
                  colorScheme === "dark" && styles.darkModalContent,
                ]}
              >
                {modalLoading ? (
                  <ActivityIndicator size="large" color="#1e40af" />
                ) : (
                  <>
                    {selectedWord && (
                      <>
                        <Text
                          style={[
                            styles.modalHeading,
                            colorScheme === "dark" && styles.darkModalHeading,
                          ]}
                        >
                          Word: {selectedWord.word}
                        </Text>
                        <Text
                          style={[
                            styles.modalDescription,
                            colorScheme === "dark" &&
                              styles.darkModalDescription,
                          ]}
                        >
                          Description: {selectedWord.description}
                        </Text>

                        <Text
                          style={[
                            styles.examplesHeading,
                            colorScheme === "dark" &&
                              styles.darkExamplesHeading,
                          ]}
                        >
                          Example Sentences:
                        </Text>
                        {exampleSentences.length > 0 ? (
                          exampleSentences.map((sentence, index) => (
                            <Text
                              key={index}
                              style={[
                                styles.exampleSentence,
                                colorScheme === "dark" &&
                                  styles.darkExampleSentence,
                              ]}
                            >
                              {sentence.sentence}
                            </Text>
                          ))
                        ) : (
                          <Text>No example sentences available.</Text>
                        )}

                        {/* Navigation buttons */}
                        <View style={styles.navigationButtons}>
                          <Pressable
                            style={styles.modalButton}
                            onPress={() => navigateToWord("previous")}
                          >
                            <Text style={styles.buttonText}>Previous</Text>
                          </Pressable>

                          <Pressable
                            style={styles.modalButton}
                            onPress={() => navigateToWord("next")}
                          >
                            <Text style={styles.buttonText}>Next</Text>
                          </Pressable>
                        </View>

                        {/* Close Modal Button */}
                        <Pressable
                          style={[
                            styles.modalButton,
                            { backgroundColor: "red" },
                          ]}
                          onPress={() => setModalVisible(false)}
                        >
                          <Text style={styles.buttonText}>Close</Text>
                        </Pressable>
                      </>
                    )}
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  wordButton: {
    backgroundColor: "#1e40af",
    padding: 16,
    margin: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  darkWordButton: {
    backgroundColor: "#333",
  },
  wordText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  darkWordText: {
    color: "#fff",
  },
  wordList: {
    justifyContent: "space-between",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
  },
  darkModalContent: {
    backgroundColor: "#333",
  },
  modalHeading: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    color: "#000",
  },
  darkModalHeading: {
    color: "#fff",
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 12,
    fontStyle: "italic",
    color: "#6b7280",
  },
  darkModalDescription: {
    color: "#ccc",
  },
  examplesHeading: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#000",
  },
  darkExamplesHeading: {
    color: "#fff",
  },
  exampleSentence: {
    fontSize: 16,
    marginBottom: 6,
    color: "#333",
  },
  darkExampleSentence: {
    color: "#ddd",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButton: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 9999,
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
