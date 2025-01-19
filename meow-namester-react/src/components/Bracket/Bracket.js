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

import React from 'react';
import './Bracket.css';

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

  // Group matches into a proper tournament tree structure
  const organizeMatchesIntoTree = (matches) => {
    const totalRounds = Math.ceil(Math.log2(matches.length + 1));
    const tree = Array(totalRounds).fill().map(() => []);
    
    matches.forEach(match => {
      const roundIndex = Math.floor(Math.log2(match.id));
      tree[roundIndex].push(match);
    });

    // Sort matches within each round by their position
    tree.forEach(round => {
      round.sort((a, b) => a.id - b.id);
    });

    return tree;
  };

  const tree = organizeMatchesIntoTree(matches);

  return (
    <div className="bracket-container">
      <div className="bracket">
        {tree.map((round, roundIndex) => (
          <div key={roundIndex} className="bracket-round">
            <div className="round-header">
              <span className="round-title">Round {roundIndex + 1}</span>
              <span className="round-matches">{round.length} {round.length === 1 ? 'match' : 'matches'}</span>
            </div>
            <div className="bracket-matches">
              {round.map((match) => (
                <div 
                  key={match.id} 
                  className="bracket-match"
                >
                  <div className="match-content">
                    <div className={`bracket-player ${getCardVariant(match, true)}`}>
                      <span className="player-name">{match.name1}</span>
                      {getMatchStatus(match) === 'first' && <span className="winner-badge">✓</span>}
                      {getMatchStatus(match) === 'both' && <span className="tie-badge">≈</span>}
                    </div>
                    <div className="vs-divider">vs</div>
                    {match.name2 ? (
                      <div className={`bracket-player ${getCardVariant(match, false)}`}>
                        <span className="player-name">{match.name2}</span>
                        {getMatchStatus(match) === 'second' && <span className="winner-badge">✓</span>}
                        {getMatchStatus(match) === 'both' && <span className="tie-badge">≈</span>}
                      </div>
                    ) : (
                      <div className="bracket-player bye">
                        <span className="bye-text">Bye</span>
                      </div>
                    )}
                  </div>
                  {roundIndex < tree.length - 1 && (
                    <div className="match-connector">
                      <div className="connector-line"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Bracket; 