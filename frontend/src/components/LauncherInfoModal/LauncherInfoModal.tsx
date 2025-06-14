import {Anchor, Box, Flex, Loader, Modal, rem, Text} from "@mantine/core";
import {IconAlertHexagon, IconCheck, IconCloudExclamation, IconX} from "@tabler/icons-react";
import {useEffect, useState} from "react";
import {
    GetVersion,
    IsAnyUpdateAvailable,
    IsMandatoryUpdateAvailable,
    RestartApp,
    Update
} from "../../wailsjs/go/main/App";
import {AnimatePresence, motion} from "motion/react";

import styles from "./LauncherInfoModal.module.css"
import {notifications} from "@mantine/notifications";

export default function LauncherInfoModal({
                                              opened,
                                              handlers,
                                          }: {
    opened: boolean;
    handlers: { readonly open: () => void, readonly close: () => void, readonly toggle: () => void }
}) {
    enum UpdateFlowStatus {
        CHECKING,
        FOUND,
        MANDATORYFOUND,
        NOUPDATES,
        UPDATING,
        RESTARTING,
        ERROR
    }

    const [error, setError] = useState("")

    const [version, setVersion] = useState("v0.0.0")
    const [status, setStatus] = useState<UpdateFlowStatus>(UpdateFlowStatus.CHECKING)

    const [countdown, setCountdown] = useState(10)

    const [showedNotification, setShowedNotification] = useState(false)


    useEffect(() => {
        async function wrapper() {
            setVersion(await GetVersion())
        }

        wrapper()
    }, []);

    useEffect(() => {
        async function wrapper() {
            if (!opened && showedNotification) {
                return
            }

            setCountdown(10)
            setStatus(UpdateFlowStatus.CHECKING)
            await new Promise(resolve => setTimeout(resolve, 500))

            const isUpdate = await IsAnyUpdateAvailable()
            if (isUpdate) {
                const isUpdateMandatory = await IsMandatoryUpdateAvailable()
                if (isUpdateMandatory) {
                    setStatus(UpdateFlowStatus.MANDATORYFOUND)
                    return
                }
                if (!showedNotification) {
                    const notificationID = notifications.show({
                        title: "Найдены необязательные обновления",
                        message: <Anchor fz={"sm"} onClick={() => {
                            handlers.open()
                            notifications.hide(notificationID)
                        }}>Обновиться</Anchor>,
                        color: "transparent",
                        icon: <IconAlertHexagon style={{width: rem(20), height: rem(20)}}
                                                color={"yellow"}/>
                    })
                    setShowedNotification(true)
                }
                setStatus(UpdateFlowStatus.FOUND)
            } else {
                setStatus(UpdateFlowStatus.NOUPDATES)
            }
        }
        wrapper()
    }, [opened]);

    function handleClose() {
        if ([UpdateFlowStatus.UPDATING, UpdateFlowStatus.RESTARTING, UpdateFlowStatus.MANDATORYFOUND].includes(status)) {
            return
        }
        handlers.close()
    }

    async function update() {
        try {
            setStatus(UpdateFlowStatus.UPDATING)
            await new Promise(resolve => setTimeout(resolve, 2000))

            await Update()

            setStatus(UpdateFlowStatus.RESTARTING)
            await new Promise(resolve => setTimeout(resolve, 2000))

            await RestartApp()
        } catch (e) {
            setError(`${e}`)
            setStatus(UpdateFlowStatus.ERROR)
        }

    }

    useEffect(() => {
        let timeout: number;
        if (status === UpdateFlowStatus.MANDATORYFOUND) {
            if (countdown > 0) {
                timeout = setTimeout(() => setCountdown(countdown => countdown - 1), 1000);
            } else {
                update()
            }
        }
        return () => clearTimeout(timeout)
    }, [countdown, status]);

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            size={"100%"}
            centered
            overlayProps={{
                backgroundOpacity: 0.5,
                blur: 3,
            }}
            closeButtonProps={{
                size: 20,
                icon: ![UpdateFlowStatus.UPDATING, UpdateFlowStatus.RESTARTING, UpdateFlowStatus.MANDATORYFOUND].includes(status) ?
                    <IconX/> : " ",
            }}
            title={<Text fz={"h3"} fw={"bold"}>О приложении</Text>}
        >
            <Flex mt={rem(-20)} gap={rem(20)} bg={"none"} p={"sm"}>
                <img className={styles.logo} alt="logo" height={"20%"} width={"20%"}/>
                <Box>
                    <Text fz={"h2"} fw={"bold"}>Infinity Launcher <Text component={"span"} c={"dimmed"}
                                                                        fz={"sm"}>{version}</Text></Text>


                    <AnimatePresence mode={"wait"}>
                        {status == UpdateFlowStatus.CHECKING &&
                            <motion.div key={1} exit={{opacity: 0}} animate={{opacity: 1}} initial={{opacity: 0}}>
                                <Flex gap={rem(10)} align={"center"} mt={rem(5)}>
                                    <Loader size={"xs"} color={"blue"}/>
                                    <Text size={"sm"}>Проверка наличия обновлений...</Text>
                                </Flex>
                            </motion.div>
                        }
                        {status == UpdateFlowStatus.FOUND &&
                            <motion.div key={2} exit={{opacity: 0}} animate={{opacity: 1}} initial={{opacity: 0}}>
                                <Flex gap={rem(10)} align={"flex-start"} mt={rem(5)}>
                                    <IconAlertHexagon style={{width: rem(18), height: rem(18), marginTop: rem(1)}}
                                                      color={"yellow"}/>
                                    <Box>
                                        <Text size={"sm"}>Найдены необязательные обновления</Text>
                                        <Anchor onClick={update} size={"sm"}>Обновиться</Anchor>
                                    </Box>
                                </Flex>
                            </motion.div>
                        }
                        {status == UpdateFlowStatus.NOUPDATES &&
                            <motion.div key={3} exit={{opacity: 0}} animate={{opacity: 1}} initial={{opacity: 0}}>
                                <Flex gap={rem(10)} align={"center"} mt={rem(5)}>
                                    <IconCheck style={{width: rem(18), height: rem(18), marginTop: rem(1)}}
                                               color={"green"}/>
                                    <Text size={"sm"}>Обновлений не найдено</Text>
                                </Flex>
                            </motion.div>
                        }
                        {status == UpdateFlowStatus.UPDATING &&
                            <motion.div key={4} exit={{opacity: 0}} animate={{opacity: 1}} initial={{opacity: 0}}>
                                <Flex gap={rem(10)} align={"center"} mt={rem(5)}>
                                    <Text size={"sm"}>Обновление...</Text>
                                </Flex>
                            </motion.div>
                        }
                        {status == UpdateFlowStatus.RESTARTING &&
                            <motion.div key={5} exit={{opacity: 0}} animate={{opacity: 1}} initial={{opacity: 0}}>
                                <Flex gap={rem(10)} align={"center"} mt={rem(5)}>
                                    <Text size={"sm"}>Перезапуск...</Text>
                                </Flex>
                            </motion.div>
                        }
                        {status == UpdateFlowStatus.ERROR &&
                            <motion.div key={6} exit={{opacity: 0}} animate={{opacity: 1}} initial={{opacity: 0}}>
                                <Flex gap={rem(10)} align={"flex-start"} mt={rem(5)}>
                                    <IconX style={{width: rem(18), height: rem(18), marginTop: rem(1)}} color={"red"}/>
                                    <Box>
                                        <Text size={"sm"}>Ошибка во время обновления:</Text>
                                        <Text size={"sm"} c={"red"}>{error}</Text>
                                    </Box>
                                </Flex>
                            </motion.div>
                        }
                        {status == UpdateFlowStatus.MANDATORYFOUND &&
                            <motion.div key={7} exit={{opacity: 0}} animate={{opacity: 1}} initial={{opacity: 0}}>
                                <Flex gap={rem(10)} align={"flex-start"} mt={rem(5)}>
                                    <IconCloudExclamation style={{width: rem(18), height: rem(18), marginTop: rem(1)}}
                                                          color={"red"}/>
                                    <Box>
                                        <Text size={"sm"}>Найдено обязательное обновление</Text>
                                        <Text size={"sm"}>Обновится через {countdown} секунд</Text>
                                    </Box>
                                </Flex>
                            </motion.div>
                        }
                    </AnimatePresence>

                </Box>

            </Flex>
        </Modal>
    );
}
