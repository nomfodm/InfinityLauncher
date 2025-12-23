import { CSSProperties, useEffect, useState } from "react";
import AnimatedPage from "../../components/AnimatedPage/AnimatedPage";
import styles from "./DetailPage.module.css";
import { useParams } from "react-router-dom";
import { IconEdit, IconSettings } from "@tabler/icons-react";
import {
  Anchor,
  Box,
  Breadcrumbs,
  Button,
  Group,
  Paper,
  rem,
  ScrollArea,
  Slider,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useAppSelector } from "../../store/hooks";
import store from "../../store";
import { modals } from "@mantine/modals";
import InfinitySpanText from "../../components/InfinitySpanText";
import cx from "clsx";
import { EventsEmit } from "../../wailsjs/runtime";
import downloadService from "../../services/download";
import { gameActions, GameStatus } from "../../store/game";
import {
  InitGameProfileConfig,
  MkDirAll,
  ReadGameProfileConfig,
  WriteGameProfileConfig,
} from "../../wailsjs/go/main/FS";
import { motion, AnimatePresence } from "motion/react";
import { floorRamValue } from "../../utils/ram";
import {
  GetOptionalFiles,
  OpenDirectoryDialog,
  OpenDirectoryInExplorer,
} from "../../wailsjs/go/main/App";
import { GetTotalRAMInMB } from "../../wailsjs/go/main/System";

import { main } from "../../wailsjs/go/models";

import OptionalFileEntry = main.OptionalFileEntry;
import OptionalFileCard from "../../components/OptionalFileCard/OptionalFileCard";

enum CurrentContentType {
  Main,
  Settings,
  OptionalFiles,
}

export default function DetailPage() {
  const { id } = useParams();
  const authState = useAppSelector((state) => state.auth);
  const gameProfilesState = useAppSelector((state) => state.gameProfiles);
  const gameState = useAppSelector((state) => state.game);

  const [initialized, setInitialized] = useState<boolean>(false);
  const [contentType, setContentType] = useState<CurrentContentType>(
    CurrentContentType.Main
  );

  const fadeVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const [ram, setRAM] = useState<number>(0);
  const [gamePath, setGamePath] = useState<string>("");

  const [totalRam, setTotalRAM] = useState<number>(0);

  const [checkedList, setCheckedList] = useState<{ [p: string]: boolean }>({});
  const [filesList, setFilesList] = useState<OptionalFileEntry[]>([]);

  const [optionalFilesChecking, setOptionalFilesChecking] =
    useState<boolean>(true);

  useEffect(() => {
    async function wrapper() {
      await InitGameProfileConfig(
        Number(id),
        gameProfilesState.profiles.at(Number(id) - 1)!.name
      );
      setInitialized(true);
    }

    wrapper();
  }, []);

  function getStatusText(status: GameStatus): string {
    const statuses = {
      [GameStatus.IDLE]: "",
      [GameStatus.FETCHING]: "Получаю файлы игры...",
      [GameStatus.DOWNLOADING]: "Загрузка...",
      [GameStatus.PREPARING]: "Подготовка файлов игры...",
      [GameStatus.DONE]: "",
      [GameStatus.PLAYING]: "Игра запущена",
      [GameStatus.ERROR]: gameState.error,
    };
    return statuses[status]!;
  }

  async function handlePlay() {
    const authState = store.getState().auth;
    if (authState.authed) {
      await play();
      return;
    }

    modals.openConfirmModal({
      withCloseButton: false,
      centered: true,
      children: (
        <Text>
          Без входа в аккаунт у вас не будет доступа к серверам{" "}
          <InfinitySpanText />
        </Text>
      ),
      labels: { confirm: "Все равно играть", cancel: "Отмена" },
      onCancel: () => {},
      onConfirm: async () => await play(),
    });
  }

  async function play() {
    store.dispatch(gameActions.idle());
    await downloadService.play(Number(id));
  }

  async function handleCancel() {
    EventsEmit("cancel");
  }

  async function handleCloseGame() {
    EventsEmit("closeGame");
    store.dispatch(gameActions.idle());
  }

  useEffect(() => {
    async function asyncWrapper() {
      const totalRAM = await GetTotalRAMInMB();
      setTotalRAM(floorRamValue(totalRAM - 2 * 1024));

      const config = await ReadGameProfileConfig(
        gameProfilesState.profiles.at(Number(id) - 1)!.id
      );
      setRAM(config.ram);
      setGamePath(config.path);
    }

    asyncWrapper();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameProfilesState]);

  async function handleChoosePath() {
    const config = await ReadGameProfileConfig(
      gameProfilesState.profiles.at(Number(id) - 1)!.id
    );
    const oldPath = config.path;
    const newPath = await OpenDirectoryDialog(config.path);
    config.path = newPath;
    if (newPath.trim() === "") {
      config.path = oldPath;
    }
    await WriteGameProfileConfig(
      gameProfilesState.profiles.at(Number(id) - 1)!.id,
      config
    );
    await MkDirAll(newPath);
    setGamePath(newPath);
  }

  async function handleOpenPath() {
    const config = await ReadGameProfileConfig(
      gameProfilesState.profiles.at(Number(id) - 1)!.id
    );
    const path = config.path;

    await OpenDirectoryInExplorer(path);
  }

  async function handleRAMChange(valueRaw: number | string) {
    let value = Number(valueRaw);
    console.log(value);
    if (value <= 1024) {
      value = 1024;
    }
    setRAM(value);
    if (ram === value) {
      return;
    }
    const config = await ReadGameProfileConfig(
      gameProfilesState.profiles.at(Number(id) - 1)!.id
    );
    config.ram = value;

    await WriteGameProfileConfig(
      gameProfilesState.profiles.at(Number(id) - 1)!.id,
      config
    );
  }

  useEffect(() => {
    async function asyncWrapper() {
      await SetDefaults();
    }

    asyncWrapper();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function SetDefaults() {
    const config = await ReadGameProfileConfig(
      gameProfilesState.profiles.at(Number(id) - 1)!.id
    );
    const files = await GetOptionalFiles(
      gameProfilesState.profiles.at(Number(id) - 1)!
    );

    if (!config.optionalFilesEnabled) {
      config.optionalFilesEnabled = {};
    }

    files.forEach((entry) => {
      if (!(entry.md5 in config.optionalFilesEnabled)) {
        config.optionalFilesEnabled[entry.md5] =
          entry.launcherData.defaultEnabled;
      }
    });

    setCheckedList(config.optionalFilesEnabled);
    setFilesList(files);
    setOptionalFilesChecking(false);
    console.log(files);

    await WriteGameProfileConfig(
      gameProfilesState.profiles.at(Number(id) - 1)!.id,
      config
    );
  }

  async function handleCheckbox(md5: string, checked: boolean) {
    const config = await ReadGameProfileConfig(
      gameProfilesState.profiles.at(Number(id) - 1)!.id
    );

    config.optionalFilesEnabled[md5] = checked;

    setCheckedList(config.optionalFilesEnabled);

    await WriteGameProfileConfig(
      gameProfilesState.profiles.at(Number(id) - 1)!.id,
      config
    );
  }

  const renderContent = () => {
    switch (contentType) {
      case CurrentContentType.Settings:
        return (
          <motion.div
            key="settings"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className={styles.content}
          >
            <Breadcrumbs w={rem(400)} separatorMargin={"5px"}>
              <Anchor
                onClick={() => setContentType(CurrentContentType.Main)}
                fz={"16px"}
              >
                {gameProfilesState.profiles.at(Number(id) - 1)!.title}
              </Anchor>
              <Text fz={"16px"}>Настройки</Text>
            </Breadcrumbs>

            <Text mt={rem(33)} fz={"15px"} c={"#969696"}>
              Оперативная память
            </Text>
            <Text mt={rem(5)}>
              {ram > 1024
                ? `${ram} Mb / ${totalRam} Mb`
                : "автоматически".toUpperCase()}
            </Text>

            <Box mt={rem(5)} w={rem(339)} className={styles.noDrag}>
              <Slider
                min={1024}
                max={totalRam}
                value={ram}
                step={256}
                onChange={(value) => setRAM(value)}
                onChangeEnd={handleRAMChange}
                marks={Array.from({ length: totalRam / 1024 }).map(
                  (_, index) => ({
                    value: (index + 1) * 1024,
                  })
                )}
                className={cx(styles.slider)}
              />
            </Box>

            <Text fz={"15px"} c={"#969696"} mt={rem(30)}>
              Папка с файлами игры
            </Text>
            <Text
              style={{ overflowX: "auto" }}
              w={rem(400)}
              mt={rem(5)}
              onWheel={(e) => {
                e.currentTarget.scrollLeft += e.deltaY;
              }}
            >
              {gamePath}
            </Text>
            <Group gap={rem(10)} mt={rem(10)}>
              <Button
                radius={"7px"}
                w={rem(115)}
                h={rem(35)}
                color={"indigo.9"}
                onClick={handleOpenPath}
              >
                <Text fw={500} fz={"13px"}>
                  Открыть
                </Text>
              </Button>
              <Button
                w={rem(115)}
                h={rem(35)}
                color={"indigo.9"}
                variant="outline"
                onClick={handleChoosePath}
                radius={"7px"}
                style={{ borderWidth: rem(2) }}
              >
                <Text fw={500} fz={"13px"}>
                  Изменить
                </Text>
              </Button>
            </Group>
          </motion.div>
        );
      case CurrentContentType.OptionalFiles:
        return (
          <motion.div
            key="optional"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className={styles.content}
          >
            <Stack h={"100%"} justify="space-between">
              <Breadcrumbs w={rem(400)} separatorMargin={"5px"}>
                <Anchor
                  onClick={() => setContentType(CurrentContentType.Main)}
                  fz={"16px"}
                >
                  {gameProfilesState.profiles.at(Number(id) - 1)!.title}
                </Anchor>
                <Text fz={"16px"}>Опциональные файлы</Text>
              </Breadcrumbs>

              <Paper radius={rem(12)} w={rem(339)} h={rem(226)} bg={"#1F1F1F"}>
                <ScrollArea h={"100%"} scrollHideDelay={99999999999}>
                  <Box h={rem(20)}></Box>
                  {filesList
                    ? filesList.map((file, index) => {
                        return (
                          <OptionalFileCard
                            key={index}
                            data={file}
                            defaultChecked={checkedList[file.md5]}
                            handleCallback={handleCheckbox}
                          />
                        );
                      })
                    : "..."}
                </ScrollArea>
              </Paper>
            </Stack>
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="main"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className={styles.content}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Text w={rem(300)} fw={500} c={"#969696"} fz={"16px"}>
                {gameProfilesState.profiles.at(Number(id) - 1)!.description}
              </Text>
            </Box>
            <Box>
              {[GameStatus.ERROR].includes(gameState.status) ? (
                <Text style={{ overflow: "visible" }} fz={"xs"} c={"red.9"}>
                  Ошибка: {getStatusText(gameState.status)}
                </Text>
              ) : (
                <Text style={{ overflow: "visible" }} fz={"xs"} c={"#818181"}>
                  {getStatusText(gameState.status)}
                </Text>
              )}

              {[GameStatus.DOWNLOADING].includes(gameState.status) && (
                <>
                  <progress
                    max={gameState.downloadProgress.total}
                    value={gameState.downloadProgress.done}
                    className={cx(styles.progress_bar, {
                      [styles.downloading]:
                        gameState.status == GameStatus.DOWNLOADING,
                    })}
                  />

                  <Group w={rem(300)} justify={"space-between"}>
                    <Text fw={500} fz={"xs"} c={"dimmed"}>
                      {gameState.downloadProgress.done} Мб /{" "}
                      {gameState.downloadProgress.total} Мб
                    </Text>
                  </Group>
                </>
              )}

              <section className={styles.buttons}>
                {[GameStatus.IDLE, GameStatus.ERROR].includes(
                  gameState.status
                ) && (
                  <Button
                    onClick={handlePlay}
                    w={rem(130)}
                    className={styles.play_btn}
                    color={authState.authed ? "indigo.9" : "yellow.9"}
                  >
                    Играть
                  </Button>
                )}
                {[GameStatus.DOWNLOADING, GameStatus.PREPARING].includes(
                  gameState.status
                ) && (
                  <Button
                    onClick={handleCancel}
                    w={rem(130)}
                    className={styles.play_btn}
                    color={"red.9"}
                  >
                    Отмена
                  </Button>
                )}
                {[GameStatus.FETCHING].includes(gameState.status) && (
                  <Button disabled w={rem(180)} className={styles.play_btn}>
                    Получаю файлы...
                  </Button>
                )}
                {[GameStatus.PLAYING].includes(gameState.status) && (
                  <Button
                    onClick={handleCloseGame}
                    w={rem(150)}
                    className={styles.play_btn}
                    color={"grape.9"}
                  >
                    Закрыть игру
                  </Button>
                )}
                {[GameStatus.DONE].includes(gameState.status) && (
                  <Button disabled w={rem(150)} className={styles.play_btn}>
                    Запуск игры...
                  </Button>
                )}
                {![
                  GameStatus.FETCHING,
                  GameStatus.DOWNLOADING,
                  GameStatus.PREPARING,
                  GameStatus.PLAYING,
                  GameStatus.DONE,
                ].includes(gameState.status) && (
                  <>
                    <Button
                      w={rem(40)}
                      onClick={() =>
                        setContentType(CurrentContentType.Settings)
                      }
                      color={"dark.4"}
                      className={styles.settings_btn}
                    >
                      <IconSettings width={20} height={20} />
                    </Button>
                    {(filesList.length > 0 || optionalFilesChecking) && (
                      <Button
                        w={rem(40)}
                        onClick={() =>
                          setContentType(CurrentContentType.OptionalFiles)
                        }
                        loading={optionalFilesChecking}
                        disabled={optionalFilesChecking}
                        color={"dark.4"}
                        className={styles.settings_btn}
                      >
                        <IconEdit width={20} height={20} />
                      </Button>
                    )}
                  </>
                )}
              </section>

              {!authState.authed && (
                <Tooltip
                  position={"bottom"}
                  color={"gray"}
                  label={
                    <Text fz={"xs"}>
                      Вы можете запустить игру, но, чтобы поиграть
                      <br /> на серверах <InfinitySpanText fz={"xs"} />,
                      потребуется войти в аккаунт
                    </Text>
                  }
                >
                  <Text mt={"xs"} fw={500} fz={"xs"} c={"red.9"}>
                    Для игры на сервере требуется вход ⓘ
                  </Text>
                </Tooltip>
              )}
            </Box>
          </motion.div>
        );
    }
  };

  return (
    <AnimatedPage>
      {initialized && gameProfilesState.retrieved && (
        <main
          className={styles.main}
          style={
            {
              "--infinity-image": `url("${
                gameProfilesState.profiles.at(Number(id) - 1)!
                  .pageBackgroundImgUrl
              }")`,
            } as CSSProperties
          }
        >
          <Text mb={rem(10)} w={rem(400)} fw={"bold"} fz={"24px"}>
            {gameProfilesState.profiles.at(Number(id) - 1)!.title}
          </Text>
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </main>
      )}
      {!gameProfilesState.retrieved && (
        <Text mt={rem(100)} fz={"xl"}>
          Получаю игровые режимы...
        </Text>
      )}
    </AnimatedPage>
  );
}
