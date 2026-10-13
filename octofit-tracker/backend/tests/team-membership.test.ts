import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Team, User } from '../src/models/index.js';

let mongo: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60_000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
beforeEach(async () => {
  await Promise.all([Team.deleteMany({}), User.deleteMany({})]);
});

describe('team membership consistency', () => {
  it('moves members from previous teams when creating a team', async () => {
    const previousTeam = await Team.create({ name: 'Previous team', mascot: 'Mona', members: [] });
    const user = await User.create({
      name: 'Mona',
      email: 'mona@example.com',
      team: previousTeam._id,
      fitnessGoal: 'endurance',
    });
    await Team.updateOne({ _id: previousTeam._id }, { $addToSet: { members: user._id } });

    const response = await request(app)
      .post('/api/teams')
      .send({ name: 'Octocats', mascot: 'Mona', members: [user._id.toString()] });

    expect(response.status).toBe(201);
    const [updatedUser, updatedPreviousTeam] = await Promise.all([
      User.findById(user._id),
      Team.findById(previousTeam._id),
    ]);
    expect(updatedUser?.team?.toString()).toBe(response.body.team._id);
    expect(updatedPreviousTeam?.members.map((member) => member.toString())).not.toContain(user._id.toString());
    expect(response.body.team.members).toContain(user._id.toString());
  });
});
