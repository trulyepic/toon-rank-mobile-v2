export type ThemeName = "violet" | "classic" | "amber";

type Palette = {
  background: string;
  backgroundSoft: string;
  surface: string;
  surfaceRaised: string;
  surfacePressed: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentBorder: string;
  border: string;
  borderSoft: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  overlay: string;
};

const PALETTES: Record<ThemeName, Palette> = {
  violet: {
    background: "#0f0e14",
    backgroundSoft: "#141220",
    surface: "#1a1828",
    surfaceRaised: "#221f35",
    surfacePressed: "#2a2740",
    accent: "#1e1a3a",
    accentStrong: "#a78bfa",
    accentSoft: "#15122a",
    accentBorder: "#5b45b8",
    border: "#2e2b45",
    borderSoft: "#1f1d32",
    text: "#f4f2ff",
    textMuted: "#a8a4c4",
    textSubtle: "#6e6a8a",
    overlay: "rgba(8, 7, 12, 0.88)",
  },
  classic: {
    background: "#101216",
    backgroundSoft: "#151922",
    surface: "#1a1f2a",
    surfaceRaised: "#202737",
    surfacePressed: "#273149",
    accent: "#315fdc",
    accentStrong: "#5f88ff",
    accentSoft: "#203469",
    accentBorder: "#6d93ff",
    border: "#313a4f",
    borderSoft: "#263044",
    text: "#f7f9fc",
    textMuted: "#aeb8ca",
    textSubtle: "#7f8da6",
    overlay: "rgba(10, 13, 20, 0.84)",
  },
  amber: {
    background: "#0d0b08",
    backgroundSoft: "#131008",
    surface: "#1b1510",
    surfaceRaised: "#231b13",
    surfacePressed: "#2c2218",
    accent: "#2e1d09",
    accentStrong: "#f59e0b",
    accentSoft: "#1f1408",
    accentBorder: "#7a4d0c",
    border: "#3d2e1e",
    borderSoft: "#2a1e12",
    text: "#faf8f5",
    textMuted: "#b0a090",
    textSubtle: "#7d6a55",
    overlay: "rgba(8, 6, 4, 0.88)",
  },
};

export const DEFAULT_THEME: ThemeName = "violet";

// Mutable colors object — call applyTheme() before first render to override
export const colors = {
  ...PALETTES[DEFAULT_THEME],
  // Static semantic / warm tokens (theme-independent)
  surfaceWarm: "#211b18",
  borderWarm: "#42342d",
  success: "#0ea76a",
  warning: "#e8a23a",
  warningBorder: "#8b521c",
  warningSurface: "rgba(232, 162, 58, 0.14)",
  warningText: "#f3cf89",
  credBorder: "#8b521c",
  credSurface: "rgba(232, 162, 58, 0.14)",
  credText: "#f3cf89",
  danger: "#eb6a5a",
  overlayBorder: "rgba(255,255,255,0.12)",
  shadow: "#000000",
  // Rating bar fill — blue→cyan gradient matching the website wordmark/identity.
  // Theme-independent on purpose so the rating breakdown reads as "Toon Ranks blue"
  // across all palettes.
  ratingBarFrom: "#3b82f6",
  ratingBarTo: "#22d3ee",
};

/** Mutate the shared colors object to the given palette. Call before first render. */
export function applyTheme(name: ThemeName) {
  const p = PALETTES[name];
  colors.background = p.background;
  colors.backgroundSoft = p.backgroundSoft;
  colors.surface = p.surface;
  colors.surfaceRaised = p.surfaceRaised;
  colors.surfacePressed = p.surfacePressed;
  colors.accent = p.accent;
  colors.accentStrong = p.accentStrong;
  colors.accentSoft = p.accentSoft;
  colors.accentBorder = p.accentBorder;
  colors.border = p.border;
  colors.borderSoft = p.borderSoft;
  colors.text = p.text;
  colors.textMuted = p.textMuted;
  colors.textSubtle = p.textSubtle;
  colors.overlay = p.overlay;
}

export const THEME_META: Record<
  ThemeName,
  { label: string; swatch: string; description: string }
> = {
  violet: {
    label: "Violet",
    swatch: "#a78bfa",
    description: "Deep violet — premium and distinctive",
  },
  classic: {
    label: "Classic",
    swatch: "#5f88ff",
    description: "Original blue — clean and familiar",
  },
  amber: {
    label: "Amber",
    swatch: "#f59e0b",
    description: "Warm amber-gold — bold and unique",
  },
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

// Brand font families. Names must match the @expo-google-fonts exports loaded in
// App.tsx. In React Native each weight is its own family (fontWeight alone won't
// switch face), so headings use Manrope (matches the web display font) and
// body/UI uses Inter. fontWeight is kept as a graceful fallback if a face fails
// to load.
export const fonts = {
  body: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  heading: "Manrope_800ExtraBold",
  headingBold: "Manrope_700Bold",
};

export const typography = {
  screenTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800" as const,
    fontFamily: fonts.heading,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800" as const,
    fontFamily: fonts.heading,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800" as const,
    fontFamily: fonts.heading,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "400" as const,
    fontFamily: fonts.body,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
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
