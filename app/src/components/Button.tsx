import React, { useRef } from "react";
import {
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors, radii, shadows, fontSizes, spacing } from "../lib/theme";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isGradient = variant === "primary";

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 },
    md: { paddingVertical: 12, paddingHorizontal: 18, minHeight: 48 },
    lg: { paddingVertical: 15, paddingHorizontal: 22, minHeight: 54 },
  }[size];

  const textSize = {
    sm: fontSizes.sm,
    md: fontSizes.md,
    lg: fontSizes.lg,
  }[size];

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? colors.primary : colors.textLight}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              styles.text,
              { fontSize: textSize },
              variant === "outline" && styles.textOutline,
              variant === "ghost" && styles.textGhost,
              variant === "secondary" && styles.textSecondary,
              variant === "danger" && styles.textDanger,
              disabled && styles.textDisabled,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </>
  );

  return (
    <Animated.View
      style={[
        styles.wrapper,
        fullWidth && styles.fullWidth,
        { transform: [{ scale }] },
        style,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.pressable,
          sizeStyles,
          !isGradient && variant === "secondary" && styles.btnSecondary,
          !isGradient && variant === "outline" && styles.btnOutline,
          !isGradient && variant === "ghost" && styles.btnGhost,
          !isGradient && variant === "danger" && styles.btnDanger,
          disabled && styles.btnDisabled,
        ]}
      >
        {isGradient && !disabled ? (
          <LinearGradient
            colors={colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, styles.gradient, sizeStyles]}
          >
            {content}
          </LinearGradient>
        ) : (
          content
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  fullWidth: {
    width: "100%",
  },
  pressable: {
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  gradient: {
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    ...shadows.glow,
  },
  btnSecondary: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  btnGhost: {
    backgroundColor: "transparent",
  },
  btnDanger: {
    backgroundColor: colors.danger,
    ...shadows.soft,
  },
  btnDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  text: {
    color: colors.textLight,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans-Bold",
  },
  textSecondary: {
    color: colors.text,
  },
  textOutline: {
    color: colors.primary,
  },
  textGhost: {
    color: colors.primary,
  },
  textDanger: {
    color: colors.textLight,
  },
  textDisabled: {
    color: colors.textMuted,
  },
});
