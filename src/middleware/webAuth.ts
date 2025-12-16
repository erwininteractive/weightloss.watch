import { Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AuthenticatedRequest } from "../types/auth";
import { authConfig } from "../config/auth";

/**
 * Middleware to authenticate web pages using cookies
 * Redirects to login page if not authenticated
 */
export const webAuthenticate = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		// First try access token from cookie
		const accessToken = req.cookies.accessToken;

		if (accessToken) {
			try {
				const payload = AuthService.verifyAccessToken(accessToken);
				req.user = payload;
				next();
				return;
			} catch {
				// Access token expired, try refresh
			}
		}

		// Try to refresh using refresh token
		const refreshToken = req.cookies[authConfig.cookie.refreshTokenName];

		if (!refreshToken) {
			res.redirect(
				"/login?error=" +
					encodeURIComponent("Please sign in to continue."),
			);
			return;
		}

		try {
			const tokens = await AuthService.refreshTokens(refreshToken);

			// Set new cookies
			res.cookie(
				authConfig.cookie.refreshTokenName,
				tokens.refreshToken,
				authConfig.cookie.options,
			);

			res.cookie("accessToken", tokens.accessToken, {
				...authConfig.cookie.options,
				httpOnly: false,
				maxAge: 15 * 60 * 1000,
			});

			// Verify and set user
			const payload = AuthService.verifyAccessToken(tokens.accessToken);
			req.user = payload;
			next();
		} catch {
			// Refresh failed, clear cookies and redirect
			res.clearCookie(authConfig.cookie.refreshTokenName);
			res.clearCookie("accessToken");
			res.redirect(
				"/login?error=" +
					encodeURIComponent(
						"Session expired. Please sign in again.",
					),
			);
		}
	} catch (error) {
		next(error);
	}
};

/**
 * Middleware to redirect authenticated users away from auth pages
 */
export const redirectIfAuthenticated = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	const refreshToken = req.cookies[authConfig.cookie.refreshTokenName];

	if (refreshToken) {
		res.redirect("/dashboard");
		return;
	}

	next();
};
