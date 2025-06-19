import AnimatedPage from "../../components/AnimatedPage/AnimatedPage";
import styles from "./PlayPage.module.css";
import GameProfileCard from "../../components/GameProfileCard/GameProfileCard";
import {useAppSelector} from "../../store/hooks";
import {Text} from "@mantine/core";


export default function PlayPage() {
    const gameProfiles = useAppSelector(state => state.gameProfiles)

    return (
        <AnimatedPage>
            <main className={styles.main}>
                <div className={styles.blob_outer_container}>
                    <div className={styles.blob_inner_container}>
                        <div className={styles.blob}></div>
                    </div>
                </div>
                <div className={styles.content}>
                    {gameProfiles.retrieved ?
                        gameProfiles.profiles.map((v, i) => {
                            return <GameProfileCard key={i} profile={v}/>;
                        })
                        :
                        <Text fz={"xl"} ta={"center"}>{gameProfiles.error}</Text>
                    }
                </div>
            </main>
        </AnimatedPage>
    );
}
