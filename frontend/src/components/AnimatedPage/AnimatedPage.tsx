import { ReactNode } from "react";
import { motion } from "motion/react";

const visible = { opacity: 1, transition: { duration: 0.3 } };

const itemVariants = {
  hidden: { opacity: 0 },
  visible,
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export default function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={itemVariants}
    >
      {children}
    </motion.div>
  );
}
