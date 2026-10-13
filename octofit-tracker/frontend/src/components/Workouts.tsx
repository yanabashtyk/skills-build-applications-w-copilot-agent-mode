import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Workout = { title: string; reason: string; focus?: string; minutes?: number };

const loadWorkouts = async () =>
  (await getJson<{ suggestions: Workout[] }>(
    `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`,
  )).suggestions;

export default function Workouts() {
  return (
    <CapabilityCard<Workout>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loadItems={loadWorkouts}
      emptyMessage="No workout suggestions yet."
      renderItems={(suggestions) => (
        <ul className="list-group list-group-flush">
          {suggestions.map((workout) => (
            <li className="list-group-item px-0" key={workout.title}>
              <strong>{workout.title}</strong>{workout.focus ? ` · ${workout.focus}` : ''}
              {workout.minutes ? ` · ${workout.minutes} minutes` : ''}
              <p className="mb-0">{workout.reason}</p>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
