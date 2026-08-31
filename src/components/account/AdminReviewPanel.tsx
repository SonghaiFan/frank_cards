import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPlay, faRotateLeft, faXmark } from "@fortawesome/free-solid-svg-icons";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import type { MutableTopicRepository } from "../../data/topics/TopicRepository";
import type { ConversationGame } from "../../types/ConversationGame";
import type { TopicRecord } from "../../types/Topic";

interface AdminReviewPanelProps {
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

export default function AdminReviewPanel({ onClose, onTopicsChanged, onUseTopic }: AdminReviewPanelProps) {
  const { t } = useTranslation();
  const [topics, setTopics] = useState<TopicRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const repository = await loadRepository();
      setTopics(await repository.list({ scope: "review" }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("admin.reviewLoadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const review = async (topic: TopicRecord, decision: "approve" | "reject") => {
    setWorkingId(topic.id);
    setError(null);
    try {
      const repository = await loadRepository();
      await repository.review(topic.id, decision, decision === "reject" ? reason : undefined);
      setTopics((current) => current.filter((candidate) => candidate.id !== topic.id));
      setRejectingId(null);
      setReason("");
      onTopicsChanged();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : t("admin.reviewActionError"));
    } finally {
      setWorkingId(null);
    }
  };

  const preview = (topic: TopicRecord) => {
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
        aria-labelledby="admin-review-title"
        aria-modal="true"
        className="account-sheet account-topics-sheet admin-review-sheet"
        initial={{ x: 32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 24, opacity: 0 }}
        role="dialog"
      >
        <button className="account-icon-button account-sheet-close" onClick={onClose} aria-label={t("account.close")}>
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="account-topics-header">
          <p className="account-kicker">FrankCards</p>
          <h2 id="admin-review-title">{t("admin.reviewTitle")}</h2>
          <p>{t("admin.reviewBody")}</p>
        </div>

        <div className="account-topics-content">
          {isLoading ? (
            <div className="account-topic-skeletons" role="status" aria-label={t("admin.reviewLoading")}>
              <span /><span /><span />
            </div>
          ) : error ? (
            <div className="account-topics-state" role="alert">
              <p>{error}</p>
              <button className="account-text-button" type="button" onClick={() => void loadQueue()}>{t("account.tryAgain")}</button>
            </div>
          ) : topics.length === 0 ? (
            <div className="account-topics-state">
              <h3>{t("admin.reviewEmptyTitle")}</h3>
              <p>{t("admin.reviewEmptyBody")}</p>
            </div>
          ) : (
            <div className="admin-review-list">
              {topics.map((topic) => {
                const isWorking = workingId === topic.id;
                const isRejecting = rejectingId === topic.id;
                return (
                  <article className="admin-review-row" key={topic.id}>
                    <div className="admin-review-copy">
                      <h3>{topic.game.app.title}</h3>
                      <p>{topic.game.app.subtitle || t("account.noSubtitle")}</p>
                      <span>{t("admin.reviewMeta", { count: countQuestions(topic), language: topic.language.toUpperCase() })}</span>
                    </div>
                    <div className="admin-review-actions">
                      <button type="button" onClick={() => preview(topic)}>
                        <FontAwesomeIcon icon={faPlay} />
                        <span>{t("admin.preview")}</span>
                      </button>
                      <button className="admin-review-approve" disabled={isWorking} type="button" onClick={() => void review(topic, "approve")}>
                        <FontAwesomeIcon icon={faCheck} />
                        <span>{t("admin.approve")}</span>
                      </button>
                      <button
                        className="admin-review-reject"
                        disabled={isWorking}
                        type="button"
                        onClick={() => {
                          setRejectingId(isRejecting ? null : topic.id);
                          setReason("");
                        }}
                      >
                        <FontAwesomeIcon icon={isRejecting ? faRotateLeft : faXmark} />
                        <span>{t(isRejecting ? "account.cancel" : "admin.reject")}</span>
                      </button>
                    </div>
                    {isRejecting ? (
                      <div className="admin-review-reason">
                        <label htmlFor={`review-reason-${topic.id}`}>{t("admin.rejectionReason")}</label>
                        <textarea
                          id={`review-reason-${topic.id}`}
                          maxLength={500}
                          onChange={(event) => setReason(event.target.value)}
                          placeholder={t("admin.rejectionReasonPlaceholder")}
                          value={reason}
                        />
                        <button disabled={isWorking || !reason.trim()} type="button" onClick={() => void review(topic, "reject")}>
                          {t("admin.confirmReject")}
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
