import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket, faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthProvider";
import type { MutableTopicRepository } from "../../data/topics/TopicRepository";
import type { TopicRecord } from "../../types/Topic";
import CreateTopicForm from "./CreateTopicForm";

interface MyTopicsPanelProps {
  onClose: () => void;
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

export default function MyTopicsPanel({ onClose }: MyTopicsPanelProps) {
  const { i18n, t } = useTranslation();
  const { signOut, user } = useAuth();
  const [topics, setTopics] = useState<TopicRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleCreated = (topic: TopicRecord) => {
    setTopics((current) => [topic, ...current]);
    setIsCreating(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch {
      // AuthProvider keeps the session intact and exposes the error.
    }
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
        aria-labelledby="my-topics-title"
        className="account-sheet account-topics-sheet"
        initial={{ x: 32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 24, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="account-icon-button account-sheet-close" onClick={onClose} aria-label={t("account.close")}>
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="account-topics-header">
          <p className="account-kicker">{user?.email}</p>
          <h2 id="my-topics-title">{t("account.myTopics")}</h2>
          <p>{t("account.myTopicsBody")}</p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {isCreating ? (
            <motion.div key="create" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <CreateTopicForm onCancel={() => setIsCreating(false)} onCreated={handleCreated} />
            </motion.div>
          ) : (
            <motion.div key="list" className="account-topics-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button className="account-create-button" type="button" onClick={() => setIsCreating(true)}>
                <FontAwesomeIcon icon={faPlus} />
                <span>{t("account.createTopic")}</span>
              </button>

              {isLoading ? (
                <div className="account-topic-skeletons" aria-label={t("account.loadingTopics")}>
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
                    </article>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button className="account-sign-out-button" type="button" onClick={() => void handleSignOut()}>
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
          <span>{t("account.signOut")}</span>
        </button>
      </motion.section>
    </motion.div>
  );
}
