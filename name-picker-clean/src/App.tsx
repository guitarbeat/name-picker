import { NameInput } from '@features/tournament/components/NameInput';
import { Tournament } from '@features/tournament/components/Tournament';
import { Results } from '@features/tournament/components/Results';
import { useTournament } from '@features/tournament/hooks/useTournament';
import type { MatchResult } from '@features/tournament/types';
import { UserMenu, useSession } from '@features/user';
import styles from './App.module.scss';

export default function App() {
  const tournament = useTournament();
  const { login } = useSession();

  const handleMatchVote = (result: MatchResult) => {
    if (!tournament.currentRound[tournament.currentMatchIndex]) return;
    tournament.updateMatch(tournament.currentRound[tournament.currentMatchIndex].id, result);
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Name Tournament</h1>
        <UserMenu onLogin={login} />
      </header>

      <main className={styles.main}>
        {tournament.state === 'input' && (
          <NameInput
            useDefaultNames={true}
            onSubmit={tournament.submitNames}
          />
        )}
        {tournament.state === 'tournament' && tournament.currentRound[tournament.currentMatchIndex] && (
          <Tournament
            currentMatch={tournament.currentRound[tournament.currentMatchIndex]}
            onVote={handleMatchVote}
            totalMatches={tournament.currentRound.length}
            currentMatchNumber={tournament.currentMatchIndex + 1}
          />
        )}
        {tournament.state === 'results' && tournament.winner && (
          <Results
            winner={tournament.winner}
            matches={tournament.currentRound}
            points={tournament.points}
            onRestart={tournament.reset}
          />
        )}
      </main>
    </div>
  );
} 