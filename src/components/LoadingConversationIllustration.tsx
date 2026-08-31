import { memo } from "react";
import { useMotionValue, useReducedMotion } from "motion/react";
import FemaleFigure from "./illustrations/FemaleFigure";

function LoadingConversationIllustration() {
  const reducedMotion = useReducedMotion();
  const still = useMotionValue(0);

  return (
    <div className="app-loading-figure" aria-hidden="true">
      <svg
        className="h-full w-full overflow-visible"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 334 448"
        xmlns="http://www.w3.org/2000/svg"
      >
        <FemaleFigure
          animateCoffeeSurface={!reducedMotion}
          headRotate={still}
          headX={still}
          headY={still}
          reducedMotion={reducedMotion}
        />
      </svg>
    </div>
  );
}

export default memo(LoadingConversationIllustration);
