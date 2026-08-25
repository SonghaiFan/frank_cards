import React from "react";
import { motion, HTMLMotionProps } from "motion/react";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "default" | "large";
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "default",
  disabled = false,
  className = "",
  ...motionProps
}) => {
  const baseClasses =
    "material-control transition-all duration-300 touch-manipulation min-h-[48px] flex items-center justify-center font-bold relative";

  const sizeClasses = {
    default: "px-6 py-3 text-base rounded-full",
    large:
      "px-8 py-4 text-lg tracking-wide rounded-full",
  };

  const variantClasses = {
    primary:
      "bg-black dark:bg-white text-white dark:text-black hover:scale-105 origin-center transform-gpu cursor-pointer disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
    secondary:
      "paper-control bg-white/60 dark:bg-white/5 text-gray-900 dark:text-white hover:scale-105 origin-center transform-gpu cursor-pointer disabled:cursor-not-allowed",
  };

  const disabledClasses =
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none";

  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`;

  return (
    <motion.button
      whileHover={{ y: -1, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      {...motionProps}
      className={combinedClasses}
      disabled={disabled}
    >
      <span className="tracking-wide">{children}</span>
    </motion.button>
  );
};

export default Button;
