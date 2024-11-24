import AnimatedPage from "../../components/AnimatedPage/AnimatedPage";
import {Text} from "@mantine/core";

import styles from "./ErrorPage.module.css"

export default function ErrorPage({error}: { error: string }) {
    return <AnimatedPage>
        <main className={styles.main}>
            <div className={styles.content}>
                <Text className={styles.error} fw={"600"} fz={"h2"} ta={"center"}>{error}</Text>
            </div>
        </main>
    </AnimatedPage>
}