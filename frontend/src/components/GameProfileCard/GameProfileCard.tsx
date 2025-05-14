import styles from "./GameProfileCard.module.css";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {main} from "../../wailsjs/go/models";
import {Loader} from "@mantine/core";
import {useAppSelector} from "../../store/hooks";
import GameProfile = main.GameProfile;
import {IconDeviceGamepad2} from "@tabler/icons-react";
import {GameStatus} from "../../store/game";
import {PingMinecraftServer} from "../../wailsjs/go/main/GameProfiler";

export default function GameProfileCard({
                                            profile,
                                        }: {
    profile: GameProfile;
}) {
    const [online, setOnline] = useState<boolean>(false);
    const navigate = useNavigate();
    const gameState = useAppSelector(state => state.game)

    useEffect(() => {
        async function wrapper() {
            try {
                await PingMinecraftServer(profile.minecraftServer.ip, profile.minecraftServer.port)
                setOnline(true)
            } catch (e) {
                console.log(e)
                setOnline(false)
            }
        }
        wrapper()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleClick() {
        navigate(profile.id.toString());
    }

    return (
        <div onClick={handleClick} className={styles.card}>
            <img
                className={styles.img}
                draggable={false}
                src={profile.cardImgUrl}
                alt=""
            />

            <section className={styles.profile_information}>
                <div className={styles.version}>{profile.version}</div>
                <div className={styles.status}>
                    <div
                        className={`${styles.status_indicator} ${
                            online ? styles.online : styles.offline
                        }`}
                    ></div>
                </div>
            </section>
            {[GameStatus.FETCHING, GameStatus.DOWNLOADING, GameStatus.PREPARING].includes(gameState.status) && gameState.clientPlayingID === profile.id &&
                <Loader className={styles.loader} color="white"/>}
            {[GameStatus.ERROR].includes(gameState.status) && gameState.clientPlayingID === profile.id &&
                <Loader className={styles.loader} color="red"/>}
            {[GameStatus.PLAYING].includes(gameState.status) && gameState.clientPlayingID === profile.id &&
                <IconDeviceGamepad2 className={styles.loader} color={"white"}/>}
            <section className={styles.title}>{profile.title}</section>
        </div>
    );
}
