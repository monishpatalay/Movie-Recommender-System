export function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

export function filterMovies<T extends { title: string }>(
  movies: T[],
  query: string,
  limit = 8,
): T[] {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];

  const matches: T[] = [];
  for (const movie of movies) {
    if (movie.title.toLowerCase().includes(normalized)) {
      matches.push(movie);
      if (matches.length === limit) break;
    }
  }
  return matches;
}
