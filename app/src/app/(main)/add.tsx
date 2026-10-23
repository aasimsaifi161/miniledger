import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { colors, radii, shadows, fontSizes, spacing } from "../../lib/theme";
import { formatCalendarDate } from "../../lib/format";
import { useCreateLoan, useUploadReceipt } from "../../hooks/useLoans";
import { Button } from "../../components/Button";
import { useToast } from "../../components/Toast";
import { ApiError } from "../../lib/api";

type QuickChip = "1w" | "2w" | "1m" | "custom";

export default function AddLoanScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [friendName, setFriendName] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [dueDate, setDueDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [quickChip, setQuickChip] = useState<QuickChip>("1w");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receiptImage, setReceiptImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [errors, setErrors] = useState<{ friendName?: string; amount?: string }>({});
  const [loading, setLoading] = useState(false);

  const createLoanMutation = useCreateLoan();
  const uploadReceiptMutation = useUploadReceipt();

  const handleQuickChip = (chip: QuickChip) => {
    setQuickChip(chip);
    Haptics.selectionAsync();

    const now = new Date();
    if (chip === "1w") {
      now.setDate(now.getDate() + 7);
      setDueDate(now);
      setShowDatePicker(false);
    } else if (chip === "2w") {
      now.setDate(now.getDate() + 14);
      setDueDate(now);
      setShowDatePicker(false);
    } else if (chip === "1m") {
      now.setDate(now.getDate() + 30);
      setDueDate(now);
      setShowDatePicker(false);
    } else if (chip === "custom") {
      setShowDatePicker(true);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (event.type === "set" && selectedDate) {
      setDueDate(selectedDate);
      setQuickChip("custom");
    }
  };

  const handlePickReceipt = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photos to attach a receipt proof."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setReceiptImage(result.assets[0]);
        showToast("Receipt attached", "info");
      }
    } catch (error) {
      console.warn("Image picker error:", error);
    }
  };

  const handleRemoveReceipt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReceiptImage(null);
  };

  const validateForm = (): boolean => {
    const newErrors: { friendName?: string; amount?: string } = {};

    const trimmedName = friendName.trim();
    if (!trimmedName) {
      newErrors.friendName = "Friend's name is required";
    } else if (trimmedName.length > 60) {
      newErrors.friendName = "Name cannot exceed 60 characters";
    }

    const cleanAmount = parseInt(amountStr.replace(/[^0-9]/g, ""), 10);
    if (!amountStr || isNaN(cleanAmount) || cleanAmount <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const amount = parseInt(amountStr.replace(/[^0-9]/g, ""), 10);
    setLoading(true);

    try {
      const loan = await createLoanMutation.mutateAsync({
        friendName: friendName.trim(),
        amount,
        dueDate: dueDate.toISOString(),
      });

      if (receiptImage && receiptImage.uri) {
        try {
          await uploadReceiptMutation.mutateAsync({
            loanId: loan.id,
            imageUri: receiptImage.uri,
          });
        } catch (receiptErr: any) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          showToast(
            `Loan saved, but receipt upload failed: ${receiptErr?.message || "Upload error"}`,
            "error"
          );
          router.back();
          return;
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Loan recorded successfully!", "success");
      router.back();
    } catch (err: any) {
      const errorMsg =
        err instanceof ApiError ? err.message : "Failed to record loan";
      showToast(errorMsg, "error");

      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={colors.gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={18} color={colors.textLight} />
          </Pressable>

          <Text style={styles.navTitle}>Record New Loan</Text>

          <View style={styles.navPlaceholder} />
        </View>

        <View style={styles.amountContainer}>
          <View style={styles.amountCaptionRow}>
            <View style={styles.captionBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.captionBadgeText}>LENT AMOUNT • INR (₹)</Text>
            </View>
          </View>

          <View
            style={[
              styles.amountGlassBox,
              Boolean(errors.amount) && styles.amountGlassBoxError,
            ]}
          >
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="rgba(255, 255, 255, 0.35)"
              keyboardType="number-pad"
              value={amountStr}
              onChangeText={(val) => {
                setAmountStr(val.replace(/[^0-9]/g, ""));
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
              }}
              autoFocus
            />
          </View>

          {errors.amount && (
            <Text style={styles.headerErrorText}>{errors.amount}</Text>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.glassCard}>
          <Text style={styles.cardLabel}>WHO RECEIVED THIS?</Text>

          <View
            style={[
              styles.inputBox,
              Boolean(errors.friendName) && styles.inputBoxError,
            ]}
          >
            <View style={styles.inputIconCircle}>
              <Ionicons name="person" size={14} color={colors.primary} />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={colors.textMuted}
              value={friendName}
              onChangeText={(val) => {
                setFriendName(val);
                if (errors.friendName)
                  setErrors((prev) => ({ ...prev, friendName: undefined }));
              }}
              maxLength={60}
            />
          </View>

          {errors.friendName && (
            <Text style={styles.errorText}>{errors.friendName}</Text>
          )}
        </View>

        <View style={styles.glassCard}>
          <View style={styles.deadlineHeaderRow}>
            <Text style={styles.cardLabel}>REPAYMENT DEADLINE</Text>
            <View style={styles.selectedDateBadge}>
              <Ionicons name="calendar-outline" size={11} color={colors.primary} />
              <Text style={styles.selectedDateText}>
                {formatCalendarDate(dueDate.toISOString())}
              </Text>
            </View>
          </View>

          <View style={styles.segmentedTrack}>
            {(["1w", "2w", "1m", "custom"] as QuickChip[]).map((chip) => {
              const isActive = quickChip === chip;
              const label =
                chip === "1w"
                  ? "1 Week"
                  : chip === "2w"
                  ? "2 Weeks"
                  : chip === "1m"
                  ? "1 Month"
                  : "Custom";

              return (
                <Pressable
                  key={chip}
                  onPress={() => handleQuickChip(chip)}
                  style={[styles.segmentTab, isActive && styles.segmentTabActive]}
                >
                  {chip === "custom" && (
                    <Ionicons
                      name="calendar"
                      size={11}
                      color={isActive ? colors.primary : colors.textSecondary}
                      style={{ marginRight: 3 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.segmentText,
                      isActive && styles.segmentTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={dueDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
              {Platform.OS === "ios" && (
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  style={styles.datePickerDoneButton}
                >
                  <Text style={styles.datePickerDoneText}>Confirm Date</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.cardLabel}>PAYMENT PROOF / RECEIPT (OPTIONAL)</Text>

          {receiptImage ? (
            <View style={styles.receiptPreviewCard}>
              <Image
                source={{ uri: receiptImage.uri }}
                style={styles.receiptThumbnail}
              />
              <View style={styles.receiptInfoCol}>
                <Text style={styles.receiptFileName} numberOfLines={1}>
                  {receiptImage.fileName || "Receipt Proof Attached"}
                </Text>
                <Text style={styles.receiptFileSize}>
                  {receiptImage.fileSize
                    ? `${Math.round(receiptImage.fileSize / 1024)} KB`
                    : "Ready to upload"}
                </Text>
              </View>
              <Pressable
                onPress={handleRemoveReceipt}
                style={styles.removeReceiptButton}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={handlePickReceipt} style={styles.uploadPlaceholder}>
              <View style={styles.uploadIconCircle}>
                <Ionicons name="camera-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.uploadTextCol}>
                <Text style={styles.uploadPlaceholderTitle}>
                  Attach UPI screenshot or receipt
                </Text>
                <Text style={styles.uploadPlaceholderSubtitle}>
                  JPG, PNG, WebP up to 5MB
                </Text>
              </View>
            </Pressable>
          )}
        </View>

        <View style={styles.submitSection}>
          <Button
            title={loading ? "Recording Loan..." : "Record Loan"}
            onPress={handleSubmit}
            loading={loading}
            size="md"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg + 2,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  backButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.94 }],
  },
  navTitle: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.textLight,
  },
  navPlaceholder: {
    width: 32,
  },
  amountContainer: {
    marginTop: 2,
  },
  amountCaptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  captionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: radii.full,
    gap: 5,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#34D399",
  },
  captionBadgeText: {
    fontSize: fontSizes.xs - 1.5,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: "rgba(255, 255, 255, 0.85)",
    letterSpacing: 0.8,
  },
  amountGlassBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    borderRadius: radii.xl,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  amountGlassBoxError: {
    borderColor: "#FDA4AF",
    backgroundColor: "rgba(244, 63, 94, 0.16)",
  },
  rupeeSymbol: {
    fontSize: 28,
    fontWeight: "900",
    fontFamily: "PlusJakartaSans-ExtraBold",
    color: "#34D399",
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "900",
    fontFamily: "PlusJakartaSans-ExtraBold",
    color: colors.textLight,
    letterSpacing: -0.6,
  },
  headerErrorText: {
    marginTop: 5,
    fontSize: fontSizes.xs,
    color: "#FDA4AF",
    fontFamily: "PlusJakartaSans-Bold",
    fontWeight: "700",
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: radii.xl,
    padding: 14,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.95)",
    ...shadows.soft,
  },
  cardLabel: {
    fontSize: fontSizes.xs - 1,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.lg,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  inputBoxError: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerLight,
  },
  inputIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.text,
  },
  errorText: {
    marginTop: 6,
    fontSize: fontSizes.xs - 1,
    color: colors.dangerDark,
    fontFamily: "PlusJakartaSans-Bold",
    fontWeight: "700",
  },
  deadlineHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 7.5,
    paddingVertical: 2,
    borderRadius: radii.full,
    gap: 3.5,
  },
  selectedDateText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.primary,
  },
  segmentedTrack: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: radii.full,
    padding: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  segmentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: radii.full,
  },
  segmentTabActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  datePickerContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  datePickerDoneButton: {
    alignSelf: "flex-end",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  datePickerDoneText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.primary,
  },
  uploadPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.lg,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderStyle: "dashed",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  uploadIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTextCol: {
    flex: 1,
  },
  uploadPlaceholderTitle: {
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.text,
    marginBottom: 1,
  },
  uploadPlaceholderSubtitle: {
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    fontFamily: "PlusJakartaSans-Regular",
  },
  receiptPreviewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  receiptThumbnail: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    marginRight: 10,
  },
  receiptInfoCol: {
    flex: 1,
  },
  receiptFileName: {
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.text,
    marginBottom: 1,
  },
  receiptFileSize: {
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    fontFamily: "PlusJakartaSans-Medium",
    fontWeight: "600",
  },
  removeReceiptButton: {
    padding: 6,
  },
  submitSection: {
    marginTop: 4,
  },
});
