import { describe, expect, it } from "vitest";
import { filterMovies, normalizeQuery } from "@/lib/search";
import type { Movie } from "@/lib/movies";

const movies: Movie[] = [
  { id: 1, title: "Avatar", poster: null },
  { id: 2, title: "Avengers: Endgame", poster: null },
  { id: 3, title: "The Dark Knight", poster: null },
];

describe("normalizeQuery", () => {
  it("trims whitespace and lowercases", () => {
    expect(normalizeQuery("  Avatar  ")).toBe("avatar");
  });
});

describe("filterMovies", () => {
  it("returns an empty array for a blank query", () => {
    expect(filterMovies(movies, "   ")).toEqual([]);
  });

  it("matches titles case-insensitively", () => {
    const results = filterMovies(movies, "aVaTaR");
    expect(results.map((movie) => movie.title)).toEqual(["Avatar"]);
  });

  it("matches by substring across multiple titles", () => {
    const results = filterMovies(movies, "e");
    expect(results.map((movie) => movie.title)).toEqual([
      "Avengers: Endgame",
      "The Dark Knight",
    ]);
  });

  it("respects the limit parameter", () => {
    const results = filterMovies(movies, "a", 1);
    expect(results).toHaveLength(1);
  });

  it("returns no matches when nothing matches the query", () => {
    expect(filterMovies(movies, "xyz")).toEqual([]);
  });
});
