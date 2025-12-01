import { ReactNode } from "react";
import { motion } from "motion/react";

const itemVariants = {
  hidden: { 
    opacity: 0,
    x: 100,
  },
  visible: { 
    opacity: 1,
    x: 0,
    transition: { 
      duration: 0.2,
      ease: "easeOut"
    } 
  },
  exit: { 
    opacity: 0,
    x: -100,
    transition: { 
      duration: 0.2,
      ease: "easeIn"
    } 
  },
};

export default function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={itemVariants}
      style={{
        position: 'relative',
        zIndex: 1,
      }}
    >
      {children}
    </motion.div>
  );
}
