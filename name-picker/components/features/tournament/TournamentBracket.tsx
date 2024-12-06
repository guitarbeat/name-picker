'use client'

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import cn from 'classnames';

interface Match {
  player1: string;
  player2: string;
  winner: string;
  round: number;
  matchIndex: number;
}

interface TournamentBracketProps {
  matches: Match[];
  totalRounds: number;
}

interface MatchesState {
  byRound: Record<number, Match[]>;
  roundWidth: number;
  matchHeight: number;
  lineColor: string;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ matches, totalRounds }) => {
  const [state] = useState<MatchesState>(() => ({
    byRound: matches.reduce((acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    }, {} as Record<number, Match[]>),
    roundWidth: 200,
    matchHeight: 80,
    lineColor: "rgb(229 231 235)"
  }));

  const calculateMatchPosition = useCallback((match: Match) => {
    const x = match.round * state.roundWidth;
    const matchesInRound = Math.pow(2, totalRounds - match.round - 1);
    const sectionHeight = Math.pow(2, totalRounds - 1) * state.matchHeight / matchesInRound;
    const y = (match.matchIndex * sectionHeight) + (sectionHeight / 2) - (state.matchHeight / 2);
    
    return { x, y };
  }, [state.roundWidth, state.matchHeight, totalRounds]);

  const findNextMatch = useCallback((match: Match): Match | undefined => {
    const nextRoundMatches = state.byRound[match.round + 1] || [];
    return nextRoundMatches.find(m => 
      m.player1 === match.winner || m.player2 === match.winner
    );
  }, [state.byRound]);

  const renderMatch = useCallback((match: Match) => {
    const { x, y } = calculateMatchPosition(match);
    const nextMatch = findNextMatch(match);

    return (
      <React.Fragment key={`${match.round}-${match.matchIndex}`}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: match.round * 0.1 }}
          className="absolute"
          style={{
            left: x,
            top: y,
            width: state.roundWidth - 40,
          }}
          role="group"
          aria-label={`Match between ${match.player1} and ${match.player2}`}
        >
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div 
              className={cn(
                'mb-2',
                match.winner === match.player1 && 'font-bold text-green-600'
              )}
              aria-label={`Player 1: ${match.player1}${match.winner === match.player1 ? ' (Winner)' : ''}`}
            >
              {match.player1}
            </div>
            <div className="w-full border-t border-gray-200 my-2" role="separator" />
            <div 
              className={cn(
                match.winner === match.player2 && 'font-bold text-green-600'
              )}
              aria-label={`Player 2: ${match.player2 || 'BYE'}${match.winner === match.player2 ? ' (Winner)' : ''}`}
            >
              {match.player2 || 'BYE'}
            </div>
          </div>

          {match.round < totalRounds - 1 && nextMatch && (
            <>
              {/* Horizontal line */}
              <div
                className="absolute bg-gray-200"
                style={{
                  right: -20,
                  top: '50%',
                  width: 20,
                  height: 2,
                }}
                role="presentation"
              />
              {/* Vertical line */}
              <div
                className="absolute bg-gray-200"
                style={{
                  right: -20,
                  top: '50%',
                  width: 2,
                  height: Math.abs(calculateMatchPosition(nextMatch).y - y),
                  transform: y > calculateMatchPosition(nextMatch).y ? 'translateY(-100%)' : '',
                }}
                role="presentation"
              />
            </>
          )}
        </motion.div>
      </React.Fragment>
    );
  }, [calculateMatchPosition, findNextMatch, state.roundWidth, totalRounds]);

  return (
    <div 
      className="relative w-full overflow-x-auto overflow-y-hidden p-8"
      style={{ 
        height: Math.pow(2, totalRounds - 1) * state.matchHeight + 100,
        minWidth: totalRounds * state.roundWidth 
      }}
    >
      {Object.values(state.byRound).flatMap(roundMatches =>
        roundMatches.map(match => renderMatch(match))
      )}
    </div>
  );
};

export default TournamentBracket;
