import { motion, useReducedMotion } from "framer-motion";

type PunchButtonProps = {
  onPunch: () => void;
};

export function PunchButton({ onPunch }: PunchButtonProps) {
  const reduce = useReducedMotion();

  return (
    <div className="relative flex h-52 w-52 items-center justify-center sm:h-56 sm:w-56">
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute rounded-full bg-emerald-400/30 blur-2xl"
          style={{ width: "78%", height: "78%" }}
          animate={{
            scale: [1, 1.14, 1],
            opacity: [0.28, 0.52, 0.28],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      <motion.button
        type="button"
        onClick={onPunch}
        aria-label="打卡，记录当前时间"
        whileTap={reduce ? undefined : { scale: 0.97 }}
        whileHover={reduce ? undefined : { scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className={`punch-btn-face relative z-10 flex h-44 w-44 shrink-0 items-center justify-center rounded-full text-lg font-semibold tracking-wide text-white ring-1 ring-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-app-accent sm:h-52 sm:w-52 sm:text-xl ${reduce ? "punch-btn-face-static" : "punch-btn-face-breathe"}`}
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-t from-black/20 via-transparent to-white/18"
          aria-hidden
        />
        <span className="relative z-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
          打卡
        </span>
      </motion.button>
    </div>
  );
}
