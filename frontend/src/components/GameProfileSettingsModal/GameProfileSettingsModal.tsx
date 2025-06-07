import {Box, Modal, NumberInput, Paper, Slider, Text} from "@mantine/core";
import {IconX} from "@tabler/icons-react";
import {useEffect, useState} from "react";
import {MkDirAll, ReadGameProfileConfig, WriteGameProfileConfig} from "../../wailsjs/go/main/FS";
import {main} from "../../wailsjs/go/models";
import styles from "./GameProfileSettingsModal.module.css"
import {GetTotalRAMInMB} from "../../wailsjs/go/main/System";
import cx from "clsx"
import {floorRamValue} from "../../utils/ram";
import {OpenDirectoryDialog} from "../../wailsjs/go/main/App";
import GameProfile = main.GameProfile;

export default function GameProfileSettingsModal({
                                                     opened,
                                                     close,
                                                     profile,
                                                 }: {
    opened: boolean;
    close: () => void;
    profile: GameProfile
}) {
    const [ram, setRAM] = useState<number>(0)
    const [gamePath, setGamePath] = useState<string>("")

    const [totalRam, setTotalRAM] = useState<number>(0)

    useEffect(() => {
        async function asyncWrapper() {
            const totalRAM = await GetTotalRAMInMB();
            setTotalRAM(floorRamValue(totalRAM - 2 * 1024))

            const config = await ReadGameProfileConfig(profile.id);
            setRAM(config.ram)
            setGamePath(config.path)
        }

        asyncWrapper();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleChoosePath() {
        const config = await ReadGameProfileConfig(profile.id)
        const oldPath = config.path
        const newPath = await OpenDirectoryDialog(config.path)
        config.path = newPath
        if (newPath.trim() === "") {
            config.path = oldPath
        }
        await WriteGameProfileConfig(profile.id, config)
        await MkDirAll(newPath)
        setGamePath(newPath)
    }

    async function handleRAMChange(valueRaw: number | string) {
        let value = Number(valueRaw)
        console.log(value)
        if (value <= 1024) {
            value = 1024
        }
        setRAM(value)
        if (ram === value) {
            return
        }
        const config = await ReadGameProfileConfig(profile.id)
        config.ram = value

        await WriteGameProfileConfig(profile.id, config)
    }

    return (
        <Modal
            opened={opened}
            onClose={close}
            size={"lg"}
            centered
            overlayProps={{
                backgroundOpacity: 0.5,
                blur: 3,
            }}
            closeButtonProps={{
                size: 20,
                icon: <IconX/>,
            }}
            title={profile.title}
        >
            <Paper bg={"none"} p={"sm"}>
                <Text>Оперативная
                    память: {ram > 1024 ? `${ram} Mb / ${totalRam} Mb` : "автоматически".toUpperCase()}</Text>
                <Box className={styles.noDrag} mt={"xs"} w={"100%"}>
                    <Slider
                        min={1024}
                        max={totalRam}
                        value={ram}
                        step={256}
                        onChange={(value) => setRAM(value)}
                        onChangeEnd={handleRAMChange}
                        marks={Array.from({length: totalRam / 1024}).map((_, index) => ({
                            value: (index + 1) * 1024,
                        }))}
                        className={cx(styles.slider)}
                    />
                    <NumberInput
                        mt={"xs"}
                        color={"white"}
                        min={1024}
                        clampBehavior="strict"
                        max={totalRam}
                        value={ram == 1024 ? "" : ram}
                        suffix={"MB"}
                        w={"35%"}
                        placeholder={"АВТОМАТИЧЕСКИ"}
                        onChange={handleRAMChange}
                    />
                </Box>

                <Text mt={"md"}>Расположение файлов клиента:</Text>
                <Text ml={"xs"} td={"underline"} style={{cursor: "pointer"}} onClick={handleChoosePath} lineClamp={10}>{gamePath}</Text>

            </Paper>
        </Modal>
    );
}
