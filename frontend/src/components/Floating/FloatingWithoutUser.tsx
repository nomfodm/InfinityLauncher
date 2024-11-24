import {IconMinus, IconX,} from "@tabler/icons-react";
import styles from "./Floating.module.css";
import {Quit, WindowMinimise} from "../../wailsjs/runtime";


export default function FloatingWithoutUser() {
    return (
        <section className={styles.main}>
            <div className={styles.buttons}>
                <button
                    onClick={WindowMinimise}
                    className={`${styles.button} ${styles.hide}`}
                >
                    <IconMinus width={15} height={15} color="white"/>
                </button>

                <button onClick={Quit} className={`${styles.button} ${styles.close}`}>
                    <IconX width={15} height={15} color="white"/>
                </button>
            </div>
        </section>
    );
}
