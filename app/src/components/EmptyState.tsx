import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSizes, spacing, shadows } from "../lib/theme";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionTitle?: string;
  onAction?: () => void;
  isError?: boolean;
}

export function EmptyState({
  icon = "wallet-outline",
  title,
  subtitle,
  actionTitle,
  onAction,
  isError = false,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          isError ? styles.iconCircleError : styles.iconCircleNormal,
        ]}
      >
        <Ionicons
          name={icon}
          size={36}
          color={isError ? colors.danger : colors.primary}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionTitle && onAction && (
        <View style={styles.actionContainer}>
          <Button
            title={actionTitle}
            onPress={onAction}
            size="md"
            variant={isError ? "secondary" : "primary"}
            fullWidth={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.hero,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  iconCircleNormal: {
    backgroundColor: colors.primaryLight,
  },
  iconCircleError: {
    backgroundColor: colors.dangerLight,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  actionContainer: {
    marginTop: spacing.xs,
  },
});
