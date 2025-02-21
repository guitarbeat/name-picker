/**
 * @module EloRating
 * @description A class that implements the Elo rating system for ranking cat names.
 * Used to calculate and update ratings based on head-to-head comparisons.
 */

class EloRating {
  constructor(defaultRating = 1500, kFactor = 40) {
    this.defaultRating = defaultRating;
    this.kFactor = kFactor;
    this.minRating = 800;
    this.maxRating = 2400;
  }

  getExpectedScore(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  getKFactor(rating, games = 0) {
    if (games < 15) return this.kFactor * 2;
    if (rating < 1400 || rating > 2000) return this.kFactor * 1.5;
    return this.kFactor;
  }

  updateRating(rating, expected, actual, games = 0) {
    const k = this.getKFactor(rating, games);
    const newRating = Math.round(rating + k * (actual - expected));
    return Math.max(this.minRating, Math.min(this.maxRating, newRating));
  }

  /**
   * Calculate new ratings after a match
   * @param {number} ratingA - Current rating of first item
   * @param {number} ratingB - Current rating of second item
   * @param {'left'|'right'|'both'|'none'} outcome - Match result
   * @param {Object} stats - Player statistics
   * @param {number} [stats.winsA] - Wins for player A
   * @param {number} [stats.lossesA] - Losses for player A
   * @returns {Object} New ratings and updated win/loss counts for both items
   */
  calculateNewRatings(ratingA, ratingB, outcome, stats = {}) {
    const expectedA = this.getExpectedScore(ratingA, ratingB);
    const expectedB = this.getExpectedScore(ratingB, ratingA);
    
    let actualA, actualB;
    let winsA = stats.winsA || 0;
    let lossesA = stats.lossesA || 0;
    let winsB = stats.winsB || 0;
    let lossesB = stats.lossesB || 0;

    switch(outcome) {
      case 'left':
        actualA = 1;
        actualB = 0;
        winsA++;
        lossesB++;
        break;
      case 'right':
        actualA = 0;
        actualB = 1;
        lossesA++;
        winsB++;
        break;
      case 'both':
        actualA = 0.7;
        actualB = 0.7;
        winsA++;
        winsB++;
        break;
      case 'none':
        actualA = 0.3;
        actualB = 0.3;
        break;
      default:
        actualA = 0.5;
        actualB = 0.5;
    }

    const gamesA = winsA + lossesA;
    const gamesB = winsB + lossesB;

    return {
      newRatingA: this.updateRating(ratingA, expectedA, actualA, gamesA),
      newRatingB: this.updateRating(ratingB, expectedB, actualB, gamesB),
      winsA,
      lossesA,
      winsB,
      lossesB
    };
  }
}

export default EloRating; 