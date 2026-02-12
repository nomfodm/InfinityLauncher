import { Anchor, Box, Flex, rem, Text, Loader } from "@mantine/core";
import AnimatedPage from "../../components/AnimatedPage/AnimatedPage";
import styles from "./LauncherInfoPage.module.css";
import {
  IconAlertHexagon,
  IconCheck,
  IconCloudExclamation,
  IconX,
} from "@tabler/icons-react";
import store from "../../store";
import { useEffect, useRef, useState } from "react";
import {
  IsAnyUpdateAvailable,
  IsMandatoryUpdateAvailable,
  RestartApp,
  Update,
} from "../../wailsjs/go/main/App";
import { AnimatePresence, motion } from "motion/react";
import { globalStateActions } from "../../store/global";
import { InfinityLogo } from "../../components/InfinityLoader/InfinityLoader";
import { GetFormattedVersion } from "../../utils/string";

export default function LauncherInfoPage() {
  enum UpdateFlowStatus {
    CHECKING,
    FOUND,
    MANDATORYFOUND,
    NOUPDATES,
    UPDATING,
    RESTARTING,
    ERROR,
  }

  const [error, setError] = useState("");

  const [version, setVersion] = useState("v0.0.0");
  const [status, setStatus] = useState<UpdateFlowStatus>(
    UpdateFlowStatus.CHECKING,
  );

  const [countdown, setCountdown] = useState(5);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    async function wrapper() {
      const ver = await GetFormattedVersion();
      setVersion(ver);

      setCountdown(5);
      setStatus(UpdateFlowStatus.CHECKING);
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (!isMountedRef.current) return;

      const isUpdate = await IsAnyUpdateAvailable();
      if (!isMountedRef.current) return;

      if (isUpdate) {
        const isUpdateMandatory = await IsMandatoryUpdateAvailable();
        if (!isMountedRef.current) return;

        if (isUpdateMandatory) {
          store.dispatch(globalStateActions.hideNavbar());
          setStatus(UpdateFlowStatus.MANDATORYFOUND);
          return;
        }
        setStatus(UpdateFlowStatus.FOUND);
      } else {
        setStatus(UpdateFlowStatus.NOUPDATES);
      }
    }
    wrapper();

    return () => {
      isMountedRef.current = false;
      store.dispatch(globalStateActions.showNavbar());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function update() {
    if (!isMountedRef.current) return;

    try {
      store.dispatch(globalStateActions.hideNavbar());
      setStatus(UpdateFlowStatus.UPDATING);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (!isMountedRef.current) return;

      await Update();

      setStatus(UpdateFlowStatus.RESTARTING);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (!isMountedRef.current) return;

      await RestartApp();
    } catch (e) {
      if (!isMountedRef.current) return;
      setError(`${e}`);
      setStatus(UpdateFlowStatus.ERROR);
    } finally {
      if (isMountedRef.current) {
        store.dispatch(globalStateActions.showNavbar());
      }
    }
  }

  useEffect(() => {
    let timeout: number;
    if (status === UpdateFlowStatus.MANDATORYFOUND && isMountedRef.current) {
      if (countdown > 0) {
        timeout = setTimeout(() => {
          if (isMountedRef.current) {
            setCountdown((countdown) => countdown - 1);
          }
        }, 1000);
      } else {
        update();
      }
    }
    return () => {
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, status]);

  return (
    <>
      <AnimatedPage>
        <main className={styles.main}>
          <Text fz={"20px"}>О программе</Text>
          <Flex h={rem(276)} justify={"space-between"} mt={rem(20)}>
            <Box>
              <Flex gap={rem(5)} align={"baseline"}>
                <Text fz={"32px"} fw={700}>
                  Infinity Launcher
                </Text>
                <Text
                  display={"inline"}
                  w={rem(100)}
                  truncate={"end"}
                  c={"#585858"}
                  fz={"18px"}
                  fw={500}
                >
                  {version}
                  {/* v1.7.0-m */}
                </Text>
              </Flex>
              <AnimatePresence mode={"wait"}>
                {status == UpdateFlowStatus.CHECKING && (
                  <motion.div
                    key={1}
                    exit={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                  >
                    <Flex gap={rem(10)} align={"center"} mt={rem(5)}>
                      <Loader
                        overflow={"visible"}
                        size={rem(15)}
                        color={"blue"}
                      />
                      <Text size={"14px"}>Проверка наличия обновлений...</Text>
                    </Flex>
                  </motion.div>
                )}
                {status == UpdateFlowStatus.FOUND && (
                  <motion.div
                    key={2}
                    exit={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                  >
                    <Flex gap={rem(10)} align={"flex-start"} mt={rem(5)}>
                      <IconAlertHexagon
                        style={{
                          width: rem(18),
                          height: rem(18),
                          marginTop: rem(1),
                          cursor: "default",
                        }}
                        color={"yellow"}
                      />
                      <Box>
                        <Text size={"14px"}>
                          Найдены необязательные обновления
                        </Text>
                        <Anchor onClick={update} size={"14px"}>
                          Обновиться
                        </Anchor>
                      </Box>
                    </Flex>
                  </motion.div>
                )}
                {status == UpdateFlowStatus.NOUPDATES && (
                  <motion.div
                    key={3}
                    exit={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                  >
                    <Flex gap={rem(10)} align={"center"} mt={rem(5)}>
                      <IconCheck
                        style={{
                          width: rem(18),
                          height: rem(18),
                          marginTop: rem(1),
                          cursor: "default",
                        }}
                        color={"green"}
                      />
                      <Text size={"14px"}>Обновлений не найдено</Text>
                    </Flex>
                  </motion.div>
                )}
                {status == UpdateFlowStatus.UPDATING && (
                  <motion.div
                    key={4}
                    exit={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                  >
                    <Flex gap={rem(10)} align={"center"} mt={rem(5)}>
                      <Text size={"14px"}>Обновление...</Text>
                    </Flex>
                  </motion.div>
                )}
                {status == UpdateFlowStatus.RESTARTING && (
                  <motion.div
                    key={5}
                    exit={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                  >
                    <Flex gap={rem(10)} align={"center"} mt={rem(5)}>
                      <Text size={"14px"}>Перезапуск...</Text>
                    </Flex>
                  </motion.div>
                )}
                {status == UpdateFlowStatus.ERROR && (
                  <motion.div
                    key={6}
                    exit={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                  >
                    <Flex gap={rem(10)} align={"flex-start"} mt={rem(5)}>
                      <IconX
                        style={{
                          width: rem(18),
                          height: rem(18),
                          marginTop: rem(1),
                          cursor: "default",
                        }}
                        color={"red"}
                      />
                      <Box>
                        <Text size={"14px"}>Ошибка во время обновления:</Text>
                        <Text size={"14px"} c={"red"}>
                          {error}
                        </Text>
                      </Box>
                    </Flex>
                  </motion.div>
                )}
                {status == UpdateFlowStatus.MANDATORYFOUND && (
                  <motion.div
                    key={7}
                    exit={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                  >
                    <Flex gap={rem(10)} align={"flex-start"} mt={rem(5)}>
                      <IconCloudExclamation
                        style={{
                          width: rem(18),
                          height: rem(18),
                          marginTop: rem(1),
                          cursor: "default",
                        }}
                        color={"red"}
                      />
                      <Box>
                        <Text size={"14px"}>
                          Найдено обязательное обновление
                        </Text>
                        <Text size={"14px"}>
                          Обновится через {countdown} секунд
                        </Text>
                      </Box>
                    </Flex>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
            <Box w={rem(150)} h={rem(75)}>
              <InfinityLogo />
            </Box>
          </Flex>
        </main>
      </AnimatedPage>
    </>
  );
}
