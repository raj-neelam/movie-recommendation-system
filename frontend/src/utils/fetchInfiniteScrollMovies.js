const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://movie-recommendation-system-unbf.onrender.com";
// Utility to fetch and append unique similar movies for infinite scroll
import { fetchMovieDetailsWithCredits } from './fetchMovieDetails';

export const fetchInfiniteScrollMovies = async (movies, API_KEY, setMovies) => {
  const visibleMovieIds = movies.map((movie) => movie.id || movie.tmdbId).filter(Boolean);
  if (!visibleMovieIds.length) return;
  try {
  const response = await fetch(`${API_BASE_URL}/similar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movie_ids: visibleMovieIds }),
    });
    if (!response.ok) throw new Error('Failed to fetch similar movies');
    const data = await response.json();
    const similarMovies = Object.values(data).flat();
    // Only keep unique movie IDs not already present
    const uniqueNewIds = Array.from(
      new Set(
        similarMovies
          .map((m) => m.id)
          .filter((id) => id && !movies.some((movie) => (movie.id || movie.tmdbId) === id))
      )
    );
    const limitedIds = uniqueNewIds.slice(0, 20);
    const movieDetailsPromises = limitedIds.map(async (id) => {
      return fetchMovieDetailsWithCredits(id, API_KEY);
    });
    const movieDetails = (await Promise.all(movieDetailsPromises)).filter(Boolean);
    // Only add movies that are not already present (by id)
    setMovies((prev) => {
      const existingIds = new Set(prev.map((m) => m.id || m.tmdbId));
      const uniqueMovies = movieDetails.filter((m) => !existingIds.has(m.id));
      return [...prev, ...uniqueMovies];
    });
  } catch (error) {
    console.error('Error fetching more similar movies:', error);
  }
};
