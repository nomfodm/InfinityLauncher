import AnimatedPageFade from "../../components/AnimatedPage/AnimatedPageFade";
import { Anchor, Box, Button, Flex, rem, Text } from "@mantine/core";
import { BrowserOpenURL } from "../../wailsjs/runtime";
import { getLauncherDownloadUrl } from "../../utils/url";
import { InfinityLogo } from "../../components/InfinityLoader/InfinityLoader";
import styles from "./ErrorPage.module.css";
import { RestartApp } from "../../wailsjs/go/main/App";

export default function ErrorPage({ error }: { error: string }) {
  const errorList = ["cant check update", "cant connect", "maintenance"];

  return (
    <>
      <AnimatedPageFade>
        <main
          style={{ height: rem(380), padding: rem(10), position: "relative" }}
        >
          <Box
            left={rem(310)}
            top={rem(180)}
            pos={"absolute"}
            w={rem(80)}
            h={rem(40)}
            style={{ position: "relative", cursor: "default" }}
            className={styles.logoContainer}
          >
            <InfinityLogo />
            <Box
              pos={"absolute"}
              top={0}
              left={0}
              w={"100%"}
              h={"100%"}
              className={styles.redOverlay}
            >
              <InfinityLogo />
            </Box>
          </Box>

          {error == errorList.at(0) && (
            <Flex h={"100%"} direction={"column"} justify={"space-between"}>
              <Text fz={"h3"} c={"red.6"} fw={"bold"}>
                Произошла ошибка при проверке обновлений лаунчера
              </Text>

              <Box>
                <Text fz={"14px"}>
                  Скорее всего какая-то ошибка на сервере, поэтому можете просто
                </Text>
                <Text fz={"14px"}>
                  подождать, либо попробовать скачать лаунчер вручную:
                </Text>
                <Anchor
                  fz={"14px"}
                  onClick={() => BrowserOpenURL(getLauncherDownloadUrl())}
                >
                  infinityserver.ru/launcher
                </Anchor>
              </Box>
            </Flex>
          )}

          {error == errorList.at(1) && (
            <Flex h={"100%"} direction={"column"} justify={"space-between"}>
              <Box>
                <Text fz={"h3"} c={"red.6"} fw={"bold"}>
                  Не удалось подключиться к серверам Infinity
                </Text>
                <Text mt={rem(5)} fz={"14px"}>
                  Проверьте Ваше интернет-соединение или
                </Text>
                <Text fz={"14px"}>попробуйте запустить лаунчер позже.</Text>
              </Box>

              <Box>
                <Button
                  onClick={() => {
                    RestartApp();
                  }}
                  radius={rem(7)}
                  w={rem(160)}
                  h={rem(40)}
                  color={"gray.8"}
                  mt={rem(5)}
                >
                  <Text fz={"14px"} fw={500}>
                    Перезапустить
                  </Text>
                </Button>
              </Box>
            </Flex>
          )}

          {error == errorList.at(2) && (
            <Flex h={"100%"} justify={"space-between"} direction={"column"}>
              <Box>
                <Text fz={"h3"} c={"red.6"} fw={"bold"}>
                  Проводятся технические работы
                </Text>
                <Text mt={rem(5)} fz={"14px"}>
                  Попробуйте запустить лаунчер позже.
                </Text>
              </Box>

              <Box>
                <Button
                  onClick={() => {
                    RestartApp();
                  }}
                  radius={rem(7)}
                  w={rem(160)}
                  h={rem(40)}
                  color={"gray.8"}
                  mt={rem(5)}
                >
                  <Text fz={"14px"} fw={500}>
                    Перезапустить
                  </Text>
                </Button>
              </Box>
            </Flex>
          )}

          {!errorList.includes(error) && (
            <Flex h={"100%"} direction={"column"} justify={"space-between"}>
              <Box>
                <Text fz={"24px"} c={"red.6"} fw={"bold"}>
                  Ошибка при запуске лаунчера
                </Text>
                <Text c={"#8F8F8F"} fz={"16px"}>
                  {error}
                </Text>
              </Box>

              <Button
                onClick={() => {
                  RestartApp();
                }}
                radius={rem(7)}
                w={rem(160)}
                h={rem(40)}
                color={"gray.8"}
              >
                <Text fz={"14px"} fw={500}>
                  Перезапустить
                </Text>
              </Button>
            </Flex>
          )}
        </main>
      </AnimatedPageFade>
    </>
  );
}
