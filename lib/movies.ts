import raw from "@/data/movies.json";

export type Movie = {
  id: number;
  title: string;
  poster: string | null;
};

export type MovieSummary = {
  id: number;
  title: string;
};

type MoviesData = {
  movies: Movie[];
  similar: Record<string, number[]>;
};

const data = raw as MoviesData;
const moviesById = new Map(data.movies.map((movie) => [movie.id, movie]));

export function getAllMovies(): Movie[] {
  return data.movies;
}

/**
 * Slim id+title projection, safe to pass from a Server Component to a
 * Client Component so search can run instantly in the browser instead of
 * round-tripping to the server on every keystroke.
 */
export function getSearchIndex(): MovieSummary[] {
  return data.movies.map(({ id, title }) => ({ id, title }));
}

export function getMovieByTitle(title: string): Movie | undefined {
  return data.movies.find((movie) => movie.title === title);
}

export function getRecommendations(movieId: number): Movie[] {
  const similarIds = data.similar[String(movieId)] ?? [];
  return similarIds
    .map((id) => moviesById.get(id))
    .filter((movie): movie is Movie => movie !== undefined);
}
