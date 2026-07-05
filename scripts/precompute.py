"""Offline build step: bakes recommendations + TMDb poster URLs into data/movies.json
so the deployed Next.js app is fully static with no runtime API calls or secrets.
Run with: .venv/bin/python3 -m scripts.precompute
"""
from __future__ import annotations

import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

from scripts.recommend import load_movies, recommend_by_index

TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8"
TMDB_MOVIE_URL = "https://api.themoviedb.org/3/movie/{}"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "movies.json"
MAX_WORKERS = 8
TOP_K = 5


def fetch_poster_path(session: requests.Session, movie_id: int) -> str | None:
    for attempt in range(3):
        response = session.get(
            TMDB_MOVIE_URL.format(movie_id),
            params={"api_key": TMDB_API_KEY, "language": "en-US"},
            timeout=10,
        )
        if response.status_code == 429:
            time.sleep(1 + attempt)
            continue
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json().get("poster_path")
    return None


def main() -> None:
    movies = load_movies()

    print(f"Computing top-{TOP_K} recommendations for {len(movies)} movies...")
    similar: dict[str, list[int]] = {}
    for index, row in movies.iterrows():
        movie_id = int(row["movie_id"])
        recs = recommend_by_index(index, k=TOP_K)
        similar[str(movie_id)] = [rec["movie_id"] for rec in recs]

    movie_ids = movies["movie_id"].astype(int).tolist()
    print(f"Fetching TMDb posters for {len(movie_ids)} movies...")

    posters: dict[int, str | None] = {}
    with requests.Session() as session:
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
            futures = {
                pool.submit(fetch_poster_path, session, movie_id): movie_id
                for movie_id in movie_ids
            }
            done = 0
            for future in as_completed(futures):
                movie_id = futures[future]
                try:
                    posters[movie_id] = future.result()
                except requests.RequestException as exc:
                    print(f"  poster fetch failed for {movie_id}: {exc}")
                    posters[movie_id] = None
                done += 1
                if done % 500 == 0:
                    print(f"  {done}/{len(movie_ids)} posters fetched")

    output_movies = []
    for _, row in movies.iterrows():
        movie_id = int(row["movie_id"])
        poster_path = posters.get(movie_id)
        output_movies.append(
            {
                "id": movie_id,
                "title": row["title"],
                "poster": f"{IMAGE_BASE_URL}{poster_path}" if poster_path else None,
            }
        )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump({"movies": output_movies, "similar": similar}, f)

    missing = sum(1 for m in output_movies if m["poster"] is None)
    print(f"Wrote {OUTPUT_PATH} ({len(output_movies)} movies, {missing} missing posters)")


if __name__ == "__main__":
    main()
