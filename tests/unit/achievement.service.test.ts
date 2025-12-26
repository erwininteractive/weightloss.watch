import { describe, it, expect, beforeEach } from "@jest/globals";
import { AchievementService } from "../../src/services/achievement.service";
import { resetDatabase } from "../helpers/db";
import {
	createTestUser,
	createTestWeightEntry,
	createTestAchievement,
	createTestUserAchievement,
	createTestTeam,
	createTestTeamMember,
} from "../helpers/factories";
import { prisma } from "../helpers/db";

describe("AchievementService", () => {
	beforeEach(async () => {
		await resetDatabase();
	});

	describe("awardAchievement", () => {
		it("should award an achievement to a user", async () => {
			const user = await createTestUser();
			const achievement = await createTestAchievement({
				name: "Test Achievement",
			});

			const result = await AchievementService.awardAchievement(
				user.id,
				"Test Achievement",
			);

			expect(result).toBeDefined();
			expect(result?.name).toBe("Test Achievement");
			expect(result?.points).toBe(10);

			// Verify in database
			const userAchievement = await prisma.userAchievement.findUnique({
				where: {
					userId_achievementId: {
						userId: user.id,
						achievementId: achievement.id,
					},
				},
			});

			expect(userAchievement).toBeDefined();
		});

		it("should return null if achievement not found", async () => {
			const user = await createTestUser();

			const result = await AchievementService.awardAchievement(
				user.id,
				"Non-existent Achievement",
			);

			expect(result).toBeNull();
		});

		it("should return null if user already has achievement", async () => {
			const user = await createTestUser();
			await createTestAchievement({
				name: "Duplicate Achievement",
			});

			// Award once
			await AchievementService.awardAchievement(
				user.id,
				"Duplicate Achievement",
			);

			// Try to award again
			const result = await AchievementService.awardAchievement(
				user.id,
				"Duplicate Achievement",
			);

			expect(result).toBeNull();
		});
	});

	describe("checkWeightAchievements", () => {
		it("should award 'First Weigh-In' on first entry", async () => {
			const user = await createTestUser();
			await createTestAchievement({ name: "First Weigh-In" });
			await createTestWeightEntry(user.id, { weight: 200 });

			const unlocked = await AchievementService.checkWeightAchievements(
				user.id,
			);

			expect(unlocked).toHaveLength(1);
			expect(unlocked[0].name).toBe("First Weigh-In");
		});

		it("should award weight loss milestone achievements", async () => {
			const user = await createTestUser();
			await createTestAchievement({ name: "5 lbs Lost" });
			await createTestAchievement({ name: "10 lbs Lost" });

			// Create entries showing weight loss
			const now = new Date();
			await createTestWeightEntry(user.id, {
				weight: 200,
				recordedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
			});
			await createTestWeightEntry(user.id, {
				weight: 189,
				recordedAt: now,
			});

			const unlocked = await AchievementService.checkWeightAchievements(
				user.id,
			);

			const achievementNames = unlocked.map((a) => a.name);
			expect(achievementNames).toContain("5 lbs Lost");
			expect(achievementNames).toContain("10 lbs Lost");
		});

		it("should award 'Goal Reached' when current weight <= goal weight", async () => {
			const user = await createTestUser({ goalWeight: 180 });
			await createTestAchievement({ name: "Goal Reached" });

			await createTestWeightEntry(user.id, { weight: 200 });
			await createTestWeightEntry(user.id, { weight: 179 });

			// Update user's current weight
			await prisma.user.update({
				where: { id: user.id },
				data: { currentWeight: 179 },
			});

			const unlocked = await AchievementService.checkWeightAchievements(
				user.id,
			);

			const achievementNames = unlocked.map((a) => a.name);
			expect(achievementNames).toContain("Goal Reached");
		});

		it("should award 'Perfect Week' for 7 consecutive days of weight loss", async () => {
			const user = await createTestUser();
			await createTestAchievement({ name: "Perfect Week" });

			const now = new Date();
			for (let i = 6; i >= 0; i--) {
				await createTestWeightEntry(user.id, {
					weight: 200 - (6 - i),
					recordedAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
				});
			}

			const unlocked = await AchievementService.checkWeightAchievements(
				user.id,
			);

			const achievementNames = unlocked.map((a) => a.name);
			expect(achievementNames).toContain("Perfect Week");
		});

		it("should award 'Comeback Kid' for logging after 30+ day gap", async () => {
			const user = await createTestUser();
			await createTestAchievement({ name: "Comeback Kid" });

			const now = new Date();
			await createTestWeightEntry(user.id, {
				weight: 200,
				recordedAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
			});
			await createTestWeightEntry(user.id, {
				weight: 195,
				recordedAt: now,
			});

			const unlocked = await AchievementService.checkWeightAchievements(
				user.id,
			);

			const achievementNames = unlocked.map((a) => a.name);
			expect(achievementNames).toContain("Comeback Kid");
		});
	});

	describe("checkStreakAchievements", () => {
		it("should award 'Week Warrior' for 7 day streak", async () => {
			const user = await createTestUser();
			await createTestAchievement({ name: "Week Warrior" });

			const now = new Date();
			for (let i = 0; i < 7; i++) {
				await createTestWeightEntry(user.id, {
					weight: 200 - i,
					recordedAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
				});
			}

			const unlocked = await AchievementService.checkStreakAchievements(
				user.id,
			);

			expect(unlocked).toHaveLength(1);
			expect(unlocked[0].name).toBe("Week Warrior");
		});

		it("should award 'Monthly Consistent' for 4+ weeks with entries", async () => {
			const user = await createTestUser();
			await createTestAchievement({ name: "Monthly Consistent" });

			const now = new Date();
			// Create 5 entries over 4 weeks
			for (let week = 0; week < 4; week++) {
				await createTestWeightEntry(user.id, {
					weight: 200 - week,
					recordedAt: new Date(now.getTime() - week * 7 * 24 * 60 * 60 * 1000),
				});
			}

			const unlocked = await AchievementService.checkStreakAchievements(
				user.id,
			);

			const achievementNames = unlocked.map((a) => a.name);
			expect(achievementNames).toContain("Monthly Consistent");
		});

		it("should award 'Year of Progress' for 365 entries", async () => {
			const user = await createTestUser();
			await createTestAchievement({ name: "Year of Progress" });

			const now = new Date();
			// Create 365 entries
			for (let i = 0; i < 365; i++) {
				await createTestWeightEntry(user.id, {
					weight: 200,
					recordedAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
				});
			}

			const unlocked = await AchievementService.checkStreakAchievements(
				user.id,
			);

			const achievementNames = unlocked.map((a) => a.name);
			expect(achievementNames).toContain("Year of Progress");
		});
	});

	describe("checkEngagementAchievements", () => {
		it("should award 'Team Player' for joining first team", async () => {
			const user = await createTestUser();
			const owner = await createTestUser();
			await createTestAchievement({ name: "Team Player" });

			const team = await createTestTeam(owner.id);
			await createTestTeamMember(team.id, user.id, "MEMBER");

			const unlocked =
				await AchievementService.checkEngagementAchievements(user.id);

			expect(unlocked).toHaveLength(1);
			expect(unlocked[0].name).toBe("Team Player");
		});

		it("should award 'Social Butterfly' for creating first post", async () => {
			const user = await createTestUser();
			const team = await createTestTeam(user.id);
			await createTestAchievement({ name: "Social Butterfly" });

			await prisma.post.create({
				data: {
					authorId: user.id,
					teamId: team.id,
					content: "First post!",
					type: "GENERAL",
					visibility: "TEAM",
				},
			});

			const unlocked =
				await AchievementService.checkEngagementAchievements(user.id);

			const achievementNames = unlocked.map((a) => a.name);
			expect(achievementNames).toContain("Social Butterfly");
		});

		it("should award 'Challenger' for joining first challenge", async () => {
			const user = await createTestUser();
			const team = await createTestTeam(user.id);
			await createTestAchievement({ name: "Challenger" });

			const challenge = await prisma.challenge.create({
				data: {
					name: "Test Challenge",
					description: "A test challenge",
					type: "TOTAL_WEIGHT_LOSS",
					status: "ACTIVE",
					teamId: team.id,
					startDate: new Date(),
					endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
					targetValue: 10,
				},
			});

			await prisma.challengeParticipant.create({
				data: {
					challengeId: challenge.id,
					userId: user.id,
					progress: 0,
				},
			});

			const unlocked =
				await AchievementService.checkEngagementAchievements(user.id);

			const achievementNames = unlocked.map((a) => a.name);
			expect(achievementNames).toContain("Challenger");
		});

		it("should award 'Complete Profile' when all fields are filled", async () => {
			const user = await createTestUser({
				displayName: "Complete User",
				bio: "I am a complete user",
				avatarUrl: "https://example.com/avatar.jpg",
				goalWeight: 180,
				height: 72,
			});
			await createTestAchievement({ name: "Complete Profile" });

			const unlocked =
				await AchievementService.checkEngagementAchievements(user.id);

			const achievementNames = unlocked.map((a) => a.name);
			expect(achievementNames).toContain("Complete Profile");
		});

		it("should award 'Progress Photo Pro' for uploading 10 photos", async () => {
			const user = await createTestUser();
			await createTestAchievement({ name: "Progress Photo Pro" });

			const entry = await createTestWeightEntry(user.id);

			// Create 10 photos
			for (let i = 0; i < 10; i++) {
				await prisma.progressPhoto.create({
					data: {
						entryId: entry.id,
						url: `/uploads/progress/photo-${i}.jpg`,
						visibility: "PRIVATE",
						sortOrder: i,
					},
				});
			}

			const unlocked =
				await AchievementService.checkEngagementAchievements(user.id);

			const achievementNames = unlocked.map((a) => a.name);
			expect(achievementNames).toContain("Progress Photo Pro");
		});
	});

	describe("getUserAchievements", () => {
		it("should return unlocked and locked achievements", async () => {
			const user = await createTestUser();
			const achievement1 = await createTestAchievement({ name: "Unlocked" });
			await createTestAchievement({ name: "Locked" });

			await createTestUserAchievement(user.id, achievement1.id);

			const result = await AchievementService.getUserAchievements(user.id);

			expect(result.unlocked).toHaveLength(1);
			expect(result.unlocked[0].name).toBe("Unlocked");
			expect(result.locked).toHaveLength(1);
			expect(result.locked[0].achievement.name).toBe("Locked");
			expect(result.totalPoints).toBe(10);
		});

		it("should calculate progress for locked achievements", async () => {
			const user = await createTestUser();
			await createTestAchievement({ name: "5 lbs Lost" });

			// Create entries showing 3 lbs lost
			await createTestWeightEntry(user.id, { weight: 200 });
			await createTestWeightEntry(user.id, { weight: 197 });

			await prisma.user.update({
				where: { id: user.id },
				data: { currentWeight: 197 },
			});

			const result = await AchievementService.getUserAchievements(user.id);

			const fiveLbs = result.locked.find(
				(a) => a.achievement.name === "5 lbs Lost",
			);
			expect(fiveLbs).toBeDefined();
			expect(fiveLbs?.current).toBe(3);
			expect(fiveLbs?.target).toBe(5);
			expect(fiveLbs?.progress).toBe(60); // 3/5 = 60%
		});
	});

	describe("calculateProgress", () => {
		it("should calculate progress for weight loss achievements", async () => {
			const user = await createTestUser();

			// Create entries showing 7 lbs lost
			await createTestWeightEntry(user.id, { weight: 200 });
			await createTestWeightEntry(user.id, { weight: 193 });

			await prisma.user.update({
				where: { id: user.id },
				data: { currentWeight: 193 },
			});

			const progress = await AchievementService.calculateProgress(
				user.id,
				"10 lbs Lost",
			);

			expect(progress.current).toBe(7);
			expect(progress.target).toBe(10);
			expect(progress.percentage).toBe(70);
		});

		it("should cap progress at 100%", async () => {
			const user = await createTestUser();

			// Create entries showing 12 lbs lost
			await createTestWeightEntry(user.id, { weight: 200 });
			await createTestWeightEntry(user.id, { weight: 188 });

			await prisma.user.update({
				where: { id: user.id },
				data: { currentWeight: 188 },
			});

			const progress = await AchievementService.calculateProgress(
				user.id,
				"10 lbs Lost",
			);

			expect(progress.current).toBe(12);
			expect(progress.target).toBe(10);
			expect(progress.percentage).toBe(100); // Capped at 100
		});

		it("should calculate progress for team membership", async () => {
			const user = await createTestUser();
			const owner = await createTestUser();
			const team = await createTestTeam(owner.id);
			await createTestTeamMember(team.id, user.id, "MEMBER");

			const progress = await AchievementService.calculateProgress(
				user.id,
				"Team Player",
			);

			expect(progress.current).toBe(1);
			expect(progress.target).toBe(1);
			expect(progress.percentage).toBe(100);
		});

		it("should calculate progress for post count", async () => {
			const user = await createTestUser();
			const team = await createTestTeam(user.id);

			await prisma.post.create({
				data: {
					authorId: user.id,
					teamId: team.id,
					content: "First post!",
					type: "GENERAL",
					visibility: "TEAM",
				},
			});

			const progress = await AchievementService.calculateProgress(
				user.id,
				"Social Butterfly",
			);

			expect(progress.current).toBe(1);
			expect(progress.target).toBe(1);
			expect(progress.percentage).toBe(100);
		});
	});
});
