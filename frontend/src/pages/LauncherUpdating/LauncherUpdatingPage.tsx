import styles from "./LauncherUpdatingPage.module.css";
import { Box, rem, Text } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  GetActualLauncherVersion,
  RestartApp,
  Update,
} from "../../wailsjs/go/main/App";
import { useAppSelector } from "../../store/hooks";
import store from "../../store";
import {
  launcherUpdateActions,
  LauncherUpdateStatus,
} from "../../store/launcherUpdate";
import { main } from "../../wailsjs/go/models";
import { formatVersion, GetFormattedVersion } from "../../utils/string";
import { InfinityLogo } from "../../components/InfinityLoader/InfinityLoader";
import AnimatedPageFade from "../../components/AnimatedPage/AnimatedPageFade";

export default function LauncherUpdatingPage() {
  const launcherUpdatingState = useAppSelector((state) => state.launcherUpdate);

  const [currentVersionNumber, setCurrentVersionNumber] = useState<string>("");
  const [newLauncherVersionInfo, setNewLauncherVersionInfo] =
    useState<main.LauncherVersion>();

  const [infoMessage, setInfoMessage] = useState("Найдено обновление");

  const update = useCallback(async () => {
    if (launcherUpdatingState.status === LauncherUpdateStatus.UPDATING) return;
    store.dispatch(launcherUpdateActions.updating());

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await Update();

      store.dispatch(launcherUpdateActions.restarting());
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await RestartApp();
    } catch (e) {
      console.log(e);
      store.dispatch(launcherUpdateActions.setErrorMessage(`${e}`));
      store.dispatch(launcherUpdateActions.error());
    }
  }, []);

  useEffect(() => {
    async function wrapper() {
      const actualLauncherVersion = await GetActualLauncherVersion();
      actualLauncherVersion.version = formatVersion(
        actualLauncherVersion.version
      );
      setNewLauncherVersionInfo(actualLauncherVersion);
      setCurrentVersionNumber(await GetFormattedVersion());
    }

    wrapper();
  }, []);

  useEffect(() => {
    let timeout: number;
    if (
      launcherUpdatingState.status !== LauncherUpdateStatus.UPDATING &&
      launcherUpdatingState.status !== LauncherUpdateStatus.RESTARTING &&
      launcherUpdatingState.countdown > 0
    ) {
      timeout = setTimeout(
        () =>
          store.dispatch(
            launcherUpdateActions.launcherUpdateDecreaseCountdown()
          ),
        1000
      );
    } else {
      update();
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [launcherUpdatingState.countdown]);

  useEffect(() => {
    switch (launcherUpdatingState.status) {
      case LauncherUpdateStatus.UPDATING:
        setInfoMessage("Обновление...");
        break;
      case LauncherUpdateStatus.RESTARTING:
        setInfoMessage("Обновление завершено");
        break;
      case LauncherUpdateStatus.IDLE:
        setInfoMessage("Найдено обновление");
        break;
      case LauncherUpdateStatus.ERROR:
        setInfoMessage("Ошибка обновления");
        break;
    }
  }, [launcherUpdatingState.status]);

  return (
    <>
      <AnimatedPageFade>
        <main
          onClick={
            ![
              LauncherUpdateStatus.UPDATING,
              LauncherUpdateStatus.RESTARTING,
              LauncherUpdateStatus.ERROR,
            ].includes(launcherUpdatingState.status)
              ? update
              : undefined
          }
          className={styles.main}
        >
          <Box
            left={rem(310)}
            top={rem(180)}
            pos={"absolute"}
            w={rem(80)}
            h={rem(40)}
            style={{ position: "relative", cursor: "default" }}
            className={styles.logoContainer}
          >
            <InfinityLogo />
            {/* Зелёный overlay */}
            <Box
              pos={"absolute"}
              top={0}
              left={0}
              w={"100%"}
              h={"100%"}
              className={styles.greenOverlay}
              style={{
                opacity: [LauncherUpdateStatus.ERROR].includes(
                  launcherUpdatingState.status
                )
                  ? 0
                  : 1,
              }}
            >
              <InfinityLogo />
            </Box>
            {/* Красный overlay */}
            <Box
              pos={"absolute"}
              top={0}
              left={0}
              w={"100%"}
              h={"100%"}
              className={styles.redOverlay}
              style={{
                opacity: [LauncherUpdateStatus.ERROR].includes(
                  launcherUpdatingState.status
                )
                  ? 1
                  : 0,
              }}
            >
              <InfinityLogo />
            </Box>
          </Box>
          <Box>
            <Text
              c={
                [LauncherUpdateStatus.ERROR].includes(
                  launcherUpdatingState.status
                )
                  ? "red.6"
                  : "green.6"
              }
              fw={"700"}
              fz={"24px"}
            >
              {infoMessage}
            </Text>

            <AnimatePresence mode={"wait"}>
              {launcherUpdatingState.status === LauncherUpdateStatus.IDLE && (
                <motion.div
                  key={1}
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 1 }}
                >
                  <Text mt={rem(5)} fz={"16px"}>
                    Найдено новое обязательное обновление{" "}
                    {newLauncherVersionInfo?.version}
                  </Text>
                  <Text fz={"16px"}>
                    Обновится сам через: {launcherUpdatingState.countdown}{" "}
                    секунд
                  </Text>
                </motion.div>
              )}
              {launcherUpdatingState.status ===
                LauncherUpdateStatus.RESTARTING && (
                <motion.div
                  key={2}
                  exit={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                >
                  <Text mt={rem(5)} fz={"16px"}>
                    Обновлен до {newLauncherVersionInfo?.version}
                  </Text>
                  <Text fz={"16px"}>Лаунчер перезапускается...</Text>
                </motion.div>
              )}
              {launcherUpdatingState.status === LauncherUpdateStatus.ERROR && (
                <motion.div
                  key={3}
                  exit={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                >
                  <Text mt={rem(5)} fz={"16px"}>
                    Произошла ошибка во время обновления до версии{" "}
                    {newLauncherVersionInfo?.version}:
                  </Text>
                  <Text c={"red.6"} fw={600} fz={"16px"}>
                    {launcherUpdatingState.error}
                  </Text>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>

          <AnimatePresence>
            {newLauncherVersionInfo &&
              currentVersionNumber &&
              ![LauncherUpdateStatus.RESTARTING].includes(
                launcherUpdatingState.status
              ) && (
                <motion.div
                  key={4}
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 1 }}
                >
                  <Box pos={"absolute"} bottom={rem(10)} left={rem(10)}>
                    <Text c={"#797979"} fz={"xs"}>
                      {currentVersionNumber} {"->"}{" "}
                      {newLauncherVersionInfo?.version}
                    </Text>

                    <Text c={"#797979"} fz={"xs"}>
                      {newLauncherVersionInfo?.version} SHA256:{" "}
                      {newLauncherVersionInfo?.sha256}
                    </Text>
                  </Box>
                </motion.div>
              )}
          </AnimatePresence>
        </main>
      </AnimatedPageFade>
    </>
  );
}
