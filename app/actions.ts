"use server";

import { getAllMovies, getMovieByTitle, getRecommendations, type Movie } from "@/lib/movies";
import { filterMovies } from "@/lib/search";

const MAX_INPUT_LENGTH = 200;

export async function searchMovies(query: string): Promise<Movie[]> {
  if (typeof query !== "string" || query.length > MAX_INPUT_LENGTH) return [];
  return filterMovies(getAllMovies(), query);
}

export async function recommendForTitle(title: string): Promise<Movie[]> {
  if (typeof title !== "string" || title.length > MAX_INPUT_LENGTH) return [];
  const movie = getMovieByTitle(title);
  if (!movie) return [];
  return getRecommendations(movie.id);
}
