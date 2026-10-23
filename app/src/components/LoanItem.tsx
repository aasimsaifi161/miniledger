import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radii, shadows, fontSizes, spacing } from "../lib/theme";
import {
  formatRupees,
  formatRelativeDueDate,
  getInitials,
  getAvatarColor,
  formatCalendarDate,
} from "../lib/format";
import { Loan } from "../hooks/useLoans";

interface LoanItemProps {
  loan: Loan;
  onRepay: (loanId: string) => void;
  onDelete?: (loanId: string) => void;
  isRepaying?: boolean;
  isDeleting?: boolean;
  index?: number;
}

export function LoanItem({
  loan,
  onRepay,
  onDelete,
  isRepaying = false,
  isDeleting = false,
  index = 0,
}: LoanItemProps) {
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 240,
        delay: Math.min(index * 30, 180),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 150,
        delay: Math.min(index * 30, 180),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const initials = getInitials(loan.friendName);
  const avatarBg = getAvatarColor(loan.friendName);
  const relativeDate = formatRelativeDueDate(
    loan.dueDate,
    loan.isRepaid,
    loan.repaidAt
  );

  const isOverdue = loan.isOverdue;
  const isRepaid = loan.isRepaid;

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.985,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handleRepayPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Confirm Repayment",
      `Did ${loan.friendName} return ${formatRupees(loan.amount)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Mark Repaid",
          style: "default",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onRepay(loan.id);
          },
        },
      ]
    );
  };

  const handleDeletePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Loan",
      `Are you sure you want to delete the loan for ${loan.friendName} (${formatRupees(loan.amount)})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete?.(loan.id);
          },
        },
      ]
    );
  };

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: pressScale }],
          },
        ]}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.glassCard,
            isOverdue && styles.glassCardOverdue,
            isRepaid && styles.glassCardRepaid,
          ]}
        >
          {isOverdue && <View style={styles.overdueGlowEdge} />}

          <View style={styles.cardInner}>
            <View style={styles.headerRow}>
              {isOverdue ? (
                <View style={styles.statusPillOverdue}>
                  <Ionicons name="alert-circle" size={11} color={colors.dangerDark} />
                  <Text style={styles.statusTextOverdue}>
                    OVERDUE • {relativeDate.text.toUpperCase()}
                  </Text>
                </View>
              ) : isRepaid ? (
                <View style={styles.statusPillRepaid}>
                  <Ionicons name="checkmark-done" size={11} color={colors.successDark} />
                  <Text style={styles.statusTextRepaid}>SETTLED</Text>
                </View>
              ) : (
                <View style={styles.statusPillPending}>
                  <Ionicons name="time-outline" size={11} color={colors.primary} />
                  <Text style={styles.statusTextPending}>
                    {relativeDate.text.toUpperCase()}
                  </Text>
                </View>
              )}

              <Text
                style={[
                  styles.amountText,
                  isOverdue && styles.amountTextOverdue,
                  isRepaid && styles.amountTextRepaid,
                ]}
              >
                {formatRupees(loan.amount)}
              </Text>
            </View>

            <View
              style={[
                styles.glassDivider,
                isOverdue && styles.glassDividerOverdue,
                isRepaid && styles.glassDividerRepaid,
              ]}
            />

            <View style={styles.bodyRow}>
              <View style={styles.identityCol}>
                <View
                  style={[
                    styles.avatarRing,
                    { borderColor: isRepaid ? colors.border : `${avatarBg}45` },
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: isRepaid ? colors.textMuted : avatarBg },
                    ]}
                  >
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                </View>

                <View style={styles.friendCol}>
                  <Text
                    style={[styles.friendName, isRepaid && styles.friendNameRepaid]}
                    numberOfLines={1}
                  >
                    {loan.friendName}
                  </Text>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={10} color={colors.textMuted} />
                    <Text style={styles.dateCalendarText}>
                      Due {formatCalendarDate(loan.dueDate)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionsRow}>
                {loan.receiptUrl ? (
                  <Pressable
                    onPress={() => setReceiptModalVisible(true)}
                    style={({ pressed }) => [
                      styles.receiptGlassButton,
                      pressed && styles.glassButtonPressed,
                    ]}
                    hitSlop={4}
                  >
                    <Ionicons name="document-attach" size={12} color={colors.primary} />
                    <Text style={styles.receiptButtonText}>Receipt</Text>
                  </Pressable>
                ) : null}

                {!isRepaid ? (
                  <Pressable
                    onPress={handleRepayPress}
                    disabled={isRepaying || isDeleting}
                    style={({ pressed }) => [
                      styles.repayGlassButton,
                      pressed && styles.glassButtonPressed,
                    ]}
                    hitSlop={4}
                  >
                    {isRepaying ? (
                      <ActivityIndicator size="small" color={colors.successDark} />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={13}
                          color={colors.successDark}
                        />
                        <Text style={styles.repayButtonText}>Mark repaid</Text>
                      </>
                    )}
                  </Pressable>
                ) : (
                  <View style={styles.settledBadge}>
                    <Ionicons name="shield-checkmark" size={13} color={colors.success} />
                  </View>
                )}

                {onDelete ? (
                  <Pressable
                    onPress={handleDeletePress}
                    disabled={isDeleting || isRepaying}
                    style={({ pressed }) => [
                      styles.deleteGlassButton,
                      pressed && styles.glassButtonPressed,
                    ]}
                    hitSlop={5}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color={colors.dangerDark} />
                    ) : (
                      <Ionicons name="trash-outline" size={13} color={colors.dangerDark} />
                    )}
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {loan.receiptUrl && (
        <Modal
          visible={receiptModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setReceiptModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Receipt Proof</Text>
                <Text style={styles.modalSubtitle}>
                  {loan.friendName} • {formatRupees(loan.amount)}
                </Text>
              </View>
              <Pressable
                onPress={() => setReceiptModalVisible(false)}
                style={styles.modalCloseButton}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={colors.textLight} />
              </Pressable>
            </View>

            <View style={styles.modalImageContainer}>
              {imageLoading && (
                <ActivityIndicator
                  size="large"
                  color={colors.primaryLight}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Image
                source={{ uri: loan.receiptUrl }}
                style={styles.modalImage}
                resizeMode="contain"
                onLoadEnd={() => setImageLoading(false)}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md - 2,
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.90)",
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.95)",
    ...shadows.soft,
  },
  glassCardOverdue: {
    backgroundColor: "rgba(255, 241, 242, 0.88)",
    borderColor: "rgba(254, 205, 211, 0.95)",
  },
  glassCardRepaid: {
    backgroundColor: "rgba(240, 253, 244, 0.82)",
    borderColor: "rgba(167, 243, 208, 0.9)",
    opacity: 0.88,
  },
  overdueGlowEdge: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    backgroundColor: colors.danger,
    zIndex: 2,
  },
  cardInner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPillOverdue: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 63, 94, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.25)",
    paddingHorizontal: 7.5,
    paddingVertical: 2.5,
    borderRadius: radii.full,
    gap: 4,
  },
  statusTextOverdue: {
    fontSize: 9.5,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.dangerDark,
    letterSpacing: 0.4,
  },
  statusPillRepaid: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    paddingHorizontal: 7.5,
    paddingVertical: 2.5,
    borderRadius: radii.full,
    gap: 4,
  },
  statusTextRepaid: {
    fontSize: 9.5,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.successDark,
    letterSpacing: 0.4,
  },
  statusPillPending: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(199, 210, 254, 0.7)",
    paddingHorizontal: 7.5,
    paddingVertical: 2.5,
    borderRadius: radii.full,
    gap: 4,
  },
  statusTextPending: {
    fontSize: 9.5,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.primary,
    letterSpacing: 0.4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "PlusJakartaSans-ExtraBold",
    color: colors.text,
    letterSpacing: -0.3,
  },
  amountTextOverdue: {
    color: colors.dangerDark,
  },
  amountTextRepaid: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  glassDivider: {
    height: 1,
    backgroundColor: "rgba(226, 232, 240, 0.65)",
    marginVertical: 8,
  },
  glassDividerOverdue: {
    backgroundColor: "rgba(254, 205, 211, 0.6)",
  },
  glassDividerRepaid: {
    backgroundColor: "rgba(167, 243, 208, 0.6)",
  },
  bodyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  identityCol: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.xs,
  },
  avatarRing: {
    padding: 1.5,
    borderRadius: 19,
    borderWidth: 1.5,
    marginRight: 9,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.textLight,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  friendCol: {
    justifyContent: "center",
  },
  friendName: {
    fontSize: 14,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.text,
    marginBottom: 1,
  },
  friendNameRepaid: {
    color: colors.textSecondary,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  dateCalendarText: {
    fontSize: 10.5,
    fontFamily: "PlusJakartaSans-Regular",
    color: colors.textMuted,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  receiptGlassButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(199, 210, 254, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: radii.full,
    gap: 3.5,
  },
  receiptButtonText: {
    fontSize: 10.5,
    color: colors.primary,
    fontFamily: "PlusJakartaSans-Bold",
    fontWeight: "700",
  },
  repayGlassButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.85)",
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: radii.full,
    gap: 3.5,
  },
  glassButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  repayButtonText: {
    fontSize: 11,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.successDark,
  },
  settledBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteGlassButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244, 63, 94, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(254, 205, 211, 0.8)",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    paddingTop: spacing.hero,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "900",
    color: colors.textLight,
  },
  modalSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modalImageContainer: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
});
