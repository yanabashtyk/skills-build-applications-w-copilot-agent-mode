import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };

const loadActivities = async () =>
  (await getJson<{ activities: Activity[] }>('/api/activities')).activities;

export default function Activities() {
  return (
    <CapabilityCard<Activity>
      title="Activities"
      description="Track student activity minutes and points."
      loadItems={loadActivities}
      emptyMessage="No activities yet."
      renderItems={(activities) => (
          <ul className="list-group list-group-flush">
            {activities.map((activity, index) => (
              <li className="list-group-item px-0" key={activity._id ?? `${activity.type}-${index}`}>
                <strong>{activity.type}</strong>: {activity.minutes} minutes, {activity.points} points
              </li>
            ))}
          </ul>
      )}
    />
  );
}
