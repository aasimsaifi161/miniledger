import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadows, fontSizes, spacing } from "../lib/theme";

export type ToastType = "success" | "error" | "info";

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({ message, type });

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToast(null);
      });
    }, 3200);
  }, [translateY, opacity]);

  const getIcon = () => {
    if (!toast) return null;
    switch (toast.type) {
      case "success":
        return <Ionicons name="checkmark-circle" size={20} color={colors.success} />;
      case "error":
        return <Ionicons name="alert-circle" size={20} color={colors.danger} />;
      default:
        return <Ionicons name="information-circle" size={20} color={colors.primary} />;
    }
  };

  const getBorderColor = () => {
    if (!toast) return colors.border;
    switch (toast.type) {
      case "success":
        return colors.successBorder;
      case "error":
        return colors.dangerBorder;
      default:
        return colors.primaryBorder;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.container,
            {
              top: insets.top + spacing.sm,
              transform: [{ translateY }],
              opacity,
              borderColor: getBorderColor(),
            },
          ]}
        >
          <View style={styles.iconContainer}>{getIcon()}</View>
          <Text style={styles.message} numberOfLines={2}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    zIndex: 9999,
    ...shadows.floating,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: colors.text,
  },
});
