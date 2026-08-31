import { generateText, Output } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import type { PlayerGroup, QuestionEnergy, QuestionType } from "../types/ConversationGame";
import type { TopicLanguage } from "../types/Topic";

export type AiProviderId = "openai" | "deepseek" | "kimi" | "custom";

export interface AiProviderPreset {
  id: AiProviderId;
  label: string;
  baseUrl: string;
  model: string;
}

export const AI_PROVIDER_PRESETS: AiProviderPreset[] = [
  { id: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4.1-mini" },
  { id: "deepseek", label: "DeepSeek", baseUrl: "https://api.deepseek.com", model: "deepseek-chat" },
  { id: "kimi", label: "Kimi", baseUrl: "https://api.moonshot.ai/v1", model: "" },
  { id: "custom", label: "Custom", baseUrl: "", model: "" },
];

export interface GeneratedCategory {
  key: string;
  name: string;
  description: string;
  color: string;
}

export interface GeneratedCard {
  category: string;
  type: Exclude<QuestionType, "discussion">;
  energy: QuestionEnergy;
  question: string;
  more?: string[];
}

export interface GeneratedConversationDraft {
  title: string;
  subtitle: string;
  startTitle: string;
  startDescription: string;
  startButton: string;
  endTitle: string;
  endSubtitle: string;
  restartButton: string;
  categories: GeneratedCategory[];
  cards: GeneratedCard[];
}

export interface GenerateConversationInput {
  apiKey: string;
  baseUrl: string;
  cardCount: number;
  language: TopicLanguage;
  model: string;
  playerGroups: PlayerGroup[];
  sharpness: "balanced" | "gentle" | "sharp";
  signal?: AbortSignal;
  topic: string;
}

const FALLBACK_COLORS = ["#20201e", "#d96c4f", "#e5ad45", "#7d9b76", "#6f91bb", "#9a78ad"];

const generatedDraftSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  startTitle: z.string(),
  startDescription: z.string(),
  startButton: z.string(),
  endTitle: z.string(),
  endSubtitle: z.string(),
  restartButton: z.string(),
  categories: z.array(z.object({
    key: z.string(),
    name: z.string(),
    description: z.string(),
    color: z.string(),
  })).min(1).max(6),
  cards: z.array(z.object({
    category: z.string(),
    type: z.enum(["open", "wildcard", "end"]),
    energy: z.enum(["bouba", "kiki"]),
    question: z.string(),
    more: z.array(z.string()).max(4).optional(),
  })).min(1).max(40),
});

const normalizeCategoryKey = (value: string, index: number, used: Set<string>): string => {
  const stem = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `category-${index + 1}`;
  let key = stem;
  let suffix = 2;
  while (used.has(key)) key = `${stem}-${suffix++}`;
  used.add(key);
  return key;
};

const normalizeBaseUrl = (baseUrl: string): string => {
  const normalized = baseUrl.trim().replace(/\/+$/, "");
  if (!normalized) throw new Error("Base URL is required.");
  const url = new URL(normalized);
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) {
    throw new Error("Use an HTTPS API endpoint.");
  }
  return normalized.replace(/\/chat\/completions$/, "");
};

const normalizeDraft = (
  value: z.infer<typeof generatedDraftSchema>,
  language: TopicLanguage,
): GeneratedConversationDraft => {
  const usedKeys = new Set<string>();
  const rawToNormalized = new Map<string, string>();
  const categories = value.categories.map((category, index) => {
    const rawKey = category.key.trim() || `category-${index + 1}`;
    const key = normalizeCategoryKey(rawKey, index, usedKeys);
    rawToNormalized.set(rawKey, key);
    return {
      key,
      name: category.name.trim() || (language === "zh" ? `分类 ${index + 1}` : `Category ${index + 1}`),
      description: category.description.trim(),
      color: /^#[0-9a-f]{6}$/i.test(category.color.trim())
        ? category.color.trim()
        : FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    };
  });

  const categoryKeys = new Set(categories.map((category) => category.key));
  const fallbackCategory = categories[0].key;
  const cards = value.cards.flatMap((card) => {
    const question = card.question.trim();
    if (!question) return [];
    const category = rawToNormalized.get(card.category)
      ?? (categoryKeys.has(card.category) ? card.category : fallbackCategory);
    const more = card.more?.map((item) => item.trim()).filter(Boolean);
    return [{
      category,
      type: card.type,
      energy: card.energy,
      question,
      ...(more?.length ? { more } : {}),
    }];
  });

  if (cards.length === 0) throw new Error("The model did not create any usable cards.");

  const chinese = language === "zh";
  const title = value.title.trim() || (chinese ? "新的对话" : "A New Conversation");
  return {
    title,
    subtitle: value.subtitle.trim(),
    startTitle: value.startTitle.trim() || title,
    startDescription: value.startDescription.trim(),
    startButton: value.startButton.trim() || (chinese ? "开始" : "Begin"),
    endTitle: value.endTitle.trim() || (chinese ? "聊得很好" : "A good conversation"),
    endSubtitle: value.endSubtitle.trim(),
    restartButton: value.restartButton.trim() || (chinese ? "再聊一次" : "Talk again"),
    categories,
    cards,
  };
};

const asRecord = (value: unknown): Record<string, unknown> | null => (
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
);

const generationError = (error: unknown): Error => {
  if (error instanceof DOMException && error.name === "AbortError") return error;
  const root = asRecord(error);
  const lastError = asRecord(root?.lastError);
  const data = asRecord(lastError?.data);
  const providerError = asRecord(data?.error);
  const providerMessage = typeof providerError?.message === "string" ? providerError.message : null;
  const message = providerMessage
    ?? (error instanceof Error ? error.message : "Unknown provider error.");
  if (/fetch|network|cors|failed to fetch/i.test(message)) {
    return new Error("Could not reach this API from the browser. Check the Base URL and whether the provider allows browser requests.");
  }
  return new Error(message);
};

export async function generateConversationDraft(input: GenerateConversationInput): Promise<GeneratedConversationDraft> {
  if (!input.apiKey.trim()) throw new Error("API Key is required.");
  if (!input.model.trim()) throw new Error("Model is required.");
  if (!input.topic.trim()) throw new Error("Describe the topic you want to explore.");

  const cardCount = Math.max(6, Math.min(40, Math.round(input.cardCount)));
  const languageName = input.language === "zh" ? "Simplified Chinese" : "English";
  const sharpnessDirection = {
    gentle: "Mostly Bouba: warm, spacious prompts, with a few precise challenges.",
    balanced: "Balance Bouba openness with Kiki questions that puncture rehearsed or socially safe answers.",
    sharp: "Use more Kiki energy: direct, specific and willing to surface tension, without becoming cruel or coercive.",
  }[input.sharpness];

  const provider = createOpenAICompatible({
    name: "frankcards-user-provider",
    apiKey: input.apiKey.trim(),
    baseURL: normalizeBaseUrl(input.baseUrl),
  });

  const system = [
    "You design original FrankCards conversation packs.",
    "Create prompts that lead to specific stories, honest reflection and meaningful disagreement.",
    "Do not copy existing commercial conversation-card wording. Avoid generic self-help platitudes.",
    sharpnessDirection,
    "Bouba cards open space through curiosity and detail. Kiki cards name tension, contradiction or avoidance.",
    "Wildcards change the interaction or rhythm. End cards close the conversation intentionally.",
    "Every visible string must use the requested language.",
  ].join(" ");

  const prompt = `Create a ${cardCount}-card conversation pack in ${languageName} about: ${input.topic.trim()}\n\nAudience: ${input.playerGroups.join(", ")}. Use 2 to 4 coherent categories and no more than one end card. Keep the title simple and direct. Keep the subtitle concise. The opening description must stay under 100 words. Return exactly ${cardCount} cards.\n\nUse this JSON shape:\n{\n  "title": "",\n  "subtitle": "",\n  "startTitle": "",\n  "startDescription": "",\n  "startButton": "",\n  "endTitle": "",\n  "endSubtitle": "",\n  "restartButton": "",\n  "categories": [{ "key": "lowercase-key", "name": "", "description": "", "color": "#RRGGBB" }],\n  "cards": [{ "category": "lowercase-key", "type": "open|wildcard|end", "energy": "bouba|kiki", "question": "", "more": ["optional back-side prompt"] }]\n}`;

  try {
    const result = await generateText({
      model: provider.chatModel(input.model.trim()),
      system,
      prompt,
      temperature: 0.85,
      maxRetries: 0,
      abortSignal: input.signal,
      output: Output.object({ schema: generatedDraftSchema }),
    });
    return normalizeDraft(result.output, input.language);
  } catch (error) {
    throw generationError(error);
  }
}
