/**
 * @module EloRating
 * @description A class that implements the Elo rating system for ranking cat names.
 * Used to calculate and update ratings based on head-to-head comparisons.
 * 
 * @example
 * const elo = new EloRating();
 * const { newRatingA, newRatingB } = elo.calculateNewRatings(1500, 1500, 'left');
 * 
 * @class
 * @property {number} defaultRating - Default rating for new names (default: 1500)
 * @property {number} kFactor - Base K-factor affecting rating changes (default: 32)
 * @property {number} minRating - Minimum possible rating (default: 1000)
 * @property {number} maxRating - Maximum possible rating (default: 2000)
 */

class EloRating {
  constructor(defaultRating = 1500, kFactor = 32) {
    this.defaultRating = defaultRating;
    this.kFactor = kFactor;
    this.minRating = 1000;
    this.maxRating = 2000;
  }

  /**
   * Calculates the expected score for a matchup
   * @param {number} ratingA - Rating of first name
   * @param {number} ratingB - Rating of second name
   * @returns {number} Expected score between 0 and 1
   */
  getExpectedScore(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  /**
   * Gets the appropriate K-factor based on rating and number of games
   * @param {number} rating - Current rating
   * @param {number} games - Number of games played
   * @returns {number} Adjusted K-factor
   */
  getKFactor(rating, games = 0) {
    // Higher K-factor for new names or extreme ratings
    if (games < 10) return this.kFactor * 1.5;
    if (rating < 1300 || rating > 1700) return this.kFactor * 0.75;
    return this.kFactor;
  }

  /**
   * Updates a rating based on expected and actual scores
   * @param {number} rating - Current rating
   * @param {number} expected - Expected score
   * @param {number} actual - Actual score
   * @param {number} games - Number of games played
   * @returns {number} New rating
   */
  updateRating(rating, expected, actual, games = 0) {
    const k = this.getKFactor(rating, games);
    const newRating = Math.round(rating + k * (actual - expected));
    
    // Ensure rating stays within bounds
    return Math.max(this.minRating, Math.min(this.maxRating, newRating));
  }

  /**
   * Calculates new ratings for both names after a comparison
   * @param {number} ratingA - Rating of first name
   * @param {number} ratingB - Rating of second name
   * @param {string} outcome - Result ('left', 'right', 'both', or 'none')
   * @param {Object} stats - Optional stats for both names
   * @returns {Object} Object containing new ratings for both names
   */
  calculateNewRatings(ratingA, ratingB, outcome, stats = {}) {
    const expectedA = this.getExpectedScore(ratingA, ratingB);
    const expectedB = this.getExpectedScore(ratingB, ratingA);
    
    let actualA, actualB;
    switch(outcome) {
      case 'left': // A wins
        actualA = 1;
        actualB = 0;
        break;
      case 'right': // B wins
        actualA = 0;
        actualB = 1;
        break;
      case 'both': // Slight preference for first option
        actualA = 0.6;
        actualB = 0.4;
        break;
      case 'none': // True tie
        actualA = 0.5;
        actualB = 0.5;
        break;
      default: // Default to tie
        actualA = 0.5;
        actualB = 0.5;
    }

    const gamesA = (stats.winsA || 0) + (stats.lossesA || 0);
    const gamesB = (stats.winsB || 0) + (stats.lossesB || 0);

    return {
      newRatingA: this.updateRating(ratingA, expectedA, actualA, gamesA),
      newRatingB: this.updateRating(ratingB, expectedB, actualB, gamesB)
    };
  }
}

export default EloRating;