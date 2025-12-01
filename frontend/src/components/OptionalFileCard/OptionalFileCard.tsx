import styles from "./OptionalFileCard.module.css";
import { Checkbox, Flex, rem, Text } from "@mantine/core";
import { main } from "../../wailsjs/go/models";
import React from "react";

export default function OptionalFileCard({
  data,
  defaultChecked,
  handleCallback,
}: {
  data: main.OptionalFileEntry;
  defaultChecked: boolean;
  handleCallback: CallableFunction;
}) {
  const launcherData = data.launcherData;

  async function handleCheckbox(e: React.ChangeEvent<HTMLInputElement>) {
    handleCallback(data.md5, e.target.checked);
  }

  return (
    <>
      <Flex className={styles.noDrag} w={"100%"} align={"center"} mb={rem(20)}>
        <Flex justify={"center"} align={"center"} w={rem(50)}>
          <Checkbox
            size={rem(15)}
            defaultChecked={defaultChecked}
            onChange={handleCheckbox}
          />
        </Flex>

        <Flex w={rem(269)} direction={"column"} justify={"center"}>
          <Flex gap={"xs"} align={"center"}>
            <Text fz={"15px"} c={launcherData.typeMantineColor}>
              [{launcherData.type}]
            </Text>
            <Text fz={"15px"}>{launcherData.name}</Text>
          </Flex>
          <Text fz={"12px"} c={"#8F8F8F"} lh={rem(16)} ta={"justify"}>
            {launcherData.description}
          </Text>
        </Flex>
      </Flex>
    </>
  );
}
