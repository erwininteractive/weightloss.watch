import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AuthService } from "../services/auth.service";
import { authConfig } from "../config/auth";

/**
 * Controller for web-based authentication pages (renders HTML)
 */
export class WebAuthController {
	/**
	 * GET /login
	 * Render login page
	 */
	static loginPage(req: Request, res: Response, _next: NextFunction): void {
		// If already logged in, redirect to dashboard
		if (req.cookies[authConfig.cookie.refreshTokenName]) {
			res.redirect("/dashboard");
			return;
		}

		res.render("auth/login", {
			title: "Sign In",
			error: req.query.error || null,
			success: req.query.success || null,
		});
	}

	/**
	 * POST /login
	 * Handle login form submission
	 */
	static async loginSubmit(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.render("auth/login", {
					title: "Sign In",
					error: errors.array()[0].msg,
					success: null,
				});
				return;
			}

			const { email, password } = req.body;

			const { tokens } = await AuthService.login(email, password);

			// Set refresh token as httpOnly cookie
			res.cookie(
				authConfig.cookie.refreshTokenName,
				tokens.refreshToken,
				authConfig.cookie.options,
			);

			// Set access token in a separate cookie for client-side use (or session)
			res.cookie("accessToken", tokens.accessToken, {
				...authConfig.cookie.options,
				httpOnly: false, // Allow JS access for API calls
				maxAge: 15 * 60 * 1000, // 15 minutes
			});

			// Redirect to dashboard
			res.redirect("/dashboard");
		} catch (error) {
			if (error instanceof Error) {
				res.render("auth/login", {
					title: "Sign In",
					error: error.message,
					success: null,
				});
				return;
			}
			next(error);
		}
	}

	/**
	 * GET /register
	 * Render registration page
	 */
	static registerPage(
		req: Request,
		res: Response,
		_next: NextFunction,
	): void {
		// If already logged in, redirect to dashboard
		if (req.cookies[authConfig.cookie.refreshTokenName]) {
			res.redirect("/dashboard");
			return;
		}

		res.render("auth/register", {
			title: "Create Account",
			errors: [],
			formData: {},
		});
	}

	/**
	 * POST /register
	 * Handle registration form submission
	 */
	static async registerSubmit(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.render("auth/register", {
					title: "Create Account",
					errors: errors.array(),
					formData: req.body,
				});
				return;
			}

			const {
				email,
				username,
				password,
				displayName,
				unitSystem,
				height,
				currentWeight,
				goalWeight,
				activityLevel,
			} = req.body;

			await AuthService.register({
				email,
				username,
				password,
				displayName,
				unitSystem,
				height: height ? parseFloat(height) : undefined,
				currentWeight: currentWeight
					? parseFloat(currentWeight)
					: undefined,
				goalWeight: goalWeight ? parseFloat(goalWeight) : undefined,
				activityLevel: activityLevel || undefined,
			});

			// Redirect to login with success message
			res.redirect(
				"/login?success=" +
					encodeURIComponent(
						"Account created successfully! Please sign in.",
					),
			);
		} catch (error) {
			if (error instanceof Error) {
				res.render("auth/register", {
					title: "Create Account",
					errors: [{ msg: error.message }],
					formData: req.body,
				});
				return;
			}
			next(error);
		}
	}

	/**
	 * GET /logout
	 * Handle logout
	 */
	static async logout(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const refreshToken =
				req.cookies[authConfig.cookie.refreshTokenName];

			if (refreshToken) {
				await AuthService.logout(refreshToken);
			}

			// Clear cookies
			res.clearCookie(authConfig.cookie.refreshTokenName);
			res.clearCookie("accessToken");

			// Redirect to landing page
			res.redirect(
				"/?success=" +
					encodeURIComponent(
						"You have been logged out successfully.",
					),
			);
		} catch (error) {
			next(error);
		}
	}
}
