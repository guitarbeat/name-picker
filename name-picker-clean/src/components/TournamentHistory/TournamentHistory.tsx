import React from 'react';
import { Card } from '../ui/Card/Card';
import { Button } from '../ui/Button/Button';
import type { TournamentResult } from '../../types/tournament';
import styles from './TournamentHistory.module.scss';

interface TournamentHistoryProps {
  tournaments: TournamentResult[];
  isAdmin: boolean;
  onClearHistory: () => void;
}

export function TournamentHistory({
  tournaments,
  isAdmin,
  onClearHistory,
}: TournamentHistoryProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (tournaments.length === 0) {
    return null;
  }

  return (
    <div className={styles.history}>
      <div className={styles.header}>
        <h2>Tournament History</h2>
        {isAdmin && (
          <Button variant="outline" size="small" onClick={onClearHistory}>
            Clear History
          </Button>
        )}
      </div>

      <div className={styles.list}>
        {tournaments.map((tournament) => (
          <Card
            key={tournament.id}
            className={`${styles.tournament} ${
              expandedId === tournament.id ? styles.expanded : ''
            }`}
            onClick={() => setExpandedId(
              expandedId === tournament.id ? null : tournament.id
            )}
          >
            <div className={styles.summary}>
              <div className={styles.info}>
                <div className={styles.date}>
                  {formatDate(tournament.createdAt)}
                </div>
                <div className={styles.stats}>
                  <span>{tournament.matches.length} matches</span>
                  <span>{tournament.names.length} names</span>
                </div>
              </div>
              <div className={styles.winner}>
                <span>Winner:</span>
                <strong>{tournament.winner}</strong>
              </div>
            </div>

            {expandedId === tournament.id && (
              <div className={styles.details}>
                <div className={styles.standings}>
                  <h3>Final Standings</h3>
                  <div className={styles.standingsList}>
                    {Object.entries(tournament.points)
                      .sort(([, a], [, b]) => b - a)
                      .map(([name, points], index) => (
                        <div key={name} className={styles.standing}>
                          <span className={styles.rank}>#{index + 1}</span>
                          <span className={styles.name}>{name}</span>
                          <span className={styles.points}>{points} pts</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className={styles.matches}>
                  <h3>Matches</h3>
                  <div className={styles.matchList}>
                    {tournament.matches.map((match) => (
                      <div key={match.id} className={styles.match}>
                        <span className={`${styles.name} ${
                          match.winner === -1 ? styles.winner : ''
                        }`}>
                          {match.name1}
                        </span>
                        <span className={styles.vs}>vs</span>
                        {match.name2 ? (
                          <span className={`${styles.name} ${
                            match.winner === 1 ? styles.winner : ''
                          }`}>
                            {match.name2}
                          </span>
                        ) : (
                          <span className={styles.bye}>Bye</span>
                        )}
                        {match.winner === 0 && (
                          <span className={styles.tie}>Tie</span>
                        )}
                        {match.winner === 2 && (
                          <span className={styles.skip}>Skipped</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
} 