import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFloppyDisk,
  faPlus,
  faRotate,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import Card from "../Card";
import { useAppTheme } from "../../hooks/useAppTheme";
import {
  PLAYER_GROUPS,
  type Category,
  type ConversationGame,
  type ConversationGameType,
  type PlayerGroup,
  type Question,
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

interface TopicStudioProps {
  topic?: TopicRecord;
  onCancel: () => void;
  onSave: (input: SaveTopicInput) => Promise<void>;
}

interface StudioCard {
  id: string;
  category: string;
  type: QuestionType;
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
  nextButton: string;
  prevButton: string;
  endTitle: string;
  endSubtitle: string;
  restartButton: string;
  categories: Record<string, Category>;
  cards: StudioCard[];
  version: string;
}

const COLOR_SWATCHES = ["#20201e", "#d96c4f", "#e5ad45", "#7d9b76", "#6f91bb", "#9a78ad"];
const QUESTION_TYPES: QuestionType[] = ["open", "discussion", "wildcard", "end"];

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
    nextButton: chinese ? "下一个" : "Next",
    prevButton: chinese ? "上一个" : "Previous",
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
  startDescription: topic.game.ui.startScreen.description.join("\n"),
  startButton: topic.game.ui.startScreen.startButton,
  nextButton: topic.game.ui.navigation.nextButton,
  prevButton: topic.game.ui.navigation.prevButton,
  endTitle: topic.game.ui.endScreen.title,
  endSubtitle: topic.game.ui.endScreen.subtitle,
  restartButton: topic.game.ui.endScreen.restartButton,
  categories: Object.fromEntries(
    Object.entries(topic.game.theme.categories).map(([key, category]) => [key, { ...category }]),
  ),
  cards: topic.game.questions.flatMap((group) => group.questions.map((question) => ({
    id: createLocalCardId(),
    category: group.category,
    type: question.type ?? "open",
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
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCard = useMemo(
    () => draft.cards.find((card) => card.id === selectedView) ?? null,
    [draft.cards, selectedView],
  );
  const activeCategoryKey = activeCard?.category ?? Object.keys(draft.categories)[0];
  const activeCategory = draft.categories[activeCategoryKey];
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

  const updateCategory = (update: Partial<Category>) => {
    if (!activeCategoryKey) return;
    setDraft((current) => ({
      ...current,
      categories: {
        ...current.categories,
        [activeCategoryKey]: { ...current.categories[activeCategoryKey], ...update },
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
    const category = activeCategoryKey ?? Object.keys(draft.categories)[0];
    const card: StudioCard = {
      id: createLocalCardId(),
      category,
      type: "open",
      question: "",
    };
    setDraft((current) => ({ ...current, cards: [...current.cards, card] }));
    setSelectedView(card.id);
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
      cards: activeCard
        ? current.cards.map((card) => card.id === activeCard.id ? { ...card, category: key } : card)
        : current.cards,
    }));
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
        navigation: {
          nextButton: draft.nextButton.trim(),
          prevButton: draft.prevButton.trim(),
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
        status: topic?.status ?? "draft",
        visibility: topic?.visibility ?? "private",
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("account.studioSaveError"));
    } finally {
      setIsSaving(false);
    }
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
        <button className="topic-studio-save" type="button" onClick={() => void save()} disabled={isSaving} aria-label={isSaving ? t("account.studioSaving") : t("account.studioSave")}>
          <FontAwesomeIcon icon={faFloppyDisk} />
          <span>{isSaving ? t("account.studioSaving") : t("account.studioSave")}</span>
        </button>
      </header>

      <div className="topic-studio-workspace">
        <aside className="topic-studio-rail" aria-label={t("account.studioCards")}>
          <button
            className={`topic-studio-rail-item topic-studio-cover-thumb${selectedView === "cover" ? " is-active" : ""}`}
            type="button"
            onClick={() => { setSelectedView("cover"); setIsFlipped(false); }}
          >
            <span>{t("account.studioCover")}</span>
            <strong>{draft.title || t("account.studioUntitled")}</strong>
          </button>

          {draft.cards.map((card, index) => {
            const category = draft.categories[card.category];
            return (
              <button
                key={card.id}
                className={`topic-studio-rail-item${selectedView === card.id ? " is-active" : ""}`}
                type="button"
                onClick={() => { setSelectedView(card.id); setIsFlipped(false); }}
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
        </aside>

        <main
          className="topic-studio-stage"
          style={{ backgroundColor: selectedView === "cover" ? "var(--material-canvas)" : surfaceTheme.backgroundColor }}
        >
          {selectedView === "cover" ? (
            <div className="topic-studio-cover-stage">
              <p className="topic-studio-stage-hint">{t("account.studioDirectEditHint")}</p>
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
          ) : activeCard ? (
            <div className="topic-studio-card-stage">
              <div className="topic-studio-card-meta" style={{ color: surfaceTheme.uiColor }}>
                <span>{activeCategory?.name}</span>
                <span>{t(`account.questionType.${activeCard.type}`)}</span>
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

        <aside className="topic-studio-inspector">
          {selectedView === "cover" ? (
            <>
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

              <section className="topic-studio-inspector-section">
                <h3>{t("account.studioOpening")}</h3>
                <label><span>{t("account.studioOpeningTitle")}</span><input value={draft.startTitle} onChange={(event) => setDraft((current) => ({ ...current, startTitle: event.target.value }))} /></label>
                <label><span>{t("account.studioOpeningDescription")}</span><textarea rows={4} value={draft.startDescription} placeholder={t("account.studioSubtitlePlaceholder")} onChange={(event) => setDraft((current) => ({ ...current, startDescription: event.target.value }))} /></label>
                <label><span>{t("account.studioStartButton")}</span><input value={draft.startButton} onChange={(event) => setDraft((current) => ({ ...current, startButton: event.target.value }))} /></label>
              </section>

              <section className="topic-studio-inspector-section">
                <h3>{t("account.studioEnding")}</h3>
                <label><span>{t("account.studioEndingTitle")}</span><input value={draft.endTitle} onChange={(event) => setDraft((current) => ({ ...current, endTitle: event.target.value }))} /></label>
                <label><span>{t("account.studioEndingDescription")}</span><textarea rows={3} value={draft.endSubtitle} onChange={(event) => setDraft((current) => ({ ...current, endSubtitle: event.target.value }))} /></label>
                <label><span>{t("account.studioRestartButton")}</span><input value={draft.restartButton} onChange={(event) => setDraft((current) => ({ ...current, restartButton: event.target.value }))} /></label>
                <div className="topic-studio-inline-fields">
                  <label><span>{t("common.previous")}</span><input value={draft.prevButton} onChange={(event) => setDraft((current) => ({ ...current, prevButton: event.target.value }))} /></label>
                  <label><span>{t("common.next")}</span><input value={draft.nextButton} onChange={(event) => setDraft((current) => ({ ...current, nextButton: event.target.value }))} /></label>
                </div>
              </section>
            </>
          ) : activeCard && activeCategory ? (
            <>
              <section className="topic-studio-inspector-section">
                <h3>{t("account.studioCardType")}</h3>
                <div className="topic-studio-type-grid">
                  {QUESTION_TYPES.map((type) => (
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
              </section>

              <section className="topic-studio-inspector-section">
                <div className="topic-studio-section-heading">
                  <h3>{t("account.studioCategory")}</h3>
                  <button type="button" onClick={addCategory}><FontAwesomeIcon icon={faPlus} /> {t("account.studioAddCategory")}</button>
                </div>
                <label>
                  <span>{t("account.studioCategory")}</span>
                  <select value={activeCard.category} onChange={(event) => updateActiveCard({ category: event.target.value })}>
                    {Object.entries(draft.categories).map(([key, category]) => <option key={key} value={key}>{category.name}</option>)}
                  </select>
                </label>
                <label><span>{t("account.studioCategoryName")}</span><input value={activeCategory.name} onChange={(event) => updateCategory({ name: event.target.value })} /></label>
                <label><span>{t("account.studioCategoryDescription")}</span><textarea rows={3} value={activeCategory.description} onChange={(event) => updateCategory({ description: event.target.value })} /></label>
              </section>

              <section className="topic-studio-inspector-section">
                <h3>{t("account.studioColor")}</h3>
                <div className="topic-studio-colors">
                  {COLOR_SWATCHES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={activeCategory.color.toLowerCase() === color ? "is-selected" : ""}
                      style={{ backgroundColor: color }}
                      onClick={() => updateCategory({ color })}
                      aria-label={color}
                    />
                  ))}
                  <label className="topic-studio-custom-color" title={t("account.studioCustomColor")}>
                    <input type="color" value={activeCategory.color} onChange={(event) => updateCategory({ color: event.target.value })} />
                    <span>+</span>
                  </label>
                </div>
              </section>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
