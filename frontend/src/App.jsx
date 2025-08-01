import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import MovieCard from './components/MovieCard'; // Import the MovieCard component
import Popup from './components/Popup'; // Import the Popup component
import SearchBar from './components/SearchBar';
import Header from './components/Header';
import FloatingActionButton from './components/FloatingActionButton';
import AISuggestedContent from './components/AISuggestedContent';
import { fetchSimilarMovies } from './utils/fetchSimilarMovies';
import { fetchMovieDetailsWithCredits } from './utils/fetchMovieDetails';
import { fetchInfiniteScrollMovies } from './utils/fetchInfiniteScrollMovies';
import { filterSuggestions } from './utils/filterSuggestions';

const App = () => {
  const [movieId, setMovieId] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [fadeOut, setFadeOut] = useState(false); // New state for fade-out effect
  const [selectedMovie, setSelectedMovie] = useState(null); // New state for selected movie
  const [likedMovieIds, setLikedMovieIds] = useState([]); // Track liked movie IDs
  const [showAISuggested, setShowAISuggested] = useState(false);

  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  // Helper to clear previous movie images from memory
  const clearPreviousImages = () => {
    if (window.cachedMovieImages) {
      Object.keys(window.cachedMovieImages).forEach(key => {
        delete window.cachedMovieImages[key];
      });
    }
    window.cachedMovieImages = {};
  };

  // Update the fetchMovieDetails function to use the utility
  const fetchMovieDetails = async (id) => {
    if (!id) {
      alert('Please enter a movie ID');
      return;
    }
    clearPreviousImages();
    setLoading(true);
    try {
      const movieData = await fetchMovieDetailsWithCredits(id, API_KEY);
      if (!movieData) throw new Error('Failed to fetch movie details or credits');
      setMovies([movieData]);
      // Fetch similar movies for the searched movie ID
      await fetchSimilarMovies([id]);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      alert('Failed to fetch movie details.');
    }
    setLoading(false);
    setMovieId(''); // Clear the search box
    setSuggestions([]); // Hide the suggestion box
  };

  // Fetch /list from FastAPI backend and get random movies on initial load
  useEffect(() => {
    const fetchRandomMovies = async () => {
      if (window.cachedRandomMovies) {
        setMovies(window.cachedRandomMovies); // Use cached movies if available
        return;
      }

      setLoading(true);
      try {
        const listResponse = await fetch('/list');
        const movieList = await listResponse.json();
        // Filter out invalid IDs (e.g., 0 or null)
        const validMovies = movieList.filter(movie => movie.tmdbId && movie.tmdbId > 0);
        const randomIds = validMovies
          .sort(() => 0.5 - Math.random())
          .slice(0, 50)
          .map(movie => movie.tmdbId);

        const moviePromises = randomIds.map(async (id) => {
          return fetchMovieDetailsWithCredits(id, API_KEY);
        });

        const movieDataArr = await Promise.all(moviePromises);
        const filteredMovies = movieDataArr.filter(Boolean);
        setMovies(filteredMovies);
        window.cachedRandomMovies = filteredMovies; // Cache the result globally
      } catch (error) {
        console.error('Error fetching random movies:', error);
      }
      setLoading(false);
    };

    fetchRandomMovies();
  }, []); // Empty dependency array ensures this runs only once

  // Store the cached movie list and use it for search and suggestions
  useEffect(() => {
    const fetchAndCacheMovieList = async () => {
      if (!window.cachedMovieList) {
        try {
          const response = await fetch('/list');
          const movieList = await response.json();
          window.cachedMovieList = movieList;
        } catch (error) {
          console.error('Error fetching movie list:', error);
        }
      }
    };
    fetchAndCacheMovieList();
  }, []);

  // Update the fetchSuggestions function to use the utility
  const fetchSuggestions = async (query) => {
    setSuggestions(filterSuggestions(query, window.cachedMovieList));
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && movieId) {
      fetchMovieDetails(movieId);
    }
  };

  const handleInputChange = (e) => {
    setMovieId(e.target.value);
    setFadeOut(false); // Ensure the suggestion box is visible when typing resumes
    fetchSuggestions(e.target.value);
  };

  // Remove the scroll-based fading effect completely
  useEffect(() => {
    const handleScroll = () => {
      const cards = document.querySelectorAll('.movie-card');
      cards.forEach((card) => {
        card.style.animation = 'none'; // Disable any animation styles
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update the fallback image to use the local asset if TMDb API fails to provide an image
  const fallbackImage = './assets/no_movie_found.png';

  // Fetch similar movies using new API (10 per call, sorted by similarity)
  const fetchSimilarMoviesRecursively = async (seedMovieId, minCount = 20) => {
    const seen = new Set();
    const allMovies = [];
    let queue = [seedMovieId];

    while (queue.length > 0 && allMovies.length < minCount) {
      const currentId = queue.shift();
      if (seen.has(currentId)) continue;
      seen.add(currentId);
      try {
        // Fetch similar movies for the current movie
        const response = await fetch('/similar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movie_ids: [parseInt(currentId, 10)] }),
        });
        if (response.ok) {
          const data = await response.json();
          // Each movie has id, name, distance (lower is better)
          const similarMovies = Object.values(data).flat();
          // Sort by ascending distance (most similar first)
          similarMovies.sort((a, b) => a.distance - b.distance);
          for (const movie of similarMovies) {
            if (!seen.has(movie.id) && !queue.includes(movie.id) && !allMovies.some(m => m.id === movie.id)) {
              // Fetch details for each similar movie
              const movieData = await fetchMovieDetailsWithCredits(movie.id, API_KEY);
              if (movieData) {
                movieData.similarityScore = movie.distance;
                allMovies.push(movieData);
                queue.push(movie.id);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in recursive similar fetch:', error);
      }
    }
    // Return up to minCount, most similar first
    return allMovies.slice(0, minCount);
  };

  // Only use this for card clicks (popup, find similar, etc.)
  const handleCardClick = async (movieId, isFindSimilar) => {
    if (isFindSimilar) {
      await handleFindSimilarMovies(movieId);
      return;
    }
    try {
      const movieData = await fetchMovieDetailsWithCredits(movieId, API_KEY);
      if (!movieData) throw new Error('Failed to fetch movie details or credits');
      setSelectedMovie(movieData);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    }
  };

  // When a movie is selected from search suggestions, recursively load similar movies and update the grid
  const handleSearchSuggestionSelect = async (movieId) => {
    setLoading(true);
    try {
      // Fetch details for the selected movie
      const selectedMovieData = await fetchMovieDetailsWithCredits(movieId, API_KEY);

      // Fetch similar movies recursively
      const moviesList = await fetchSimilarMoviesRecursively(movieId, 20);

      // Remove the selected movie from the similar movies list if present
      const filteredMovies = moviesList.filter(m => m.id !== selectedMovieData.id);

      // Place the selected movie at the start
      setMovies([selectedMovieData, ...filteredMovies]);
      setSelectedMovie(null);
      setSuggestions([]);
      setMovieId('');
    } catch (error) {
      console.error('Error loading similar movies from search:', error);
    }
    setLoading(false);
  };

  const handleFindSimilarMovies = async (movieId) => {
    try {
      const response = await fetch('/similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movie_ids: [parseInt(movieId, 10)] }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let similarMovies = Object.values(data).flat();
      // Sort by ascending distance (most similar first)
      similarMovies.sort((a, b) => a.distance - b.distance);

      // Map the response to movie cards with similarity score
      const movieDetailsPromises = similarMovies.map(async (movie) => {
        const movieData = await fetchMovieDetailsWithCredits(movie.id, API_KEY);
        if (movieData) {
          movieData.similarityScore = movie.distance;
        }
        return movieData;
      });

      const movieDetails = (await Promise.all(movieDetailsPromises)).filter(Boolean);

      setMovies((prevMovies) => {
        const updatedMovies = [
          ...prevMovies,
          ...movieDetails.filter((movie) => movie && !prevMovies.some((m) => m.id === movie.id)),
        ];
        return updatedMovies;
      });
    } catch (error) {
      console.error('Error fetching similar movies:', error);
    }
  };

  // Add logic to prevent scrolling when the popup is active
  useEffect(() => {
    if (selectedMovie) {
      document.body.classList.add('popup-active');
    } else {
      document.body.classList.remove('popup-active');
    }
  }, [selectedMovie]);

  // Infinite scroll: fetch more similar movies when scrolled to the end
  useEffect(() => {
    const handleScroll = async () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 100
      ) {
        await fetchInfiniteScrollMovies(movies, API_KEY, setMovies);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [movies]);

  // Helper to determine how many placeholders to show
  const PLACEHOLDER_COUNT = 5; // Number of cards per row
  const showPlaceholders = !loading && movies.length > 0 && movies.length % PLACEHOLDER_COUNT !== 0;
  const placeholdersNeeded = showPlaceholders ? PLACEHOLDER_COUNT - (movies.length % PLACEHOLDER_COUNT) : 0;

  // Handler to toggle like for a movie
  const handleToggleLike = useCallback((movieId) => {
    setLikedMovieIds((prev) =>
      prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId]
    );
  }, []);

  // Handler to clear all liked movies
  const handleClearLiked = () => setLikedMovieIds([]);

  // Get liked movie objects from current movies list (fallback to empty array)
  const likedMovies = movies.filter(m => likedMovieIds.includes(m.id)).map(m => ({ ...m, liked: true }));

  return (
    <div className="app">
      {showAISuggested ? (
        <AISuggestedContent
          likedMovies={likedMovies}
          onBack={() => setShowAISuggested(false)}
          onClear={handleClearLiked}
          onToggleLike={handleToggleLike}
        />
      ) : (
        <>
          <Header />
          <SearchBar
            movieId={movieId}
            setMovieId={setMovieId}
            fetchMovieDetails={fetchMovieDetails}
            suggestions={suggestions}
            fadeOut={fadeOut}
            setFadeOut={setFadeOut}
            setSuggestions={setSuggestions}
            handleInputChange={handleInputChange}
            handleKeyPress={handleKeyPress}
            onSuggestionSelect={handleSearchSuggestionSelect}
          />

          {loading ? (
            <div className="loading">Loading movies...</div>
          ) : (
            <div className="movie-grid">
              {movies.length > 0 && (
                <>
                  {/* Always show the first movie (the selected one) first */}
                  <MovieCard
                    key={movies[0].id}
                    movie={movies[0]}
                    onClick={handleCardClick}
                    liked={likedMovieIds.includes(movies[0].id)}
                    onToggleLike={() => handleToggleLike(movies[0].id)}
                    similarityScore={movies[0].similarityScore}
                  />
                  {/* Show the rest, sorted by similarityScore */}
                  {movies
                    .slice(1)
                    .sort((a, b) => (a.similarityScore ?? 9999) - (b.similarityScore ?? 9999))
                    .map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onClick={handleCardClick}
                        liked={likedMovieIds.includes(movie.id)}
                        onToggleLike={() => handleToggleLike(movie.id)}
                        similarityScore={movie.similarityScore}
                      />
                    ))}
                </>
              )}
              {/* Show empty cards as placeholders while loading more movies */}
              {loading &&
                Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
                  <div className="movie-card placeholder" key={`placeholder-${i}`}></div>
                ))}
            </div>
          )}

          {/* Render the Popup component */}
          <Popup movie={selectedMovie} onClose={() => setSelectedMovie(null)} />
          <FloatingActionButton onClick={() => setShowAISuggested(true)} likedCount={likedMovieIds.length} />
        </>
      )}
    </div>
  );
};

export default App;