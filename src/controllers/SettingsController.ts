import { Response, NextFunction } from "express";
import { validationResult, body } from "express-validator";
import { AuthenticatedRequest } from "../types/auth";
import prisma from "../services/database";
import bcrypt from "bcrypt";

// Theme options
export const THEME_OPTIONS = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
	{ value: "system", label: "System" },
];

// Unit system options
export const UNIT_SYSTEMS = [
	{ value: "IMPERIAL", label: "Imperial (lbs, ft)" },
	{ value: "METRIC", label: "Metric (kg, cm)" },
];

/**
 * Controller for user settings management
 */
export class SettingsController {
	/**
	 * Validation rules for preferences update
	 */
	static preferencesValidation = [
		body("unitSystem")
			.isIn(["IMPERIAL", "METRIC"])
			.withMessage("Invalid unit system"),
		body("profilePublic")
			.optional()
			.isBoolean()
			.withMessage("Profile public must be a boolean"),
		body("weightVisible")
			.optional()
			.isBoolean()
			.withMessage("Weight visible must be a boolean"),
		body("theme")
			.isIn(["light", "dark", "system"])
			.withMessage("Invalid theme option"),
	];

	/**
	 * Validation rules for password change
	 */
	static passwordValidation = [
		body("currentPassword")
			.notEmpty()
			.withMessage("Current password is required"),
		body("newPassword")
			.isLength({ min: 8 })
			.withMessage("New password must be at least 8 characters")
			.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
			.withMessage(
				"New password must contain at least one uppercase letter, one lowercase letter, and one number",
			),
		body("confirmPassword")
			.custom((value, { req }) => value === req.body.newPassword)
			.withMessage("Passwords do not match"),
	];

	/**
	 * GET /settings
	 * Render settings page
	 */
	static async index(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.sub;

			if (!userId) {
				res.redirect("/login");
				return;
			}

			const user = await prisma.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				res.redirect("/login");
				return;
			}

			res.render("settings/index", {
				title: "Settings",
				user,
				themeOptions: THEME_OPTIONS,
				unitSystems: UNIT_SYSTEMS,
				errors: [],
				success: req.query.success || null,
				error: req.query.error || null,
				section: req.query.section || null,
			});
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /settings/preferences
	 * Update user preferences
	 */
	static async updatePreferences(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.sub;

			if (!userId) {
				res.redirect("/login");
				return;
			}

			const user = await prisma.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				res.redirect("/login");
				return;
			}

			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				res.render("settings/index", {
					title: "Settings",
					user,
					themeOptions: THEME_OPTIONS,
					unitSystems: UNIT_SYSTEMS,
					errors: errors.array(),
					success: null,
					error: null,
					section: "preferences",
				});
				return;
			}

			const { unitSystem, profilePublic, weightVisible, theme } = req.body;

			await prisma.user.update({
				where: { id: userId },
				data: {
					unitSystem,
					profilePublic:
						profilePublic === "on" || profilePublic === "true",
					weightVisible:
						weightVisible === "on" || weightVisible === "true",
					theme,
				},
			});

			res.redirect(
				"/settings?success=" +
					encodeURIComponent("Preferences updated successfully!") +
					"&section=preferences",
			);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /settings/password
	 * Change user password
	 */
	static async changePassword(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.sub;

			if (!userId) {
				res.redirect("/login");
				return;
			}

			const user = await prisma.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				res.redirect("/login");
				return;
			}

			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				res.render("settings/index", {
					title: "Settings",
					user,
					themeOptions: THEME_OPTIONS,
					unitSystems: UNIT_SYSTEMS,
					errors: errors.array(),
					success: null,
					error: null,
					section: "security",
				});
				return;
			}

			const { currentPassword, newPassword } = req.body;

			// Verify current password
			const isValid = await bcrypt.compare(
				currentPassword,
				user.passwordHash,
			);

			if (!isValid) {
				res.render("settings/index", {
					title: "Settings",
					user,
					themeOptions: THEME_OPTIONS,
					unitSystems: UNIT_SYSTEMS,
					errors: [{ msg: "Current password is incorrect" }],
					success: null,
					error: null,
					section: "security",
				});
				return;
			}

			// Hash new password and update
			const passwordHash = await bcrypt.hash(newPassword, 10);

			await prisma.user.update({
				where: { id: userId },
				data: { passwordHash },
			});

			res.redirect(
				"/settings?success=" +
					encodeURIComponent("Password changed successfully!") +
					"&section=security",
			);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /settings/delete-account
	 * Delete user account
	 */
	static async deleteAccount(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.sub;

			if (!userId) {
				res.redirect("/login");
				return;
			}

			const { confirmPassword } = req.body;

			const user = await prisma.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				res.redirect("/login");
				return;
			}

			// Verify password before deletion
			const isValid = await bcrypt.compare(
				confirmPassword,
				user.passwordHash,
			);

			if (!isValid) {
				res.redirect(
					"/settings?error=" +
						encodeURIComponent(
							"Incorrect password. Account not deleted.",
						) +
						"&section=danger",
				);
				return;
			}

			// Delete the user (cascades to related records due to schema)
			await prisma.user.delete({
				where: { id: userId },
			});

			// Clear auth cookie and redirect
			res.clearCookie("token");
			res.redirect(
				"/?message=" +
					encodeURIComponent("Account deleted successfully."),
			);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /api/settings/theme
	 * Quick update theme preference via API
	 */
	static async updateTheme(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.sub;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Unauthorized",
				});
				return;
			}

			const { theme } = req.body;

			if (!["light", "dark", "system"].includes(theme)) {
				res.status(400).json({
					success: false,
					message: "Invalid theme option",
				});
				return;
			}

			await prisma.user.update({
				where: { id: userId },
				data: { theme },
			});

			res.json({
				success: true,
				message: "Theme updated successfully",
			});
		} catch (error) {
			next(error);
		}
	}
}
