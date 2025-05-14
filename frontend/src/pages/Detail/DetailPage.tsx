import {CSSProperties} from "react";
import AnimatedPage from "../../components/AnimatedPage/AnimatedPage";
import styles from "./DetailPage.module.css";
import {useParams} from "react-router-dom";
import {IconSettings} from "@tabler/icons-react";
import {Button, Group, rem, Text, Title, Tooltip} from "@mantine/core";
import {useAppSelector} from "../../store/hooks";
import GameProfileSettingsModal from "../../components/GameProfileSettingsModal/GameProfileSettingsModal";
import {useDisclosure} from "@mantine/hooks";
import store from "../../store";
import {modals} from "@mantine/modals";
import InfinitySpanText from "../../components/InfinitySpanText";
import cx from "clsx";
import {EventsEmit} from "../../wailsjs/runtime";
import downloadService from "../../services/download"
import {gameActions, GameStatus} from "../../store/game";

export default function DetailPage() {
    const {id} = useParams();
    const authState = useAppSelector(state => state.auth)
    const gameProfilesState = useAppSelector(state => state.gameProfiles)
    // const downloadState = useAppSelector(state => state.download)
    const gameState = useAppSelector(state => state.game)

    // const isCurrentClientDownloading = downloadState.clientDownloadingID === Number(id)
    // const isCurrentClientPlaying = gameState.clientPlayingID === Number(id)

    const [opened, settingsModalHandlers] = useDisclosure(false);

    function getStatusText(status: GameStatus): string {
        const statuses = {
            [GameStatus.IDLE]: "",
            [GameStatus.FETCHING]: "Получаю файлы игры...",
            [GameStatus.DOWNLOADING]: "Загрузка...",
            [GameStatus.PREPARING]: "Подготовка файлов игры...",
            [GameStatus.DONE]: "",
            [GameStatus.PLAYING]: "Игра запущена",
            [GameStatus.ERROR]: gameState.error,
        }
        return statuses[status]!
    }

    async function handlePlay() {
        const authState = store.getState().auth
        if (authState.authed) {
            await play()
            return
        }

        modals.openConfirmModal({
            withCloseButton: false,
            centered: true,
            children: (
                <Text>
                    Без входа в аккаунт у вас не будет доступа к серверам <InfinitySpanText/>
                </Text>
            ),
            labels: {confirm: 'Все равно играть', cancel: 'Отмена'},
            onCancel: () => {
            },
            onConfirm: async () => await play(),
        });
    }

    async function play() {
        store.dispatch(gameActions.idle())
        await downloadService.play(Number(id))
    }

    async function handleCancel() {
        EventsEmit("cancel")

    }

    async function handleCloseGame() {
        EventsEmit("closeGame")
        store.dispatch(gameActions.idle())
    }

    return (
        <AnimatedPage>
            {gameProfilesState.retrieved && <main
                className={styles.main}
                style={
                    {
                        "--infinity-image": `url("${gameProfilesState.profiles.at(Number(id) - 1)!.pageBackgroundImgUrl}")`,
                    } as CSSProperties
                }
            >
                <div className={styles.content}>
                    <Title w={rem(400)} order={1}>{gameProfilesState.profiles.at(Number(id) - 1)!.title}</Title>
                    <Text w={rem(400)}
                          mt={rem(25)}>{gameProfilesState.profiles.at(Number(id) - 1)!.description}</Text>
                    <section className={styles.buttons}>
                        {[GameStatus.IDLE, GameStatus.ERROR].includes(gameState.status) &&
                            <Button onClick={handlePlay} w={rem(150)} className={styles.play_btn}
                                    color={authState.authed ? "green" : "yellow"}>Играть</Button>}
                        {[GameStatus.DOWNLOADING, GameStatus.PREPARING].includes(gameState.status) &&
                            <Button onClick={handleCancel} w={rem(150)} className={styles.play_btn}
                                    color={"red"}>Отменить</Button>}
                        {[GameStatus.FETCHING].includes(gameState.status) &&
                            <Button disabled w={rem(210)} className={styles.play_btn}
                                    color={"gray"}>Получаю файлы...</Button>}
                        {[GameStatus.PLAYING].includes(gameState.status) &&
                            <Button onClick={handleCloseGame} w={rem(150)} className={styles.play_btn}
                                    color={"cyan"}>Закрыть</Button>}
                        {[GameStatus.DONE].includes(gameState.status) &&
                            <Button disabled w={rem(180)} className={styles.play_btn}
                                    color={authState.authed ? "green" : "yellow"}>Запуск игры...</Button>}
                        <Button
                            disabled={[GameStatus.FETCHING, GameStatus.DOWNLOADING, GameStatus.PREPARING, GameStatus.PLAYING].includes(gameState.status)}
                            w={rem(45)} onClick={settingsModalHandlers.open} color={"indigo.9"}
                            className={styles.settings_btn}>
                            <IconSettings width={24} height={24}/>
                        </Button>
                    </section>


                    {!authState.authed && <Tooltip position={"bottom"} color={"gray"}
                                                   label={<Text fz={"xs"}>Вы можете запустить игру, но, чтобы
                                                       поиграть<br/> на сервере от <InfinitySpanText fz={"xs"}/>,
                                                       потребуется вход в
                                                       аккаунт</Text>}><Text mt={"xs"} fz={"xs"} c={"dimmed"}>Для игры
                        на сервере требуется вход ⓘ</Text></Tooltip>}

                    <Text style={{overflow: "visible"}} fz={"sm"}
                          mt={rem(20)}>{getStatusText(gameState.status)}</Text>

                    {[GameStatus.DOWNLOADING].includes(gameState.status) &&
                        <>
                            <progress
                                max={gameState.downloadProgress.done}
                                value={gameState.downloadProgress.total}
                                className={cx(styles.progress_bar, {
                                    [styles.downloading]: gameState.status == GameStatus.DOWNLOADING,
                                })}
                            />

                            <Group w={rem(400)} justify={"space-between"}>
                                <Text fz={"xs"}
                                      c={"dimmed"}>{gameState.downloadProgress.done} Мб
                                    / {gameState.downloadProgress.total} Мб</Text>
                            </Group>
                        </>
                    }

                </div>
                <GameProfileSettingsModal opened={opened} close={settingsModalHandlers.close}
                                          profile={gameProfilesState.profiles.at(Number(id) - 1)!}/>
            </main>}
            {!gameProfilesState.retrieved && <Text mt={rem(100)} fz={"xl"}>Получаю игровые режимы...</Text>}

        </AnimatedPage>
    );
}
