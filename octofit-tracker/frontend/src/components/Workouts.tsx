import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; reason: string; focus?: string; minutes?: number };

export default function Workouts() {
  return (
    <CapabilityCard<Workout>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      endpoint={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
      collection="suggestions"
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
