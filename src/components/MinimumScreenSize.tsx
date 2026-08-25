import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { MIN_SCREEN_HEIGHT, MIN_SCREEN_WIDTH } from "../hooks/useScreenSize";

interface MinimumScreenSizeProps {
  height: number;
  width: number;
}

const MinimumScreenSize: React.FC<MinimumScreenSizeProps> = ({ height, width }) => {
  const { t } = useTranslation();

  return (
    <div className="h-screen w-screen bg-white dark:bg-black flex flex-col items-center justify-center px-6 py-8 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4"
        >
          {t("minimumScreen.title", "Screen Too Small")}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed"
        >
          {t(
            "minimumScreen.description",
            "FrankCards requires a little more room to display properly. Please enlarge the window or rotate your device."
          )}
        </motion.p>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-gray-500 dark:text-gray-400 space-y-2"
        >
          <p>
            •{" "}
            {t("minimumScreen.suggestions.rotate", "Try rotating your device")}
          </p>
          <p>
            •{" "}
            {t("minimumScreen.suggestions.desktop", "Use a tablet or desktop")}
          </p>
          <p>
            • {t("minimumScreen.suggestions.zoom", "Adjust browser zoom level")}
          </p>
        </motion.div>

        {/* Current dimensions (helpful for debugging) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-xs text-gray-400 dark:text-gray-500"
        >
          <p>
            Current: {width}×{height}px
          </p>
          <p>Required: {MIN_SCREEN_WIDTH}×{MIN_SCREEN_HEIGHT}px minimum</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MinimumScreenSize;
