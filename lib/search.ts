import type { Movie } from "@/lib/movies";

export function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

export function filterMovies(movies: Movie[], query: string, limit = 8): Movie[] {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];

  const matches: Movie[] = [];
  for (const movie of movies) {
    if (movie.title.toLowerCase().includes(normalized)) {
      matches.push(movie);
      if (matches.length === limit) break;
    }
  }
  return matches;
}
