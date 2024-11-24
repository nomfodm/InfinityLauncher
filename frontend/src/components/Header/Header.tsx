import { Link, useLocation } from "react-router-dom";
import styles from "./Header.module.css";
import {useEffect, useState,} from "react";

export default function Header() {
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

  const location = useLocation();
  const pathname = location.pathname;

  function isLinkActive(path: string) {
    if (pathname === path) {
      return styles.active;
    }

    return "";
  }

  return (
    <>
      <header className={`${styles.header} ${blurred && styles.bg_blurred}`}>
        <Link draggable={false} to={"/"} className={styles.logo_title}>
          Infinity
        </Link>
        <ul className={styles.navbar}>
          <li>
            <Link draggable={false} className={isLinkActive("/")} to={"/"}>
              Главная
            </Link>
          </li>
          {/*<li>*/}
          {/*  <Link*/}
          {/*    draggable={false}*/}
          {/*    className={isLinkActive("/news")}*/}
          {/*    to={"/news"}*/}
          {/*  >*/}
          {/*    Новости*/}
          {/*  </Link>*/}
          {/*</li>*/}
          <li>
            <Link
              draggable={false}
              className={isLinkActive("/play")}
              to={"/play"}
            >
              Играть
            </Link>
          </li>
        </ul>
      </header>
    </>
  );
}
