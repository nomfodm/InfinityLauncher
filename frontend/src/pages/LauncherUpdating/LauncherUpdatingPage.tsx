import styles from "./LauncherUpdatingPage.module.css";
import {Box, rem, Text} from "@mantine/core";
import AnimatedPage from "../../components/AnimatedPage/AnimatedPage";
import {useCallback, useEffect, useState} from "react";
import {AnimatePresence, motion} from "motion/react"
import {GetActualLauncherVersion, GetVersion, RestartApp, Update} from "../../wailsjs/go/main/App";
import {useAppSelector} from "../../store/hooks";
import store from "../../store";
import {launcherUpdateActions, LauncherUpdateStatus} from "../../store/launcherUpdate";
import {main} from "../../wailsjs/go/models";

export default function LauncherUpdatingPage() {
    const launcherUpdatingState = useAppSelector(state => state.launcherUpdate)

    const [currentVersionNumber, setCurrentVersionNumber] = useState<string>("");
    const [newLauncherVersionInfo, setNewLauncherVersionInfo] = useState<main.LauncherVersion>()

    const [infoMessage, setInfoMessage] = useState("Найдено обязательное обновление")

    const update = useCallback(async () => {
        if (launcherUpdatingState.status === LauncherUpdateStatus.UPDATING) return
        store.dispatch(launcherUpdateActions.updating())

        try {
            await new Promise(resolve => setTimeout(resolve, 2000))
            await Update()

            store.dispatch(launcherUpdateActions.restarting())
            await new Promise(resolve => setTimeout(resolve, 3000))

            await RestartApp()
        } catch (e) {
            console.log(e)
            store.dispatch(launcherUpdateActions.setErrorMessage(`${e}`))
            store.dispatch(launcherUpdateActions.error())
        }
    }, [])

    useEffect(() => {
        async function wrapper() {
            setNewLauncherVersionInfo(await GetActualLauncherVersion())
            setCurrentVersionNumber(await GetVersion())
        }

        wrapper()
    }, []);

    useEffect(() => {
        let timeout: number;
        if (launcherUpdatingState.status !== LauncherUpdateStatus.UPDATING && launcherUpdatingState.status !== LauncherUpdateStatus.RESTARTING && launcherUpdatingState.countdown > 0) {
            timeout = setTimeout(() => store.dispatch(launcherUpdateActions.launcherUpdateDecreaseCountdown()), 1000);
        } else {
            update()
        }
        return () => {
            clearTimeout(timeout)
        }
    }, [launcherUpdatingState.countdown]);

    useEffect(() => {
        switch (launcherUpdatingState.status) {
            case LauncherUpdateStatus.UPDATING:
                setInfoMessage("Обновление...")
                break
            case LauncherUpdateStatus.RESTARTING:
                setInfoMessage("Обновление завершено")
                break
            case LauncherUpdateStatus.IDLE:
                setInfoMessage("Найдено обязательное обновление")
                break
            case LauncherUpdateStatus.ERROR:
                setInfoMessage("Ошибка обновления")
                break
        }

    }, [launcherUpdatingState.status]);

    return <>
        <AnimatedPage>
            <main
                onClick={![LauncherUpdateStatus.UPDATING, LauncherUpdateStatus.RESTARTING, LauncherUpdateStatus.ERROR].includes(launcherUpdatingState.status) ? update : undefined}
                className={styles.main}>
                <Box pl={rem(28)} mt={rem(100)}>
                    <Text fw={"600"} fz={"h3"}>{infoMessage}</Text>

                    <AnimatePresence mode={"wait"}>
                        {launcherUpdatingState.status === LauncherUpdateStatus.IDLE &&
                            <motion.div key={1} exit={{opacity: 0}} initial={{opacity: 1}}>
                                <Text mt={"md"} c={"dimmed"} fz={"sm"}>
                                    Нажмите куда-нибудь, чтобы обновиться сейчас
                                </Text>
                                <Text c={"dimmed"} fz={"sm"}>
                                    Обновится сам через: {launcherUpdatingState.countdown} секунд
                                </Text>
                            </motion.div>

                        }
                        {launcherUpdatingState.status === LauncherUpdateStatus.RESTARTING &&
                            <motion.div key={2} exit={{opacity: 0}} animate={{opacity: 1}} initial={{opacity: 0}}>
                                <Text mt={"md"} c={"dimmed"} fz={"sm"}>
                                    Обновлен до {newLauncherVersionInfo?.version}
                                </Text>
                                <Text c={"dimmed"} fz={"sm"}>
                                    Лаунчер перезапускается...
                                </Text>
                            </motion.div>

                        }
                        {launcherUpdatingState.status === LauncherUpdateStatus.ERROR &&
                            <motion.div key={3} exit={{opacity: 0}} animate={{opacity: 1}} initial={{opacity: 0}}>
                                <Text mt={"md"} c={"dimmed"} fz={"sm"}>
                                    Произошла ошибка во время обновления до версии {newLauncherVersionInfo?.version}:
                                </Text>
                                <Text c={"red"} fz={"sm"}>
                                    {launcherUpdatingState.error}
                                </Text>
                            </motion.div>

                        }
                    </AnimatePresence>
                </Box>

                <AnimatePresence>
                    {newLauncherVersionInfo && currentVersionNumber && ![LauncherUpdateStatus.RESTARTING].includes(launcherUpdatingState.status) &&
                        <motion.div key={4} exit={{opacity: 0}} initial={{opacity: 1}}>
                            <Box pos={"absolute"} bottom={rem(28)} left={rem(28)}>
                                <Text mt={rem(240)} c={"dimmed"} fz={"xs"}>
                                    {currentVersionNumber} {"->"} {newLauncherVersionInfo?.version}
                                </Text>

                                <Text c={"dimmed"} fz={"xs"}>
                                    {newLauncherVersionInfo?.version} SHA256: {newLauncherVersionInfo?.sha256}
                                </Text>
                            </Box>
                        </motion.div>
                    }
                </AnimatePresence>

            </main>
        </AnimatedPage>
    </>
}