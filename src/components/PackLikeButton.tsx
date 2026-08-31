import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { usePackLikes } from "../social/PackLikesProvider";

export default function PackLikeButton({ packId }: { packId: string }) {
  const { t } = useTranslation();
  const { getLikeState, isWorking, toggleLike } = usePackLikes();
  const [hasError, setHasError] = useState(false);
  const likeState = getLikeState(packId);
  const working = isWorking(packId);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setHasError(false);
    try {
      await toggleLike(packId);
    } catch {
      setHasError(true);
    }
  };

  return (
    <button
      type="button"
      className={`pack-like-button${likeState.liked ? " is-liked" : ""}${hasError ? " has-error" : ""}`}
      aria-label={t(likeState.liked ? "account.unlikePack" : "account.likePack")}
      aria-pressed={likeState.liked}
      disabled={working}
      onClick={(event) => void handleClick(event)}
      onPointerDown={(event) => event.stopPropagation()}
      title={hasError ? t("account.likeError") : undefined}
    >
      <FontAwesomeIcon icon={faHeart} aria-hidden="true" />
      <span>{likeState.count}</span>
    </button>
  );
}
