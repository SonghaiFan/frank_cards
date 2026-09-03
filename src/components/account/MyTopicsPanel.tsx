import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket, faGlobe, faPen, faPlay, faPlus, faRotateLeft, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthProvider";
import type { MutableTopicRepository } from "../../data/topics/TopicRepository";
import type { ConversationGame } from "../../types/ConversationGame";
import type { SaveTopicInput, TopicRecord } from "../../types/Topic";
import CardPack from "../CardPack";
import TopicStudio from "./TopicStudioPlay";
import ProfileEditor from "./ProfileEditor";

interface MyTopicsPanelProps {
  onClose: () => void;
  onTopicsChanged: () => void;
  onUseTopic: (game: ConversationGame) => void;
}

let repositoryPromise: Promise<MutableTopicRepository> | null = null;

const loadRepository = (): Promise<MutableTopicRepository> => {
  if (!repositoryPromise) {
    repositoryPromise = import("../../data/topics/SupabaseTopicRepository")
      .then(({ createUserTopicRepository }) => createUserTopicRepository());
  }
  return repositoryPromise;
};

const countQuestions = (topic: TopicRecord): number => topic.game.questions.reduce(
  (total, category) => total + category.questions.length,
  0,
);

export default function MyTopicsPanel({ onClose, onTopicsChanged, onUseTopic }: MyTopicsPanelProps) {
  const { t } = useTranslation();
  const { signOut, user } = useAuth();
  const [topics, setTopics] = useState<TopicRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studioTopic, setStudioTopic] = useState<TopicRecord | "new" | null>(null);
  const [hoveredTopicId, setHoveredTopicId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<TopicRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workingTopicId, setWorkingTopicId] = useState<string | null>(null);
  const userId = user?.id ?? null;

  const refreshTopics = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const repository = await loadRepository();
      setTopics(await repository.list({ scope: "mine" }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("account.topicsError"));
    } finally {
      setIsLoading(false);
    }
  }, [t, userId]);

  useEffect(() => {
    void refreshTopics();
  }, [refreshTopics]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (deleteCandidate) {
        setDeleteCandidate(null);
      } else if (studioTopic === null) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [deleteCandidate, onClose, studioTopic]);

  const handleStudioSave = async (input: SaveTopicInput) => {
    const repository = await loadRepository();
    const savedTopic = studioTopic === "new"
      ? await repository.create(input)
      : studioTopic
        ? await repository.update(studioTopic.id, input)
        : null;

    if (!savedTopic) return;
    setTopics((current) => {
      const exists = current.some((topic) => topic.id === savedTopic.id);
      return exists
        ? current.map((topic) => topic.id === savedTopic.id ? savedTopic : topic)
        : [savedTopic, ...current];
    });
    setStudioTopic(null);
    onTopicsChanged();
  };

  const replaceTopic = (nextTopic: TopicRecord) => {
    setTopics((current) => current.map((topic) => topic.id === nextTopic.id ? nextTopic : topic));
  };

  const handleWorkflowAction = async (topic: TopicRecord) => {
    setWorkingTopicId(topic.id);
    setError(null);
    try {
      const repository = await loadRepository();
      const nextTopic = topic.status === "draft" || topic.status === "rejected"
        ? await repository.submitForReview(topic.id)
        : await repository.withdrawFromCommunity(topic.id);
      replaceTopic(nextTopic);
      onTopicsChanged();
    } catch (workflowError) {
      setError(workflowError instanceof Error ? workflowError.message : t("account.workflowError"));
    } finally {
      setWorkingTopicId(null);
    }
  };

  const handleDeleteTopic = async (topic: TopicRecord) => {
    setWorkingTopicId(topic.id);
    setError(null);
    try {
      const repository = await loadRepository();
      await repository.delete(topic.id);
      setTopics((current) => current.filter((item) => item.id !== topic.id));
      setSelectedTopicId((current) => current === topic.id ? null : current);
      setDeleteCandidate(null);
      onTopicsChanged();
    } catch {
      setError(t("account.deleteTopicError"));
    } finally {
      setWorkingTopicId(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch {
      // AuthProvider keeps the session intact and exposes the error.
    }
  };

  const handleUseTopic = (topic: TopicRecord) => {
    onUseTopic(topic.game);
    onClose();
  };

  return (
    <motion.div
      className="account-overlay account-overlay-align-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby={studioTopic === null ? "my-topics-title" : undefined}
        aria-label={studioTopic !== null ? t(studioTopic === "new" ? "account.studioCreating" : "account.studioEditing") : undefined}
        className={`account-sheet account-topics-sheet${studioTopic !== null ? " account-topic-studio-sheet" : ""}`}
        initial={{ x: 32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 24, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {studioTopic !== null ? (
            <motion.div
              key={studioTopic === "new" ? "studio-new" : `studio-${studioTopic.id}`}
              className="account-topic-studio-container"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
            >
              <TopicStudio
                topic={studioTopic === "new" ? undefined : studioTopic}
                onCancel={() => setStudioTopic(null)}
                onSave={handleStudioSave}
              />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button className="account-icon-button account-sheet-close" onClick={onClose} aria-label={t("account.close")}>
                <FontAwesomeIcon icon={faXmark} />
              </button>

              <div className="account-topics-header">
                <p className="account-kicker">{user?.email}</p>
                <h2 id="my-topics-title">{t("account.myTopics")}</h2>
                <p>{t("account.myTopicsBody")}</p>
              </div>

              <ProfileEditor />

              <div className="account-topics-content">
                <button className="account-create-button" type="button" onClick={() => setStudioTopic("new")}>
                  <FontAwesomeIcon icon={faPlus} />
                  <span>{t("account.createTopic")}</span>
                </button>

                {isLoading ? (
                  <div className="account-topic-skeletons" role="status" aria-live="polite" aria-label={t("account.loadingTopics")}>
                    <span />
                    <span />
                    <span />
                  </div>
                ) : error ? (
                  <div className="account-topics-state" role="alert">
                    <p>{error}</p>
                    <button className="account-text-button" type="button" onClick={() => void refreshTopics()}>{t("account.tryAgain")}</button>
                  </div>
                ) : topics.length === 0 ? (
                  <div className="account-topics-state">
                    <h3>{t("account.emptyTopicsTitle")}</h3>
                    <p>{t("account.emptyTopicsBody")}</p>
                  </div>
                ) : (
                  <div className="account-topic-list">
                    {topics.map((topic, index) => {
                      const questionCount = countQuestions(topic);
                      const canPlay = questionCount > 0;
                      const isSelected = selectedTopicId === topic.id;
                      const workflowLabel = t(
                        workingTopicId === topic.id
                          ? "account.workflowWorking"
                          : topic.status === "draft" || topic.status === "rejected"
                            ? "account.submitForReview"
                            : topic.status === "pending_review"
                              ? "account.withdrawReview"
                              : "account.unpublish",
                      );

                      return (
                        <article className={`account-topic-pack${isSelected ? " is-selected" : ""}`} key={topic.id}>
                          <div className={`account-topic-pack-preview${canPlay ? "" : " is-disabled"}`}>
                            <div className="account-topic-pack-shell">
                              <CardPack
                                game={topic.game}
                                index={index}
                                isSelected={isSelected}
                                isHovered={hoveredTopicId === topic.id}
                                onToggle={() => {
                                  setSelectedTopicId((current) => current === topic.id ? null : topic.id);
                                  setDeleteCandidate(null);
                                }}
                                onHoverStart={() => setHoveredTopicId(topic.id)}
                                onHoverEnd={() => setHoveredTopicId(null)}
                                disableEntranceAnimation
                                showSelectionIndicator={false}
                                showLikeButton={false}
                                disableInteractionMotion
                                className="account-topic-pack-card cursor-pointer relative"
                              />

                              <span className="account-topic-pack-status">{t(`account.status.${topic.status}`)}</span>

                              <AnimatePresence initial={false}>
                                {isSelected ? (
                                  <motion.div className="account-topic-pack-actions" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                                    {deleteCandidate?.id === topic.id ? (
                                      <>
                                        <button className="account-topic-pack-action" type="button" onClick={() => setDeleteCandidate(null)} disabled={workingTopicId === topic.id} aria-label={t("account.cancel")} title={t("account.cancel")}><FontAwesomeIcon icon={faXmark} /></button>
                                        <button className="account-topic-pack-action account-topic-pack-delete account-topic-pack-delete-confirm" type="button" onClick={() => void handleDeleteTopic(topic)} disabled={workingTopicId === topic.id} aria-label={t("account.deleteTopicConfirm", { title: topic.game.app.title })} title={t("account.deleteTopicConfirm", { title: topic.game.app.title })}><FontAwesomeIcon icon={faTrash} /><span>{t("account.confirmDelete")}</span></button>
                                      </>
                                    ) : (
                                      <>
                                        <button className="account-topic-pack-action" type="button" onClick={() => handleUseTopic(topic)} disabled={!canPlay} aria-label={t("account.useTopic")} title={t("account.useTopic")}><FontAwesomeIcon icon={faPlay} /></button>
                                        <button className="account-topic-pack-action" type="button" onClick={() => setStudioTopic(topic)} aria-label={t("account.editTopic")} title={t("account.editTopic")}><FontAwesomeIcon icon={faPen} /></button>
                                        <button className="account-topic-pack-action" type="button" onClick={() => void handleWorkflowAction(topic)} disabled={workingTopicId === topic.id || !canPlay} aria-label={workflowLabel} title={workflowLabel}><FontAwesomeIcon icon={topic.status === "draft" || topic.status === "rejected" ? faGlobe : faRotateLeft} /></button>
                                        <button className="account-topic-pack-action account-topic-pack-delete" type="button" onClick={() => setDeleteCandidate(topic)} disabled={workingTopicId === topic.id} aria-label={t("account.deleteTopic")} title={t("account.deleteTopic")}><FontAwesomeIcon icon={faTrash} /></button>
                                      </>
                                    )}
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>
                            </div>
                          </div>

                          {isSelected && topic.rejectionReason ? (
                            <p className="account-topic-rejection" role="note">
                              {t("account.rejectionReason", { reason: topic.rejectionReason })}
                            </p>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <button className="account-sign-out-button" type="button" onClick={() => void handleSignOut()}>
                <FontAwesomeIcon icon={faArrowRightFromBracket} />
                <span>{t("account.signOut")}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}
