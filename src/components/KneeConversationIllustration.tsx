import React, { memo, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import FemaleFigure from "./illustrations/FemaleFigure";
import MaleFigure from "./illustrations/MaleFigure";

interface KneeConversationIllustrationProps {
  className?: string;
  departureDelay?: number;
  femaleClothingColor?: string;
  isDeparting?: boolean;
  isEngaged: boolean;
  isLoading?: boolean;
  maleClothingColor?: string;
}

const KneeConversationIllustration: React.FC<KneeConversationIllustrationProps> = ({
  className = "",
  departureDelay = 0,
  femaleClothingColor,
  isDeparting = false,
  isEngaged,
  isLoading = false,
  maleClothingColor,
}) => {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const femaleLookXTarget = useMotionValue(0);
  const femaleLookYTarget = useMotionValue(0);
  const maleLookXTarget = useMotionValue(0);
  const maleLookYTarget = useMotionValue(0);
  const springConfig = { stiffness: 48, damping: 19, mass: 0.9 };
  const femaleLookX = useSpring(femaleLookXTarget, springConfig);
  const femaleLookY = useSpring(femaleLookYTarget, springConfig);
  const maleLookX = useSpring(maleLookXTarget, springConfig);
  const maleLookY = useSpring(maleLookYTarget, springConfig);

  const femaleHeadX = useTransform(femaleLookX, [-1, 1], [11, -11]);
  const femaleHeadY = useTransform(femaleLookY, [-1, 1], [6, -6]);
  const femaleHeadRotate = useTransform(femaleLookX, [-1, 1], [9, -9]);
  const maleHeadX = useTransform(maleLookX, [-1, 1], [-12, 12]);
  const maleHeadY = useTransform(maleLookY, [-1, 1], [-6, 6]);
  const maleHeadRotate = useTransform(maleLookX, [-1, 1], [-9.5, 9.5]);

  const notifyFigureLayout = () => {
    document.dispatchEvent(new Event("frankcards:figure-layout"));
  };

  useEffect(() => {
    if (reducedMotion) return;

    const resetLook = () => {
      femaleLookXTarget.set(0);
      femaleLookYTarget.set(0);
      maleLookXTarget.set(0);
      maleLookYTarget.set(0);
    };

    const femaleFigure = rootRef.current?.querySelector("#female-figure") ?? null;
    const maleFigure = rootRef.current?.querySelector("#male-figure") ?? null;
    const femaleHead = rootRef.current?.querySelector("#female-head-look") ?? null;
    const maleHead = rootRef.current?.querySelector("#male-head-look") ?? null;

    const containsPoint = (element: Element | null, x: number, y: number) => {
      if (!element) return false;
      const bounds = element.getBoundingClientRect();
      return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
    };

    const pointHeadAt = (
      head: Element | null,
      targetX: typeof femaleLookXTarget,
      targetY: typeof femaleLookYTarget,
      pointerX: number,
      pointerY: number,
    ) => {
      if (!head) return;
      const bounds = head.getBoundingClientRect();
      const deltaX = pointerX - (bounds.left + bounds.width / 2);
      const deltaY = pointerY - (bounds.top + bounds.height / 2);
      const distance = Math.hypot(deltaX, deltaY) || 1;
      const strength = Math.min(1, distance / 180);
      targetX.set((deltaX / distance) * strength);
      targetY.set((deltaY / distance) * strength);
    };

    let pointerFrame: number | null = null;
    let pointerX = 0;
    let pointerY = 0;

    const updateLook = () => {
      pointerFrame = null;
      const root = rootRef.current;
      if (!root) return;

      const isOverEitherPerson =
        containsPoint(femaleFigure, pointerX, pointerY) ||
        containsPoint(maleFigure, pointerX, pointerY);

      if (isOverEitherPerson) {
        resetLook();
        return;
      }

      pointHeadAt(
        femaleHead,
        femaleLookXTarget,
        femaleLookYTarget,
        pointerX,
        pointerY,
      );
      pointHeadAt(
        maleHead,
        maleLookXTarget,
        maleLookYTarget,
        pointerX,
        pointerY,
      );
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (pointerFrame === null) pointerFrame = window.requestAnimationFrame(updateLook);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", resetLook);
    document.documentElement.addEventListener("mouseleave", resetLook);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetLook);
      document.documentElement.removeEventListener("mouseleave", resetLook);
      if (pointerFrame !== null) window.cancelAnimationFrame(pointerFrame);
    };
  }, [
    femaleLookXTarget,
    femaleLookYTarget,
    maleLookXTarget,
    maleLookYTarget,
    reducedMotion,
  ]);

  const figureTransition = reducedMotion
    ? { duration: 0 }
    : {
        delay: isDeparting ? departureDelay : 0,
        duration: isDeparting ? 0.82 : isEngaged ? 2.35 : 1.65,
        ease: [0.16, 1, 0.3, 1] as const,
      };

  return (
    <div
      ref={rootRef}
      className={`knee-conversation-illustration ${className}`}
      data-departing={isDeparting ? "true" : "false"}
      data-engaged={isEngaged ? "true" : "false"}
    >
      <motion.div
        id="female-figure-viewport"
        data-layer="female"
        className="absolute left-[14%] top-[-12%] h-[40%] w-[72%] will-change-transform lg:top-[-4%] lg:h-[55%]"
        initial={reducedMotion ? false : { y: "-125%" }}
        animate={{ y: isDeparting ? "-125%" : isEngaged ? "0%" : "-21%" }}
        transition={figureTransition}
        onAnimationComplete={notifyFigureLayout}
      >
        <svg aria-hidden="true" className="h-full w-full overflow-visible" focusable="false" preserveAspectRatio="xMidYMid meet" viewBox="0 0 334 448" xmlns="http://www.w3.org/2000/svg">
          <FemaleFigure
            animateCoffeeSurface={isLoading && !reducedMotion}
            clothingColor={femaleClothingColor}
            headRotate={femaleHeadRotate}
            headX={femaleHeadX}
            headY={femaleHeadY}
            reducedMotion={reducedMotion}
          />
        </svg>
      </motion.div>

      <motion.div
        id="male-figure-viewport"
        data-layer="male"
        className="absolute bottom-[-12%] left-[4%] h-[39%] w-[92%] will-change-transform lg:bottom-[-2%] lg:h-[52%]"
        initial={reducedMotion ? false : { y: "125%" }}
        animate={{ y: isDeparting || isLoading ? "125%" : isEngaged ? "0%" : "23%" }}
        transition={figureTransition}
        onAnimationComplete={notifyFigureLayout}
      >
        <svg aria-hidden="true" className="h-full w-full overflow-visible" focusable="false" preserveAspectRatio="xMidYMid meet" viewBox="0 0 455 414" xmlns="http://www.w3.org/2000/svg">
          <MaleFigure
            clothingColor={maleClothingColor}
            headRotate={maleHeadRotate}
            headX={maleHeadX}
            headY={maleHeadY}
            reducedMotion={reducedMotion}
          />
        </svg>
      </motion.div>
    </div>
  );
};

export default memo(KneeConversationIllustration);
