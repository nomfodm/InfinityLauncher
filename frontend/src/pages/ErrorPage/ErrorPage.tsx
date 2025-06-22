import AnimatedPage from "../../components/AnimatedPage/AnimatedPage";
import {Anchor, Box, rem, Text} from "@mantine/core";
import {ReactNode, useEffect, useState} from "react";
import {GetVersion} from "../../wailsjs/go/main/App";
import {BrowserOpenURL} from "../../wailsjs/runtime";
import {getLauncherDownloadUrl} from "../../utils/url";

function Container({children}: { children: ReactNode }) {
    return <Box mt={rem(100)} ml={rem(28)}>
        {children}
    </Box>
}

export default function ErrorPage({error}: { error: string }) {
    const [version, setVersion] = useState<string>("...");
    useEffect(() => {
        async function wrapper() {
            setVersion(await GetVersion())
        }

        wrapper()
    }, []);
    const errorList = ["cant check update", "cant connect", "maintenance"]
    return (<>
        <AnimatedPage>
            <main style={{height: "100vh"}}>
                {error == errorList.at(0) &&
                    <Container>
                        <Text fz={"h3"} c={"red"} fw={"bold"}>Произошла ошибка при проверке обновлений лаунчера</Text>
                        <Text mt={rem(40)}>Скорее всего какая-то ошибка на сервере, поэтому можете просто</Text>
                        <Text>подождать, либо попробовать скачать лаунчер вручную:</Text>

                        <Anchor
                            onClick={() => BrowserOpenURL(getLauncherDownloadUrl())}>infinityserver.ru/launcher</Anchor>
                    </Container>
                }

                {error == errorList.at(1) &&
                    <Container>
                        <Text fz={"h3"} c={"red"} fw={"bold"}>Не удалось подключиться к серверам Infinity</Text>
                        <Text mt={rem(40)}>Проверьте Ваше интернет-соединение или</Text>
                        <Text>попробуйте запустить лаунчер позже.</Text>
                    </Container>
                }

                {error == errorList.at(2) &&
                    <Container>
                        <Text fz={"h3"} c={"red"} fw={"bold"}>Проводятся технические работы</Text>
                        <Text mt={rem(40)}>Попробуйте запустить лаунчер позже.</Text>
                    </Container>
                }

                {!errorList.includes(error) &&
                    <Container>
                        <Text fz={"h3"} fw={"bold"}>Произошла неизвестная ошибка при инициализации:</Text>
                        <Text c={"red"} fz={"lg"}>{error}</Text>

                        <Text fz={"sm"} mt={rem(40)}>Попробуйте перезапустить лаунчер.</Text>
                        <Text fz={"sm"}>Если это не помогло, то отправьте эту ошибку <Anchor
                            onClick={() => BrowserOpenURL("https://t.me/nomfodm")} fz={"sm"}>администратору</Anchor></Text>
                        <Text fz={"sm"}>и попробуйте скачать лаунчер заново:</Text>
                        <Anchor fz={"sm"}
                                onClick={() => BrowserOpenURL(getLauncherDownloadUrl())}>infinityserver.ru/launcher</Anchor>
                    </Container>
                }

                <Box pos={"absolute"} left={rem(28)} bottom={rem(28)}>
                    <Text c={"dimmed"} fz={"xs"}>Infinity Launcher {version}</Text>
                </Box>
            </main>
        </AnimatedPage>

    </>)
}