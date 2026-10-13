import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot: string; members: string[] };

const loadTeams = async () =>
  (await getJson<{ teams: Team[] }>('/api/teams')).teams;

export default function Teams() {
  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      loadItems={loadTeams}
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
