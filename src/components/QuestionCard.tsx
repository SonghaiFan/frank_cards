import React, { useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import Card from "./Card";
import CardEnergyIcon from "./CardEnergyIcon";

interface QuestionCardProps {
  currentQuestionIndex: number;
  direction: number;
  isCardFlipped: boolean;
  currentQuestion: any;
  isWildcard: boolean;
  cardColor: string;
  textColor: string;
  onCardClick: () => void;
  readerRotation?: 0 | 180;
  sessionEntryId?: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  currentQuestionIndex,
  direction,
  isCardFlipped,
  currentQuestion,
  cardColor,
  textColor,
  onCardClick,
  readerRotation = 0,
  sessionEntryId,
}) => {
  // Mouse movement tracking with optimized values
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const reducedMotion = useReducedMotion();

  // Spring animations with reliable settings
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), {
    stiffness: 300,
    damping: 30,
    restDelta: 0.01,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 300,
    damping: 30,
    restDelta: 0.01,
  });

  // Optimized mouse move handler with reliable calculations
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;

    const mouseXNorm = (event.clientX - rect.left - halfWidth) / halfWidth;
    const mouseYNorm = (event.clientY - rect.top - halfHeight) / halfHeight;

    // Clamp values to prevent extreme rotations
    const clampedX = Math.max(-1, Math.min(1, mouseXNorm));
    const clampedY = Math.max(-1, Math.min(1, mouseYNorm));

    // Direct update for better reliability
    mouseX.set(clampedX);
    mouseY.set(clampedY);
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;

    // Ensure reliable reset with immediate value setting
    requestAnimationFrame(() => {
      mouseX.set(0);
      mouseY.set(0);
    });
  };

  // Optimized card variants with improved transitions
  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
  };
  const isSessionEntry = currentQuestionIndex === 0 && Boolean(sessionEntryId);

  return (
    <div className="flex justify-center items-center">
      <div
        className="relative perspective-1000 w-[92vw] max-w-[380px] sm:w-[440px] sm:max-w-[440px] md:w-[520px] md:max-w-[520px] h-[220px] sm:h-[280px] md:h-[340px]"
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <AnimatePresence mode="sync" custom={direction}>
          <motion.div
            key={currentQuestionIndex}
            data-card-transition={isSessionEntry ? "session-entry" : "question-sequence"}
            className="absolute inset-0 h-full w-full"
            style={{
              rotateX,
              rotateY,
            }}
            custom={direction}
            variants={cardVariants}
            initial={isSessionEntry ? false : "enter"}
            animate="center"
            exit="exit"
            transition={
              isSessionEntry
                ? { duration: 0 }
                : {
                    x: { type: "spring", stiffness: 420, damping: 34 },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 },
                  }
            }
          >
            <motion.div
              className="relative w-full h-full"
              data-reader-rotation={readerRotation}
              initial={{ rotate: isSessionEntry ? readerRotation : 90 }}
              animate={{ rotate: readerRotation }}
              exit={{ rotate: 90 }}
              transition={
                isSessionEntry || reducedMotion
                  ? { duration: 0 }
                  : {
                      rotate: {
                        duration: 0.54,
                        ease: [0.16, 1, 0.3, 1],
                      },
                    }
              }
              style={{
                transformOrigin: "50% 50%",
              }}
            >
              {/* Rotate each face inside its own perspective scene. This keeps
                  the near edge visibly wider than the far edge during the flip. */}
              <div
                className={`relative h-full w-full ${
                  currentQuestion?.more ? "cursor-pointer" : "cursor-default"
                }`}
                data-card-flip-target
                onClick={currentQuestion?.more ? onCardClick : undefined}
                style={{
                  borderRadius: "1.5rem",
                  perspective: "1000px",
                  transformStyle: "preserve-3d",
                  WebkitTransformStyle: "preserve-3d",
                }}
              >
                <Card
                  size="large"
                  variant="question"
                  aria-hidden={isCardFlipped}
                  initial={false}
                  animate={{ rotateY: isCardFlipped ? -180 : 0 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`absolute inset-0 text-center shadow-2xl ${
                    currentQuestion?.more ? "cursor-pointer" : "cursor-default"
                  } ${
                    isCardFlipped ? "pointer-events-none" : ""
                  }`}
                  style={{
                    backgroundColor: cardColor,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transformOrigin: "50% 50%",
                    willChange: "transform",
                  }}
                >
                  {currentQuestion?.energy ? (
                    <CardEnergyIcon
                      className="pointer-events-none absolute right-6 top-6 text-lg opacity-75 sm:right-8 sm:top-8 sm:text-xl"
                      energy={currentQuestion.energy}
                      style={{ color: textColor }}
                    />
                  ) : null}
                  <div className="text-center h-full flex flex-col justify-center">
                    <h2
                      className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight font-sans tracking-tight px-2"
                      style={{ color: textColor }}
                    >
                      {currentQuestion?.question
                        ? currentQuestion.question
                            .split("\n")
                            .map((line: string, idx: number) => (
                              <span key={idx}>
                                {line}
                                {idx !==
                                  currentQuestion.question.split("\n").length - 1 && <br />}
                              </span>
                            ))
                        : null}
                    </h2>
                  </div>
                </Card>

                <Card
                  size="large"
                  variant="question"
                  aria-hidden={!isCardFlipped}
                  initial={false}
                  animate={{ rotateY: isCardFlipped ? 0 : 180 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`absolute inset-0 cursor-pointer text-center shadow-2xl ${
                    isCardFlipped ? "" : "pointer-events-none"
                  }`}
                  style={{
                    backgroundColor: cardColor,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    transformOrigin: "50% 50%",
                    willChange: "transform",
                  }}
                >
                  {currentQuestion?.energy ? (
                    <CardEnergyIcon
                      className="pointer-events-none absolute right-6 top-6 text-lg opacity-75 sm:right-8 sm:top-8 sm:text-xl"
                      energy={currentQuestion.energy}
                      style={{ color: textColor }}
                    />
                  ) : null}
                  <div className="h-full w-full overflow-y-auto text-left">
                    <div className="space-y-3">
                      {Array.isArray(currentQuestion?.more)
                        ? currentQuestion.more.map(
                            (option: string, index: number) => (
                              <p
                                key={index}
                                className="text-xs font-light leading-relaxed sm:text-sm"
                                style={{ color: textColor }}
                              >
                                • {option}
                              </p>
                            )
                          )
                        : Object.entries(currentQuestion?.more ?? {}).map(
                            ([key, value]) => (
                              <p
                                key={key}
                                className="text-xs font-light leading-relaxed sm:text-sm"
                                style={{ color: textColor }}
                              >
                                <span
                                  className="font-medium"
                                  style={{ color: textColor }}
                                >
                                  {key}.
                                </span>{" "}
                                {value as string}
                              </p>
                            )
                          )}
                    </div>
                  </div>
                </Card>
                </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuestionCard;
