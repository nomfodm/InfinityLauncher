import styles from "../GameProfileOptionalFilesModal/GameProfileOptionalFilesModal.module.css";
import {Checkbox, Flex, rem, Text} from "@mantine/core";
import {main} from "../../wailsjs/go/models";
import React from "react";

export default function OptionalFileCard({data, defaultChecked, handleCallback}:
{data: main.OptionalFileEntry, defaultChecked: boolean, handleCallback: CallableFunction}) {
    const launcherData = data.launcherData


    async function handleCheckbox(e: React.ChangeEvent<HTMLInputElement>) {
        handleCallback(data.md5, e.target.checked)
    }

    return <>
        <Flex p={"sm"} bg={"gray.9"}
              className={styles.noDrag}
              mt={"xs"} gap={"xs"} w={"100%"}
              align={"center"}
              style={{borderRadius: rem(10)}}
        >
            <Checkbox defaultChecked={defaultChecked} onChange={handleCheckbox}/>
            <Flex direction={"column"} justify={"center"} w={"90%"}>
                <Flex gap={"xs"} align={"center"}>
                    <Text fz={"lg"} c={launcherData.typeMantineColor}>[{launcherData.type}]</Text>
                    <Text fz={"lg"}>{launcherData.name}</Text>
                </Flex>
                <Text fz={"sm"} c={"dimmed"} ta={"justify"}>{launcherData.description}</Text>
            </Flex>
        </Flex>
    </>
}