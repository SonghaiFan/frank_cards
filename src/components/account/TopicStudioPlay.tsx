import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faBookOpen,
  faDoorOpen,
  faFloppyDisk,
  faFlagCheckered,
  faLayerGroup,
  faPlus,
  faRectangleList,
  faRotate,
  faSliders,
  faTrash,
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import CardEnergyIcon from "../CardEnergyIcon";
import CardPack from "../CardPack";
import QuestionCard from "../QuestionCard";
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
import { countTextUnits, limitTextUnits, START_SCREEN_DESCRIPTION_LIMIT } from "../../utils/textLimits";
import type { GeneratedConversationDraft } from "../../ai/openAiCompatible";

const AiCardGeneratorDialog = lazy(() => import("./AiCardGeneratorDialog"));

interface TopicStudioPlayProps {
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
  endCard: StudioCard;
  version: string;
}

type StudioView = "cover" | "opening" | "ending" | string;

const COLOR_SWATCHES = ["#20201e", "#d96c4f", "#e5ad45", "#7d9b76", "#6f91bb", "#9a78ad"];
const EDITABLE_QUESTION_TYPES: Exclude<QuestionType, "discussion" | "end">[] = ["open", "wildcard"];
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

const createBlankCard = (category: string): StudioCard => ({
  id: createLocalCardId(),
  category,
  type: "open",
  energy: "bouba",
  question: "",
});

const createEndCard = (category: string): StudioCard => ({
  id: createLocalCardId(),
  category,
  type: "end",
  energy: "bouba",
  question: "",
});

const withTrailingBlankCard = (cards: StudioCard[], fallbackCategory: string): StudioCard[] => {
  const lastCard = cards[cards.length - 1];
  return lastCard && !lastCard.question.trim()
    ? cards
    : [...cards, createBlankCard(lastCard?.category ?? fallbackCategory)];
};

const createEmptyDraft = (language: TopicLanguage, t: (key: string) => string): StudioDraft => {
  const chinese = language === "zh";
  return {
    testID: `draft-${Date.now()}`,
    title: "",
    subtitle: "",
    language,
    appType: "normal",
    playerGroups: ["friends"],
    startTitle: "",
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
    cards: [createBlankCard("conversation")],
    endCard: createEndCard("conversation"),
    version: "1",
  };
};

const draftFromTopic = (topic: TopicRecord): StudioDraft => {
  const categories = Object.fromEntries(Object.entries(topic.game.theme.categories).map(([key, category]) => [key, { ...category }]));
  const sourceCards = topic.game.questions.flatMap((group) => group.questions.map((question) => ({
    id: createLocalCardId(),
    category: group.category,
    type: question.type === "discussion" ? "open" : (question.type ?? "open"),
    energy: question.energy ?? "bouba",
    question: question.question,
    ...(question.more ? { more: Array.isArray(question.more) ? [...question.more] : { ...question.more } } : {}),
  } satisfies StudioCard)));
  const fallbackCategory = Object.keys(categories)[0] ?? "conversation";
  const sourceEndCard = [...sourceCards].reverse().find((card) => card.type === "end");
  const cards = sourceCards
    .filter((card) => card.id !== sourceEndCard?.id)
    .map((card) => card.type === "end" ? { ...card, type: "open" as const } : card);

  return {
    testID: topic.game.testID,
    title: topic.game.app.title,
    subtitle: topic.game.app.subtitle,
    language: topic.language,
    appType: topic.game.app.type,
    playerGroups: [...topic.game.app.playerGroup],
    startTitle: topic.game.ui.startScreen.title,
    startDescription: limitTextUnits(topic.game.ui.startScreen.description.join("\n"), START_SCREEN_DESCRIPTION_LIMIT),
    startButton: topic.game.ui.startScreen.startButton,
    endTitle: topic.game.ui.endScreen.title,
    endSubtitle: topic.game.ui.endScreen.subtitle,
    restartButton: topic.game.ui.endScreen.restartButton,
    categories,
    cards: withTrailingBlankCard(cards, fallbackCategory),
    endCard: sourceEndCard ? { ...sourceEndCard, type: "end" } : createEndCard(fallbackCategory),
    version: topic.game.app.version ?? String(topic.version),
  };
};

export default function TopicStudioPlay({ topic, onCancel, onSave }: TopicStudioPlayProps) {
  const { i18n, t } = useTranslation();
  const isDarkTheme = useAppTheme() === "dark";
  const initialDraft = useMemo(() => topic ? draftFromTopic(topic) : createEmptyDraft(toTopicLanguage(i18n.language), t), []);
  const [draft, setDraft] = useState<StudioDraft>(initialDraft);
  const [selectedView, setSelectedView] = useState<StudioView>(() => initialDraft.cards[0]?.id ?? "cover");
  const [editingCategoryKey, setEditingCategoryKey] = useState(() => Object.keys(initialDraft.categories)[0] ?? "");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isCoverHovered, setIsCoverHovered] = useState(false);
  const [inlineMenu, setInlineMenu] = useState<"category" | "card" | null>(null);
  const [direction, setDirection] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const cardInputRef = useRef<HTMLTextAreaElement>(null);

  const activeCard = useMemo(() => (
    selectedView === draft.endCard.id
      ? draft.endCard
      : draft.cards.find((card) => card.id === selectedView) ?? null
  ), [draft.cards, draft.endCard, selectedView]);
  const isEndCard = activeCard?.id === draft.endCard.id;
  const activeCardIndex = activeCard ? draft.cards.findIndex((card) => card.id === activeCard.id) : -1;
  const activeCategoryKey = activeCard?.category ?? Object.keys(draft.categories)[0];
  const activeCategory = draft.categories[activeCategoryKey];
  const regularCardCount = draft.cards.filter((card) => card.question.trim()).length;
  const realCardCount = regularCardCount + (draft.endCard.question.trim() ? 1 : 0);
  const positionCards = draft.cards.filter((card) => card.question.trim() || card.id === activeCard?.id);
  const currentCardPosition = activeCard
    ? isEndCard
      ? positionCards.length + 1
      : positionCards.findIndex((card) => card.id === activeCard.id) + 1
    : 0;
  const positionedCardCount = activeCard
    ? positionCards.length + (draft.endCard.question.trim() || isEndCard ? 1 : 0)
    : 0;
  const blankCardIndex = draft.cards.findIndex((card, index) => (
    !card.question.trim() && (index < draft.cards.length - 1 || regularCardCount === 0)
  ));
  const titleIsComplete = Boolean(draft.title.trim());
  const draftIsReady = titleIsComplete && blankCardIndex === -1;
  const viewSequence = useMemo<StudioView[]>(() => (
    ["cover", "opening", ...draft.cards.map((card) => card.id), draft.endCard.id, "ending"]
  ), [draft.cards, draft.endCard.id]);
  const currentViewIndex = Math.max(0, viewSequence.indexOf(selectedView));
  const surfaceTheme = resolveGameSurfaceTheme({
    categoryColor: activeCategory?.color ?? "#20201e",
    isDarkTheme,
    isWildcard: activeCard?.type === "wildcard",
  });

  const updateActiveCard = (update: Partial<Omit<StudioCard, "id">>) => {
    if (!activeCard) return;
    setDraft((current) => {
      if (activeCard.id === current.endCard.id) {
        return {
          ...current,
          endCard: { ...current.endCard, ...update, type: "end" },
        };
      }
      const activeIndex = current.cards.findIndex((card) => card.id === activeCard.id);
      const wasTrailingBlank = activeIndex === current.cards.length - 1 && !current.cards[activeIndex]?.question.trim();
      const cards = current.cards.map((card) => card.id === activeCard.id ? { ...card, ...update } : card);
      const updatedCard = cards[activeIndex];
      return {
        ...current,
        cards: wasTrailingBlank && updatedCard?.question.trim()
          ? [...cards, createBlankCard(updatedCard.category)]
          : cards,
      };
    });
    setError(null);
  };

  const updateEditingCategory = (update: Partial<Category>) => {
    if (!editingCategoryKey || !draft.categories[editingCategoryKey]) return;
    setDraft((current) => ({
      ...current,
      categories: { ...current.categories, [editingCategoryKey]: { ...current.categories[editingCategoryKey], ...update } },
    }));
  };

  const updateTitle = (title: string) => {
    setDraft((current) => ({ ...current, title, startTitle: current.startTitle === current.title ? title : current.startTitle }));
    setError(null);
  };

  const selectView = (view: StudioView) => {
    const nextIndex = viewSequence.indexOf(view);
    setDirection(nextIndex >= currentViewIndex ? 1 : -1);
    setSelectedView(view);
    setIsFlipped(false);
    setInlineMenu(null);
    const nextCard = view === draft.endCard.id
      ? draft.endCard
      : draft.cards.find((card) => card.id === view);
    if (nextCard) setEditingCategoryKey(nextCard.category);
  };

  const showPrevious = () => currentViewIndex > 0 && selectView(viewSequence[currentViewIndex - 1]);
  const showNext = () => currentViewIndex < viewSequence.length - 1 && selectView(viewSequence[currentViewIndex + 1]);

  const showNewCard = () => {
    const blankCard = draft.cards[draft.cards.length - 1];
    if (!blankCard || blankCard.question.trim() || blankCard.id === activeCard?.id) return;
    selectView(blankCard.id);
    requestAnimationFrame(() => cardInputRef.current?.focus());
  };

  const deleteActiveCard = () => {
    if (!activeCard || isEndCard || !activeCard.question.trim()) return;
    const nextCard = draft.cards[activeCardIndex + 1] ?? draft.cards[activeCardIndex - 1];
    setDraft((current) => ({ ...current, cards: current.cards.filter((card) => card.id !== activeCard.id) }));
    setSelectedView(nextCard.id);
    setEditingCategoryKey(nextCard.category);
    setIsFlipped(false);
  };

  const addCategoryForActiveCard = () => {
    if (!activeCard) return;
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
      cards: current.cards.map((card) => card.id === activeCard.id ? { ...card, category: key } : card),
      endCard: current.endCard.id === activeCard.id ? { ...current.endCard, category: key } : current.endCard,
    }));
    setEditingCategoryKey(key);
    setInlineMenu("category");
    setError(null);
  };

  const togglePlayerGroup = (group: PlayerGroup) => {
    setDraft((current) => {
      const selected = current.playerGroups.includes(group);
      if (selected && current.playerGroups.length === 1) return current;
      return {
        ...current,
        playerGroups: selected ? current.playerGroups.filter((item) => item !== group) : [...current.playerGroups, group],
      };
    });
  };

  const buildGame = (): ConversationGame => {
    const hasEndCard = Boolean(draft.endCard.question.trim());
    const categoryOrder = Object.keys(draft.categories).filter((category) => (
      !hasEndCard || category !== draft.endCard.category
    ));
    if (hasEndCard) categoryOrder.push(draft.endCard.category);

    return {
      testID: draft.testID,
      app: {
        title: draft.title.trim(), subtitle: draft.subtitle.trim(), language: toGameLanguage(draft.language),
        type: draft.appType, playerGroup: draft.playerGroups, version: draft.version,
      },
      ui: {
        startScreen: {
          title: draft.startTitle.trim() || draft.title.trim(),
          description: draft.startDescription.split("\n").map((line) => line.trim()).filter(Boolean),
          startButton: draft.startButton.trim(),
        },
        endScreen: { title: draft.endTitle.trim(), subtitle: draft.endSubtitle.trim(), restartButton: draft.restartButton.trim() },
      },
      theme: { categories: draft.categories },
      questions: categoryOrder.flatMap((category) => {
        const regularCards = draft.cards.filter((card) => card.category === category && card.question.trim());
        const categoryCards = hasEndCard && draft.endCard.category === category
          ? [...regularCards, draft.endCard]
          : regularCards;
        return categoryCards.length === 0 ? [] : [{
          category,
          questions: categoryCards.map((card): Question => ({
            type: card.id === draft.endCard.id ? "end" : card.type === "end" ? "open" : card.type,
            energy: card.energy,
            question: card.question.trim(),
            ...(card.more ? { more: card.more } : {}),
          })),
        }];
      }),
    };
  };

  const save = async () => {
    setAttemptedSave(true);
    if (!draft.title.trim()) {
      setError(t("account.studioTitleRequired"));
      setIsToolsOpen(false);
      requestAnimationFrame(() => titleInputRef.current?.focus());
      return;
    }
    const blankCard = blankCardIndex >= 0 ? draft.cards[blankCardIndex] : null;
    if (blankCard) {
      setError(t("account.studioQuestionRequired"));
      setSelectedView(blankCard.id);
      setEditingCategoryKey(blankCard.category);
      setIsToolsOpen(false);
      setIsFlipped(false);
      requestAnimationFrame(() => cardInputRef.current?.focus());
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({ game: buildGame(), language: draft.language, status: "draft", visibility: "private" });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("account.studioSaveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const applyGeneratedDraft = (generated: GeneratedConversationDraft) => {
    const generatedCards: StudioCard[] = generated.cards.map((card) => ({
      id: createLocalCardId(), category: card.category, type: card.type, energy: card.energy,
      question: card.question, ...(card.more ? { more: card.more } : {}),
    }));
    const generatedEndCard = [...generatedCards].reverse().find((card) => card.type === "end");
    const nextCards = generatedCards
      .filter((card) => card.id !== generatedEndCard?.id)
      .map((card) => card.type === "end" ? { ...card, type: "open" as const } : card);
    const nextCategories = Object.fromEntries(generated.categories.map((category) => [
      category.key, { name: category.name, description: category.description, color: category.color },
    ]));
    const fallbackCategory = generated.categories[0]?.key ?? "conversation";
    setDraft((current) => ({
      ...current,
      title: generated.title, subtitle: generated.subtitle, startTitle: generated.startTitle,
      startDescription: limitTextUnits(generated.startDescription, START_SCREEN_DESCRIPTION_LIMIT),
      startButton: generated.startButton, endTitle: generated.endTitle, endSubtitle: generated.endSubtitle,
      restartButton: generated.restartButton,
      categories: nextCategories,
      cards: withTrailingBlankCard(nextCards, fallbackCategory),
      endCard: generatedEndCard ? { ...generatedEndCard, type: "end" } : createEndCard(fallbackCategory),
    }));
    setSelectedView(nextCards[0]?.id ?? generatedEndCard?.id ?? "cover");
    setEditingCategoryKey(nextCards[0]?.category ?? generatedEndCard?.category ?? fallbackCategory);
    setIsFlipped(false);
    setError(null);
    setIsAiDialogOpen(false);
    setAttemptedSave(false);
  };

  const goToNextRequiredField = () => {
    if (!titleIsComplete) {
      setIsToolsOpen(false);
      requestAnimationFrame(() => titleInputRef.current?.focus());
      return;
    }
    if (blankCardIndex >= 0) {
      selectView(draft.cards[blankCardIndex].id);
      setIsToolsOpen(false);
      requestAnimationFrame(() => cardInputRef.current?.focus());
    }
  };

  const previewGame = buildGame();
  const studioBackground = activeCard ? surfaceTheme.backgroundColor : "var(--material-canvas)";
  const studioUiColor = activeCard ? surfaceTheme.uiColor : "var(--material-ink)";
  const cardStageView = activeCard && !isEndCard ? activeCard.id : draft.cards[0]?.id ?? "cover";
  const navigationStages = [
    { id: "cover", view: "cover", label: t("account.studioScreen.cover"), icon: faLayerGroup, active: selectedView === "cover" },
    { id: "opening", view: "opening", label: t("account.studioScreen.opening"), icon: faBookOpen, active: selectedView === "opening" },
    { id: "cards", view: cardStageView, label: t("account.studioScreen.cards"), icon: faRectangleList, active: Boolean(activeCard && !isEndCard) },
    { id: "final-card", view: draft.endCard.id, label: t("account.studioScreen.finalCard"), icon: faFlagCheckered, active: isEndCard },
    { id: "ending", view: "ending", label: t("account.studioScreen.ending"), icon: faDoorOpen, active: selectedView === "ending" },
  ];

  return (
    <div className="topic-studio topic-studio-play" style={{ backgroundColor: studioBackground }}>
      <header className="topic-studio-play-header" style={{ color: studioUiColor }}>
        <button type="button" onClick={onCancel} aria-label={t("common.back")}><FontAwesomeIcon icon={faArrowLeft} /></button>
        <div className="topic-studio-play-title-wrap">
          <small>{topic ? t("account.studioEditing") : t("account.studioCreating")}</small>
          <input ref={titleInputRef} value={draft.title} onChange={(event) => updateTitle(event.target.value)} aria-label={t("account.topicTitleLabel")} aria-invalid={attemptedSave && !titleIsComplete} placeholder={t("account.studioUntitled")} />
        </div>
        <div className="topic-studio-play-header-actions">
          <button type="button" onClick={() => setIsAiDialogOpen(true)} aria-label={t("account.aiOpen")}><FontAwesomeIcon icon={faWandMagicSparkles} /></button>
          <button type="button" className={isToolsOpen ? "is-active" : ""} onClick={() => setIsToolsOpen((open) => !open)} aria-controls="topic-studio-tools" aria-expanded={isToolsOpen} aria-label={t("account.studioPackDetails")}><FontAwesomeIcon icon={faSliders} /></button>
          <button className="topic-studio-play-save" type="button" onClick={() => void save()} disabled={isSaving}><FontAwesomeIcon icon={faFloppyDisk} /><span>{isSaving ? t("account.studioSaving") : t("account.studioSave")}</span></button>
        </div>
      </header>

      <main className="topic-studio-play-main">
        <AnimatePresence>
          {error ? (
            <motion.button
              className="topic-studio-play-error"
              type="button"
              onClick={goToNextRequiredField}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              role="alert"
            >
              {error}
            </motion.button>
          ) : null}
        </AnimatePresence>
        <div className="topic-studio-play-stage">
          {selectedView === "cover" ? (
            <CardPack game={previewGame} index={0} isSelected={false} isHovered={isCoverHovered} onToggle={() => undefined} onHoverStart={() => setIsCoverHovered(true)} onHoverEnd={() => setIsCoverHovered(false)} disableEntranceAnimation showSelectionIndicator={false} size="medium" className="topic-studio-play-cover-pack relative">
              <div className="topic-studio-play-cover-fields" onClick={(event) => event.stopPropagation()}>
                <textarea value={draft.title} onChange={(event) => updateTitle(event.target.value)} aria-label={t("account.topicTitleLabel")} aria-invalid={attemptedSave && !titleIsComplete} placeholder={t("account.studioUntitled")} rows={2} />
                <textarea value={draft.subtitle} onChange={(event) => setDraft((current) => ({ ...current, subtitle: event.target.value }))} aria-label={t("account.topicSubtitleLabel")} placeholder={t("account.studioSubtitlePlaceholder")} rows={2} />
                <div className="topic-studio-category-dots" aria-hidden="true">{Object.entries(draft.categories).map(([key, category]) => <span key={key} style={{ backgroundColor: category.color }} />)}</div>
                <p>{t("account.studioCardCount", { count: realCardCount })}</p>
              </div>
            </CardPack>
          ) : selectedView === "opening" ? (
            <section className="topic-studio-play-screen" aria-label={t("account.studioOpening")}>
              <textarea className="topic-studio-screen-title theme-text-primary" value={draft.startTitle} onChange={(event) => setDraft((current) => ({ ...current, startTitle: event.target.value }))} aria-label={t("account.studioOpeningTitle")} placeholder={draft.title || t("account.studioOpeningTitle")} rows={2} />
              <div className="topic-studio-screen-description-field">
                <textarea className="topic-studio-screen-description theme-text-secondary" value={draft.startDescription} onChange={(event) => setDraft((current) => ({ ...current, startDescription: limitTextUnits(event.target.value, START_SCREEN_DESCRIPTION_LIMIT) }))} aria-label={t("account.studioOpeningDescription")} placeholder={t("account.studioSubtitlePlaceholder")} rows={5} />
                <small>{t("account.studioDescriptionCount", { count: countTextUnits(draft.startDescription), limit: START_SCREEN_DESCRIPTION_LIMIT })}</small>
              </div>
              <input className="topic-studio-screen-button topic-studio-screen-button-primary" value={draft.startButton} onChange={(event) => setDraft((current) => ({ ...current, startButton: event.target.value }))} aria-label={t("account.studioStartButton")} />
            </section>
          ) : selectedView === "ending" ? (
            <section className="topic-studio-play-screen" aria-label={t("account.studioEnding")}>
              <textarea className="topic-studio-screen-title theme-text-primary" value={draft.endTitle} onChange={(event) => setDraft((current) => ({ ...current, endTitle: event.target.value }))} aria-label={t("account.studioEndingTitle")} rows={2} />
              <textarea className="topic-studio-screen-description theme-text-secondary" value={draft.endSubtitle} onChange={(event) => setDraft((current) => ({ ...current, endSubtitle: event.target.value }))} aria-label={t("account.studioEndingDescription")} rows={3} />
              <div className="topic-studio-screen-actions">
                <input className="topic-studio-screen-button topic-studio-screen-button-primary" value={draft.restartButton} onChange={(event) => setDraft((current) => ({ ...current, restartButton: event.target.value }))} aria-label={t("account.studioRestartButton")} />
                <span className="topic-studio-screen-button topic-studio-screen-button-secondary">{t("common.exit")}</span>
              </div>
            </section>
          ) : activeCard ? (
            <div className="topic-studio-play-question">
              {activeCategory ? <div className="topic-studio-play-category" style={{ color: studioUiColor }}><span style={{ backgroundColor: studioUiColor }} /><strong>{activeCategory.name}</strong></div> : null}
              <div className="topic-studio-play-card-shell">
                <QuestionCard currentQuestionIndex={currentViewIndex} direction={direction} isCardFlipped={isFlipped} currentQuestion={activeCard} isWildcard={activeCard.type === "wildcard"} cardColor={surfaceTheme.cardColor} textColor={surfaceTheme.cardTextColor} onCardClick={() => setIsFlipped((flipped) => !flipped)}
                  frontContent={<div className="topic-studio-play-card-field" onClick={(event) => event.stopPropagation()}><textarea ref={cardInputRef} value={activeCard.question} onChange={(event) => updateActiveCard({ question: event.target.value })} placeholder={t("account.studioFrontPlaceholder")} aria-label={t("account.studioFront")} aria-invalid={attemptedSave && blankCardIndex === activeCardIndex} style={{ color: surfaceTheme.cardTextColor }} rows={5} /></div>}
                  backContent={<div className="topic-studio-play-card-field topic-studio-play-card-back-field" onClick={(event) => event.stopPropagation()}><textarea value={moreToText(activeCard.more)} onChange={(event) => updateActiveCard({ more: textToMore(event.target.value) })} placeholder={t("account.studioBackPlaceholder")} aria-label={t("account.studioBack")} style={{ color: surfaceTheme.cardTextColor }} rows={7} /><small style={{ color: surfaceTheme.cardTextColor }}>{t("account.studioBackHint")}</small></div>}
                />
              </div>
              <p className="topic-studio-play-category-description" style={{ color: studioUiColor }}>{activeCategory?.description}</p>
              <div className="topic-studio-play-card-actions" style={{ color: studioUiColor }}>
                <button type="button" onClick={() => setIsFlipped((flipped) => !flipped)} aria-label={isFlipped ? t("account.studioShowFront") : t("account.studioShowBack")} title={isFlipped ? t("account.studioShowFront") : t("account.studioShowBack")}><FontAwesomeIcon icon={faRotate} /></button>
                <button type="button" onClick={showNewCard} disabled={activeCard.id === draft.cards[draft.cards.length - 1]?.id} aria-label={t("account.studioAddCard")} title={t("account.studioAddCard")}><FontAwesomeIcon icon={faPlus} /></button>
                <button type="button" className={inlineMenu === "category" ? "is-active" : ""} onClick={() => { setEditingCategoryKey(activeCard.category); setInlineMenu((menu) => menu === "category" ? null : "category"); }} aria-label={t("account.studioCardCategory")} title={t("account.studioCardCategory")}><FontAwesomeIcon icon={faLayerGroup} /></button>
                <button type="button" className={inlineMenu === "card" ? "is-active" : ""} onClick={() => setInlineMenu((menu) => menu === "card" ? null : "card")} aria-label={t("account.studioCardSettings")} title={t("account.studioCardSettings")}><FontAwesomeIcon icon={faSliders} /></button>
                <button type="button" onClick={deleteActiveCard} disabled={isEndCard || !activeCard.question.trim()} aria-label={t("account.studioDeleteCard")} title={t("account.studioDeleteCard")}><FontAwesomeIcon icon={faTrash} /></button>
              </div>
              <AnimatePresence mode="wait">
                {inlineMenu ? (
                  <motion.div
                    key={inlineMenu}
                    className="topic-studio-play-inline-menu"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    {inlineMenu === "category" ? (
                      <div className="topic-studio-play-inline-category">
                        <div className="topic-studio-play-inline-options">
                          {Object.entries(draft.categories).map(([key, category]) => <button key={key} type="button" className={activeCard.category === key ? "is-selected" : ""} onClick={() => { updateActiveCard({ category: key }); setEditingCategoryKey(key); }}><span style={{ backgroundColor: category.color }} />{category.name}</button>)}
                          <button type="button" onClick={addCategoryForActiveCard}><FontAwesomeIcon icon={faPlus} />{t("account.studioNewCategoryAction")}</button>
                        </div>
                        <div className="topic-studio-play-inline-fields">
                          <input value={activeCategory?.name ?? ""} onChange={(event) => updateEditingCategory({ name: event.target.value })} aria-label={t("account.studioCategoryName")} placeholder={t("account.studioNewCategory")} />
                          <input value={activeCategory?.description ?? ""} onChange={(event) => updateEditingCategory({ description: event.target.value })} aria-label={t("account.studioCategoryDescription")} placeholder={t("account.studioCategoryDescriptionPlaceholder")} />
                        </div>
                        <div className="topic-studio-colors">
                          {COLOR_SWATCHES.map((color) => <button key={color} type="button" className={activeCategory?.color.toLowerCase() === color ? "is-selected" : ""} style={{ backgroundColor: color }} onClick={() => updateEditingCategory({ color })} aria-label={color} />)}
                          <label className="topic-studio-custom-color" title={t("account.studioCustomColor")}><input type="color" value={activeCategory?.color ?? "#20201e"} onChange={(event) => updateEditingCategory({ color: event.target.value })} /><span>+</span></label>
                        </div>
                      </div>
                    ) : (
                      <div className="topic-studio-play-inline-settings">
                        {!isEndCard ? <div className="topic-studio-type-grid">{EDITABLE_QUESTION_TYPES.map((type) => <button key={type} type="button" className={activeCard.type === type ? "is-selected" : ""} onClick={() => updateActiveCard({ type })}>{t(`account.questionType.${type}`)}</button>)}</div> : null}
                        <div className="topic-studio-type-grid">{CARD_ENERGIES.map((energy) => <button key={energy} type="button" className={activeCard.energy === energy ? "is-selected" : ""} onClick={() => updateActiveCard({ energy })}><CardEnergyIcon decorative energy={energy} /><span>{t(`cardEnergy.${energy}.label`)}</span></button>)}</div>
                      </div>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}
        </div>

        <footer className="topic-studio-play-navigation" style={{ color: studioUiColor }}>
          <div className="topic-studio-play-navigation-sequence">
            <button className="topic-studio-play-navigation-arrow" type="button" onClick={showPrevious} disabled={currentViewIndex === 0} aria-label={t("common.previous")} title={t("common.previous")}><FontAwesomeIcon icon={faArrowLeft} /></button>
            {activeCard ? (
              <output
                className="topic-studio-play-card-position"
                aria-label={t("account.studioCardPosition", { current: currentCardPosition, total: positionedCardCount })}
              >
                {currentCardPosition} / {positionedCardCount}
              </output>
            ) : null}
            <button className="topic-studio-play-navigation-arrow" type="button" onClick={showNext} disabled={currentViewIndex === viewSequence.length - 1} aria-label={t("common.next")} title={t("common.next")}><FontAwesomeIcon icon={faArrowRight} /></button>
          </div>
          <nav className="topic-studio-play-stages" aria-label={t("account.studioNavigation")}>
            {navigationStages.map((stage) => (
              <button
                key={stage.id}
                type="button"
                className={stage.active ? "is-active" : ""}
                aria-label={stage.label}
                aria-current={stage.active ? "step" : undefined}
                onClick={() => selectView(stage.view)}
                title={stage.label}
              >
                <FontAwesomeIcon icon={stage.icon} />
              </button>
            ))}
          </nav>
        </footer>
      </main>

      <AnimatePresence>
        {isToolsOpen ? <TopicTools
          draft={draft}
          draftIsReady={draftIsReady}
          error={error}
          onClose={() => setIsToolsOpen(false)}
          onGoToRequired={goToNextRequiredField}
          onSetDraft={setDraft}
          onTogglePlayerGroup={togglePlayerGroup}
        /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {isAiDialogOpen ? <Suspense fallback={null}><AiCardGeneratorDialog initialCardCount={realCardCount} initialTopic={draft.subtitle || (topic ? draft.title : "")} language={draft.language} playerGroups={draft.playerGroups} onApply={applyGeneratedDraft} onClose={() => setIsAiDialogOpen(false)} /></Suspense> : null}
      </AnimatePresence>
    </div>
  );
}

interface TopicToolsProps {
  draft: StudioDraft;
  draftIsReady: boolean;
  error: string | null;
  onClose: () => void;
  onGoToRequired: () => void;
  onSetDraft: React.Dispatch<React.SetStateAction<StudioDraft>>;
  onTogglePlayerGroup: (group: PlayerGroup) => void;
}

function TopicTools(props: TopicToolsProps) {
  const { t } = useTranslation();
  const { draft, draftIsReady, error } = props;

  return (
    <>
      <motion.button className="topic-studio-play-tools-scrim" type="button" aria-label={t("account.close")} onClick={props.onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.aside id="topic-studio-tools" className="topic-studio-play-tools" initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
        <header>
          <div><small>{draftIsReady ? t("account.studioReadyEyebrow") : t("account.studioNextEyebrow")}</small><h2>{t("account.studioPackDetails")}</h2></div>
          <button type="button" onClick={props.onClose} aria-label={t("account.close")}><FontAwesomeIcon icon={faXmark} /></button>
        </header>
        {!draftIsReady ? <button className="topic-studio-play-next-required" type="button" onClick={props.onGoToRequired}>{!draft.title.trim() ? t("account.studioNextTitle") : t("account.studioNextQuestion", { number: draft.cards.findIndex((card) => !card.question.trim()) + 1 })}</button> : null}
        {error ? <p className="topic-studio-error" role="alert">{error}</p> : null}

        <div className="topic-studio-play-tools-fields">
          <label><span>{t("account.languageLabel")}</span><select value={draft.language} onChange={(event) => props.onSetDraft((current) => ({ ...current, language: event.target.value as TopicLanguage }))}><option value="en">English</option><option value="zh">中文</option></select></label>
          <label><span>{t("account.studioPackType")}</span><select value={draft.appType} onChange={(event) => props.onSetDraft((current) => ({ ...current, appType: event.target.value as ConversationGameType }))}><option value="normal">{t("gameLibrary.type.normal")}</option><option value="edition">{t("gameLibrary.type.edition")}</option><option value="premium">{t("gameLibrary.type.premium")}</option></select></label>
          <div className="topic-studio-play-chip-grid">{PLAYER_GROUPS.map((group) => <button key={group} type="button" className={draft.playerGroups.includes(group) ? "is-selected" : ""} onClick={() => props.onTogglePlayerGroup(group)}>{t(`account.audience.${group}`)}</button>)}</div>
        </div>
      </motion.aside>
    </>
  );
}
