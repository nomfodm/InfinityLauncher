import {Group, Modal, Switch, Text} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import {ReadLauncherConfig, WriteLauncherConfig} from "../../wailsjs/go/main/FS";


export default function SettingsModal({
  opened,
  close,
}: {
  opened: boolean;
  close: () => void;
}) {
  const [closeOnGameStart, setCloseOnGameStart] = useState<boolean>(true);

  useEffect(() => {
    async function asyncWrapper() {
      const config = await ReadLauncherConfig();

      setCloseOnGameStart(config.closeOnGameStart);
    }

    asyncWrapper();
  }, []);

  async function handleCloseOnGameStartSwitch(e: React.ChangeEvent<HTMLInputElement>) {
    setCloseOnGameStart(e.target.checked);

    const config = await ReadLauncherConfig();
    config.closeOnGameStart = e.target.checked;

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
      title={"Настройки лаунчера"}
    >
      <Group>
        <Switch
          defaultChecked={closeOnGameStart}
          onChange={handleCloseOnGameStartSwitch}
        />
        <Text>Закрывать лаунчер при запуске игры</Text>
      </Group>
    </Modal>
  );
}
