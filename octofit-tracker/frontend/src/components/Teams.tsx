import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot: string; members: string[] };

export default function Teams() {
  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      endpoint="/api/teams"
      collection="teams"
      emptyMessage="No teams yet."
      renderItems={(teams) => (
        <ul className="list-group list-group-flush">
          {teams.map((team) => (
            <li className="list-group-item px-0" key={team.name}>
              <strong>{team.name}</strong> ({team.mascot}) · {team.members.length} members
            </li>
          ))}
        </ul>
      )}
    />
  );
}
