import styles from "./GameProfileCard.module.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { main, types } from "../../wailsjs/go/models";
import { Box, Loader, Text } from "@mantine/core";
import { useAppSelector } from "../../store/hooks";
import GameProfile = main.GameProfile;
import { IconDeviceGamepad2 } from "@tabler/icons-react";
import { GameStatus } from "../../store/game";
import { PingMinecraftServer } from "../../wailsjs/go/main/GameProfiler";

export default function GameProfileCard({ profile }: { profile: GameProfile }) {
  const [isPinging, setIsPinging] = useState<boolean>(true);
  const [mcserverPingResp, setMcserverPingResp] = useState<
    types.PingResponse | undefined
  >(undefined);
  const navigate = useNavigate();
  const gameState = useAppSelector((state) => state.game);

  useEffect(() => {
    async function wrapper() {
      try {
        const response = await PingMinecraftServer(
          profile.minecraftServer.ip,
          profile.minecraftServer.port
        );
        setMcserverPingResp(response);
      } catch (e) {
        console.log(e);
      } finally {
        setIsPinging(false);
      }
    }
    wrapper();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClick() {
    navigate(`play/${profile.id.toString()}`);
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
        <div className={`${styles.badge} ${styles.version}`}>
          {profile.version}
        </div>
        <div className={`${styles.badge} ${styles.status}`}>
          {isPinging && (
            <Box>
              <Loader size={25} type="dots" color={"yellow.6"} />
            </Box>
          )}
          {!isPinging && (
            <Box>
              {mcserverPingResp ? (
                <Text fz={"13px"} fw={600} c="green.6">
                  {`${mcserverPingResp.PlayerCount.Online} / ${mcserverPingResp.PlayerCount.Max}`}
                </Text>
              ) : (
                <Text fz={"13px"} fw={500} c="red.6">
                  Оффлайн
                </Text>
              )}
            </Box>
          )}
        </div>
      </section>
      {[
        GameStatus.FETCHING,
        GameStatus.DOWNLOADING,
        GameStatus.PREPARING,
      ].includes(gameState.status) &&
        gameState.clientPlayingID === profile.id && (
          <Loader className={styles.loader} color="white" />
        )}
      {[GameStatus.ERROR].includes(gameState.status) &&
        gameState.clientPlayingID === profile.id && (
          <Loader className={styles.loader} color="red" />
        )}
      {[GameStatus.PLAYING].includes(gameState.status) &&
        gameState.clientPlayingID === profile.id && (
          <IconDeviceGamepad2 className={styles.loader} color={"white"} />
        )}
      <section className={styles.title}>
        <span>
          <Text fz={"18px"}>{profile.title}</Text>
        </span>
      </section>
    </div>
  );
}
