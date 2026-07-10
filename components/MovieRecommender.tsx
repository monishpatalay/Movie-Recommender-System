"use client";

import { useMemo, useState, useTransition, type KeyboardEvent } from "react";
import Image from "next/image";
import { Clapperboard, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { recommendForTitle } from "@/app/actions";
import { filterMovies } from "@/lib/search";
import type { Movie, MovieSummary } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import PosterCard from "@/components/PosterCard";

type Status = "idle" | "loading" | "done" | "error" | "unmatched";

const SKELETON_COUNT = 5;

export default function MovieRecommender({ movies }: { movies: MovieSummary[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [sourceMovie, setSourceMovie] = useState<Movie | null>(null);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [isPending, startTransition] = useTransition();

  // Filtering ~4,800 in-memory titles is sub-millisecond, so suggestions
  // update on every keystroke with no debounce and no network round trip.
  const matches = useMemo(() => filterMovies(movies, query, 8), [movies, query]);

  function runRecommendation(movie: MovieSummary) {
    setStatus("loading");
    startTransition(() => {
      recommendForTitle(movie.title)
        .then((result) => {
          if (!result) {
            setStatus("error");
            return;
          }
          setSourceMovie(result.movie);
          setRecommendations(result.recommendations);
          setStatus("done");
        })
        .catch(() => setStatus("error"));
    });
  }

  function chooseMovie(movie: MovieSummary) {
    setQuery(movie.title);
    setOpen(false);
    runRecommendation(movie);
  }

  function handleSubmit() {
    const trimmed = query.trim();
    if (!trimmed) return;
    const exactMatch = movies.find(
      (movie) => movie.title.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exactMatch) {
      chooseMovie(exactMatch);
    } else {
      setStatus("unmatched");
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <>
      <header className="mb-10 max-w-2xl sm:mb-14">
        <Badge
          variant="outline"
          className="mb-4 border-primary/40 uppercase tracking-widest text-primary"
        >
          <Sparkles className="size-3" />
          Content-based recommender
        </Badge>
        <h1 className="font-heading text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          CineMatch
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Pick a movie you love — we compare its plot, genres, cast, and crew against
          ~4,800 others to surface five worth watching next.
        </p>
      </header>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-start"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <div className="relative flex-1">
          <label htmlFor="movie-search" className="sr-only">
            Search for a movie
          </label>
          <Command shouldFilter={false} className="w-full gap-0 overflow-visible bg-transparent p-0">
            <CommandInput
              id="movie-search"
              value={query}
              onValueChange={(value) => {
                setQuery(value);
                setOpen(true);
                if (status !== "loading") setStatus("idle");
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 120)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a movie, e.g. The Dark Knight"
              wrapperClassName="h-12! rounded-xl! border-input bg-input/20 px-1"
              className="text-base"
            />
            {open && query.trim() && (
              <CommandList className="absolute inset-x-0 top-full z-20 mt-2 max-h-80 rounded-xl border border-border bg-popover p-1 shadow-2xl shadow-black/50">
                <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
                  No movies match &ldquo;{query.trim()}&rdquo;.
                </CommandEmpty>
                {matches.map((movie) => (
                  <CommandItem
                    key={movie.id}
                    value={String(movie.id)}
                    onSelect={() => chooseMovie(movie)}
                    className="cursor-pointer gap-2.5 py-2.5 text-[0.95rem] data-selected:bg-primary/15 data-selected:text-foreground"
                  >
                    <Clapperboard className="size-4 text-muted-foreground" />
                    {movie.title}
                  </CommandItem>
                ))}
              </CommandList>
            )}
          </Command>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="h-12 shrink-0 px-6 text-base font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Finding matches…
            </>
          ) : (
            "Get recommendations"
          )}
        </Button>
      </form>

      <p
        className="mt-4 min-h-5 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        {status === "loading" && "Finding similar movies…"}
        {status === "unmatched" && (
          <span className="inline-flex items-center gap-1.5 text-destructive">
            <TriangleAlert className="size-3.5" />
            Pick a movie from the suggestions list first.
          </span>
        )}
        {status === "done" && recommendations.length === 0 && "No close matches found."}
        {status === "error" && "Something went wrong. Try again."}
      </p>

      {isPending && (
        <div className="mt-12">
          <Skeleton className="h-3 w-40" />
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <Skeleton key={index} className="aspect-2/3 rounded-xl" />
            ))}
          </ul>
        </div>
      )}

      {!isPending && sourceMovie && (
        <section className="mt-12 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Because you liked
          </p>
          <Card className="flex-row items-center gap-4 border-primary/20 bg-card/60 px-4 py-4 sm:px-5 sm:py-5">
            <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-border sm:h-32 sm:w-22">
              {sourceMovie.poster ? (
                <Image
                  src={sourceMovie.poster}
                  alt={`${sourceMovie.title} poster`}
                  fill
                  sizes="88px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary font-heading text-xl text-muted-foreground">
                  {sourceMovie.title.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Your pick
              </p>
              <p className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                {sourceMovie.title}
              </p>
            </div>
          </Card>

          {recommendations.length > 0 && (
            <>
              <p className="mb-3 mt-8 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Recommended for you
              </p>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {recommendations.map((movie, index) => (
                  <PosterCard
                    key={movie.id}
                    movie={movie}
                    rank={index + 1}
                    priority={index < 2}
                  />
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </>
  );
}
