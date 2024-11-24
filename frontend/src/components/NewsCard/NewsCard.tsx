import styles from "./NewsCard.module.css";
import {Card, Group, Image, Text} from "@mantine/core";

export default function NewsCard({
  title,
  subtitle,
  imgUrl,
}: {
  title: string;
  subtitle: string;
  imgUrl: string;
}) {
  return (
    <Card w={220} radius={"md"} className={styles.card}>
      <Card.Section>
        <Image draggable={false} src={imgUrl} alt={"news card image"} h={120} />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>{title}</Text>
      </Group>

      <Text size="sm" c="dimmed">
        {subtitle}
      </Text>
    </Card>
  );
}
