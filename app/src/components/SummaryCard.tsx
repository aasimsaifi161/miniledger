import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, fontSizes, spacing } from "../lib/theme";
import { formatRupees } from "../lib/format";
import { Summary } from "../hooks/useLoans";

interface SummaryCardProps {
  summary?: Summary;
  loading?: boolean;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const totalLent = summary?.totalLent ?? 0;
  const totalRepaid = summary?.totalRepaid ?? 0;
  const overdueAmount = summary?.overdueAmount ?? 0;

  const percentRepaid =
    totalLent > 0 ? Math.min(100, Math.round((totalRepaid / totalLent) * 100)) : 0;

  const hasOverdue = overdueAmount > 0;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.balanceRow}>
        <View style={styles.balanceInfo}>
          <View style={styles.captionRow}>
            <View style={styles.liveDot} />
            <Text style={styles.captionText}>TOTAL LENT</Text>
          </View>
          <Text style={styles.balanceAmount}>{formatRupees(totalLent)}</Text>
        </View>

        <View style={styles.countBadge}>
          <Ionicons name="documents-outline" size={11} color="rgba(255, 255, 255, 0.9)" />
          <Text style={styles.countBadgeText}>
            {summary?.totalCount ?? 0} {summary?.totalCount === 1 ? "loan" : "loans"}
          </Text>
        </View>
      </View>

      <View style={styles.glassCard}>
        <View style={styles.progressRow}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Recovered</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{percentRepaid}%</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={["#6366F1", "#06B6D4", "#10B981"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressBar,
                { width: `${Math.max(4, percentRepaid)}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.glassDivider} />

        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <View style={styles.metricHeader}>
              <View style={[styles.iconDot, styles.iconDotRepaid]}>
                <Ionicons name="checkmark" size={10} color="#10B981" />
              </View>
              <Text style={styles.metricLabel}>REPAID</Text>
            </View>
            <Text style={[styles.metricAmount, styles.metricAmountRepaid]}>
              {formatRupees(totalRepaid)}
            </Text>
            <Text style={styles.metricSubtext}>
              {summary?.repaidCount ?? 0} returned
            </Text>
          </View>

          <View style={styles.verticalSeparator} />

          <View style={styles.metricCol}>
            <View style={styles.metricHeader}>
              <View
                style={[
                  styles.iconDot,
                  hasOverdue ? styles.iconDotOverdue : styles.iconDotNeutral,
                ]}
              >
                <Ionicons
                  name={hasOverdue ? "alert" : "shield-checkmark-outline"}
                  size={10}
                  color={hasOverdue ? "#F43F5E" : "rgba(255, 255, 255, 0.5)"}
                />
              </View>
              <Text
                style={[
                  styles.metricLabel,
                  hasOverdue && { color: "#FDA4AF" },
                ]}
              >
                OVERDUE
              </Text>
            </View>
            <Text
              style={[
                styles.metricAmount,
                hasOverdue ? styles.metricAmountOverdue : styles.metricAmountNeutral,
              ]}
            >
              {formatRupees(overdueAmount)}
            </Text>
            <Text
              style={[
                styles.metricSubtext,
                hasOverdue && { color: "#FDA4AF" },
              ]}
            >
              {summary?.overdueCount ?? 0} {hasOverdue ? "urgent" : "pending"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginTop: spacing.md,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: spacing.sm + 2,
  },
  balanceInfo: {
    justifyContent: "center",
  },
  captionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  captionText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    letterSpacing: 1.1,
    color: "rgba(255, 255, 255, 0.7)",
  },
  balanceAmount: {
    fontSize: 27,
    fontWeight: "900",
    fontFamily: "PlusJakartaSans-ExtraBold",
    color: colors.textLight,
    letterSpacing: -0.6,
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    gap: 4,
    marginBottom: 4,
  },
  countBadgeText: {
    fontSize: fontSizes.xs - 0.5,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.textLight,
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    padding: spacing.md,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  progressLabel: {
    fontSize: fontSizes.xs - 0.5,
    color: "rgba(255, 255, 255, 0.75)",
    fontFamily: "PlusJakartaSans-Medium",
  },
  progressBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  progressBadgeText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: "#34D399",
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2.5,
  },
  glassDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginVertical: 10,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricCol: {
    flex: 1,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    gap: 4,
  },
  iconDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconDotRepaid: {
    backgroundColor: "rgba(16, 185, 129, 0.25)",
  },
  iconDotOverdue: {
    backgroundColor: "rgba(244, 63, 94, 0.28)",
  },
  iconDotNeutral: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  metricLabel: {
    fontSize: fontSizes.xs - 1.5,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    letterSpacing: 0.6,
    color: "rgba(255, 255, 255, 0.7)",
  },
  metricAmount: {
    fontSize: fontSizes.md + 1,
    fontWeight: "900",
    fontFamily: "PlusJakartaSans-ExtraBold",
    letterSpacing: -0.3,
  },
  metricAmountRepaid: {
    color: "#34D399",
  },
  metricAmountOverdue: {
    color: "#FDA4AF",
  },
  metricAmountNeutral: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  metricSubtext: {
    fontSize: fontSizes.xs - 1.5,
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: "PlusJakartaSans-Medium",
    marginTop: 1,
  },
  verticalSeparator: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginHorizontal: spacing.sm,
  },
});
