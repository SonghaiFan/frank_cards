import { lazy, Suspense, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFloppyDisk,
  faPlus,
  faRotate,
  faTrash,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import Card from "../Card";
import CardEnergyIcon from "../CardEnergyIcon";
import { useAppTheme } from "../../hooks/useAppTheme";
import {
  PLAYER_GROUPS,
  type Category,
  type ConversationGame,
  type ConversationGameType,
  type PlayerGroup,
  type Question,
  type QuestionEnergy,
  type QuestionType,
} from "../../types/ConversationGame";
import {
  toGameLanguage,
  toTopicLanguage,
  type SaveTopicInput,
  type TopicLanguage,
  type TopicRecord,
} from "../../types/Topic";
import { resolveGameSurfaceTheme } from "../../utils/gameTheme";
import {
  countTextUnits,
  limitTextUnits,
  START_SCREEN_DESCRIPTION_LIMIT,
} from "../../utils/textLimits";
import type { GeneratedConversationDraft } from "../../ai/openAiCompatible";

const AiCardGeneratorDialog = lazy(() => import("./AiCardGeneratorDialog"));

interface TopicStudioProps {
  topic?: TopicRecord;
  onCancel: () => void;
  onSave: (input: SaveTopicInput) => Promise<void>;
}

interface StudioCard {
  id: string;
  category: string;
  type: QuestionType;
  energy: QuestionEnergy;
  question: string;
  more?: Question["more"];
}

interface StudioDraft {
  testID: string;
  title: string;
  subtitle: string;
  language: TopicLanguage;
  appType: ConversationGameType;
  playerGroups: PlayerGroup[];
  startTitle: string;
  startDescription: string;
  startButton: string;
  endTitle: string;
  endSubtitle: string;
  restartButton: string;
  categories: Record<string, Category>;
  cards: StudioCard[];
  version: string;
}

const COLOR_SWATCHES = ["#20201e", "#d96c4f", "#e5ad45", "#7d9b76", "#6f91bb", "#9a78ad"];
const EDITABLE_QUESTION_TYPES: Exclude<QuestionType, "discussion">[] = ["open", "wildcard", "end"];
const CARD_ENERGIES: QuestionEnergy[] = ["bouba", "kiki"];

let localCardSequence = 0;
const createLocalCardId = (): string => `studio-card-${Date.now()}-${localCardSequence++}`;

const moreToText = (more: Question["more"]): string => {
  if (!more) return "";
  if (Array.isArray(more)) return more.join("\n");
  return Object.entries(more).map(([label, value]) => `${label}: ${value}`).join("\n");
};

const textToMore = (value: string): string[] | undefined => {
  const lines = value.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.length > 0 ? lines : undefined;
};

const uniqueCategoryKey = (categories: Record<string, Category>): string => {
  let index = Object.keys(categories).length + 1;
  while (`category-${index}` in categories) index += 1;
  return `category-${index}`;
};

const createEmptyDraft = (language: TopicLanguage, t: (key: string) => string): StudioDraft => {
  const chinese = language === "zh";
  return {
    testID: `draft-${Date.now()}`,
    title: t("account.studioUntitled"),
    subtitle: "",
    language,
    appType: "normal",
    playerGroups: ["friends"],
    startTitle: t("account.studioUntitled"),
    startDescription: "",
    startButton: chinese ? "开始" : "Begin",
    endTitle: chinese ? "聊得很好" : "A good conversation",
    endSubtitle: chinese ? "愿这段对话继续留在你们之间。" : "Keep the conversation with you.",
    restartButton: chinese ? "再聊一次" : "Talk again",
    categories: {
      conversation: {
        name: chinese ? "对话" : "Conversation",
        color: "#20201e",
        description: t("account.studioCategoryDescriptionPlaceholder"),
      },
    },
    cards: [{
      id: createLocalCardId(),
      category: "conversation",
      type: "open",
      energy: "bouba",
      question: "",
    }],
    version: "1",
  };
};

const draftFromTopic = (topic: TopicRecord): StudioDraft => ({
  testID: topic.game.testID,
  title: topic.game.app.title,
  subtitle: topic.game.app.subtitle,
  language: topic.language,
  appType: topic.game.app.type,
  playerGroups: [...topic.game.app.playerGroup],
  startTitle: topic.game.ui.startScreen.title,
  startDescription: limitTextUnits(
    topic.game.ui.startScreen.description.join("\n"),
    START_SCREEN_DESCRIPTION_LIMIT,
  ),
  startButton: topic.game.ui.startScreen.startButton,
  endTitle: topic.game.ui.endScreen.title,
  endSubtitle: topic.game.ui.endScreen.subtitle,
  restartButton: topic.game.ui.endScreen.restartButton,
  categories: Object.fromEntries(
    Object.entries(topic.game.theme.categories).map(([key, category]) => [key, { ...category }]),
  ),
  cards: topic.game.questions.flatMap((group) => group.questions.map((question) => ({
    id: createLocalCardId(),
    category: group.category,
    type: question.type === "discussion" ? "open" : (question.type ?? "open"),
    energy: question.energy ?? "bouba",
    question: question.question,
    ...(question.more ? { more: Array.isArray(question.more) ? [...question.more] : { ...question.more } } : {}),
  }))),
  version: topic.game.app.version ?? String(topic.version),
});

export default function TopicStudio({ topic, onCancel, onSave }: TopicStudioProps) {
  const { i18n, t } = useTranslation();
  const isDarkTheme = useAppTheme() === "dark";
  const [draft, setDraft] = useState<StudioDraft>(() => (
    topic ? draftFromTopic(topic) : createEmptyDraft(toTopicLanguage(i18n.language), t)
  ));
  const [selectedView, setSelectedView] = useState<"cover" | string>("cover");
  const [editingCategoryKey, setEditingCategoryKey] = useState(
    () => Object.keys(draft.categories)[0] ?? "",
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCard = useMemo(
    () => draft.cards.find((card) => card.id === selectedView) ?? null,
    [draft.cards, selectedView],
  );
  const activeCategoryKey = activeCard?.category ?? Object.keys(draft.categories)[0];
  const activeCategory = draft.categories[activeCategoryKey];
  const editingCategory = draft.categories[editingCategoryKey];
  const startDescriptionCount = countTextUnits(draft.startDescription);
  const surfaceTheme = resolveGameSurfaceTheme({
    categoryColor: activeCategory?.color ?? "#20201e",
    isDarkTheme,
    isWildcard: activeCard?.type === "wildcard",
  });

  const updateActiveCard = (update: Partial<Omit<StudioCard, "id">>) => {
    if (!activeCard) return;
    setDraft((current) => ({
      ...current,
      cards: current.cards.map((card) => card.id === activeCard.id ? { ...card, ...update } : card),
    }));
    setError(null);
  };

  const updateEditingCategory = (update: Partial<Category>) => {
    if (!editingCategoryKey || !draft.categories[editingCategoryKey]) return;
    setDraft((current) => ({
      ...current,
      categories: {
        ...current.categories,
        [editingCategoryKey]: { ...current.categories[editingCategoryKey], ...update },
      },
    }));
  };

  const updateTitle = (title: string) => {
    setDraft((current) => ({
      ...current,
      title,
      startTitle: current.startTitle === current.title ? title : current.startTitle,
    }));
    setError(null);
  };

  const addCard = () => {
    const category = editingCategoryKey || activeCategoryKey || Object.keys(draft.categories)[0];
    const card: StudioCard = {
      id: createLocalCardId(),
      category,
      type: "open",
      energy: "bouba",
      question: "",
    };
    setDraft((current) => ({ ...current, cards: [...current.cards, card] }));
    setSelectedView(card.id);
    setEditingCategoryKey(category);
    setIsFlipped(false);
    setError(null);
  };

  const deleteActiveCard = () => {
    if (!activeCard || draft.cards.length <= 1) return;
    const activeIndex = draft.cards.findIndex((card) => card.id === activeCard.id);
    const nextCard = draft.cards[activeIndex + 1] ?? draft.cards[activeIndex - 1];
    setDraft((current) => ({
      ...current,
      cards: current.cards.filter((card) => card.id !== activeCard.id),
    }));
    setSelectedView(nextCard.id);
    setEditingCategoryKey(nextCard.category);
    setIsFlipped(false);
  };

  const addCategory = () => {
    const key = uniqueCategoryKey(draft.categories);
    setDraft((current) => ({
      ...current,
      categories: {
        ...current.categories,
        [key]: {
          name: t("account.studioNewCategory"),
          color: COLOR_SWATCHES[Object.keys(current.categories).length % COLOR_SWATCHES.length],
          description: "",
        },
      },
    }));
    setEditingCategoryKey(key);
  };

  const togglePlayerGroup = (group: PlayerGroup) => {
    setDraft((current) => {
      const selected = current.playerGroups.includes(group);
      if (selected && current.playerGroups.length === 1) return current;
      return {
        ...current,
        playerGroups: selected
          ? current.playerGroups.filter((item) => item !== group)
          : [...current.playerGroups, group],
      };
    });
  };

  const buildGame = (): ConversationGame => {
    const questions = Object.keys(draft.categories).flatMap((category) => {
      const categoryCards = draft.cards.filter((card) => card.category === category);
      if (categoryCards.length === 0) return [];
      return [{
        category,
        questions: categoryCards.map((card): Question => ({
          type: card.type,
          energy: card.energy,
          question: card.question.trim(),
          ...(card.more ? { more: card.more } : {}),
        })),
      }];
    });

    return {
      testID: draft.testID,
      app: {
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        language: toGameLanguage(draft.language),
        type: draft.appType,
        playerGroup: draft.playerGroups,
        version: draft.version,
      },
      ui: {
        startScreen: {
          title: draft.startTitle.trim() || draft.title.trim(),
          description: draft.startDescription.split("\n").map((line) => line.trim()).filter(Boolean),
          startButton: draft.startButton.trim(),
        },
        endScreen: {
          title: draft.endTitle.trim(),
          subtitle: draft.endSubtitle.trim(),
          restartButton: draft.restartButton.trim(),
        },
      },
      theme: { categories: draft.categories },
      questions,
    };
  };

  const save = async () => {
    if (!draft.title.trim()) {
      setError(t("account.studioTitleRequired"));
      setSelectedView("cover");
      return;
    }
    const blankCard = draft.cards.find((card) => !card.question.trim());
    if (blankCard) {
      setError(t("account.studioQuestionRequired"));
      setSelectedView(blankCard.id);
      setIsFlipped(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        game: buildGame(),
        language: draft.language,
        status: "draft",
        visibility: "private",
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("account.studioSaveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const applyGeneratedDraft = (generated: GeneratedConversationDraft) => {
    const nextCards: StudioCard[] = generated.cards.map((card) => ({
      id: createLocalCardId(),
      category: card.category,
      type: card.type,
      energy: card.energy,
      question: card.question,
      ...(card.more ? { more: card.more } : {}),
    }));
    const nextCategories = Object.fromEntries(generated.categories.map((category) => [
      category.key,
      {
        name: category.name,
        description: category.description,
        color: category.color,
      },
    ]));

    setDraft((current) => ({
      ...current,
      title: generated.title,
      subtitle: generated.subtitle,
      startTitle: generated.startTitle,
      startDescription: limitTextUnits(generated.startDescription, START_SCREEN_DESCRIPTION_LIMIT),
      startButton: generated.startButton,
      endTitle: generated.endTitle,
      endSubtitle: generated.endSubtitle,
      restartButton: generated.restartButton,
      categories: nextCategories,
      cards: nextCards,
    }));
    setSelectedView(nextCards[0]?.id ?? "cover");
    setEditingCategoryKey(generated.categories[0]?.key ?? "");
    setIsFlipped(false);
    setError(null);
    setIsAiDialogOpen(false);
  };

  return (
    <div className="topic-studio">
      <header className="topic-studio-header">
        <button className="topic-studio-icon-button" type="button" onClick={onCancel} aria-label={t("common.back")}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div className="topic-studio-heading">
          <p>{topic ? t("account.studioEditing") : t("account.studioCreating")}</p>
          <h2>{draft.title || t("account.studioUntitled")}</h2>
        </div>
        {error ? <p className="topic-studio-error" role="alert">{error}</p> : null}
        <div className="topic-studio-header-actions">
          <button className="topic-studio-ai-button" type="button" onClick={() => setIsAiDialogOpen(true)}>
            <FontAwesomeIcon icon={faWandMagicSparkles} />
            <span>{t("account.aiOpen")}</span>
          </button>
          <button className="topic-studio-save" type="button" onClick={() => void save()} disabled={isSaving} aria-label={isSaving ? t("account.studioSaving") : t("account.studioSave")}>
            <FontAwesomeIcon icon={faFloppyDisk} />
            <span>{isSaving ? t("account.studioSaving") : t("account.studioSave")}</span>
          </button>
        </div>
      </header>

      <div className="topic-studio-workspace">
        <aside className="topic-studio-rail topic-studio-property-panel topic-studio-pack-panel" aria-label={t("account.studioPackDetails")}>
          <section className="topic-studio-inspector-section">
            <h3>{t("account.studioPackDetails")}</h3>
            <label>
              <span>{t("account.languageLabel")}</span>
              <select
                value={draft.language}
                onChange={(event) => setDraft((current) => ({ ...current, language: event.target.value as TopicLanguage }))}
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </label>
            <label>
              <span>{t("account.studioPackType")}</span>
              <select
                value={draft.appType}
                onChange={(event) => setDraft((current) => ({ ...current, appType: event.target.value as ConversationGameType }))}
              >
                <option value="normal">{t("gameLibrary.type.normal")}</option>
                <option value="edition">{t("gameLibrary.type.edition")}</option>
                <option value="premium">{t("gameLibrary.type.premium")}</option>
              </select>
            </label>
          </section>

          <section className="topic-studio-inspector-section">
            <h3>{t("account.studioPackScreens")}</h3>
            <div className="topic-studio-screen-list">
              {(["cover", "opening", "ending"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  className={selectedView === view ? "is-selected" : ""}
                  onClick={() => { setSelectedView(view); setIsFlipped(false); }}
                >
                  {t(`account.studioScreen.${view}`)}
                </button>
              ))}
            </div>
            <p className="topic-studio-panel-hint">{t("account.studioScreenEditHint")}</p>
          </section>

          <section className="topic-studio-inspector-section">
            <h3>{t("account.audienceLabel")}</h3>
            <div className="topic-studio-chip-grid">
              {PLAYER_GROUPS.map((group) => (
                <button
                  key={group}
                  type="button"
                  className={draft.playerGroups.includes(group) ? "is-selected" : ""}
                  onClick={() => togglePlayerGroup(group)}
                >
                  {t(`account.audience.${group}`)}
                </button>
              ))}
            </div>
          </section>

          <section className="topic-studio-category-manager" aria-labelledby="studio-category-heading">
            <div className="topic-studio-rail-section-heading">
              <h3 id="studio-category-heading">{t("account.studioCategories")}</h3>
              <button type="button" onClick={addCategory}>
                <FontAwesomeIcon icon={faPlus} />
                <span>{t("account.studioNewCategoryAction")}</span>
              </button>
            </div>
            <div className="topic-studio-category-list">
              {Object.entries(draft.categories).map(([key, category]) => {
                const cardCount = draft.cards.filter((card) => card.category === key).length;
                return (
                  <button
                    key={key}
                    type="button"
                    className={editingCategoryKey === key ? "is-selected" : ""}
                    onClick={() => setEditingCategoryKey(key)}
                    aria-pressed={editingCategoryKey === key}
                  >
                    <span className="topic-studio-category-swatch" style={{ backgroundColor: category.color }} />
                    <strong>{category.name || t("account.studioNewCategory")}</strong>
                    <small>{t("account.studioCategoryCardCount", { count: cardCount })}</small>
                  </button>
                );
              })}
            </div>

            {editingCategory ? (
              <div className="topic-studio-category-editor">
                <label>
                  <span>{t("account.studioCategoryName")}</span>
                  <input value={editingCategory.name} onChange={(event) => updateEditingCategory({ name: event.target.value })} />
                </label>
                <label>
                  <span>{t("account.studioCategoryDescription")}</span>
                  <textarea rows={2} value={editingCategory.description} onChange={(event) => updateEditingCategory({ description: event.target.value })} />
                </label>
                <div>
                  <span className="topic-studio-category-editor-label">{t("account.studioCategoryColor")}</span>
                  <div className="topic-studio-colors">
                    {COLOR_SWATCHES.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={editingCategory.color.toLowerCase() === color ? "is-selected" : ""}
                        style={{ backgroundColor: color }}
                        onClick={() => updateEditingCategory({ color })}
                        aria-label={color}
                      />
                    ))}
                    <label className="topic-studio-custom-color" title={t("account.studioCustomColor")}>
                      <input type="color" value={editingCategory.color} onChange={(event) => updateEditingCategory({ color: event.target.value })} />
                      <span>+</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

        </aside>

        <main
          className="topic-studio-stage"
          style={{
            backgroundColor: ["cover", "opening", "ending"].includes(selectedView)
              ? "var(--material-canvas)"
              : surfaceTheme.backgroundColor,
          }}
        >
          {selectedView === "cover" ? (
            <div className="topic-studio-cover-stage">
              <p className="topic-studio-stage-hint">{t("account.studioScreenDirectEditHint")}</p>
              <Card
                size="large"
                variant="game"
                className="topic-studio-cover-card"
                style={{ backgroundColor: "var(--paper-card)" }}
              >
                <textarea
                  className="topic-studio-cover-title"
                  value={draft.title}
                  onChange={(event) => updateTitle(event.target.value)}
                  aria-label={t("account.topicTitleLabel")}
                  rows={2}
                />
                <textarea
                  className="topic-studio-cover-subtitle"
                  value={draft.subtitle}
                  onChange={(event) => setDraft((current) => ({ ...current, subtitle: event.target.value }))}
                  aria-label={t("account.topicSubtitleLabel")}
                  placeholder={t("account.studioSubtitlePlaceholder")}
                  rows={3}
                />
                <div className="topic-studio-category-dots" aria-hidden="true">
                  {Object.entries(draft.categories).map(([key, category]) => (
                    <span key={key} style={{ backgroundColor: category.color }} />
                  ))}
                </div>
                <p className="topic-studio-card-count">{t("account.studioCardCount", { count: draft.cards.length })}</p>
              </Card>
            </div>
          ) : selectedView === "opening" ? (
            <div className="topic-studio-screen-stage">
              <p className="topic-studio-stage-hint">{t("account.studioScreenDirectEditHint")}</p>
              <section className="topic-studio-screen-preview topic-studio-opening-preview" aria-label={t("account.studioOpening")}>
                <div className="topic-studio-screen-copy">
                  <textarea
                    className="topic-studio-screen-title theme-text-primary"
                    value={draft.startTitle}
                    onChange={(event) => setDraft((current) => ({ ...current, startTitle: event.target.value }))}
                    aria-label={t("account.studioOpeningTitle")}
                    rows={2}
                  />
                  <div className="topic-studio-screen-description-field">
                    <textarea
                      className="topic-studio-screen-description theme-text-secondary"
                      value={draft.startDescription}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        startDescription: limitTextUnits(
                          event.target.value,
                          START_SCREEN_DESCRIPTION_LIMIT,
                        ),
                      }))}
                      aria-label={t("account.studioOpeningDescription")}
                      placeholder={t("account.studioSubtitlePlaceholder")}
                      rows={5}
                    />
                    <small>
                      {t("account.studioDescriptionCount", {
                        count: startDescriptionCount,
                        limit: START_SCREEN_DESCRIPTION_LIMIT,
                      })}
                    </small>
                  </div>
                  <input
                    className="topic-studio-screen-button topic-studio-screen-button-primary"
                    value={draft.startButton}
                    onChange={(event) => setDraft((current) => ({ ...current, startButton: event.target.value }))}
                    aria-label={t("account.studioStartButton")}
                  />
                </div>
              </section>
            </div>
          ) : selectedView === "ending" ? (
            <div className="topic-studio-screen-stage">
              <p className="topic-studio-stage-hint">{t("account.studioScreenDirectEditHint")}</p>
              <section className="topic-studio-screen-preview topic-studio-ending-preview" aria-label={t("account.studioEnding")}>
                <div className="topic-studio-screen-copy">
                  <textarea
                    className="topic-studio-screen-title theme-text-primary"
                    value={draft.endTitle}
                    onChange={(event) => setDraft((current) => ({ ...current, endTitle: event.target.value }))}
                    aria-label={t("account.studioEndingTitle")}
                    rows={2}
                  />
                  <textarea
                    className="topic-studio-screen-description theme-text-secondary"
                    value={draft.endSubtitle}
                    onChange={(event) => setDraft((current) => ({ ...current, endSubtitle: event.target.value }))}
                    aria-label={t("account.studioEndingDescription")}
                    rows={3}
                  />
                  <div className="topic-studio-screen-actions">
                    <input
                      className="topic-studio-screen-button topic-studio-screen-button-primary"
                      value={draft.restartButton}
                      onChange={(event) => setDraft((current) => ({ ...current, restartButton: event.target.value }))}
                      aria-label={t("account.studioRestartButton")}
                    />
                    <span className="topic-studio-screen-button topic-studio-screen-button-secondary">
                      {t("common.exit")}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          ) : activeCard ? (
            <div className="topic-studio-card-stage">
              <div className="topic-studio-card-meta" style={{ color: surfaceTheme.uiColor }}>
                <span>{activeCategory?.name}</span>
                <span>{t(`account.questionType.${activeCard.type}`)}</span>
                <span>{t(`cardEnergy.${activeCard.energy}.label`)}</span>
              </div>

              <div className="topic-studio-card-perspective">
                <motion.div
                  className="topic-studio-flip-card"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Card
                    size="large"
                    variant="question"
                    className="topic-studio-edit-card topic-studio-card-front"
                    style={{ backgroundColor: surfaceTheme.cardColor }}
                    aria-hidden={isFlipped}
                  >
                    <CardEnergyIcon
                      className="topic-studio-card-energy-icon"
                      energy={activeCard.energy}
                      style={{ color: surfaceTheme.cardTextColor }}
                    />
                    <textarea
                      value={activeCard.question}
                      onChange={(event) => updateActiveCard({ question: event.target.value })}
                      placeholder={t("account.studioFrontPlaceholder")}
                      aria-label={t("account.studioFront")}
                      style={{ color: surfaceTheme.cardTextColor }}
                      autoFocus={!activeCard.question}
                      tabIndex={isFlipped ? -1 : 0}
                    />
                  </Card>

                  <Card
                    size="large"
                    variant="question"
                    className="topic-studio-edit-card topic-studio-card-back"
                    style={{ backgroundColor: surfaceTheme.cardColor }}
                    aria-hidden={!isFlipped}
                  >
                    <CardEnergyIcon
                      className="topic-studio-card-energy-icon"
                      energy={activeCard.energy}
                      style={{ color: surfaceTheme.cardTextColor }}
                    />
                    <textarea
                      value={moreToText(activeCard.more)}
                      onChange={(event) => updateActiveCard({ more: textToMore(event.target.value) })}
                      placeholder={t("account.studioBackPlaceholder")}
                      aria-label={t("account.studioBack")}
                      style={{ color: surfaceTheme.cardTextColor }}
                      tabIndex={isFlipped ? 0 : -1}
                    />
                    <small style={{ color: surfaceTheme.cardTextColor }}>{t("account.studioBackHint")}</small>
                  </Card>
                </motion.div>
              </div>

              <div className="topic-studio-card-actions">
                <button type="button" onClick={() => setIsFlipped((current) => !current)}>
                  <FontAwesomeIcon icon={faRotate} />
                  <span>{isFlipped ? t("account.studioShowFront") : t("account.studioShowBack")}</span>
                </button>
                <button type="button" onClick={deleteActiveCard} disabled={draft.cards.length <= 1}>
                  <FontAwesomeIcon icon={faTrash} />
                  <span>{t("account.studioDeleteCard")}</span>
                </button>
              </div>
            </div>
          ) : null}
        </main>

        <aside className="topic-studio-inspector topic-studio-property-panel topic-studio-card-panel" aria-label={t("account.studioCards")}>
          <div className="topic-studio-card-list">
            <h3 className="topic-studio-rail-heading">{t("account.studioCards")}</h3>
            {draft.cards.map((card, index) => {
              const category = draft.categories[card.category];
              return (
                <button
                  key={card.id}
                  className={`topic-studio-rail-item${selectedView === card.id ? " is-active" : ""}`}
                  type="button"
                  onClick={() => {
                    setSelectedView(card.id);
                    setEditingCategoryKey(card.category);
                    setIsFlipped(false);
                  }}
                  style={{ "--studio-card-accent": category?.color ?? "#20201e" } as React.CSSProperties}
                >
                  <span>{t("account.studioCardNumber", { number: index + 1 })}</span>
                  <strong>{card.question || t("account.studioEmptyCard")}</strong>
                </button>
              );
            })}

            <button className="topic-studio-add-card" type="button" onClick={addCard}>
              <FontAwesomeIcon icon={faPlus} />
              <span>{t("account.studioAddCard")}</span>
            </button>
          </div>

          {activeCard && activeCategory ? (
            <>
              <section className="topic-studio-inspector-section">
                <h3>{t("account.studioCardType")}</h3>
                <div className="topic-studio-type-grid">
                  {EDITABLE_QUESTION_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={activeCard.type === type ? "is-selected" : ""}
                      onClick={() => updateActiveCard({ type })}
                    >
                      {t(`account.questionType.${type}`)}
                    </button>
                  ))}
                </div>
                <p className="topic-studio-type-description">
                  {t(`account.questionTypeDescription.${activeCard.type}`)}
                </p>
              </section>

              <section className="topic-studio-inspector-section">
                <h3>{t("account.studioCardEnergy")}</h3>
                <div className="topic-studio-type-grid">
                  {CARD_ENERGIES.map((energy) => (
                    <button
                      key={energy}
                      type="button"
                      className={activeCard.energy === energy ? "is-selected" : ""}
                      onClick={() => updateActiveCard({ energy })}
                    >
                      <CardEnergyIcon decorative energy={energy} />
                      <span>{t(`cardEnergy.${energy}.label`)}</span>
                    </button>
                  ))}
                </div>
                <p className="topic-studio-type-description">
                  {t(`cardEnergy.${activeCard.energy}.description`)}
                </p>
              </section>

              <section className="topic-studio-inspector-section">
                <h3>{t("account.studioCardCategory")}</h3>
                <label>
                  <span>{t("account.studioCardCategoryHint")}</span>
                  <select
                    value={activeCard.category}
                    onChange={(event) => {
                      updateActiveCard({ category: event.target.value });
                      setEditingCategoryKey(event.target.value);
                    }}
                  >
                    {Object.entries(draft.categories).map(([key, category]) => <option key={key} value={key}>{category.name}</option>)}
                  </select>
                </label>
              </section>
            </>
          ) : (
            <section className="topic-studio-inspector-section topic-studio-cover-inspector-hint">
              <h3>{t("account.studioCardSettings")}</h3>
              <p className="topic-studio-type-description">{t("account.studioSelectCardHint")}</p>
            </section>
          )}
        </aside>
      </div>

      <AnimatePresence>
        {isAiDialogOpen ? (
          <Suspense fallback={null}>
            <AiCardGeneratorDialog
              initialCardCount={draft.cards.length}
              initialTopic={draft.subtitle || (topic ? draft.title : "")}
              language={draft.language}
              playerGroups={draft.playerGroups}
              onApply={applyGeneratedDraft}
              onClose={() => setIsAiDialogOpen(false)}
            />
          </Suspense>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
