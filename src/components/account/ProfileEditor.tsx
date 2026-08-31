import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthProvider";

export default function ProfileEditor() {
  const { t } = useTranslation();
  const {
    clearProfileError,
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

  return (
    <section className="account-profile-card" aria-labelledby="account-profile-title">
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
        <div>
          <h3 id="account-profile-title">{t("account.profileTitle")}</h3>
          <p>{t("account.profileBody")}</p>
        </div>
        <label className="account-field">
          <span>{t("account.usernameLabel")}</span>
          <input
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
    </section>
  );
}
