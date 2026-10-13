import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };

const loadLeaderboard = async () =>
  (await getJson<{ leaderboard: Ranking[] }>('/api/leaderboard')).leaderboard;

export default function Leaderboard() {
  return (
    <CapabilityCard<Ranking>
      title="Leaderboard"
      description="Compare team point totals."
      loadItems={loadLeaderboard}
      emptyMessage="No leaderboard rankings yet."
      renderItems={(rankings) => (
        <ol className="list-group list-group-numbered list-group-flush">
          {rankings.map((entry) => (
            <li className="list-group-item px-0" key={entry.rank}>
              <strong>{entry.teamName}</strong>: {entry.totalPoints} points
            </li>
          ))}
        </ol>
      )}
    />
  );
}
