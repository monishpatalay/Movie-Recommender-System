# CineMatch — Movie Recommender

**Live demo:** https://cinematch-movie-recommender-lime.vercel.app

A content-based movie recommender: search for a movie and get five similar picks with posters, using cosine similarity over TF-IDF/bag-of-words movie metadata (genres, cast, crew, keywords, overview). The model was prototyped in a notebook; the deployed version is a static Next.js site with zero runtime backend.

## Architecture

Recommendations only depend on which movie is picked, not on live user data, so the whole pipeline is precomputed once and baked into a static JSON file:

1. `CineMatch.ipynb` — the original notebook prototype (TF-IDF/bag-of-words + cosine similarity over ~4,800 movies).
2. `scripts/recommend.py` — the reusable recommendation logic (loads `movie_list.pkl`, vectorizes tags with `CountVectorizer`, computes cosine similarity). Covered by `tests/test_recommendation.py`.
3. `scripts/precompute.py` — an offline build step that computes each movie's top-5 similar movies and fetches TMDb poster URLs for all ~4,800 movies, writing everything to `data/movies.json`.
4. The Next.js app (`app/`, `components/`, `lib/`) reads `data/movies.json` at build/runtime. A Next.js Server Action (`app/actions.ts`) handles search-as-you-type and recommendation lookups, so the ~800KB movie dataset stays server-side and the client only ever receives small per-query results.

Because posters are pre-resolved to `image.tmdb.org` URLs, **the deployed app makes no runtime calls to the TMDb API and needs no API key or secrets in production.**

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
