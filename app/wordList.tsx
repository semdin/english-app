import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase"; // Import Supabase client

export default function WordListScreen() {
  const { categoryId, categoryName } = useLocalSearchParams();

  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<any>(null);
  const [exampleSentences, setExampleSentences] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch words for the selected category
  useEffect(() => {
    const fetchWords = async () => {
      setLoading(true);
      try {
        // Fetch words for this category
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

  // Fetch example sentences and show the modal
  const showWordDetail = async (word: any) => {
    setModalLoading(true);
    setSelectedWord(word);

    try {
      // Fetch example sentences for the word
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
      setModalVisible(true); // Show the modal after data is fetched
    }
  };

  // Handle navigation between words inside the modal
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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Words in {categoryName}</Text>
      <FlatList
        data={words}
        numColumns={2} // Display 2 words per row
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Pressable
            style={styles.wordButton}
            onPress={() => showWordDetail(item)}
          >
            <Text style={styles.wordText}>{item.word}</Text>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {modalLoading ? (
              <ActivityIndicator size="large" color="#1e40af" />
            ) : (
              <>
                {selectedWord && (
                  <>
                    <Text style={styles.modalHeading}>
                      Word: {selectedWord.word}
                    </Text>
                    <Text style={styles.modalDescription}>
                      Description: {selectedWord.description}
                    </Text>

                    <Text style={styles.examplesHeading}>
                      Example Sentences:
                    </Text>
                    {exampleSentences.length > 0 ? (
                      exampleSentences.map((sentence, index) => (
                        <Text key={index} style={styles.exampleSentence}>
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
                      style={[styles.modalButton, { backgroundColor: "red" }]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.buttonText}>Close</Text>
                    </Pressable>
                  </>
                )}
              </>
            )}
          </View>
        </View>
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
  heading: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
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
  wordText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  wordList: {
    justifyContent: "space-between",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Dim background
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeading: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 12,
    fontStyle: "italic",
    color: "#6b7280",
  },
  examplesHeading: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  exampleSentence: {
    fontSize: 16,
    marginBottom: 6,
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
