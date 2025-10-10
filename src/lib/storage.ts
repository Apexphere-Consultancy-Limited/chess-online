const STORAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/bot-animations`

export function getBotAnimationUrl(
  difficulty: 'easy' | 'medium' | 'hard',
  animation: string
): string {
  return `${STORAGE_URL}/${difficulty}-bot/${difficulty}-bot-${animation}.gif`
}
