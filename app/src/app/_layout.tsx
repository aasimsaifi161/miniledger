import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, router, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { getToken } from "../lib/auth";
import { colors } from "../lib/theme";
import { ToastProvider } from "../components/Toast";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

function RootNavigation() {
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getToken();
        const inAuthGroup = segments[0] === "(main)";

        if (token && !inAuthGroup) {
          router.replace("/(main)");
        } else if (!token && inAuthGroup) {
          router.replace("/login");
        } else if (!token && segments[0] !== "login") {
          router.replace("/login");
        }
      } catch (e) {
        router.replace("/login");
      } finally {
        setIsReady(true);
      }
    }

    checkAuth();
  }, [segments]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(main)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "PlusJakartaSans-Regular": require("../../assets/fonts/PlusJakartaSans_400Regular.ttf"),
    "PlusJakartaSans-Medium": require("../../assets/fonts/PlusJakartaSans_500Medium.ttf"),
    "PlusJakartaSans-SemiBold": require("../../assets/fonts/PlusJakartaSans_600SemiBold.ttf"),
    "PlusJakartaSans-Bold": require("../../assets/fonts/PlusJakartaSans_700Bold.ttf"),
    "PlusJakartaSans-ExtraBold": require("../../assets/fonts/PlusJakartaSans_800ExtraBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RootNavigation />
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
