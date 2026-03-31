import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

export function ThemeToggle() {
  const { mode, toggle } = useTheme();
  const reduce = useReducedMotion();
  const isLight = mode === "light";

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "切换到暗色主题" : "切换到亮色主题"}
      title={isLight ? "暗色" : "亮色"}
      whileTap={reduce ? undefined : { scale: 0.94 }}
      className="flex h-11 w-11 items-center justify-center rounded-xl border border-app-border bg-app-surface text-app-text shadow-sm transition-colors hover:bg-app-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
    >
      <FontAwesomeIcon
        icon={isLight ? faMoon : faSun}
        className="h-[1.1rem] w-[1.1rem] text-app-muted"
        aria-hidden
      />
    </motion.button>
  );
}
