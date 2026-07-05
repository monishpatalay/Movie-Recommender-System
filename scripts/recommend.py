from __future__ import annotations

import pickle
from functools import lru_cache
from pathlib import Path

import pandas as pd
from scipy.sparse import spmatrix
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

MOVIE_LIST_PATH = Path(__file__).resolve().parent.parent / "movie_list.pkl"
MAX_FEATURES = 5000


@lru_cache(maxsize=1)
def load_movies() -> pd.DataFrame:
    with open(MOVIE_LIST_PATH, "rb") as f:
        movies = pickle.load(f)
    # movie_list.pkl has gaps in its index (dropped duplicates were never
    # re-indexed), which would silently misalign label-based lookups against
    # the positionally-ordered vectorized/similarity matrix.
    return movies.reset_index(drop=True)


@lru_cache(maxsize=1)
def _vectorize() -> spmatrix:
    movies = load_movies()
    vectorizer = CountVectorizer(max_features=MAX_FEATURES, stop_words="english")
    return vectorizer.fit_transform(movies["tags"])


def get_movie_titles() -> list[str]:
    return load_movies()["title"].tolist()


def recommend_by_index(index: int, k: int = 5) -> list[dict]:
    movies = load_movies()
    vectors = _vectorize()
    scores = cosine_similarity(vectors[index], vectors)[0]
    ranked = sorted(enumerate(scores), key=lambda item: item[1], reverse=True)

    recommendations: list[dict] = []
    for candidate_index, score in ranked:
        if candidate_index == index:
            continue
        row = movies.iloc[candidate_index]
        recommendations.append(
            {
                "movie_id": int(row["movie_id"]),
                "title": row["title"],
                "score": float(score),
            }
        )
        if len(recommendations) == k:
            break
    return recommendations


def recommend_movies(title: str, k: int = 5) -> list[dict]:
    movies = load_movies()
    matches = movies.index[movies["title"] == title]
    if len(matches) == 0:
        raise ValueError(f"Unknown movie: {title!r}")
    return recommend_by_index(matches[0], k=k)
