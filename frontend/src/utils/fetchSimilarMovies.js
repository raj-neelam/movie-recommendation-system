export const fetchSimilarMovies = async (movieId, setMovies, handleFindSimilarMovies, existingMovies = []) => {
  try {
    const response = await fetch('/similar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ movie_ids: [parseInt(movieId, 10)] }), // Ensure movieId is an integer
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let similarMovies = Object.values(data).flat();

    // Filter out movies without IDs or names
    similarMovies = similarMovies.filter(
      (movie) => movie.id && movie.name
    );

    // Exclude movies that already exist on the page
    const newMovies = similarMovies.filter(
      (movie) => !existingMovies.some((existing) => existing.id === movie.id)
    );

    // Add new movies to the state
    setMovies((prevMovies) => {
      const updatedMovies = [
        ...prevMovies,
        ...newMovies.filter(
          (movie) => movie && !prevMovies.some((m) => m.id === movie.id)
        ),
      ];

      console.log('Updated movies state:', updatedMovies); // Debug log

      return updatedMovies;
    });

    // If fewer than 5 new movies and there are more similar movies to check, fetch recursively
    if (newMovies.length < 5 && similarMovies.length > 1) {
      const nextMovieId = similarMovies.find(
        (movie) => !existingMovies.some((existing) => existing.id === movie.id)
      )?.id; // Find the next movie ID that is not already in existingMovies

      if (nextMovieId) {
        await fetchSimilarMovies(nextMovieId, setMovies, handleFindSimilarMovies, [...existingMovies, ...newMovies]);
      }
    }
  } catch (error) {
    console.error('Error fetching similar movies from /similar API:', error);
  }
};
