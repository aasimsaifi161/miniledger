import React, { useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
} from "react-native";
import { colors, radii, shadows, fontSizes, spacing } from "../lib/theme";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  disabled?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
}: OtpInputProps) {
  const inputsRef = useRef<any[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const digits = Array(length)
    .fill("")
    .map((_, i) => value[i] || "");

  const handleChangeText = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, "");
    if (clean.length > 1) {
      const pastedOtp = clean.slice(0, length);
      onChange(pastedOtp);
      const nextIndex = Math.min(pastedOtp.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = clean;
    const newOtp = newDigits.join("");
    onChange(newOtp);

    if (clean && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<any>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {Array(length)
        .fill(0)
        .map((_, index) => {
          const isFocused = focusedIndex === index;
          const hasValue = Boolean(digits[index]);

          return (
            <View
              key={index}
              style={[
                styles.box,
                isFocused && styles.boxFocused,
                hasValue && styles.boxFilled,
                disabled && styles.boxDisabled,
              ]}
            >
              <TextInput
                ref={(ref) => {
                  inputsRef.current[index] = ref;
                }}
                style={styles.input}
                keyboardType="number-pad"
                maxLength={length}
                value={digits[index]}
                onChangeText={(text) => handleChangeText(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(-1)}
                editable={!disabled}
                selectTextOnFocus
                textAlign="center"
              />
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxHeight: 62,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  boxFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    ...shadows.glow,
  },
  boxFilled: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.surface,
  },
  boxDisabled: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.6,
  },
  input: {
    width: "100%",
    height: "100%",
    fontSize: fontSizes.xl,
    fontWeight: "800",
    color: colors.text,
  },
});
