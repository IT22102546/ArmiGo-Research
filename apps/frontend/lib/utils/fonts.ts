/**
 * Utility functions for language-specific configuration including fonts, keyboard input, and text direction
 */

export type LanguageFont = "baamini" | "fmabhaya" | "default";
export type LanguageCode = "en" | "ta" | "si";
export type TextDirection = "ltr" | "rtl";

export interface LanguageConfig {
  language: string;
  code: LanguageCode;
  font: LanguageFont;
  fontFamily: string;
  fontStack: string;
  direction: TextDirection;
  label: string;
}

const LANGUAGE_CONFIG_MAP: Record<string, LanguageConfig> = {
  // Tamil languages - Baamini font
  tamil: {
    language: "tamil",
    code: "ta",
    font: "baamini",
    fontFamily: "Baamini",
    fontStack: "Baamini, system-ui, sans-serif",
    direction: "ltr",
    label: "Tamil",
  },
  ta: {
    language: "tamil",
    code: "ta",
    font: "baamini",
    fontFamily: "Baamini",
    fontStack: "Baamini, system-ui, sans-serif",
    direction: "ltr",
    label: "Tamil",
  },

  // Sinhala languages - FMabhaya font
  sinhala: {
    language: "sinhala",
    code: "si",
    font: "fmabhaya",
    fontFamily: "FMabhaya",
    fontStack: "FMabhaya, system-ui, sans-serif",
    direction: "ltr",
    label: "Sinhala",
  },
  si: {
    language: "sinhala",
    code: "si",
    font: "fmabhaya",
    fontFamily: "FMabhaya",
    fontStack: "FMabhaya, system-ui, sans-serif",
    direction: "ltr",
    label: "Sinhala",
  },

  // Default for English and other languages
  english: {
    language: "english",
    code: "en",
    font: "default",
    fontFamily: "Inter, system-ui",
    fontStack: "Inter, system-ui, -apple-system, sans-serif",
    direction: "ltr",
    label: "English",
  },
  en: {
    language: "english",
    code: "en",
    font: "default",
    fontFamily: "Inter, system-ui",
    fontStack: "Inter, system-ui, -apple-system, sans-serif",
    direction: "ltr",
    label: "English",
  },
};

/**
 * Get complete language configuration based on medium name
 * Includes language code, text direction, font, and label
 */
export function getLanguageConfig(mediumName?: string): LanguageConfig {
  if (!mediumName) {
    return LANGUAGE_CONFIG_MAP["en"];
  }

  const normalizedName = mediumName.toLowerCase().trim();
  return LANGUAGE_CONFIG_MAP[normalizedName] || LANGUAGE_CONFIG_MAP["en"];
}

/**
 * Get CSS font-family string for a given medium (for backward compatibility)
 */
export function getLanguageFontFamily(mediumName?: string): string {
  return getLanguageConfig(mediumName).fontStack;
}

/**
 * Get CSS font-family string for a given medium
 */
export function getLanguageFontStyle(mediumName?: string): React.CSSProperties {
  const config = getLanguageConfig(mediumName);
  return {
    fontFamily: config.fontStack,
  };
}

/**
 * Get language code for input lang attribute (e.g., 'ta', 'si', 'en')
 */
export function getLanguageCode(mediumName?: string): LanguageCode {
  return getLanguageConfig(mediumName).code;
}

/**
 * Get text direction (ltr or rtl)
 */
export function getTextDirection(mediumName?: string): TextDirection {
  return getLanguageConfig(mediumName).direction;
}

/**
 * Get complete language attributes object for HTML elements
 * Usage: <input {...getLanguageAttributes(mediumName)} />
 */
export function getLanguageAttributes(mediumName?: string): {
  lang: LanguageCode;
  dir: TextDirection;
  style: React.CSSProperties;
} {
  const config = getLanguageConfig(mediumName);
  return {
    lang: config.code,
    dir: config.direction,
    style: {
      fontFamily: config.fontStack,
    },
  };
}

/**
 * Get CSS class name for language-specific fonts (for Tailwind compatibility)
 */
export function getLanguageFontClass(mediumName?: string): string {
  const config = getLanguageConfig(mediumName);
  return `font-${config.font}`;
}

/**
 * Determine if a language needs special font handling
 */
export function needsSpecialFont(mediumName?: string): boolean {
  const config = getLanguageConfig(mediumName);
  return config.font !== "default";
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): LanguageConfig[] {
  const seen = new Set<string>();
  const languages: LanguageConfig[] = [];

  Object.values(LANGUAGE_CONFIG_MAP).forEach((config) => {
    if (!seen.has(config.language)) {
      seen.add(config.language);
      languages.push(config);
    }
  });

  return languages;
}
