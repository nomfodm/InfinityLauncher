import {Flex, Group, Modal, rem, Switch, Text} from "@mantine/core";
import {IconMoodWink, IconX} from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import {ReadLauncherConfig, WriteLauncherConfig} from "../../wailsjs/go/main/FS";


export default function SettingsModal({
  opened,
  close,
}: {
  opened: boolean;
  close: () => void;
}) {
  const [closeWithFunnyAnimation, setCloseWithFunnyAnimation] = useState<boolean>(true);

  useEffect(() => {
    async function asyncWrapper() {
      const config = await ReadLauncherConfig();

      setCloseWithFunnyAnimation(config.closeWithFunnyAnimation);
    }

    asyncWrapper();
  }, []);

  async function handleCloseOnGameStartSwitch(e: React.ChangeEvent<HTMLInputElement>) {
    setCloseWithFunnyAnimation(e.target.checked);

    const config = await ReadLauncherConfig();
    config.closeWithFunnyAnimation = e.target.checked;

    await WriteLauncherConfig(config);
  }

  return (
    <Modal
      opened={opened}
      onClose={close}
      centered
      overlayProps={{
        backgroundOpacity: 0.5,
        blur: 3,
      }}
      closeButtonProps={{
        size: 15,
        icon: <IconX />,
      }}
      closeOnClickOutside={false}
      title={<Text fz={"h3"} fw={"bold"}>Настройки лаунчера</Text>}
    >
      <Group>
        <Switch
          defaultChecked={closeWithFunnyAnimation}
          onChange={handleCloseOnGameStartSwitch}
        />
        <Flex align={"center"} gap={rem(5)}>
          <Text>Закрывать лаунчер на приятной нотке</Text>
          <IconMoodWink/>
        </Flex>

      </Group>
    </Modal>
  );
}
