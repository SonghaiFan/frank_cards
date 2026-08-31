import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket, faGlobe, faPen, faPlay, faPlus, faRotateLeft, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthProvider";
import type { MutableTopicRepository } from "../../data/topics/TopicRepository";
import type { ConversationGame } from "../../types/ConversationGame";
import type { SaveTopicInput, TopicRecord } from "../../types/Topic";
import TopicStudio from "./TopicStudio";
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
  const { i18n, t } = useTranslation();
  const { signOut, user } = useAuth();
  const [topics, setTopics] = useState<TopicRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studioTopic, setStudioTopic] = useState<TopicRecord | "new" | null>(null);
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
      if (event.key === "Escape" && studioTopic === null) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, studioTopic]);

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
                    {topics.map((topic) => (
                      <article className="account-topic-row" key={topic.id}>
                        <div>
                          <h3>{topic.game.app.title}</h3>
                          <p>{topic.game.app.subtitle || t("account.noSubtitle")}</p>
                        </div>
                        <dl>
                          <div>
                            <dt>{t("account.statusLabel")}</dt>
                            <dd>{t(`account.status.${topic.status}`)}</dd>
                          </div>
                          <div>
                            <dt>{t("account.questionsLabel")}</dt>
                            <dd>{countQuestions(topic)}</dd>
                          </div>
                          <div>
                            <dt>{t("account.updatedLabel")}</dt>
                            <dd>{topic.updatedAt ? new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(new Date(topic.updatedAt)) : t("account.justNow")}</dd>
                          </div>
                        </dl>
                        <div className="account-topic-row-actions">
                          <button className="account-topic-edit-button" type="button" onClick={() => setStudioTopic(topic)}>
                            <FontAwesomeIcon icon={faPen} />
                            <span>{t("account.editTopic")}</span>
                          </button>
                          <button
                            className="account-topic-use-button"
                            type="button"
                            onClick={() => handleUseTopic(topic)}
                            disabled={countQuestions(topic) === 0}
                          >
                            <FontAwesomeIcon icon={faPlay} />
                            <span>{t("account.useTopic")}</span>
                          </button>
                          <button
                            className="account-topic-community-button"
                            type="button"
                            onClick={() => void handleWorkflowAction(topic)}
                            disabled={workingTopicId === topic.id || countQuestions(topic) === 0}
                          >
                            <FontAwesomeIcon icon={topic.status === "draft" || topic.status === "rejected" ? faGlobe : faRotateLeft} />
                            <span>{t(
                              workingTopicId === topic.id
                                ? "account.workflowWorking"
                                : topic.status === "draft" || topic.status === "rejected"
                                  ? "account.submitForReview"
                                  : topic.status === "pending_review"
                                    ? "account.withdrawReview"
                                    : "account.unpublish",
                            )}</span>
                          </button>
                        </div>
                        {topic.rejectionReason ? (
                          <p className="account-topic-rejection" role="note">
                            {t("account.rejectionReason", { reason: topic.rejectionReason })}
                          </p>
                        ) : null}
                      </article>
                    ))}
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
