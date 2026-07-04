# Movie Recommender System

A content-based movie recommender: pick a movie from a dropdown and get 5 similar movies with posters, using cosine similarity over TF-IDF/bag-of-words movie metadata (genres, cast, crew, keywords, overview) and TMDb poster images. Served as a Streamlit app.

## How it works

1. `CineMatch.ipynb` builds a combined "tags" feature per movie (overview + genres + keywords + top cast + director), vectorizes it, and computes a pairwise **cosine similarity** matrix across all ~5,000 movies (TMDb 5000 dataset)
2. The notebook pickles the processed movie table (`movie_list.pkl`) and the similarity matrix (`similarity.pkl`)
3. `appp.py` is a Streamlit app that loads those pickles, looks up the selected movie's row, sorts all other movies by similarity score, and shows the top 5 with posters fetched from the TMDb API

## Tech Stack

Python, pandas, scikit-learn (`cosine_similarity`), Streamlit, TMDb API, Jupyter Notebook.

## Setup & Running It

### 1. Install dependencies

```bash
pip install pandas scikit-learn streamlit requests jupyter
```

### 2. Generate `similarity.pkl`

`movie_dict.pkl` and `movie_list.pkl` are committed, but **`similarity.pkl` is not** (the pairwise similarity matrix is large). Regenerate it by running `CineMatch.ipynb` end-to-end — the last cells pickle both `movie_list.pkl` and `similarity.pkl` into the working directory.

### 3. Run the Streamlit app

```bash
streamlit run appp.py
```

This opens the app in your browser (typically [http://localhost:8501](http://localhost:8501)). Pick a movie from the dropdown and click **Show Recommendation**.

## Deployed Link

Not currently deployed — run it locally with the steps above. Streamlit Community Cloud is a common free option if you want to host this.

## Note on the TMDb API key

`appp.py` calls the TMDb API with a hardcoded key. It's the widely-shared public demo key from the original tutorial this project is based on, not a private credential — but for your own deployment, get a free key from [themoviedb.org](https://www.themoviedb.org/settings/api) and load it from an environment variable instead of hardcoding it.
