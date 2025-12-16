import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { authConfig } from "../config/auth";
import { JwtPayload, TokenPair, RegisterInput, SafeUser } from "../types/auth";
import prisma from "./database";

export class AuthService {
	/**
	 * Hash a password using bcrypt
	 */
	static async hashPassword(password: string): Promise<string> {
		return bcrypt.hash(password, authConfig.bcrypt.saltRounds);
	}

	/**
	 * Compare a password with a hash
	 */
	static async comparePassword(
		password: string,
		hash: string,
	): Promise<boolean> {
		return bcrypt.compare(password, hash);
	}

	/**
	 * Generate an access token
	 */
	static generateAccessToken(payload: JwtPayload): string {
		const options: SignOptions = {
			expiresIn: authConfig.jwt
				.accessTokenExpiresIn as jwt.SignOptions["expiresIn"],
		};
		return jwt.sign(payload, authConfig.jwt.accessTokenSecret, options);
	}

	/**
	 * Generate a refresh token
	 */
	static generateRefreshToken(payload: JwtPayload): string {
		const options: SignOptions = {
			expiresIn: authConfig.jwt
				.refreshTokenExpiresIn as jwt.SignOptions["expiresIn"],
		};
		return jwt.sign(payload, authConfig.jwt.refreshTokenSecret, options);
	}

	/**
	 * Verify an access token
	 */
	static verifyAccessToken(token: string): JwtPayload {
		return jwt.verify(
			token,
			authConfig.jwt.accessTokenSecret,
		) as JwtPayload;
	}

	/**
	 * Verify a refresh token
	 */
	static verifyRefreshToken(token: string): JwtPayload {
		return jwt.verify(
			token,
			authConfig.jwt.refreshTokenSecret,
		) as JwtPayload;
	}

	/**
	 * Generate a token pair (access + refresh)
	 */
	static generateTokenPair(payload: JwtPayload): TokenPair {
		return {
			accessToken: this.generateAccessToken(payload),
			refreshToken: this.generateRefreshToken(payload),
		};
	}

	/**
	 * Build JWT payload from user data
	 */
	static async buildJwtPayload(userId: string): Promise<JwtPayload> {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				teamMemberships: {
					select: { teamId: true },
				},
			},
		});

		if (!user) {
			throw new Error("User not found");
		}

		return {
			sub: user.id,
			email: user.email,
			username: user.username,
			teams: user.teamMemberships.map(
				(m: { teamId: string }) => m.teamId,
			),
		};
	}

	/**
	 * Register a new user
	 */
	static async register(input: RegisterInput): Promise<SafeUser> {
		const {
			email,
			username,
			password,
			displayName,
			unitSystem,
			currentWeight,
			goalWeight,
			height,
			activityLevel,
		} = input;

		// Check if user already exists
		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [{ email }, { username }],
			},
		});

		if (existingUser) {
			if (existingUser.email === email) {
				throw new Error("Email already in use");
			}
			throw new Error("Username already taken");
		}

		// Hash password
		const passwordHash = await this.hashPassword(password);

		// Create user
		const user = await prisma.user.create({
			data: {
				email,
				username,
				passwordHash,
				displayName: displayName || username,
				unitSystem: unitSystem || "IMPERIAL",
				currentWeight: currentWeight || null,
				goalWeight: goalWeight || null,
				height: height || null,
				activityLevel: activityLevel || null,
			},
		});

		// Return user without password hash
		const { passwordHash: _, ...safeUser } = user;
		return safeUser;
	}

	/**
	 * Login a user and return tokens
	 */
	static async login(
		email: string,
		password: string,
	): Promise<{ user: SafeUser; tokens: TokenPair }> {
		// Find user by email
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			throw new Error("Invalid email or password");
		}

		if (!user.isActive) {
			throw new Error("Account is deactivated");
		}

		// Verify password
		const isValidPassword = await this.comparePassword(
			password,
			user.passwordHash,
		);

		if (!isValidPassword) {
			throw new Error("Invalid email or password");
		}

		// Build JWT payload and generate tokens
		const payload = await this.buildJwtPayload(user.id);
		const tokens = this.generateTokenPair(payload);

		// Store refresh token in database
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

		await prisma.refreshToken.create({
			data: {
				token: tokens.refreshToken,
				userId: user.id,
				expiresAt,
			},
		});

		// Update last login
		await prisma.user.update({
			where: { id: user.id },
			data: { lastLoginAt: new Date() },
		});

		// Return user without password hash
		const { passwordHash: _, ...safeUser } = user;
		return { user: safeUser, tokens };
	}

	/**
	 * Refresh tokens using a valid refresh token
	 */
	static async refreshTokens(refreshToken: string): Promise<TokenPair> {
		// Verify the refresh token
		let payload: JwtPayload;
		try {
			payload = this.verifyRefreshToken(refreshToken);
		} catch {
			throw new Error("Invalid refresh token");
		}

		// Check if refresh token exists in database
		const storedToken = await prisma.refreshToken.findUnique({
			where: { token: refreshToken },
		});

		if (!storedToken) {
			throw new Error("Refresh token not found");
		}

		if (storedToken.expiresAt < new Date()) {
			// Clean up expired token
			await prisma.refreshToken.delete({ where: { id: storedToken.id } });
			throw new Error("Refresh token expired");
		}

		// Delete the old refresh token (rotation)
		await prisma.refreshToken.delete({ where: { id: storedToken.id } });

		// Generate new token pair
		const newPayload = await this.buildJwtPayload(payload.sub);
		const tokens = this.generateTokenPair(newPayload);

		// Store new refresh token
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		await prisma.refreshToken.create({
			data: {
				token: tokens.refreshToken,
				userId: payload.sub,
				expiresAt,
			},
		});

		return tokens;
	}

	/**
	 * Logout by revoking refresh token
	 */
	static async logout(refreshToken: string): Promise<void> {
		await prisma.refreshToken.deleteMany({
			where: { token: refreshToken },
		});
	}

	/**
	 * Logout from all devices by revoking all refresh tokens
	 */
	static async logoutAll(userId: string): Promise<void> {
		await prisma.refreshToken.deleteMany({
			where: { userId },
		});
	}

	/**
	 * Get user by ID (without password hash)
	 */
	static async getUserById(userId: string): Promise<SafeUser | null> {
		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) return null;

		const { passwordHash: _, ...safeUser } = user;
		return safeUser;
	}

	/**
	 * Clean up expired refresh tokens (call periodically)
	 */
	static async cleanupExpiredTokens(): Promise<number> {
		const result = await prisma.refreshToken.deleteMany({
			where: {
				expiresAt: { lt: new Date() },
			},
		});
		return result.count;
	}
}
