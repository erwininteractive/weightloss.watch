import { User, UnitSystem } from "@prisma/client";
import { AuthService } from "../../src/services/auth.service";
import { prisma } from "./db";

/**
 * Factory for creating test users
 */
export async function createTestUser(
	overrides: Partial<User> = {},
): Promise<User> {
	const defaultEmail = `test-${Date.now()}-${Math.random()}@example.com`;
	const defaultUsername = `testuser${Date.now()}${Math.floor(Math.random() * 1000)}`;

	const passwordHash = await AuthService.hashPassword("password123");

	return prisma.user.create({
		data: {
			email: overrides.email || defaultEmail,
			username: overrides.username || defaultUsername,
			passwordHash,
			displayName: overrides.displayName || "Test User",
			unitSystem: overrides.unitSystem || UnitSystem.IMPERIAL,
			currentWeight: overrides.currentWeight || null,
			goalWeight: overrides.goalWeight || null,
			...overrides,
		},
	});
}

/**
 * Factory for creating test weight entries
 */
export async function createTestWeightEntry(
	userId: string,
	overrides: {
		weight?: number;
		bodyFatPercentage?: number;
		notes?: string;
		recordedAt?: Date;
	} = {},
) {
	return prisma.weightEntry.create({
		data: {
			userId,
			weight: overrides.weight || 180,
			bodyFatPercentage: overrides.bodyFatPercentage || null,
			notes: overrides.notes || null,
			recordedAt: overrides.recordedAt || new Date(),
		},
	});
}

/**
 * Factory for creating test teams
 */
export async function createTestTeam(
	ownerId: string,
	overrides: {
		name?: string;
		description?: string;
		isPublic?: boolean;
	} = {},
) {
	const defaultName = `Test Team ${Date.now()}`;

	return prisma.team.create({
		data: {
			name: overrides.name || defaultName,
			description: overrides.description || "A test team",
			isPublic: overrides.isPublic !== undefined ? overrides.isPublic : true,
			ownerId,
			members: {
				create: {
					userId: ownerId,
					role: "OWNER",
				},
			},
		},
	});
}

/**
 * Factory for creating team membership
 */
export async function createTestTeamMember(
	teamId: string,
	userId: string,
	role: "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER" = "MEMBER",
) {
	return prisma.teamMember.create({
		data: {
			teamId,
			userId,
			role,
		},
	});
}

/**
 * Create a user with tokens for authenticated requests
 */
export async function createAuthenticatedUser(overrides: Partial<User> = {}) {
	const user = await createTestUser(overrides);
	const payload = await AuthService.buildJwtPayload(user.id);
	const tokens = AuthService.generateTokenPair(payload);

	// Store refresh token in database
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 7);

	await prisma.refreshToken.create({
		data: {
			token: tokens.refreshToken,
			userId: user.id,
			expiresAt,
		},
	});

	return { user, tokens };
}
