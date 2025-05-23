import {
  IconExternalLink,
  IconLogin2,
  IconLogout2,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import styles from "./Floating.module.css";
import {Menu, rem} from "@mantine/core";

import authService from "../../services/auth"

import { useDisclosure } from "@mantine/hooks";
import SettingsModal from "../SettingsModal/SettingsModal";
import LoginModal from "../LoginModal/LoginModal";
import {BrowserOpenURL} from "../../wailsjs/runtime";
import {useAppSelector} from "../../store/hooks"
import {getPersonalAccountPageUrl, getUserSkinAvatarUrl} from "../../utils/url";
import {useEffect, useState} from "react";
import store from "../../store";
import {notifications} from "@mantine/notifications";
import {GetVersion} from "../../wailsjs/go/main/App";
import {GameStatus} from "../../store/game";


export default function Floating() {
  const auth = useAppSelector((state) => state.auth)

  const [settingsOpened, settingsHandlers] = useDisclosure();
  const [loginOpened, loginHandlers] = useDisclosure();

  const [version, setVersion] = useState("0.0.0")

  useEffect(() => {
    async function wrapper() {
      setVersion(await GetVersion())
    }
    wrapper()
  }, []);

  async function handleLogin() {
    const gameState = store.getState().game
    if ([GameStatus.FETCHING, GameStatus.DOWNLOADING, GameStatus.PREPARING].includes(gameState.status)) {
      notifications.show({
        title: "Ошибка",
        message: "Сначала отмените загрузку, а потом только входите в аккаунт!",
        color: "red",
      })

      return
    }

    loginHandlers.open()
  }

  async function handleLogout() {
    const gameState = store.getState().game
    if ([GameStatus.FETCHING, GameStatus.DOWNLOADING, GameStatus.PREPARING].includes(gameState.status)) {
      notifications.show({
        title: "Ошибка",
        message: "Сначала отмените загрузку, а потом выходите из аккаунта!",
        color: "red",
      })

      return
    }
    await authService.logout()
  }

  return (
    <section className={styles.main}>
      <Menu width={220} position="bottom-end">
        <Menu.Target>
          <button className={styles.user}>
            <img draggable={false} src={getUserSkinAvatarUrl(auth.authed ? auth.user!.textures.skinHash : undefined)} alt="" width={32} height={32} />
          </button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Лаунчер {version}</Menu.Label>
          <Menu.Item
            onClick={settingsHandlers.open}
            leftSection={
              <IconSettings style={{ width: rem(20), height: rem(20) }} />
            }
          >
            Настройки
          </Menu.Item>

          <Menu.Divider />
          {auth.authed ? (
            <>
              <Menu.Label>{auth.authed && auth.user!.username}</Menu.Label>
              <Menu.Item
                  onClick={() => {
                    BrowserOpenURL(getPersonalAccountPageUrl())
                  }}
                leftSection={
                  <IconUser style={{ width: rem(20), height: rem(20) }} />
                }
                rightSection={
                  <IconExternalLink style={{ width: rem(20), height: rem(20) }} />
                }
              >
                Личный кабинет
              </Menu.Item>
              <Menu.Item
                color="#ED4245"
                onClick={handleLogout}
                // disabled={[DownloadStatus.DOWNLOADING, DownloadStatus.UNPACKING].includes(downloading.status)}
                leftSection={
                  <IconLogout2 style={{ width: rem(20), height: rem(20) }} />
                }
              >
                Выйти
              </Menu.Item>
            </>
          ) : (
            <>
              <Menu.Label>Вход не выполнен</Menu.Label>
              <Menu.Item
                color="#57F287"
                leftSection={
                  <IconLogin2 style={{ width: rem(20), height: rem(20) }} />
                }
                onClick={handleLogin}
              >
                Войти
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>

      <SettingsModal close={settingsHandlers.close} opened={settingsOpened} />
      <LoginModal close={loginHandlers.close} opened={loginOpened} />
    </section>
  );
}
