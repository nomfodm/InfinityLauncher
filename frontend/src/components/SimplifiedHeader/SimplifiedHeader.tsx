import { useEffect, useState } from "react";
import styles from "./SimplifiedHeader.module.css";
import { Link } from "react-router-dom";

export default function SimplifiedHeader() {
  const [blurred, setBlurred] = useState(false);

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  function handleScroll(event: any) {
    const target = event.target;
    const position = target.scrollTop;

    if (position! > 5) {
      setBlurred(true);
    } else {
      setBlurred(false);
    }
  }

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  return (
    <header className={`${styles.header} ${blurred && styles.bg_blurred}`}>
      <Link draggable={false} to={"/play"} className={styles.logo_title}>
        Infinity
      </Link>
    </header>
  );
}
