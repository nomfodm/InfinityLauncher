import { IconMinus, IconX } from "@tabler/icons-react";
import styles from "./WindowHeader.module.css";
import { Quit, WindowMinimise } from "../../wailsjs/runtime";
import { modals } from "@mantine/modals";
import { ReadLauncherConfig } from "../../wailsjs/go/main/FS";
import { Anchor } from "@mantine/core";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GetFormattedVersion } from "../../utils/string";
import { useAppSelector } from "../../store/hooks";

export default function WindowHeader() {
  async function quit() {
    const config = await ReadLauncherConfig();
    if (!config.closeWithFunnyAnimation) {
      Quit();
      return;
    }

    modals.openConfirmModal({
      title: "Точно хотите выйти?",
      closeOnConfirm: false,
      centered: true,
      labels: { confirm: "Да, хочу", cancel: "Не выходить" },
      onConfirm: () => {
        modals.open({
          overlayProps: {
            backgroundOpacity: 1,
            blur: 3,
            zIndex: 10000,
          },
          zIndex: 10001,
          centered: true,
          withCloseButton: false,
          closeOnEscape: false,
          closeOnClickOutside: false,
          children: "Ну и пошел ты тогда нахуй, рыцаря задержал!!!",
        });
        setTimeout(() => {
          Quit();
        }, 1500);
      },
    });
  }

  const [version, setVersion] = useState("0.0.0");
  const navigate = useNavigate();
  const isInitializing = useAppSelector(
    (state) => state.globalState.isInitializing,
  );

  useEffect(() => {
    async function wrapper() {
      setVersion(await GetFormattedVersion());
    }
    wrapper();
  }, []);

  const location = useLocation();
  const pathname = location.pathname;

  function handleNavigate() {
    console.log(1);
    if (isInitializing) return;
    navigate("/launcherinfo");
  }

  return (
    <div className={styles.header}>
      <Anchor
        onClick={handleNavigate}
        c={"#4C4C4C"}
        td={pathname === "/launcherinfo" ? "underline" : "none"}
        fz={"14px"}
        fw={"500"}
        className={isInitializing ? styles.drag : ""}
        style={{ cursor: isInitializing ? "default" : "pointer" }}
      >
        Infinity Launcher {version}
      </Anchor>
      <div className={styles.buttons}>
        <button
          onClick={WindowMinimise}
          className={`${styles.button} ${styles.hide}`}
        >
          <IconMinus width={15} height={15} color="white" />
        </button>

        <button onClick={quit} className={`${styles.button} ${styles.close}`}>
          <IconX width={15} height={15} color="white" />
        </button>
      </div>
    </div>
  );
}
