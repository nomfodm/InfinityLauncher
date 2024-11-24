import AnimatedPage from "../../components/AnimatedPage/AnimatedPage";
import NewsCard from "../../components/NewsCard/NewsCard";
import styles from "./NewsPage.module.css";

import testCardImg from "../../assets/images/news_card.jpg";

export default function NewsPage() {
  return (
    <AnimatedPage>
      <main className={styles.main}>
        <div className={styles.content}>
          <NewsCard
            imgUrl={testCardImg}
            title="Новость"
            subtitle="Кратное описание аываываыаы"
          />
          <NewsCard
            imgUrl={testCardImg}
            title="Новость"
            subtitle="Кратное описание аываываыаы"
          />
          <NewsCard
              imgUrl={testCardImg}
              title="Новость"
              subtitle="Кратное описание аываываыаы"
          />
          <NewsCard
              imgUrl={testCardImg}
              title="Новость"
              subtitle="Кратное описание аываываыаы"
          />
          <NewsCard
              imgUrl={testCardImg}
              title="Новость"
              subtitle="Кратное описание аываываыаы"
          />
          <NewsCard
              imgUrl={testCardImg}
              title="Новость"
              subtitle="Кратное описание аываываыаы"
          />
          <NewsCard
              imgUrl={testCardImg}
              title="Новость"
              subtitle="Кратное описание аываываыаы"
          />
          <NewsCard
              imgUrl={testCardImg}
              title="Новость"
              subtitle="Кратное описание аываываыаы"
          />
        </div>
      </main>
    </AnimatedPage>
  );
}
