// Utility to filter movie suggestions from cached list
export const filterSuggestions = (query, cachedMovieList) => {
  if (!query || query.length < 2 || !cachedMovieList) return [];
  return cachedMovieList
    .filter((movie) => movie.title && movie.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);
};
