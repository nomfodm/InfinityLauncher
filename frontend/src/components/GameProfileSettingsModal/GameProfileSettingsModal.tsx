import {Box, Modal, Paper, rem, Slider, Text} from "@mantine/core";
import {IconX} from "@tabler/icons-react";
import {useEffect, useState} from "react";
import {InitGameProfileConfig, MkDirAll, ReadGameProfileConfig, WriteGameProfileConfig} from "../../wailsjs/go/main/FS";
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
            await InitGameProfileConfig(profile.id, profile.name)
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
        const newPath = await OpenDirectoryDialog(config.path)
        config.path = newPath
        await WriteGameProfileConfig(profile.id, config)
        await MkDirAll(newPath)
        setGamePath(newPath)
    }

    async function handleRAMChange(value: number) {
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
                <Box className={styles.noDrag} mt={"xs"} w={"100%"} h={rem(50)}>
                    <Slider
                        min={1024}
                        max={totalRam}
                        value={ram}
                        step={256}
                        h={"100%"}
                        onChange={(value) => setRAM(value)}
                        onChangeEnd={handleRAMChange}
                        marks={Array.from({length: totalRam / 1024}).map((_, index) => ({
                            value: (index + 1) * 1024,
                            label: `${index + 1}GB`
                        }))}
                        className={cx(styles.slider)}
                    />
                </Box>

                <Text mt={"md"}>Расположение файлов клиента:</Text>
                <Text ml={"xs"} td={"underline"} style={{cursor: "pointer"}} onClick={handleChoosePath} lineClamp={10}>{gamePath}</Text>

            </Paper>
        </Modal>
    );
}
