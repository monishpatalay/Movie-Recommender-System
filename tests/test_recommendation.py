import os
import sys

import pytest

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from scripts.recommend import get_movie_titles, recommend_movies


def test_recommend_movies_returns_unique_titles_for_known_movie():
    titles = get_movie_titles()
    assert "Avatar" in titles

    results = recommend_movies("Avatar")
    assert len(results) == 5
    assert len(set(item["title"] for item in results)) == 5
    assert results[0]["title"] != "Avatar"
