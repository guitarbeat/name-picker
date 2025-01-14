/**
 * @module EloRating
 * @description A class that implements the Elo rating system for ranking cat names.
 * Used to calculate and update ratings based on head-to-head comparisons.
 */

class EloRating {
  constructor(defaultRating = 1500, kFactor = 32) {
    this.defaultRating = defaultRating;
    this.kFactor = kFactor;
    this.minRating = 1000;
    this.maxRating = 2000;
  }

  getExpectedScore(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  getKFactor(rating, games = 0) {
    if (games < 10) return this.kFactor * 1.5;
    if (rating < 1300 || rating > 1700) return this.kFactor * 0.75;
    return this.kFactor;
  }

  updateRating(rating, expected, actual, games = 0) {
    const k = this.getKFactor(rating, games);
    const newRating = Math.round(rating + k * (actual - expected));
    return Math.max(this.minRating, Math.min(this.maxRating, newRating));
  }

  calculateNewRatings(ratingA, ratingB, outcome, stats = {}) {
    const expectedA = this.getExpectedScore(ratingA, ratingB);
    const expectedB = this.getExpectedScore(ratingB, ratingA);
    
    let actualA, actualB;
    switch(outcome) {
      case 'left':
        actualA = 1;
        actualB = 0;
        break;
      case 'right':
        actualA = 0;
        actualB = 1;
        break;
      case 'both':
        actualA = 0.8;
        actualB = 0.8;
        break;
      case 'none':
        actualA = 0.5;
        actualB = 0.5;
        break;
      default:
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