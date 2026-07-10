import MovieRecommender from "@/components/MovieRecommender";
import { getSearchIndex } from "@/lib/movies";

export default function Home() {
  const movies = getSearchIndex();

  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-16 sm:pt-24">
      <MovieRecommender movies={movies} />
    </main>
  );
}
