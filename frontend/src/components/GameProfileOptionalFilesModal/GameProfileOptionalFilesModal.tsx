import {ActionIcon, Flex, Modal, Paper, rem, ScrollArea, Text} from "@mantine/core";
import {IconRefresh, IconX} from "@tabler/icons-react";
import {main} from "../../wailsjs/go/models";
import OptionalFileCard from "../OptionalFileCard/OptionalFileCard";
import {useEffect, useState} from "react";
import {GetOptionalFiles} from "../../wailsjs/go/main/App";
import {ReadGameProfileConfig, WriteGameProfileConfig} from "../../wailsjs/go/main/FS";
import GameProfile = main.GameProfile;
import OptionalFileEntry = main.OptionalFileEntry;

export default function GameProfileOptionalFilesModal({
                                                          opened,
                                                          close,
                                                          profile,
                                                      }: {
    opened: boolean;
    close: () => void;
    profile: GameProfile
}) {
    const [checkedList, setCheckedList] = useState<{ [p: string]: boolean }>({});
    const [filesList, setFilesList] = useState<OptionalFileEntry[]>([]);

    useEffect(() => {
        async function asyncWrapper() {
            await SetDefaults()
        }

        asyncWrapper();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function SetDefaults() {
        const config = await ReadGameProfileConfig(profile.id)
        const files = await GetOptionalFiles(profile)

        if (!config.optionalFilesEnabled) {
            config.optionalFilesEnabled = {}
        }

        files.forEach((entry) => {
            if (!(entry.md5 in config.optionalFilesEnabled)) {
                config.optionalFilesEnabled[entry.md5] = entry.launcherData.defaultEnabled;
            }
        })

        setCheckedList(config.optionalFilesEnabled)
        setFilesList(files)

        await WriteGameProfileConfig(profile.id, config)
    }

    async function handleCheckbox(md5: string, checked: boolean) {
        const config = await ReadGameProfileConfig(profile.id)

        config.optionalFilesEnabled[md5] = checked

        setCheckedList(config.optionalFilesEnabled)

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
            title={
                <Flex w={rem(550)} align={"center"} justify={"space-between"}>
                    <Text size={"xl"}>{profile.title}: опциональные файлы</Text>
                    <ActionIcon
                        variant="transparent"
                        size="sm"
                        onClick={() => SetDefaults()}
                    >
                        <IconRefresh/>
                    </ActionIcon>
                </Flex>
            }
        >
            <Paper bg={"none"} p={"sm"}>

                <ScrollArea h={rem(250)} scrollHideDelay={99999999999}>
                    {filesList ? filesList.map((file, index) => {
                        return <OptionalFileCard key={index} data={file} defaultChecked={checkedList[file.md5]}
                                                 handleCallback={handleCheckbox}/>
                    }) : "..."
                    }
                </ScrollArea>
            </Paper>
        </Modal>
    );
}
