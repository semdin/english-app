import React from "react";
import { Text, StyleSheet } from "react-native";

interface WordsInformationProps {
  word: string;
  colorScheme: "light" | "dark" | null | undefined;
}

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const WordsInformation: React.FC<WordsInformationProps> = ({
  word,
  colorScheme,
}) => {
  const wordParts = word.split(" ");
  const numberOfWords = wordParts.length;
  const wordLengths = wordParts.map((w) => w.length);

  const wordsInfo = wordLengths
    .map((length, index) => {
      const ordinal = getOrdinal(index + 1);
      return `${ordinal} word (${length} letters)`;
    })
    .join(", ");

  return (
    <Text
      style={[
        styles.wordsInfoText,
        colorScheme === "dark" && styles.darkWordsInfoText,
      ]}
    >
      {`${numberOfWords} Word${numberOfWords > 1 ? "s" : ""}: ${wordsInfo}`}
    </Text>
  );
};

const styles = StyleSheet.create({
  wordsInfoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
    marginBottom: 16,
  },
  darkWordsInfoText: {
    color: "#fff",
  },
});

export default WordsInformation;
