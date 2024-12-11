class EloRating {
  constructor(defaultRating = 1400, kFactor = 32) {
    this.defaultRating = defaultRating;
    this.kFactor = kFactor;
  }

  getExpectedScore(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  updateRating(rating, expected, actual) {
    return Math.round(rating + this.kFactor * (actual - expected));
  }

  calculateNewRatings(ratingA, ratingB, outcome) {
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
      default: // tie
        actualA = 0.5;
        actualB = 0.5;
    }

    return {
      newRatingA: this.updateRating(ratingA, expectedA, actualA),
      newRatingB: this.updateRating(ratingB, expectedB, actualB)
    };
  }
}

export default EloRating;