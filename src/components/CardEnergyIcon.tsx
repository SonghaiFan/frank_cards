import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import type { QuestionEnergy } from "../types/ConversationGame";

interface CardEnergyIconProps {
  className?: string;
  decorative?: boolean;
  energy: QuestionEnergy;
  style?: CSSProperties;
}

const CardEnergyIcon = ({
  className = "",
  decorative = false,
  energy,
  style,
}: CardEnergyIconProps) => {
  const { t } = useTranslation();
  const label = t(`cardEnergy.${energy}.label`);

  return (
    <span
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      role={decorative ? undefined : "img"}
      style={style}
      title={decorative ? undefined : label}
    >
      <span
        aria-hidden="true"
        className={`card-energy-shape card-energy-shape--${energy}`}
      />
    </span>
  );
};

export default CardEnergyIcon;
