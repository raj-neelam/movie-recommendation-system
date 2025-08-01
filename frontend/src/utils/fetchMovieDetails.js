// Utility to fetch movie details and credits, including director
export const fetchMovieDetailsWithCredits = async (id, API_KEY) => {
  try {
    const [movieResponse, creditsResponse] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`),
      fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${API_KEY}`),
    ]);

    if (!movieResponse.ok || !creditsResponse.ok) {
      throw new Error('Failed to fetch movie details or credits');
    }

    const movieData = await movieResponse.json();
    const creditsData = await creditsResponse.json();

    // Extract director's name from credits
    const director = creditsData.crew.find((member) => member.job === 'Director');
    movieData.director = director ? director.name : 'Unknown';

    return movieData;
  } catch (error) {
    console.error('Error fetching movie details with credits:', error);
    return null;
  }
};
