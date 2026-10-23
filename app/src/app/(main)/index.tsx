import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Alert,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radii, shadows, spacing } from "../../lib/theme";
import { getUser, clearSession, UserProfile } from "../../lib/auth";
import { useLoans, useSummary, useRepayLoan, useDeleteLoan } from "../../hooks/useLoans";
import { SummaryCard } from "../../components/SummaryCard";
import { FilterChips, FilterType } from "../../components/FilterChips";
import { LoanItem } from "../../components/LoanItem";
import { LoanCardSkeleton } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { useToast } from "../../components/Toast";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [filter, setFilter] = useState<FilterType>("All");

  const {
    data: loans,
    isLoading: loansLoading,
    isError: loansError,
    refetch: refetchLoans,
    isRefetching: loansRefetching,
  } = useLoans();

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
    isRefetching: summaryRefetching,
  } = useSummary();

  const repayMutation = useRepayLoan();
  const deleteMutation = useDeleteLoan();

  useEffect(() => {
    getUser().then((u) => setUser(u));
  }, []);

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetchLoans(), refetchSummary()]);
  }, [refetchLoans, refetchSummary]);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out of MiniLedger?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          showToast("Signed out successfully", "info");
          router.replace("/login");
        },
      },
    ]);
  };

  const handleRepayLoan = async (loanId: string) => {
    try {
      await repayMutation.mutateAsync(loanId);
      showToast("Loan marked as repaid!", "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to mark loan as repaid", "error");
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    try {
      await deleteMutation.mutateAsync(loanId);
      showToast("Loan deleted", "info");
    } catch (err: any) {
      showToast(err?.message || "Failed to delete loan", "error");
    }
  };

  const filteredLoans = useMemo(() => {
    if (!loans) return [];
    switch (filter) {
      case "Pending":
        return loans.filter((l) => !l.isRepaid);
      case "Overdue":
        return loans.filter((l) => l.isOverdue);
      case "Repaid":
        return loans.filter((l) => l.isRepaid);
      default:
        return loans;
    }
  }, [loans, filter]);

  const counts = useMemo(() => {
    if (!loans) return undefined;
    return {
      all: loans.length,
      pending: loans.filter((l) => !l.isRepaid).length,
      overdue: loans.filter((l) => l.isOverdue).length,
      repaid: loans.filter((l) => l.isRepaid).length,
    };
  }, [loans]);

  const isRefreshing = loansRefetching || summaryRefetching;
  const initialLoading = loansLoading && !loans;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={filteredLoans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 76 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primaryLight}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={colors.gradients.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.headerGradient,
                { paddingTop: insets.top + spacing.sm },
              ]}
            >
              <View style={styles.headerRow}>
                <View style={styles.userProfileRow}>
                  <View style={styles.userAvatarBadge}>
                    <Ionicons name="wallet-outline" size={16} color={colors.textLight} />
                  </View>
                  <View style={styles.userCol}>
                    <Text style={styles.greetingText}>MINILEDGER</Text>
                    <Text style={styles.userPhoneText}>
                      {user?.phone ? user.phone : "Personal Ledger"}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleLogout}
                  style={({ pressed }) => [
                    styles.logoutButton,
                    pressed && styles.logoutButtonPressed,
                  ]}
                  hitSlop={8}
                >
                  <Ionicons name="log-out-outline" size={17} color={colors.textLight} />
                </Pressable>
              </View>

              <SummaryCard summary={summary} loading={summaryLoading} />
            </LinearGradient>

            <FilterChips
              selected={filter}
              onSelect={setFilter}
              counts={counts}
            />
          </>
        }
        renderItem={({ item, index }) => (
          <LoanItem
            loan={item}
            onRepay={handleRepayLoan}
            onDelete={handleDeleteLoan}
            isRepaying={repayMutation.isPending && repayMutation.variables === item.id}
            isDeleting={deleteMutation.isPending && deleteMutation.variables === item.id}
            index={index}
          />
        )}
        ListEmptyComponent={
          initialLoading ? (
            <View>
              <LoanCardSkeleton />
              <LoanCardSkeleton />
              <LoanCardSkeleton />
            </View>
          ) : loansError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Connection Error"
              subtitle="Unable to reach the backend server. Make sure the server is running."
              actionTitle="Retry"
              onAction={handleRefresh}
              isError
            />
          ) : (
            <EmptyState
              icon={
                filter === "Overdue"
                  ? "happy-outline"
                  : filter === "Repaid"
                  ? "checkmark-circle-outline"
                  : "cash-outline"
              }
              title={
                filter === "Overdue"
                  ? "Zero Overdue Loans"
                  : filter === "Repaid"
                  ? "No Repaid Loans Yet"
                  : filter === "Pending"
                  ? "No Pending Loans"
                  : "No Loans on Record"
              }
              subtitle={
                filter === "All"
                  ? "Tap '+ Record Loan' to log money you've lent to a friend."
                  : `You currently have 0 ${filter.toLowerCase()} loans.`
              }
              actionTitle={filter === "All" ? "Record First Loan" : undefined}
              onAction={
                filter === "All" ? () => router.push("/(main)/add") : undefined
              }
            />
          )
        }
      />

      <View style={[styles.fabContainer, { bottom: insets.bottom + spacing.md }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(main)/add");
          }}
          style={({ pressed }) => [styles.fabPressable, pressed && styles.fabPressed]}
        >
          <LinearGradient
            colors={colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={20} color={colors.textLight} />
            <Text style={styles.fabText}>Record Loan</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  userAvatarBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  userCol: {
    justifyContent: "center",
  },
  greetingText: {
    fontSize: 9.5,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    letterSpacing: 1.2,
    color: "rgba(255, 255, 255, 0.72)",
    marginBottom: 1,
  },
  userPhoneText: {
    fontSize: 13.5,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.textLight,
    letterSpacing: 0.1,
  },
  logoutButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.20)",
  },
  logoutButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.94 }],
  },
  fabContainer: {
    position: "absolute",
    right: spacing.lg,
    zIndex: 99,
    ...shadows.glow,
  },
  fabPressable: {
    borderRadius: radii.full,
    overflow: "hidden",
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
  fabGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    gap: 5,
  },
  fabText: {
    color: colors.textLight,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
