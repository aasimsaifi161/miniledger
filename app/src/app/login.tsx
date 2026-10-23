import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, radii, shadows, fontSizes, spacing } from "../lib/theme";
import { api, ApiError } from "../lib/api";
import { saveToken, saveUser } from "../lib/auth";
import { Button } from "../components/Button";
import { OtpInput } from "../components/OtpInput";
import { useToast } from "../components/Toast";

export default function LoginScreen() {
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (step === 2 && countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [step, countdown]);

  const fullPhone = `+91${phoneNumber.trim()}`;

  const handleSendOtp = async () => {
    const digitsOnly = phoneNumber.replace(/[^0-9]/g, "");
    if (digitsOnly.length < 10) {
      showToast("Please enter a valid 10-digit phone number", "error");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/request-otp", {
        phone: fullPhone,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("OTP sent! Check your server console.", "info");
      setStep(2);
      setCountdown(30);
      setOtp("");
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Failed to send OTP";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      showToast("Please enter the complete 6-digit OTP", "error");
      return;
    }

    setLoading(true);
    try {
      const data = await api.post<{
        token: string;
        user: { id: string; phone: string; createdAt: string };
      }>("/auth/verify-otp", {
        phone: fullPhone,
        otp: otp.trim(),
      });

      await saveToken(data.token);
      await saveUser(data.user);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Logged in successfully!", "success");
      router.replace("/(main)");
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Invalid or expired OTP";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    await handleSendOtp();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <LinearGradient
          colors={colors.gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.brandBadgeOuter}>
            <LinearGradient
              colors={colors.gradients.primary}
              style={styles.brandIconContainer}
            >
              <Ionicons name="wallet" size={32} color={colors.textLight} />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>MiniLedger</Text>
          <Text style={styles.appTagline}>
            Track money lent to friends with zero awkwardness and total clarity.
          </Text>
        </LinearGradient>

        <View style={styles.formSheet}>
          {step === 1 ? (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Get Started</Text>
              <Text style={styles.stepSubtitle}>
                Enter your mobile number to sign in or register instantly.
              </Text>

              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
              </View>

              <View style={styles.phoneInputRow}>
                <View style={styles.countryChip}>
                  <Text style={styles.countryFlag}>🇮🇳</Text>
                  <Text style={styles.countryCode}>+91</Text>
                </View>

                <TextInput
                  style={styles.phoneInput}
                  placeholder="98765 43210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={(val) =>
                    setPhoneNumber(val.replace(/[^0-9]/g, ""))
                  }
                  autoFocus
                />
              </View>

              <View style={styles.submitContainer}>
                <Button
                  title="Send Verification OTP"
                  onPress={handleSendOtp}
                  loading={loading}
                  disabled={phoneNumber.length < 10}
                  size="lg"
                />
              </View>
            </View>
          ) : (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Enter 6-Digit OTP</Text>
              <Text style={styles.stepSubtitle}>
                A code has been dispatched to{" "}
                <Text style={{ fontWeight: "800", color: colors.text }}>
                  {fullPhone}
                </Text>
              </Text>

              <View style={styles.otpWrapper}>
                <OtpInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                />
              </View>

              <View style={styles.hintCard}>
                <Ionicons
                  name="terminal-outline"
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: spacing.sm }}
                />
                <Text style={styles.hintText}>
                  Development mode: The 6-digit OTP is logged directly in your backend terminal console.
                </Text>
              </View>

              <View style={styles.submitContainer}>
                <Button
                  title="Verify & Continue"
                  onPress={handleVerifyOtp}
                  loading={loading}
                  disabled={otp.length !== 6}
                  size="lg"
                />
              </View>

              <View style={styles.footerRow}>
                <Pressable
                  onPress={handleResendOtp}
                  disabled={countdown > 0}
                  style={styles.footerButton}
                >
                  <Text
                    style={[
                      styles.resendText,
                      countdown > 0 && styles.resendTextDisabled,
                    ]}
                  >
                    {countdown > 0
                      ? `Resend in ${countdown}s`
                      : "Resend Code"}
                  </Text>
                </Pressable>

                <Text style={styles.footerDot}>•</Text>

                <Pressable
                  onPress={() => {
                    setStep(1);
                    setOtp("");
                  }}
                  style={styles.footerButton}
                >
                  <Text style={styles.changePhoneText}>Edit number</Text>
                </Pressable>
              </View>
            </View>
          )}
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
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    paddingTop: spacing.hero * 1.6,
    paddingBottom: spacing.hero * 1.5,
    paddingHorizontal: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  brandBadgeOuter: {
    padding: 3,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginBottom: spacing.md,
  },
  brandIconContainer: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow,
  },
  appName: {
    fontSize: fontSizes.hero + 2,
    fontWeight: "900",
    fontFamily: "PlusJakartaSans-ExtraBold",
    color: colors.textLight,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  appTagline: {
    fontSize: fontSizes.sm + 1,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    maxWidth: 290,
    lineHeight: 20,
    fontWeight: "500",
    fontFamily: "PlusJakartaSans-Medium",
  },
  formSheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl + 8,
    borderTopRightRadius: radii.xxl + 8,
    marginTop: -spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.hero,
    ...shadows.floating,
  },
  stepContainer: {
    width: "100%",
  },
  stepTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: "900",
    fontFamily: "PlusJakartaSans-ExtraBold",
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: "PlusJakartaSans-Medium",
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  inputLabelRow: {
    marginBottom: spacing.xs,
  },
  inputLabel: {
    fontSize: fontSizes.xs - 0.5,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    letterSpacing: 0.9,
    color: colors.textSecondary,
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  countryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.xl,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.text,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.xl,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    fontSize: fontSizes.lg,
    fontWeight: "800",
    fontFamily: "PlusJakartaSans-Bold",
    color: colors.text,
    letterSpacing: 1,
  },
  submitContainer: {
    marginTop: spacing.md,
  },
  otpWrapper: {
    marginVertical: spacing.md,
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  hintText: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: colors.primary,
    fontWeight: "600",
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  footerButton: {
    paddingVertical: spacing.xs,
  },
  footerDot: {
    color: colors.textMuted,
  },
  resendText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.primary,
  },
  resendTextDisabled: {
    color: colors.textMuted,
    fontWeight: "500",
  },
  changePhoneText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textSecondary,
  },
});
