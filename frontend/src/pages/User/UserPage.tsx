import {
  Anchor,
  Box,
  Button,
  Flex,
  rem,
  Text,
  TextInput,
  PasswordInput,
} from "@mantine/core";
import AnimatedPage from "../../components/AnimatedPage/AnimatedPage";
import { useAppSelector } from "../../store/hooks";
import styles from "./UserPage.module.css";
import {
  getPersonalAccountPageUrl,
  getRegisterPageUrl,
  getUserCapeUrl,
  getUserSkinUrl,
} from "../../utils/url";
import { BrowserOpenURL } from "../../wailsjs/runtime/runtime";
import { IconCheck, IconExternalLink } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { GameStatus } from "../../store/game";
import authService from "../../services/auth";
import store from "../../store";
import { capitalizeWord } from "../../utils/string";
import { useForm } from "@mantine/form";
import { ReactSkinview3d } from "react-skinview3d";

export default function UserPage() {
  const auth = useAppSelector((state) => state.auth);
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      username: "",
      password: "",
    },

    validate: {
      username: (value) => (value.trim().length === 0 ? true : null),
      password: (value) => (value.trim().length === 0 ? true : null),
    },
  });

  async function handleLogout() {
    const gameState = store.getState().game;
    if (
      [
        GameStatus.FETCHING,
        GameStatus.DOWNLOADING,
        GameStatus.PREPARING,
      ].includes(gameState.status)
    ) {
      notifications.show({
        title: "Ошибка",
        message: "Сначала отмените загрузку, а потом выходите из аккаунта!",
        color: "red",
      });

      return;
    }
    await authService.logout();
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async function handleLogin(event: any) {
    event.preventDefault();

    const validationResult = form.validate();
    if (validationResult.hasErrors) {
      return;
    }
    const values = form.getValues();
    const loginResult = await authService.login(
      values.username,
      values.password
    );
    if (loginResult) {
      notifications.show({
        title: "Успешно",
        message: "Вход выполнен",
        color: "green",
        icon: <IconCheck width={rem(20)} height={rem(20)} />,
      });
      form.reset();
      close();
    }
  }

  return (
    <>
      <AnimatedPage>
        {auth.authed ? (
          <main
            className={styles.main}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <Box>
              <Flex align={"flex-end"} gap={"5px"}>
                <Text fz={"20px"} fw={400}>
                  {auth.user?.username}
                </Text>
                <Text fz={"20px"} fw={400} c={"#6C6C6C"}>
                  {auth.user?.minecraftCredential.username}
                </Text>
              </Flex>
              <Box mt={rem(25)}>
                <Anchor
                  onClick={() => BrowserOpenURL(getPersonalAccountPageUrl())}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Text fz={"16px"} fw={400}>
                    Личный кабинет
                  </Text>
                  <IconExternalLink
                    size={18}
                    color="var(--mantine-color-anchor)"
                  />
                </Anchor>
              </Box>
              <Button
                radius={"7px"}
                onClick={handleLogout}
                w={165}
                h={40}
                mt={rem(15)}
                color={"red.9"}
              >
                <Text fz={"16px"} fw={500}>
                  Выйти
                </Text>
              </Button>
            </Box>
            <Box className={styles.skin_container}>
              <ReactSkinview3d
                width={135}
                height={276}
                skinUrl={getUserSkinUrl(auth.user?.textures.skinHash)}
                capeUrl={getUserCapeUrl(auth.user?.textures.capeHash)}
              />
            </Box>
          </main>
        ) : (
          <main className={styles.main}>
            <Text fz={"20px"} fw={400}>
              Войдите, чтобы играть на серверах от Infinity
            </Text>
            <Box mt={rem(20)} w={"70%"}>
              <form onSubmit={handleLogin} style={{ objectFit: "contain" }}>
                <TextInput
                  label="Имя пользователя"
                  placeholder="Сюда ваше имя пользователя"
                  size="sm"
                  {...form.getInputProps("username")}
                />
                <PasswordInput
                  label="Пароль"
                  placeholder="А сюда ваш пароль"
                  mt="md"
                  size="sm"
                  {...form.getInputProps("password")}
                />
                <Button
                  type={"submit"}
                  loading={auth.authing}
                  fullWidth
                  mt="md"
                  size="sm"
                >
                  Войти
                </Button>

                <Text fz={"sm"} ta={"center"} mt="md">
                  Нет аккаунта?{" "}
                  <Anchor
                    fw={700}
                    fz={"sm"}
                    onClick={() => BrowserOpenURL(getRegisterPageUrl())}
                  >
                    Так создайте же его!
                  </Anchor>
                </Text>
                <Text
                  style={{
                    userSelect: "text",
                    "--wails-draggable": "no-drag",
                  }}
                  ta={"center"}
                  mt={"sm"}
                  c={"red"}
                  fz={"sm"}
                >
                  {capitalizeWord(auth.error)}
                </Text>
              </form>
            </Box>
          </main>
        )}
      </AnimatedPage>
    </>
  );
}
