import {Group, Modal, Switch, Text} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import {ReadConfig, WriteConfig} from "../../wailsjs/go/main/FS";

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
      const config = await ReadConfig();

      setCloseOnGameStart(config.closeOnGameStart);
    }

    asyncWrapper();
  }, []);

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async function handleCloseOnGameStartSwitch(e: any) {
    setCloseOnGameStart(e.target.checked);

    const config = await ReadConfig();
    config.closeOnGameStart = e.target.checked;

    await WriteConfig(config);
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
