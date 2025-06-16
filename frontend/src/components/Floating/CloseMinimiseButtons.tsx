import {IconMinus, IconX,} from "@tabler/icons-react";
import styles from "./CloseMinimiseButtons.module.css";
import {Quit, WindowMinimise} from "../../wailsjs/runtime";
import {modals} from "@mantine/modals";
import {ReadLauncherConfig} from "../../wailsjs/go/main/FS";


export default function CloseMinimiseButtons() {
    async function quit() {
        const config = await ReadLauncherConfig()
        if (!config.closeWithFunnyAnimation) {
            Quit()
            return
        }

        modals.openConfirmModal({
            title: 'Точно хотите выйти?',
            closeOnConfirm: false,
            centered: true,
            labels: { confirm: 'Да, хочу', cancel: 'Не выходить' },
            onConfirm: () => {
                modals.open({
                    overlayProps: {
                        backgroundOpacity: 1,
                        blur: 3,
                        zIndex: 10000
                    },
                    zIndex: 10001,
                    centered: true,
                    withCloseButton: false,
                    closeOnEscape: false,
                    closeOnClickOutside: false,
                    children: 'Ну и пошел ты тогда нахуй, рыцаря задержал!!!',
                })
                setTimeout(() => {
                    Quit()
                }, 1500)
            },

        })
    }

    return (
        <div className={styles.buttons}>
            <button
                onClick={WindowMinimise}
                className={`${styles.button} ${styles.hide}`}
            >
                <IconMinus width={15} height={15} color="white"/>
            </button>

            <button onClick={quit} className={`${styles.button} ${styles.close}`}>
                <IconX width={15} height={15} color="white"/>
            </button>
        </div>
    );
}
