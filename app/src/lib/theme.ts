export const colors = {
  background: "#F8FAFC",
  backgroundAlt: "#F1F5F9",
  surface: "#FFFFFF",
  surfaceSubtle: "#F8FAFC",
  surfaceMuted: "#E2E8F0",

  glassSurface: "rgba(255, 255, 255, 0.92)",
  glassBorder: "rgba(226, 232, 240, 0.8)",
  cardGlow: "rgba(99, 102, 241, 0.06)",

  primary: "#4F46E5",
  primaryHover: "#4338CA",
  primaryDark: "#3730A3",
  primaryLight: "#EEF2FF",
  primaryBorder: "#C7D2FE",
  violet: "#7C3AED",
  violetLight: "#F5F3FF",

  gradients: {
    hero: ["#1E1B4B", "#312E81", "#4F46E5"] as const,
    heroGlow: ["#312E81", "#4F46E5", "#7C3AED"] as const,
    primary: ["#4F46E5", "#6366F1"] as const,
    cardProgress: ["#4F46E5", "#06B6D4", "#10B981"] as const,
    repaidBadge: ["#ECFDF5", "#D1FAE5"] as const,
    overdueBadge: ["#FFF1F2", "#FFE4E6"] as const,
    subtle: ["#FFFFFF", "#F8FAFC"] as const,
  },

  success: "#10B981",
  successDark: "#059669",
  successLight: "#ECFDF5",
  successBorder: "#A7F3D0",

  warning: "#F59E0B",
  warningDark: "#D97706",
  warningLight: "#FFFBEB",
  warningBorder: "#FDE68A",

  danger: "#F43F5E",
  dangerDark: "#E11D48",
  dangerLight: "#FFF1F2",
  dangerBorder: "#FECDD3",

  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textLight: "#FFFFFF",
  textInverse: "#FFFFFF",

  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  borderFocused: "#6366F1",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  hero: 44,
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  full: 9999,
};

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  hero: 34,
  display: 42,
};

export const shadows = {
  soft: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: "#1E1B4B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
  },
  floating: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 7,
  },
  successGlow: {
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  dangerGlow: {
    shadowColor: "#F43F5E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
};

export const fonts = {
  regular: "PlusJakartaSans-Regular",
  medium: "PlusJakartaSans-Medium",
  semiBold: "PlusJakartaSans-SemiBold",
  bold: "PlusJakartaSans-Bold",
  extraBold: "PlusJakartaSans-ExtraBold",
};

export const theme = {
  colors,
  spacing,
  radii,
  fontSizes,
  fonts,
  shadows,
};

export default theme;
