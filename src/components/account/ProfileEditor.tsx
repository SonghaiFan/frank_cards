import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthProvider";

interface ProfileEditorProps {
  onAccountDeleted: () => void;
}

export default function ProfileEditor({ onAccountDeleted }: ProfileEditorProps) {
  const { t } = useTranslation();
  const {
    clearError,
    clearProfileError,
    deleteAccount,
    error,
    isWorking,
    isProfileLoading,
    isProfileWorking,
    profile,
    profileError,
    updateProfile,
    uploadAvatar,
    user,
  } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [saved, setSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
  }, [profile?.display_name]);

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!displayName.trim()) return;
    setSaved(false);
    try {
      await updateProfile(displayName);
      setSaved(true);
    } catch {
      // AuthProvider keeps the readable profile error.
    }
  };

  const selectAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSaved(false);
    try {
      await uploadAvatar(file);
    } catch {
      // AuthProvider keeps the readable profile error.
    }
  };

  const fallbackInitial = (profile?.display_name || user?.email || "F").trim().charAt(0).toUpperCase();

  const requestAccountDeletion = async () => {
    if (deleteConfirmation !== "DELETE") return;
    try {
      await deleteAccount();
      onAccountDeleted();
    } catch {
      // AuthProvider exposes a readable error for the confirmation panel.
    }
  };

  return (
    <section
      className="account-profile-card"
      aria-label={t("account.editProfile")}
      data-expanded={isExpanded}
    >
      <button
        className="account-profile-mobile-summary"
        type="button"
        aria-expanded={isExpanded}
        aria-controls="account-profile-details"
        onClick={() => setIsExpanded((current) => !current)}
      >
        <span className="account-profile-summary-avatar" aria-hidden="true">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : fallbackInitial}
        </span>
        <span className="account-profile-summary-copy">
          <strong>{profile?.display_name || t("account.profileTitle")}</strong>
          <small>{t("account.editProfile")}</small>
        </span>
        <FontAwesomeIcon icon={faChevronDown} />
      </button>

      <div className="account-profile-details" id="account-profile-details">
        <div className="account-profile-avatar-wrap">
          <span className="account-profile-avatar" aria-hidden="true">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : fallbackInitial}
          </span>
          <label className="account-avatar-upload">
            <FontAwesomeIcon icon={faCamera} />
            <span>{t("account.uploadAvatar")}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={isProfileWorking}
              onChange={(event) => void selectAvatar(event)}
            />
          </label>
        </div>

        <form className="account-profile-form" onSubmit={(event) => void submitProfile(event)}>
          <label className="account-field">
            <span>{t("account.usernameLabel")}</span>
            <input
              aria-describedby="account-profile-visibility-note"
              id="account-display-name"
              type="text"
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                setSaved(false);
                if (profileError) clearProfileError();
              }}
              minLength={1}
              maxLength={80}
              disabled={isProfileLoading || isProfileWorking}
              placeholder={t("account.usernamePlaceholder")}
            />
          </label>
          <p className="account-profile-visibility-note" id="account-profile-visibility-note">{t("account.profileBody")}</p>
          {profileError ? <p className="account-field-error" role="alert">{profileError}</p> : null}
          <button
            className="account-profile-save"
            type="submit"
            disabled={isProfileLoading || isProfileWorking || !displayName.trim() || displayName.trim() === profile?.display_name}
          >
            {saved ? <FontAwesomeIcon icon={faCheck} /> : null}
            <span>{t(saved ? "account.profileSaved" : isProfileWorking ? "account.profileSaving" : "account.saveProfile")}</span>
          </button>
        </form>

        <section className="account-delete-section" aria-labelledby="account-delete-title">
          <div>
            <h3 id="account-delete-title">{t("account.deleteAccountTitle")}</h3>
            <p>{t("account.deleteAccountBody")}</p>
          </div>
          {isDeleteOpen ? (
            <div className="account-delete-confirmation" role="group" aria-labelledby="account-delete-confirm-title" aria-describedby="account-delete-confirm-description">
              <h4 id="account-delete-confirm-title">{t("account.deleteAccountConfirmTitle")}</h4>
              <p id="account-delete-confirm-description">{t("account.deleteAccountConfirmBody")}</p>
              <label className="account-field" htmlFor="account-delete-confirmation">
                <span>{t("account.deleteAccountPhraseLabel")}</span>
                <input
                  id="account-delete-confirmation"
                  name="account-delete-confirmation"
                  type="text"
                  value={deleteConfirmation}
                  onChange={(event) => { setDeleteConfirmation(event.target.value); if (error) clearError(); }}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  enterKeyHint="done"
                  disabled={isWorking}
                  placeholder="DELETE"
                />
              </label>
              {error ? <p className="account-field-error" aria-live="polite">{error}</p> : null}
              <div className="account-delete-actions">
                <button className="account-delete-cancel" type="button" onClick={() => { setDeleteConfirmation(""); setIsDeleteOpen(false); clearError(); }} disabled={isWorking}>{t("account.cancel")}</button>
                <button className="account-delete-confirm" type="button" onClick={() => void requestAccountDeletion()} disabled={deleteConfirmation !== "DELETE" || isWorking}>{t(isWorking ? "account.deletingAccount" : "account.deleteAccountConfirm")}</button>
              </div>
            </div>
          ) : (
            <button className="account-delete-trigger" type="button" onClick={() => { clearError(); setIsDeleteOpen(true); }}>{t("account.deleteAccount")}</button>
          )}
        </section>
      </div>
    </section>
  );
}
