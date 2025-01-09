import styles from "./LauncherUpdatingPage.module.css";
import {Anchor, Box, rem, Text} from "@mantine/core";
import AnimatedPage from "../../components/AnimatedPage/AnimatedPage";
import {useCallback, useEffect} from "react";
import {AnimatePresence, motion} from "motion/react"
import {RestartApp, Update} from "../../wailsjs/go/main/App";
import {BrowserOpenURL} from "../../wailsjs/runtime";
import {getLauncherDownloadUrl} from "../../utils/url";
import {useAppSelector} from "../../store/hooks";
import store from "../../store";
import {
    launcherUpdateDecreaseCountdown, setLauncherRestarting,
    setLauncherUpdateError,
    setLauncherUpdating
} from "../../store/launcherUpdate";

export default function LauncherUpdatingPage() {
    const launcherUpdatingState = useAppSelector(state => state.launcherUpdate)

    const update = useCallback(async () => {
        if (launcherUpdatingState.updating) return
        store.dispatch(setLauncherUpdating(true))

        try {
            await Update()

            store.dispatch(setLauncherRestarting(true))
            await new Promise(resolve => setTimeout(resolve, 2000))

            await RestartApp()
        } catch (e) {
            console.log(e)
            store.dispatch(setLauncherUpdateError(true))
        }
    }, [launcherUpdatingState.updating])

    useEffect(() => {
        let timeout: number;
        if (!launcherUpdatingState.updating && launcherUpdatingState.countdown > 0) {
            timeout = setTimeout(() => store.dispatch(launcherUpdateDecreaseCountdown()), 1000);
        } else {
            update()
        }
        return () => {
            clearTimeout(timeout)
        }
    }, [launcherUpdatingState.updating, launcherUpdatingState.countdown]);

    return <>
        <AnimatedPage>
            <main onClick={!launcherUpdatingState.updating ? update : undefined} className={styles.main}>
                {launcherUpdatingState.error ?
                    <Box ta={"center"} mt={rem(130)}>
                        <Text fw={"600"} fz={"h2"} ta={"center"}>Ошибка обновления</Text>
                        <AnimatePresence>
                            <motion.div exit={{opacity: 0}} animate={{opacity: 1}} initial={{opacity: 0}}>
                                <Text c={"dimmed"} fz={"xs"}>
                                    Скачайте актуальную версию вручную по ссылке:
                                </Text>
                                <Anchor component={"div"} onClick={() => BrowserOpenURL(getLauncherDownloadUrl())} fz={"sm"}>
                                    infinityserver.ru/launcher
                                </Anchor>
                            </motion.div>
                        </AnimatePresence>
                    </Box>
                    :
                    <Box ta={"center"} mt={rem(130)}>
                        <Text fw={"600"} fz={"h2"} ta={"center"}>{launcherUpdatingState.message}</Text>
                        <AnimatePresence>
                            {!launcherUpdatingState.updating &&
                                <>
                                    <motion.div exit={{opacity: 0}} initial={{opacity: 1}}>
                                        <Text c={"dimmed"} fz={"xs"}>
                                            Нажмите куда-нибудь, чтобы начать обновление
                                        </Text>
                                        <Text c={"dimmed"} fz={"xs"}>
                                            Обновится автоматически через: {launcherUpdatingState.countdown}
                                        </Text>
                                    </motion.div>
                                </>
                            }
                        </AnimatePresence>
                    </Box>
                }
            </main>
        </AnimatedPage>
    </>
}