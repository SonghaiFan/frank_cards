import { motion, HTMLMotionProps } from "motion/react";
import { ReactNode } from "react";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: ReactNode;
  size?: "small" | "medium" | "large";
  variant?: "default" | "game" | "question";
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  size = "medium",
  variant = "default",
  className = "",
  ...motionProps
}) => {
  const sizeClasses = {
    small: "w-full max-w-[300px] sm:max-w-[320px] h-[180px] sm:h-[200px]",
    medium: "w-[90vw] max-w-[360px] sm:max-w-[400px] h-[200px] sm:h-[250px]",
    large:
      "w-[92vw] max-w-[380px] sm:max-w-[440px] md:max-w-[520px] h-[220px] sm:h-[280px] md:h-[340px]",
  };

  const variantClasses = {
    default: "p-4 sm:p-6",
    game: "p-4 sm:p-6 md:p-8 flex flex-col justify-between",
    question:
      "px-6 py-8 sm:px-10 sm:py-10 md:px-14 md:py-12 flex flex-col justify-center items-center",
  };

  const baseClasses =
    "material-card theme-paper-card select-none rounded-3xl";
  const sizeClass = sizeClasses[size];
  const variantClass = variantClasses[variant];

  return (
    <motion.div
      className={`${baseClasses} ${sizeClass} ${variantClass} ${className}`}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default Card;
