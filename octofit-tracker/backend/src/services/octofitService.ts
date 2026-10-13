import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const invalidInput = () => Object.assign(new Error('Invalid activity input'), { status: 400 });
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalidInput();

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !/^[\da-f]{24}$/i.test(userId) ||
    typeof teamId !== 'string' || !/^[\da-f]{24}$/i.test(teamId) ||
    typeof type !== 'string' || !type.trim() ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1
  ) {
    throw invalidInput();
  }

  const userObjectId = new Types.ObjectId(userId);
  const teamObjectId = new Types.ObjectId(teamId);
  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userObjectId }),
    Team.exists({ _id: teamObjectId }),
  ]);
  if (!userExists || !teamExists) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: userObjectId,
    team: teamObjectId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const invalidInput = () => Object.assign(new Error('Invalid team input'), { status: 400 });
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalidInput();

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' || !name.trim() ||
    typeof mascot !== 'string' || !mascot.trim() ||
    !Array.isArray(members) ||
    !members.every((member) => typeof member === 'string' && /^[\da-f]{24}$/i.test(member))
  ) {
    throw invalidInput();
  }

  const memberIds = [...new Set(members as string[])].map((member) => new Types.ObjectId(member));
  const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
  if (existingMembers !== memberIds.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  if (memberIds.length > 0) {
    await Promise.all([
      Team.updateMany(
        { _id: { $ne: team._id }, members: { $in: memberIds } },
        { $pull: { members: { $in: memberIds } } },
      ),
      User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } }),
    ]);
  }
  return team;
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  const rankedTeams = teams
    .map(({ _id, name }) => ({ teamName: name, totalPoints: totalByTeam.get(_id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName));

  return rankedTeams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean(),
    Workout.find().lean(),
  ]);
  const focusCandidates: { focus: string; source: 'goal' | 'activity'; activityType?: string }[] = [];
  const goalFocus = String(user.fitnessGoal ?? '').trim().toLowerCase();
  if (goalFocus) focusCandidates.push({ focus: goalFocus, source: 'goal' });

  for (const activity of activities) {
    const type = activity.type.trim().toLowerCase();
    const focus = ['run', 'running', 'cycle', 'cycling', 'walk', 'walking', 'swim', 'swimming'].includes(type)
      ? 'endurance'
      : ['strength', 'weightlifting', 'resistance'].includes(type)
        ? 'strength'
        : ['yoga', 'stretching', 'mobility'].includes(type)
          ? 'mobility'
          : type;
    if (focus && !focusCandidates.some((candidate) => candidate.focus === focus)) {
      focusCandidates.push({ focus, source: 'activity', activityType: activity.type });
    }
  }

  const rank = (focus: string) => {
    const index = focusCandidates.findIndex((candidate) => candidate.focus === focus.trim().toLowerCase());
    return index < 0 ? focusCandidates.length : index;
  };
  const orderedWorkouts = [...workouts].sort((left, right) =>
    rank(left.focus) - rank(right.focus) || left.title.localeCompare(right.title),
  );

  return orderedWorkouts.map((workout) => {
    const candidate = focusCandidates.find((item) => item.focus === workout.focus.trim().toLowerCase());
    const reason = candidate?.source === 'goal'
      ? `Matches your ${candidate.focus} fitness goal.`
      : candidate?.source === 'activity'
        ? `Recommended based on your recent ${candidate.activityType} activity.`
        : 'Recommended as a general workout option.';
    return { ...workout, reason };
  });
}

export { User };
