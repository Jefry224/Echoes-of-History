export const env = {
  openai: import.meta.env.VITE_OPENAI_API_KEY as string | undefined,
  elevenlabs: import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined,
  n8nWebhook: import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined,
} as const;
