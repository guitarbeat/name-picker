/**
 * @module Bracket
 * @description A React component that displays a tournament bracket visualization.
 * Shows the progression of matches, winners, and results in a bracket format.
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

import React from 'react';

function Bracket({ matches }) {
  const getMatchStatus = (match) => {
    if (!match.winner) return 'pending';
    if (match.winner === -1) return 'first';
    if (match.winner === 1) return 'second';
    if (match.winner === 0) return 'both';
    return 'skip';
  };

  const getCardVariant = (match, isFirst) => {
    if (!match.winner) return 'default';
    const status = getMatchStatus(match);
    if (status === 'first') return isFirst ? 'winner' : 'loser';
    if (status === 'second') return isFirst ? 'loser' : 'winner';
    if (status === 'both') return 'winner';
    return 'default';
  };

  const rounds = matches.reduce((acc, match) => {
    const lastRound = acc[acc.length - 1];
    if (!lastRound || lastRound.length === Math.pow(2, acc.length - 1)) {
      acc.push([match]);
    } else {
      lastRound.push(match);
    }
    return acc;
  }, []);

  return (
    <div className="bracket">
      {rounds.map((round, roundIndex) => (
        <div key={roundIndex} className="bracket-round">
          <div className="round-title">
            Round {roundIndex + 1}
          </div>
          <div className="bracket-matches">
            {round.map((match) => (
              <div key={match.id} className="bracket-match">
                <div
                  className={`bracket-player ${getCardVariant(match, true)}`}
                >
                  <span>{match.name1}</span>
                  {getMatchStatus(match) === 'first' && <span className="winner-badge">Winner</span>}
                  {getMatchStatus(match) === 'both' && <span className="tie-badge">Tie</span>}
                </div>
                {match.name2 ? (
                  <div
                    className={`bracket-player ${getCardVariant(match, false)}`}
                  >
                    <span>{match.name2}</span>
                    {getMatchStatus(match) === 'second' && <span className="winner-badge">Winner</span>}
                    {getMatchStatus(match) === 'both' && <span className="tie-badge">Tie</span>}
                  </div>
                ) : (
                  <div className="bracket-player bye">
                    <span className="bye-text">Bye</span>
                  </div>
                )}
                {getMatchStatus(match) === 'skip' && (
                  <div className="skip-badge">Skipped</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Bracket; 