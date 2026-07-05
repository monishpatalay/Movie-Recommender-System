# CineMatch — Movie Recommender

**Live demo:** https://cinematch-movie-recommender-lime.vercel.app

Pick a movie you like, and CineMatch suggests five others that are similar in plot, genre, cast, and crew. There are no user accounts, ratings, or watch history involved — it's a **content-based** recommender, meaning it only ever looks at what a movie *is* (its own metadata), never at what other people watched or liked.

## How the recommendation model works

The model is built in `CineMatch.ipynb` from the [TMDb 5000 Movie Dataset](https://www.kaggle.com/tmdb/tmdb-movie-metadata): `tmdb_5000_movies.csv` merged with `tmdb_5000_credits.csv` on title, ending up with ~4,800 movies.

1. **Keep only the "content" columns.** Of the ~20 raw columns (budget, popularity, release date, production company, etc.), only five are used: `overview`, `genres`, `keywords`, `cast`, `crew`. Everything else is dropped as noise for this purpose.
2. **Flatten the nested fields.** `genres`, `keywords`, `cast`, and `crew` arrive as stringified JSON, e.g. `[{"id": 28, "name": "Action"}, {"id": 12, "name": "Adventure"}]`. Each gets parsed down to a plain list of names: genres → `["Action", "Adventure", ...]`, keywords → their tag names, cast → **the top 3 billed actors only**, crew → **the director(s) only** (writers, composers, producers, and everyone else in the credits are discarded).
3. **Collapse multi-word names into single tokens.** Every name has its internal spaces stripped — `"Sam Worthington"` → `"SamWorthington"`, `"Science Fiction"` → `"ScienceFiction"`. This matters: without it, two unrelated actors both named "Tom" would each contribute a generic, meaningless "Tom" token to the model. Collapsing keeps each person, genre, and keyword as one indivisible unit.
4. **Build one "tags" string per movie.** The `overview` (plot summary) is split into individual words, then concatenated with the collapsed genres, keywords, cast, and crew into one list, joined back into a single space-separated string. This string is the *entire* content the model ever sees for that movie.
5. **Vectorize with a bag-of-words model.** `CountVectorizer(max_features=5000, stop_words='english')` turns each movie's tag string into a 5,000-dimension vector of raw word counts, with common English stopwords removed. This is **plain bag-of-words, not TF-IDF** — a token counts equally whether it's rare or common across the whole dataset (aside from the stopword list).
6. **Measure similarity with cosine distance.** `cosine_similarity` computes the angle between every pair of movie vectors. Movies that share more genre/keyword/cast/crew/plot-word tokens end up closer together in this 5,000-dimensional space — cosine similarity is used specifically because it ignores vector *length* (a movie with a longer overview isn't unfairly penalized) and only measures *overlap in direction*.
7. **Recommend the top 5.** For a chosen movie, its similarity scores against all ~4,800 others are sorted descending, the movie itself (which always scores a perfect 1.0 against itself) is skipped, and the next 5 highest-scoring movies are returned.

**The practical implication:** recommendations are driven by shared vocabulary — genre words, keyword tags, a shared director, overlapping lead actors, common plot words — not by any deeper understanding of story or theme. Two movies with the same director and a couple of the same lead actors will often rank as very similar even if their actual stories have nothing in common. That's also why a given movie's results can occasionally look surprising rather than obviously "alike."

One non-obvious gotcha this project's pipeline had to account for: the notebook's `dropna()` call removes movies with missing data (e.g. no overview) but does **not** reset the DataFrame's row index afterward, leaving small gaps in it. Since the similarity matrix is built and indexed *positionally* (not by that label), a naive lookup by the original row label can silently pull the wrong movie's similarity row. `scripts/recommend.py` re-indexes the data on load specifically to avoid this.

## How this gets deployed

Recommendations only depend on which movie is picked, not on any live user data, so the whole pipeline above is run **once, offline**, and the results are baked into a static JSON file rather than recomputed per request:

1. `CineMatch.ipynb` — the original notebook prototype described above.
2. `scripts/recommend.py` — the same modeling logic (`CountVectorizer` + cosine similarity) as a reusable, tested Python module. Loads `movie_list.pkl` (the `movie_id`/`title`/`tags` table the notebook produces). Covered by `tests/test_recommendation.py`.
3. `scripts/precompute.py` — an offline build step that computes each movie's top-5 similar movies and fetches TMDb poster URLs for all ~4,800 movies, writing everything to `data/movies.json`.
4. The Next.js app (`app/`, `components/`, `lib/`) reads `data/movies.json`. A Next.js Server Action (`app/actions.ts`) handles search-as-you-type and recommendation lookups server-side, so the ~800KB movie dataset never ships to the browser — the client only ever receives small per-query results.

Because posters are pre-resolved to `image.tmdb.org` URLs ahead of time, **the deployed app makes no runtime calls to the TMDb API and needs no API key or secrets in production.**

## Running it locally

### Frontend (Next.js)

```bash
npm install
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Regenerating the data (only needed if you change the model or dataset)

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install pandas scikit-learn requests pytest
python3 -m pytest tests/               # verify the recommendation logic
python3 -m scripts.precompute          # regenerates data/movies.json (~4-5 min, calls TMDb)
```

`scripts/precompute.py` reuses the public TMDb demo API key from the original tutorial this project is based on — it's a shared tutorial key, not a private credential. Swap in your own key from [themoviedb.org](https://www.themoviedb.org/settings/api) if you prefer.

## Testing

- `tests/test_recommendation.py` (pytest) — verifies the Python recommendation logic.
- `lib/search.test.ts` (vitest, `npm test`) — verifies the client-side title search/filter logic.

## Deploying to Vercel

This is a zero-config Next.js app — no environment variables or backend services required.

1. Push this repo to GitHub.
2. In Vercel, "Add New Project" and import the repo. Vercel auto-detects Next.js.
3. Deploy. That's it — `data/movies.json` is committed and bundled at build time.

If you ever expand the movie dataset or change the model, rerun `scripts/precompute.py` locally and commit the updated `data/movies.json` before redeploying.
