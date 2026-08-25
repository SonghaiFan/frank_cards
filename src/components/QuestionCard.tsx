import React, { useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import Card from "./Card";

interface QuestionCardProps {
  currentQuestionIndex: number;
  direction: number;
  isCardFlipped: boolean;
  currentQuestion: any;
  isWildcard: boolean;
  cardColor: string;
  textColor: string;
  onCardClick: () => void;
  sharedLayoutId?: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  currentQuestionIndex,
  direction,
  isCardFlipped,
  currentQuestion,
  cardColor,
  textColor,
  onCardClick,
  sharedLayoutId,
}) => {
  // Mouse movement tracking with optimized values
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

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
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

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

  const handleMouseLeave = () => {
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
      rotateY: direction > 0 ? 25 : -25,
    }),
    center: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      filter: "blur(0px)",
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 25 : -25,
    }),
  };
  const activeSharedLayoutId = currentQuestionIndex === 0 ? sharedLayoutId : undefined;

  return (
    <div className="flex justify-center items-center">
      <div
        className="relative perspective-1000 w-[92vw] max-w-[380px] sm:w-[440px] sm:max-w-[440px] md:w-[520px] md:max-w-[520px] h-[220px] sm:h-[280px] md:h-[340px]"
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestionIndex}
            data-card-transition={activeSharedLayoutId ? "shared-entry" : "question-sequence"}
            className="relative w-full h-full"
            style={{
              transformStyle: "preserve-3d",
              rotateX,
              rotateY,
            }}
            custom={direction}
            variants={cardVariants}
            initial={activeSharedLayoutId ? {
              opacity: 0,
              y: 36,
              scale: 0.92,
              filter: "blur(10px)",
            } : "enter"}
            animate="center"
            exit="exit"
            transition={activeSharedLayoutId ? {
              opacity: { duration: 0.38, delay: 0.08 },
              y: { duration: 0.72, delay: 0.05, ease: [0.22, 1, 0.36, 1] },
              scale: { duration: 0.72, delay: 0.05, ease: [0.22, 1, 0.36, 1] },
              filter: { duration: 0.5, delay: 0.05, ease: "easeOut" },
            } : {
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 },
              rotateX: { duration: 0.1 },
              rotateY: { duration: 0.1 },
            }}
          >
            {/* Card Container with Flip Animation */}
            <motion.div
              className="relative w-full h-full"
              style={{
                transformStyle: "preserve-3d",
                borderRadius: "1.5rem",
              }}
              animate={{
                rotateY: isCardFlipped ? 180 : 0,
              }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1], // Custom bezier curve for natural feel
                layout: { duration: 0.6 },
              }}
              layoutId={activeSharedLayoutId || `card-${currentQuestionIndex}`}
            >
              {/* Front Side - Question */}
              <Card
                size="large"
                variant="question"
                className={`absolute inset-0 text-center shadow-2xl ${
                  currentQuestion?.more ? "cursor-pointer" : "cursor-default"
                }`}
                style={{
                  backfaceVisibility: "hidden",
                  backgroundColor: cardColor,
                  willChange: "transform", // Optimize for animations
                }}
                onClick={currentQuestion?.more ? onCardClick : undefined}
              >
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
                                currentQuestion.question.split("\n").length -
                                  1 && <br />}
                            </span>
                          ))
                      : null}
                  </h2>
                </div>
              </Card>

              {/* Back Side - more */}
              <Card
                size="large"
                variant="question"
                className="absolute inset-0 shadow-2xl cursor-pointer"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  backgroundColor: cardColor,
                  willChange: "transform", // Optimize for animations
                }}
                onClick={onCardClick}
              >
                <div className="text-center h-full flex flex-col justify-center">
                  {currentQuestion?.more && (
                    <div className="space-y-3 text-left">
                      {Array.isArray(currentQuestion.more)
                        ? currentQuestion.more.map(
                            (option: string, index: number) => (
                              <p
                                key={index}
                                className="text-xs sm:text-sm font-light leading-relaxed"
                                style={{ color: textColor }}
                              >
                                • {option}
                              </p>
                            )
                          )
                        : Object.entries(currentQuestion.more).map(
                            ([key, value]) => (
                              <p
                                key={key}
                                className="text-xs sm:text-sm font-light leading-relaxed"
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
                  )}
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuestionCard;
