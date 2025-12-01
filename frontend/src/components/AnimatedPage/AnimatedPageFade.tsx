import { ReactNode } from "react";
import { motion } from "motion/react";

const fadeVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

export default function AnimatedPageFade({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeVariants}
      style={{
        position: "relative",
        zIndex: 1,
      }}
    >
      {children}
    </motion.div>
  );
}

