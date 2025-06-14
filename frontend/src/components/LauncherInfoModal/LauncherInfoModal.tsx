import {Anchor, Box, Flex, Loader, Modal, rem, Text} from "@mantine/core";
import {IconAlertHexagon, IconCheck, IconX} from "@tabler/icons-react";
import {useEffect, useState} from "react";
import {GetVersion, IsAnyUpdateAvailable, RestartApp, Update} from "../../wailsjs/go/main/App";
import {AnimatePresence, motion} from "motion/react";

import styles from "./LauncherInfoModal.module.css"

export default function LauncherInfoModal({
                                              opened,
                                              close,
                                          }: {
    opened: boolean;
    close: () => void;
}) {
    enum UpdateFlowStatus {
        CHECKING,
        FOUND,
        NOUPDATES,
        UPDATING,
        RESTARTING,
        ERROR
    }

    const [error, setError] = useState("")

    const [version, setVersion] = useState("v0.0.0")
    const [status, setStatus] = useState<UpdateFlowStatus>(UpdateFlowStatus.CHECKING)


    useEffect(() => {
        async function wrapper() {
            setVersion(await GetVersion())
        }

        wrapper()
    }, []);

    useEffect(() => {
        async function wrapper() {
            if (!opened) {
                return
            }
            setStatus(UpdateFlowStatus.CHECKING)
            await new Promise(resolve => setTimeout(resolve, 500))

            const isUpdates = await IsAnyUpdateAvailable()
            if (isUpdates) {
                setStatus(UpdateFlowStatus.FOUND)
            } else {
                setStatus(UpdateFlowStatus.NOUPDATES)
            }
        }

        wrapper()
    }, [opened]);

    function handleClose() {
        if ([UpdateFlowStatus.UPDATING, UpdateFlowStatus.RESTARTING].includes(status)) {
            return
        }
        close()
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
                icon: ![UpdateFlowStatus.UPDATING, UpdateFlowStatus.RESTARTING].includes(status) ? <IconX/> : " ",
            }}
            title={<Text fz={"h3"} fw={"bold"}>О приложении</Text>}
        >
            <Flex mt={rem(-20)} gap={rem(20)} bg={"none"} p={"sm"}>
                <img className={styles.logo} alt="logo" height={"20%"} width={"20%"}/>
                <Box>
                    <Text fz={"h2"} fw={"bold"}>Infinity Launcher <Text component={"span"} c={"dimmed"} fz={"sm"}>{version}</Text></Text>


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
                                    <IconAlertHexagon style={{width: rem(18), height: rem(18)}} color={"yellow"}/>
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
                                    <IconCheck style={{width: rem(18), height: rem(18)}} color={"green"}/>
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
                            <motion.div key={5} exit={{opacity: 0}} animate={{opacity: 1}} initial={{opacity: 0}}>
                                <Flex gap={rem(10)} align={"flex-start"} mt={rem(5)}>
                                    <IconX style={{width: rem(18), height: rem(18)}} color={"red"}/>
                                    <Box>
                                        <Text size={"sm"}>Ошибка во время обновления:</Text>
                                        <Text size={"sm"} c={"red"}>{error}</Text>
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
