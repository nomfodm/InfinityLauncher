import AnimatedPage from "../../components/AnimatedPage/AnimatedPage";
import {Text} from "@mantine/core";

import styles from "./ErrorPage.module.css"

function capitalizeWord(word: string): string {
    if (!word) return ""
    return word[0].toUpperCase() + word.substring(1);
}

export default function ErrorPage({error}: { error: string }) {
    return <AnimatedPage>
        <main className={styles.main}>
            <div className={styles.content}>
                <Text className={styles.error} fw={"600"} fz={"h2"} ta={"center"}>{capitalizeWord(error)}</Text>
            </div>
        </main>
    </AnimatedPage>
}