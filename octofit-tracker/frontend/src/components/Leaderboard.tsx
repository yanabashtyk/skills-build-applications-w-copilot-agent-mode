import { CapabilityCard } from './CapabilityCard.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return (
    <CapabilityCard<Ranking>
      title="Leaderboard"
      description="Compare team point totals."
      endpoint="/api/leaderboard"
      collection="leaderboard"
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
