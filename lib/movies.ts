import raw from "@/data/movies.json";

export type Movie = {
  id: number;
  title: string;
  poster: string | null;
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

export function getMovieByTitle(title: string): Movie | undefined {
  return data.movies.find((movie) => movie.title === title);
}

export function getRecommendations(movieId: number): Movie[] {
  const similarIds = data.similar[String(movieId)] ?? [];
  return similarIds
    .map((id) => moviesById.get(id))
    .filter((movie): movie is Movie => movie !== undefined);
}
