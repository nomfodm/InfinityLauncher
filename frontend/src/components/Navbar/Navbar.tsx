import { IconDeviceGamepad } from "@tabler/icons-react";
import { Stack } from "@mantine/core";
import styles from "./Navbar.module.css";
import { InfinityLogo } from "../InfinityLoader/InfinityLoader";
import { Link, useLocation } from "react-router-dom";
import UserButton from "../UserButton/UserButton";
import { useAppSelector } from "../../store/hooks";

export default function Navbar() {
  const location = useLocation();
  const pathname = location.pathname;

  const navbarHidden = useAppSelector(
    (state) => state.globalState.navbarHidden
  );

  function isLinkActive(path: string) {
    if (pathname === path) {
      return true;
    }

    return false;
  }

  function isOnPlayPage() {
    if (pathname.startsWith("/play")) {
      return true;
    }

    return false;
  }

  return (
    <nav data-hidden={navbarHidden} className={styles.navbar}>
      <div className={styles.navbarIcon}>
        <InfinityLogo />
      </div>

      <div className={styles.navbarMain}>
        <Stack justify="center" gap={0}>
          <Link
            to={"/"}
            className={styles.link}
            data-active={isLinkActive("/") || isOnPlayPage() || undefined}
          >
            <IconDeviceGamepad size={24} stroke={2} />
          </Link>
        </Stack>

        <Stack justify="center" gap={0}>
          <UserButton isActive={isLinkActive("/user")} />
        </Stack>
      </div>
    </nav>
  );
}
