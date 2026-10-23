import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { colors, radii, spacing } from "../lib/theme";

export type FilterType = "All" | "Pending" | "Overdue" | "Repaid";

interface FilterChipsProps {
  selected: FilterType;
  onSelect: (filter: FilterType) => void;
  counts?: {
    all: number;
    pending: number;
    overdue: number;
    repaid: number;
  };
}

const TABS: { id: FilterType; label: string }[] = [
  { id: "All", label: "All" },
  { id: "Pending", label: "Pending" },
  { id: "Overdue", label: "Overdue" },
  { id: "Repaid", label: "Repaid" },
];

export function FilterChips({ selected, onSelect, counts }: FilterChipsProps) {
  const handleSelect = (tab: FilterType) => {
    if (tab !== selected) {
      Haptics.selectionAsync();
      onSelect(tab);
    }
  };

  const getCount = (id: FilterType) => {
    if (!counts) return null;
    switch (id) {
      case "All":
        return counts.all;
      case "Pending":
        return counts.pending;
      case "Overdue":
        return counts.overdue;
      case "Repaid":
        return counts.repaid;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.segmentedTrack}>
        {TABS.map((tab) => {
          const isSelected = selected === tab.id;
          const count = getCount(tab.id);
          const isOverdue = tab.id === "Overdue";
          const hasOverdue = isOverdue && (counts?.overdue ?? 0) > 0;

          return (
            <Pressable
              key={tab.id}
              onPress={() => handleSelect(tab.id)}
              style={({ pressed }) => [
                styles.tab,
                isSelected && styles.tabSelected,
                pressed && !isSelected && styles.tabPressed,
              ]}
            >
              <View style={styles.tabContentRow}>
                {hasOverdue && !isSelected && <View style={styles.overdueDot} />}

                <Text
                  style={[
                    styles.tabText,
                    isSelected && styles.tabTextSelected,
                    hasOverdue && !isSelected && styles.tabTextOverdueAlert,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>

                {count !== null && (
                  <View
                    style={[
                      styles.countBadge,
                      isSelected && styles.countBadgeSelected,
                      hasOverdue && !isSelected && styles.countBadgeOverdue,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countText,
                        isSelected && styles.countTextSelected,
                        hasOverdue && !isSelected && styles.countTextOverdue,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  segmentedTrack: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: radii.full,
    padding: 3.5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  tabSelected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  tabTextSelected: {
    color: colors.primary,
    fontWeight: "800",
  },
  tabTextOverdueAlert: {
    color: colors.dangerDark,
  },
  overdueDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.danger,
    marginRight: 1,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.full,
    backgroundColor: "rgba(226, 232, 240, 0.8)",
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeSelected: {
    backgroundColor: colors.primaryLight,
  },
  countBadgeOverdue: {
    backgroundColor: colors.dangerLight,
  },
  countText: {
    fontSize: 9.5,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.textSecondary,
  },
  countTextSelected: {
    color: colors.primary,
  },
  countTextOverdue: {
    color: colors.dangerDark,
  },
});
