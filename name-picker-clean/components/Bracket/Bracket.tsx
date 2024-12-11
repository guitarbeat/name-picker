import { Card } from '@components/ui';
import type { Match, MatchResult } from '../../types/tournament';
import styles from './Bracket.module.scss';

interface BracketProps {
  matches: Match[];
}

export function Bracket({ matches }: BracketProps) {
  const getMatchStatus = (match: Match): 'pending' | 'first' | 'second' | 'both' | 'skip' => {
    if (!match.winner) return 'pending';
    if (match.winner === -1) return 'first';
    if (match.winner === 1) return 'second';
    if (match.winner === (0 as MatchResult)) return 'both';
    return 'skip';
  };

  const getCardVariant = (match: Match, isFirst: boolean): 'default' | 'winner' | 'loser' => {
    if (!match.winner) return 'default';
    const status = getMatchStatus(match);
    if (status === 'first') return isFirst ? 'winner' : 'loser';
    if (status === 'second') return isFirst ? 'loser' : 'winner';
    if (status === 'both') return 'winner';
    return 'default';
  };

  const rounds = matches.reduce<Match[][]>((acc, match) => {
    const lastRound = acc[acc.length - 1];
    if (!lastRound || lastRound.length === Math.pow(2, acc.length - 1)) {
      acc.push([match]);
    } else {
      lastRound.push(match);
    }
    return acc;
  }, []);

  return (
    <div className={styles.bracket}>
      {rounds.map((round, roundIndex) => (
        <div key={roundIndex} className={styles.round}>
          <div className={styles.roundTitle}>
            Round {roundIndex + 1}
          </div>
          <div className={styles.matches}>
            {round.map((match) => (
              <div key={match.id} className={styles.match}>
                <Card
                  variant={getCardVariant(match, true)}
                  className={styles.player}
                >
                  <span>{match.name1}</span>
                  {getMatchStatus(match) === 'first' && <span className={styles.winner}>Winner</span>}
                  {getMatchStatus(match) === 'both' && <span className={styles.tie}>Tie</span>}
                </Card>
                {match.name2 ? (
                  <Card
                    variant={getCardVariant(match, false)}
                    className={styles.player}
                  >
                    <span>{match.name2}</span>
                    {getMatchStatus(match) === 'second' && <span className={styles.winner}>Winner</span>}
                    {getMatchStatus(match) === 'both' && <span className={styles.tie}>Tie</span>}
                  </Card>
                ) : (
                  <Card variant="default" className={styles.player}>
                    <span className={styles.bye}>Bye</span>
                  </Card>
                )}
                {getMatchStatus(match) === 'skip' && (
                  <div className={styles.skipBadge}>Skipped</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 