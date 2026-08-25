import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { PLAYER_GROUPS, type ConversationGame, type PlayerGroup } from "../../types/ConversationGame";
import { toGameLanguage, toTopicLanguage, type TopicRecord } from "../../types/Topic";

interface CreateTopicFormProps {
  onCancel: () => void;
  onCreated: (topic: TopicRecord) => void;
}

const createDraftGame = ({
  firstQuestion,
  language,
  playerGroup,
  subtitle,
  title,
}: {
  firstQuestion: string;
  language: "en" | "zh";
  playerGroup: PlayerGroup;
  subtitle: string;
  title: string;
}): ConversationGame => {
  const chinese = language === "zh";
  return {
    testID: `draft-${Date.now()}`,
    app: {
      title: title.trim(),
      subtitle: subtitle.trim(),
      language: toGameLanguage(language),
      type: "normal",
      playerGroup: [playerGroup],
      version: "1",
    },
    ui: {
      startScreen: {
        title: title.trim(),
        description: subtitle.trim() ? [subtitle.trim()] : [],
        startButton: chinese ? "开始" : "Begin",
      },
      navigation: {
        nextButton: chinese ? "下一个" : "Next",
        prevButton: chinese ? "上一个" : "Previous",
      },
      endScreen: {
        title: chinese ? "聊得很好" : "A good conversation",
        subtitle: chinese ? "愿这段对话继续留在你们之间。" : "Keep the conversation with you.",
        restartButton: chinese ? "再聊一次" : "Talk again",
      },
    },
    theme: {
      categories: {
        conversation: {
          name: chinese ? "对话" : "Conversation",
          color: "#20201e",
          description: subtitle.trim(),
        },
      },
    },
    questions: [{
      category: "conversation",
      questions: [{ type: "open", question: firstQuestion.trim() }],
    }],
  };
};

export default function CreateTopicForm({ onCancel, onCreated }: CreateTopicFormProps) {
  const { i18n, t } = useTranslation();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [firstQuestion, setFirstQuestion] = useState("");
  const [playerGroup, setPlayerGroup] = useState<PlayerGroup>("friends");
  const [language, setLanguage] = useState<"en" | "zh">(() => toTopicLanguage(i18n.language));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !firstQuestion.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      const { createUserTopicRepository } = await import("../../data/topics/SupabaseTopicRepository");
      const topic = await createUserTopicRepository().create({
        game: createDraftGame({ firstQuestion, language, playerGroup, subtitle, title }),
        language,
        status: "draft",
        visibility: "private",
      });
      onCreated(topic);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("account.createError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="account-topic-form" onSubmit={submit}>
      <div className="account-topic-form-heading">
        <h3>{t("account.createTopicTitle")}</h3>
        <p>{t("account.createTopicBody")}</p>
      </div>

      <label className="account-field">
        <span>{t("account.topicTitleLabel")}</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          autoFocus
          required
        />
      </label>

      <label className="account-field">
        <span>{t("account.topicSubtitleLabel")}</span>
        <input
          value={subtitle}
          onChange={(event) => setSubtitle(event.target.value)}
          maxLength={240}
        />
      </label>

      <label className="account-field">
        <span>{t("account.firstQuestionLabel")}</span>
        <textarea
          value={firstQuestion}
          onChange={(event) => setFirstQuestion(event.target.value)}
          rows={3}
          required
        />
      </label>

      <div className="account-form-grid">
        <label className="account-field">
          <span>{t("account.audienceLabel")}</span>
          <select value={playerGroup} onChange={(event) => setPlayerGroup(event.target.value as PlayerGroup)}>
            {PLAYER_GROUPS.map((group) => (
              <option key={group} value={group}>{t(`account.audience.${group}`)}</option>
            ))}
          </select>
        </label>

        <label className="account-field">
          <span>{t("account.languageLabel")}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value as "en" | "zh")}>
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </label>
      </div>

      <p className="account-form-note">{t("account.draftNote")}</p>
      {error ? <p className="account-field-error" role="alert">{error}</p> : null}

      <div className="account-form-actions">
        <button className="account-text-button" type="button" onClick={onCancel} disabled={isSaving}>
          {t("account.cancel")}
        </button>
        <button className="account-primary-button" type="submit" disabled={isSaving || !title.trim() || !firstQuestion.trim()}>
          {isSaving ? t("account.creating") : t("account.createDraft")}
        </button>
      </div>
    </form>
  );
}
