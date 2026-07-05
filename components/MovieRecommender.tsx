"use client";

import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { recommendForTitle, searchMovies } from "@/app/actions";
import type { Movie } from "@/lib/movies";
import PosterCard from "@/components/PosterCard";
import styles from "./MovieRecommender.module.css";

type Status = "idle" | "loading" | "done" | "error" | "unmatched";

export default function MovieRecommender() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [isPending, startTransition] = useTransition();
  const listboxId = useId();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      searchMovies(query).then((results) => {
        setSuggestions(results);
        setActiveIndex(-1);
      });
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function chooseMovie(movie: Movie) {
    setSelectedMovie(movie);
    setQuery(movie.title);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  function runRecommendation(movie: Movie) {
    setStatus("loading");
    startTransition(() => {
      recommendForTitle(movie.title)
        .then((results) => {
          setRecommendations(results);
          setStatus("done");
        })
        .catch(() => setStatus("error"));
    });
  }

  function handleSubmit() {
    if (selectedMovie) {
      runRecommendation(selectedMovie);
      return;
    }
    const exactMatch = suggestions.find(
      (movie) => movie.title.toLowerCase() === query.trim().toLowerCase(),
    );
    if (exactMatch) {
      chooseMovie(exactMatch);
      runRecommendation(exactMatch);
    } else {
      setStatus("unmatched");
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (showSuggestions && suggestions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        return;
      }
      if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        chooseMovie(suggestions[activeIndex]);
        return;
      }
      if (event.key === "Escape") {
        setShowSuggestions(false);
        return;
      }
    }
  }

  return (
    <>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Content-based recommender</p>
        <h1 className={styles.heroTitle}>CineMatch</h1>
        <p className={styles.subtitle}>
          Pick a movie you love — we compare its plot, genres, cast, and crew against
          ~4,800 others to surface five worth watching next.
        </p>
      </header>

      <form
        className={styles.searchRow}
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <div className={styles.combobox}>
          <label htmlFor="movie-search" className={styles.label}>
            Search for a movie
          </label>
          <input
            id="movie-search"
            role="combobox"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            autoComplete="off"
            className={styles.input}
            placeholder="e.g. The Dark Knight"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowSuggestions(true);
              setSelectedMovie(null);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            onKeyDown={handleKeyDown}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul id={listboxId} role="listbox" className={styles.suggestions}>
              {suggestions.map((movie, index) => (
                <li
                  key={movie.id}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={
                    index === activeIndex ? styles.suggestionActive : styles.suggestion
                  }
                  onMouseDown={() => chooseMovie(movie)}
                >
                  {movie.title}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className={styles.button} disabled={isPending}>
          {isPending ? "Finding matches…" : "Get recommendations"}
        </button>
      </form>

      <p className={styles.status} role="status" aria-live="polite">
        {status === "loading" && "Finding similar movies…"}
        {status === "unmatched" && "Pick a movie from the suggestions list first."}
        {status === "done" && recommendations.length === 0 && "No close matches found."}
        {status === "error" && "Something went wrong. Try again."}
      </p>

      {recommendations.length > 0 && (
        <ul className={styles.grid}>
          {recommendations.map((movie, index) => (
            <PosterCard key={movie.id} movie={movie} priority={index < 2} />
          ))}
        </ul>
      )}
    </>
  );
}
