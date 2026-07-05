import Image from "next/image";
import type { Movie } from "@/lib/movies";
import styles from "./PosterCard.module.css";

export default function PosterCard({
  movie,
  priority = false,
}: {
  movie: Movie;
  priority?: boolean;
}) {
  return (
    <li className={styles.card}>
      <div className={styles.posterWrap}>
        {movie.poster ? (
          <Image
            src={movie.poster}
            alt={`${movie.title} poster`}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
            className={styles.poster}
            priority={priority}
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            {movie.title.charAt(0)}
          </div>
        )}
        <div className={styles.overlay}>
          <p className={styles.title}>{movie.title}</p>
        </div>
      </div>
    </li>
  );
}
