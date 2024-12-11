import { Card, Button } from '@components/ui';
import { Bracket } from '../Bracket';
import type { Match } from '../../types/tournament';
import styles from './Results.module.scss';

interface ResultsProps {
  winner: string;
  matches: Match[];
  points: Record<string, number>;
  onRestart: () => void;
}

export function Results({ winner, matches, points, onRestart }: ResultsProps) {
  // Get top 4 names by points
  const topNames = Object.entries(points)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([name, points]) => ({ name, points }));

  return (
    <div className={styles.results}>
      <Card className={styles.winnerCard}>
        <div className={styles.confetti} />
        <h2>Winner!</h2>
        <div className={styles.winnerName}>{winner}</div>
        <Button onClick={onRestart} variant="primary">
          Start New Tournament
        </Button>
      </Card>

      <div className={styles.standings}>
        <h3>Final Standings</h3>
        <div className={styles.standingsList}>
          {topNames.map(({ name, points }, index) => (
            <Card
              key={name}
              className={`${styles.standingCard} ${index === 0 ? styles.winner : ''}`}
            >
              <div className={styles.rank}>#{index + 1}</div>
              <div className={styles.nameAndPoints}>
                <div className={styles.name}>{name}</div>
                <div className={styles.points}>{points} points</div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className={styles.bracketSection}>
        <h3>Tournament Bracket</h3>
        <Bracket matches={matches} />
      </div>

      <div className={styles.stats}>
        <h3>Tournament Stats</h3>
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <div className={styles.label}>Total Matches</div>
            <div className={styles.value}>{matches.length}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.label}>Total Names</div>
            <div className={styles.value}>{Object.keys(points).length}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.label}>Winner Points</div>
            <div className={styles.value}>{points[winner]}</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.label}>Average Points</div>
            <div className={styles.value}>
              {(Object.values(points).reduce((a, b) => a + b, 0) / Object.keys(points).length).toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 