// ui/names.ts — short display names for NPC ids: "nora" -> "Nora" (CHARACTERS.md and UI_UX use these short names)
export const shortName = (id: string): string => {
  const words = id.replaceAll('_', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}