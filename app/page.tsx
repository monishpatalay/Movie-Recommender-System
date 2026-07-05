import MovieRecommender from "@/components/MovieRecommender";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <MovieRecommender />
    </main>
  );
}
