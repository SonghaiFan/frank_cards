import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faRotate, faWandMagicSparkles, faXmark } from "@fortawesome/free-solid-svg-icons";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  AI_PROVIDER_PRESETS,
  generateConversationDraft,
  type AiProviderId,
  type GeneratedConversationDraft,
} from "../../ai/openAiCompatible";
import type { PlayerGroup } from "../../types/ConversationGame";
import type { TopicLanguage } from "../../types/Topic";

interface AiCardGeneratorDialogProps {
  initialCardCount: number;
  initialTopic: string;
  language: TopicLanguage;
  onApply: (draft: GeneratedConversationDraft) => void;
  onClose: () => void;
  playerGroups: PlayerGroup[];
}

export default function AiCardGeneratorDialog({
  initialCardCount,
  initialTopic,
  language,
  onApply,
  onClose,
  playerGroups,
}: AiCardGeneratorDialogProps) {
  const { t } = useTranslation();
  const [providerId, setProviderId] = useState<AiProviderId>("openai");
  const initialPreset = AI_PROVIDER_PRESETS[0];
  const [baseUrl, setBaseUrl] = useState(initialPreset.baseUrl);
  const [model, setModel] = useState(initialPreset.model);
  const [apiKey, setApiKey] = useState("");
  const [topic, setTopic] = useState(initialTopic);
  const [cardCount, setCardCount] = useState(Math.max(8, Math.min(40, initialCardCount || 16)));
  const [sharpness, setSharpness] = useState<"balanced" | "gentle" | "sharp">("balanced");
  const [result, setResult] = useState<GeneratedConversationDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const provider = useMemo(
    () => AI_PROVIDER_PRESETS.find((item) => item.id === providerId) ?? AI_PROVIDER_PRESETS[0],
    [providerId],
  );

  const selectProvider = (nextProviderId: AiProviderId) => {
    const nextProvider = AI_PROVIDER_PRESETS.find((item) => item.id === nextProviderId);
    if (!nextProvider) return;
    setProviderId(nextProviderId);
    setBaseUrl(nextProvider.baseUrl);
    setModel(nextProvider.model);
    setResult(null);
    setError(null);
  };

  const generate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      setResult(await generateConversationDraft({
        apiKey,
        baseUrl,
        cardCount,
        language,
        model,
        playerGroups,
        sharpness,
        topic,
      }));
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : t("account.aiGenericError"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      className="topic-ai-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !isGenerating) onClose();
      }}
    >
      <motion.section
        className="topic-ai-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-ai-title"
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.99 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        <header className="topic-ai-header">
          <div>
            <p>{t("account.aiEyebrow")}</p>
            <h2 id="topic-ai-title">{t("account.aiTitle")}</h2>
            <span>{t("account.aiBody")}</span>
          </div>
          <button type="button" onClick={onClose} disabled={isGenerating} aria-label={t("account.close")}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div className="topic-ai-body">
          <form className="topic-ai-form" onSubmit={(event) => { event.preventDefault(); void generate(); }}>
            <fieldset>
              <legend>{t("account.aiProvider")}</legend>
              <div className="topic-ai-provider-grid">
                {AI_PROVIDER_PRESETS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={providerId === item.id ? "is-selected" : ""}
                    onClick={() => selectProvider(item.id)}
                  >
                    {item.id === "custom" ? t("account.aiCustomProvider") : item.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label>
              <span>{t("account.aiBaseUrl")}</span>
              <input
                type="url"
                value={baseUrl}
                onChange={(event) => { setBaseUrl(event.target.value); setProviderId("custom"); }}
                placeholder="https://api.example.com/v1"
                required
              />
            </label>

            <label>
              <span>{t("account.aiModel")}</span>
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder={provider.model || "model-name"}
                required
              />
            </label>

            <label>
              <span>{t("account.aiApiKey")}</span>
              <input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="••••••••••••••••"
                autoComplete="off"
                spellCheck={false}
                required
              />
              <small>{t("account.aiApiKeyHint")}</small>
            </label>

            <label>
              <span>{t("account.aiTopic")}</span>
              <textarea
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder={t("account.aiTopicPlaceholder")}
                rows={4}
                required
              />
            </label>

            <div className="topic-ai-form-row">
              <label>
                <span>{t("account.aiCardCount")}</span>
                <input
                  type="number"
                  min={6}
                  max={40}
                  value={cardCount}
                  onChange={(event) => setCardCount(Number(event.target.value))}
                />
              </label>
              <label>
                <span>{t("account.aiSharpness")}</span>
                <select value={sharpness} onChange={(event) => setSharpness(event.target.value as typeof sharpness)}>
                  <option value="gentle">{t("account.aiSharpnessGentle")}</option>
                  <option value="balanced">{t("account.aiSharpnessBalanced")}</option>
                  <option value="sharp">{t("account.aiSharpnessSharp")}</option>
                </select>
              </label>
            </div>

            {error ? <p className="topic-ai-error" role="alert">{error}</p> : null}

            <button className="topic-ai-generate" type="submit" disabled={isGenerating}>
              <FontAwesomeIcon icon={isGenerating ? faRotate : faWandMagicSparkles} spin={isGenerating} />
              <span>{isGenerating ? t("account.aiGenerating") : result ? t("account.aiGenerateAgain") : t("account.aiGenerate")}</span>
            </button>
          </form>

          <section className="topic-ai-preview" aria-live="polite">
            {result ? (
              <>
                <div className="topic-ai-preview-heading">
                  <div>
                    <p>{t("account.aiDraftReady")}</p>
                    <h3>{result.title}</h3>
                    <span>{result.subtitle}</span>
                  </div>
                  <strong>{t("account.studioCardCount", { count: result.cards.length })}</strong>
                </div>

                <div className="topic-ai-category-list">
                  {result.categories.map((category) => (
                    <span key={category.key} style={{ "--ai-category": category.color } as React.CSSProperties}>
                      {category.name}
                    </span>
                  ))}
                </div>

                <div className="topic-ai-card-review">
                  {result.cards.map((card, index) => {
                    const category = result.categories.find((item) => item.key === card.category);
                    return (
                      <article key={`${card.category}-${index}`}>
                        <span style={{ "--ai-category": category?.color ?? "#20201e" } as React.CSSProperties}>
                          {index + 1}
                        </span>
                        <div>
                          <small>{category?.name} · {t(`cardEnergy.${card.energy}.label`)}</small>
                          <p>{card.question}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <button className="topic-ai-apply" type="button" onClick={() => onApply(result)}>
                  <span>{t("account.aiApply")}</span>
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
                <p className="topic-ai-review-note">{t("account.aiReviewHint")}</p>
              </>
            ) : (
              <div className="topic-ai-empty-preview">
                <FontAwesomeIcon icon={faWandMagicSparkles} />
                <h3>{t("account.aiEmptyTitle")}</h3>
                <p>{t("account.aiEmptyBody")}</p>
              </div>
            )}
          </section>
        </div>
      </motion.section>
    </motion.div>
  );
}
