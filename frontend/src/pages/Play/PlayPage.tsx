import AnimatedPage from "../../components/AnimatedPage/AnimatedPage";
import styles from "./PlayPage.module.css";
import GameProfileCard from "../../components/GameProfileCard/GameProfileCard";
import { useAppSelector } from "../../store/hooks";
import { Box, rem, Text } from "@mantine/core";

export default function PlayPage() {
  const gameProfiles = useAppSelector((state) => state.gameProfiles);

  return (
    <AnimatedPage>
      <main className={styles.main}>
        <Box mb={rem(20)} fz={"20px"} fw={500}>
          <Text>Выберите режим</Text>
        </Box>
        <div className={styles.cards}>
          {gameProfiles.retrieved ? (
            gameProfiles.profiles.map((v, i) => (
              <GameProfileCard key={i} profile={v} />
            ))
          ) : (
            <Text fz={"xl"} ta={"center"}>
              {gameProfiles.error}
            </Text>
          )}
        </div>
      </main>
    </AnimatedPage>
  );
}
