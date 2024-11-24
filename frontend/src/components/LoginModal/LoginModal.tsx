import {Anchor, Button, Modal, Paper, PasswordInput, rem, Text, TextInput} from "@mantine/core";
import {IconCheck, IconX} from "@tabler/icons-react";
import authService from "../../services/auth"
import {useForm} from "@mantine/form";
import {useAppSelector} from "../../store/hooks";
import {BrowserOpenURL} from "../../wailsjs/runtime";
import {getRegisterPageUrl} from "../../utils/url";
import store from "../../store";
import {notifications} from "@mantine/notifications";
import {clearAuthError} from "../../store/auth";

function capitalizeWord(word: string): string {
    if (!word) return ""
    return word[0].toUpperCase() + word.substring(1);
}

export default function LoginModal({
                                       opened,
                                       close,
                                   }: {
    opened: boolean;
    close: () => void;
}) {
    const auth = useAppSelector((state) => state.auth)
    const form = useForm({
        mode: 'uncontrolled',
        initialValues: {
            username: "",
            password: ""
        },

        validate: {
            username: (value) => value.trim().length === 0 ? "Введите имя пользователя" : null,
            password: (value) => value.trim().length === 0 ? "Введите пароль" : null,
        },
    });

    /* eslint-disable  @typescript-eslint/no-explicit-any */
    async function handleLogin(event: any) {
        event.preventDefault();

        const validationResult = form.validate()
        if (validationResult.hasErrors) {
            return
        }
        const values = form.getValues()
        const loginResult = await authService.login(values.username, values.password)
        if (loginResult) {
            notifications.show({
                title: "Успешно",
                message: "Вход выполнен",
                color: "green",
                icon: <IconCheck width={rem(20)} height={rem(20)}/>,
            })
            form.reset()
            close()
        }
    }

    function handleClose() {
        form.reset()
        store.dispatch(clearAuthError())
        close()
    }


    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            centered
            overlayProps={{
                backgroundOpacity: 0.5,
                blur: 3,
            }}
            closeButtonProps={{
                size: 15,
                icon: <IconX/>,
            }}
            transitionProps={{transition: 'fade', duration: 200, timingFunction: 'ease-out'}}
            closeOnClickOutside={false}
            fullScreen
        >
            <form onSubmit={handleLogin}>
                <Paper m={"auto"} w={"60%"} bg={"none"}>
                    <Text fz={"h2"} fw={"600"} ta={"center"}>Вход в аккаунт Infinity</Text>
                    <TextInput mt={"md"} label="Имя пользователя" placeholder="thebestplayer"
                               size="md" {...form.getInputProps("username")} />
                    <PasswordInput label="Пароль" placeholder="Сюда ваш пароль" mt="md"
                                   size="md" {...form.getInputProps("password")} />
                    <Button type={"submit"} loading={auth.authing} fullWidth mt="xl" size="md">
                        Войти
                    </Button>

                    <Text ta={"center"} mt="md">
                        Нет аккаунта?{' '}
                        <Anchor fw={700} onClick={() => BrowserOpenURL(getRegisterPageUrl())}>
                            Так создайте же его!
                        </Anchor>
                    </Text>
                    <Text style={{userSelect: "text", "--wails-draggable": "no-drag"}} ta={"center"} mt={"xl"}
                          c={"red"}>{capitalizeWord(auth.error)}</Text>

                </Paper>
            </form>
        </Modal>
    );
}
