"use server";

import { getMovieByTitle, getRecommendations, type Movie } from "@/lib/movies";

const MAX_INPUT_LENGTH = 200;

export type RecommendationResult = {
  movie: Movie;
  recommendations: Movie[];
};

export async function recommendForTitle(
  title: string,
): Promise<RecommendationResult | null> {
  if (typeof title !== "string" || title.length > MAX_INPUT_LENGTH) return null;
  const movie = getMovieByTitle(title);
  if (!movie) return null;
  return { movie, recommendations: getRecommendations(movie.id) };
}
