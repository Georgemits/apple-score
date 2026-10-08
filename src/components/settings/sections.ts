/**
 * The settings page's sections, in page order. Shared by the page (anchors),
 * the section nav (links + scroll-spy) and the loading skeleton (shape).
 */
export const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "account", label: "Account" },
  { id: "data", label: "Your data" },
  { id: "danger", label: "Danger zone" },
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]["id"];
