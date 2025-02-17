/**
 * @module Bracket
 * @description A React component that displays a tournament bracket visualization.
 * Shows the progression of matches in a merge sort tournament structure.
 * Supports different match outcomes including wins, ties, and skipped matches.
 * 
 * @example
 * <Bracket
 *   matches={[
 *     { id: 1, name1: "Whiskers", name2: "Mittens", winner: -1 },
 *     { id: 2, name1: "Luna", name2: "Shadow", winner: 1 }
 *   ]}
 * />
 * 
 * @param {Object} props
 * @param {Array} props.matches - Array of match objects containing match details
 * @param {number} props.matches[].id - Unique identifier for the match
 * @param {string} props.matches[].name1 - First name in the match
 * @param {string} props.matches[].name2 - Second name in the match
 * @param {number} props.matches[].winner - Winner indicator (-1: first, 1: second, 0: both, 2: skip)
 */

import React, { useMemo } from 'react';
import styles from './Bracket.module.css';

const MatchResult = {
  PENDING: 'pending',
  FIRST_WIN: 'first',
  SECOND_WIN: 'second',
  BOTH_ADVANCE: 'both',
  SKIPPED: 'skip'
};

function Match({ match, isLastRound }) {
  const status = useMemo(() => {
    if (!match.winner) return MatchResult.PENDING;
    if (match.winner === -1) return MatchResult.FIRST_WIN;
    if (match.winner === 1) return MatchResult.SECOND_WIN;
    if (match.winner === 0) return MatchResult.BOTH_ADVANCE;
    return MatchResult.SKIPPED;
  }, [match.winner]);

  const getPlayerClass = (isFirst) => {
    if (!match.winner) return styles.player;
    if (status === MatchResult.FIRST_WIN) return isFirst ? styles.playerWinner : styles.playerLoser;
    if (status === MatchResult.SECOND_WIN) return isFirst ? styles.playerLoser : styles.playerWinner;
    if (status === MatchResult.BOTH_ADVANCE) return styles.playerWinner;
    return styles.player;
  };

  return (
    <div className={styles.match}>
      <div className={styles.matchContent}>
        <div className={getPlayerClass(true)}>
          <span className={styles.playerName}>{match.name1}</span>
          {status === MatchResult.FIRST_WIN && (
            <span className={styles.winnerBadge} title="Winner">✓</span>
          )}
          {status === MatchResult.BOTH_ADVANCE && (
            <span className={styles.tieBadge} title="Both Advance">≈</span>
          )}
        </div>
        <div className={styles.vsDivider}>vs</div>
        {match.name2 ? (
          <div className={getPlayerClass(false)}>
            <span className={styles.playerName}>{match.name2}</span>
            {status === MatchResult.SECOND_WIN && (
              <span className={styles.winnerBadge} title="Winner">✓</span>
            )}
            {status === MatchResult.BOTH_ADVANCE && (
              <span className={styles.tieBadge} title="Both Advance">≈</span>
            )}
          </div>
        ) : (
          <div className={styles.playerBye}>
            <span className={styles.byeText}>Bye</span>
          </div>
        )}
      </div>
      {!isLastRound && <div className={styles.matchConnector} />}
    </div>
  );
}

function Round({ matches, roundNumber, isLastRound }) {
  return (
    <div className={styles.round}>
      <div className={styles.roundHeader}>
        <span className={styles.roundTitle}>Round {roundNumber}</span>
        <span className={styles.roundMatches}>
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </span>
      </div>
      <div className={styles.matches}>
        {matches.map((match) => (
          <Match 
            key={match.id} 
            match={match} 
            isLastRound={isLastRound}
          />
        ))}
      </div>
    </div>
  );
}

function Bracket({ matches }) {
  const tree = useMemo(() => {
    const totalRounds = Math.ceil(Math.log2(matches.length + 1));
    const rounds = Array(totalRounds).fill().map(() => []);
    
    matches.forEach(match => {
      const roundIndex = Math.floor(Math.log2(match.id));
      rounds[roundIndex].push(match);
    });

    // Sort matches within each round
    rounds.forEach(round => round.sort((a, b) => a.id - b.id));
    
    return rounds;
  }, [matches]);

  if (matches.length === 0) {
    return (
      <div className={styles.emptyState}>
        No matches to display yet
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.bracket}>
        {tree.map((roundMatches, index) => (
          <Round
            key={index}
            matches={roundMatches}
            roundNumber={index + 1}
            isLastRound={index === tree.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

export default React.memo(Bracket); 