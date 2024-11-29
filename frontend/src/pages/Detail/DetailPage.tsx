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
import {downloadIdle, DownloadStatus} from "../../store/download";
import {modals} from "@mantine/modals";
import InfinitySpanText from "../../components/InfinitySpanText";
import cx from "clsx";
import {EventsEmit} from "../../wailsjs/runtime";
import downloadService from "../../services/download"
import {gameIdle, GameStatus} from "../../store/game";

export default function DetailPage() {
    const {id} = useParams();
    const authState = useAppSelector(state => state.auth)
    const gameProfilesState = useAppSelector(state => state.gameProfiles)
    const downloadState = useAppSelector(state => state.download)
    const gameState = useAppSelector(state => state.game)

    const isCurrentClientDownloading = downloadState.clientDownloadingID === Number(id)
    const isCurrentClientPlaying = gameState.clientIDPlaying === Number(id)

    const [opened, settingsModalHandlers] = useDisclosure(false);

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
        await downloadService.play(Number(id))
    }

    async function handleCancel() {
        EventsEmit("cancel")
        store.dispatch(gameIdle())
        store.dispatch(downloadIdle())
    }

    async function handleCloseGame() {
        EventsEmit("closeGame")
        store.dispatch(gameIdle())
        store.dispatch(downloadIdle())
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
                    {isCurrentClientDownloading && !isCurrentClientPlaying ?
                        <section className={styles.buttons}>
                            {[DownloadStatus.IDLE, DownloadStatus.ERROR].includes(downloadState.status) &&
                                <Button onClick={handlePlay} w={rem(150)} className={styles.play_btn}
                                        color={authState.authed ? "green" : "yellow"}>Играть</Button>}
                            {[DownloadStatus.DOWNLOADING, DownloadStatus.EXTRACTING].includes(downloadState.status) &&
                                <Button onClick={handleCancel} w={rem(150)} className={styles.play_btn}
                                        color={"red"}>Отменить</Button>}
                            {[DownloadStatus.FETCHING].includes(downloadState.status) &&
                                <Button disabled w={rem(210)} className={styles.play_btn}
                                        color={"gray"}>Получаю файлы...</Button>}
                            {[DownloadStatus.SUCCESS].includes(downloadState.status) &&
                                <Button w={rem(150)} disabled className={styles.play_btn}
                                        color={authState.authed ? "green" : "yellow"}>Играть</Button>}
                            <Button
                                disabled={[DownloadStatus.DOWNLOADING, DownloadStatus.EXTRACTING, DownloadStatus.FETCHING].includes(downloadState.status)}
                                w={rem(45)} onClick={settingsModalHandlers.open} color={"indigo.9"}
                                className={styles.settings_btn}>
                                <IconSettings width={24} height={24}/>
                            </Button>
                        </section>
                        :
                        <>
                            {isCurrentClientPlaying ?
                                <>
                                    <section className={styles.buttons}>
                                        {[GameStatus.IDLE, GameStatus.ERROR].includes(gameState.status) &&
                                            <Button onClick={handlePlay} w={rem(150)} className={styles.play_btn}
                                                    color={authState.authed ? "green" : "yellow"}>Играть</Button>}
                                        {[GameStatus.PLAYING].includes(gameState.status) &&
                                            <Button onClick={handleCloseGame} w={rem(150)} className={styles.play_btn}
                                                    color={"cyan"}>Закрыть</Button>}
                                        <Button
                                            disabled={[GameStatus.PLAYING].includes(gameState.status)}
                                            w={rem(45)} onClick={settingsModalHandlers.open} color={"indigo.9"}
                                            className={styles.settings_btn}>
                                            <IconSettings width={24} height={24}/>
                                        </Button>
                                    </section>
                                </>
                                :
                                <section className={styles.buttons}>
                                    <Button
                                        disabled={[DownloadStatus.DOWNLOADING, DownloadStatus.EXTRACTING, DownloadStatus.FETCHING].includes(downloadState.status) || [GameStatus.PLAYING].includes(gameState.status)}
                                        onClick={handlePlay} w={rem(150)} className={styles.play_btn}
                                        color={authState.authed ? "green" : "yellow"}>Играть</Button>
                                    <Button
                                        w={rem(45)} onClick={settingsModalHandlers.open} color={"indigo.9"}
                                        className={styles.settings_btn}>
                                        <IconSettings width={24} height={24}/>
                                    </Button>
                                </section>
                            }
                        </>

                    }


                    {!authState.authed && <Tooltip position={"bottom"} color={"gray"}
                                                   label={<Text fz={"xs"}>Вы можете запустить игру, но, чтобы
                                                       поиграть<br/> на сервере от <InfinitySpanText fz={"xs"}/>,
                                                       потребуется вход в
                                                       аккаунт</Text>}><Text mt={"xs"} fz={"xs"} c={"dimmed"}>Для игры
                        на сервере требуется вход ⓘ</Text></Tooltip>}
                    {isCurrentClientDownloading &&
                        <>
                        {![DownloadStatus.IDLE, DownloadStatus.SUCCESS].includes(downloadState.status) &&
                                <Text style={{overflow: "visible"}} fz={"sm"}
                                      mt={rem(20)}>{downloadState.downloadProgress.progressMessage}</Text>}
                            {[DownloadStatus.DOWNLOADING, DownloadStatus.EXTRACTING, DownloadStatus.ERROR].includes(downloadState.status) &&
                                <>
                                    <progress
                                        max={downloadState.downloadProgress.progressTotal}
                                        value={downloadState.downloadProgress.progressValue}
                                        className={cx(styles.progress_bar,
                                            {[styles.downloading]: downloadState.status === DownloadStatus.DOWNLOADING},
                                            {[styles.extracting]: downloadState.status === DownloadStatus.EXTRACTING},
                                            {[styles.error]: downloadState.status === DownloadStatus.ERROR})}
                                    />

                                    <Group w={rem(400)} justify={"space-between"}>
                                        {![DownloadStatus.ERROR].includes(downloadState.status) &&
                                            <Text fz={"xs"}
                                                  c={"dimmed"}>{downloadState.downloadProgress.progressValue} Мб
                                                / {downloadState.downloadProgress.progressTotal} Мб</Text>}
                                        {[DownloadStatus.DOWNLOADING].includes(downloadState.status) &&
                                            <Text fz={"xs"}
                                                  c={"dimmed"}>{downloadState.downloadProgress.downloadSpeed.toFixed(2)} Мб/с</Text>}
                                    </Group>


                                </>
                            }
                        </>
                    }

                    {isCurrentClientPlaying &&
                        <>
                            <Text style={{overflow: "visible"}} fz={"sm"} mt={rem(20)} c={"dimmed"}>{gameState.statusMessage}</Text>
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
