export const colors = {
  background: "#101216",
  backgroundSoft: "#151922",
  surface: "#1a1f2a",
  surfaceRaised: "#202737",
  surfacePressed: "#273149",
  surfaceWarm: "#211b18",
  border: "#313a4f",
  borderSoft: "#263044",
  borderWarm: "#42342d",
  text: "#f7f9fc",
  textMuted: "#aeb8ca",
  textSubtle: "#7f8da6",
  accent: "#315fdc",
  accentStrong: "#5f88ff",
  accentSoft: "#203469",
  accentBorder: "#6d93ff",
  success: "#0ea76a",
  warning: "#e8a23a",
  warningBorder: "#8b521c",
  warningSurface: "rgba(232, 162, 58, 0.14)",
  warningText: "#f3cf89",
  danger: "#eb6a5a",
  overlay: "rgba(10, 13, 20, 0.84)",
  overlayBorder: "rgba(255,255,255,0.15)",
  shadow: "#000000",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
  hero: 28,
  pill: 999,
};

export const typography = {
  screenTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800" as const,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800" as const,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800" as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "400" as const,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
  },
};

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
};
