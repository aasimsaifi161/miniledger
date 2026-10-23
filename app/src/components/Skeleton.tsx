import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { colors, radii, spacing, shadows } from "../lib/theme";

interface SkeletonProps {
  width?: number | `${number}%` | "auto";
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = radii.sm,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.surfaceMuted,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function LoanCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.headerRow}>
        <Skeleton width={88} height={15} borderRadius={8} />
        <Skeleton width={64} height={17} borderRadius={4} />
      </View>

      <View style={styles.divider} />

      <View style={styles.bodyRow}>
        <Skeleton width={34} height={34} borderRadius={17} />
        <View style={styles.col}>
          <Skeleton width="60%" height={13} borderRadius={4} />
          <View style={{ height: 4 }} />
          <Skeleton width="40%" height={10} borderRadius={4} />
        </View>
        <Skeleton width={76} height={22} borderRadius={11} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderRadius: radii.xl,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md - 2,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.95)",
    ...shadows.soft,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(226, 232, 240, 0.65)",
    marginVertical: 8,
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  col: {
    flex: 1,
    marginHorizontal: 9,
  },
});
