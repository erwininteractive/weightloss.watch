import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

/**
 * Middleware to load user information into res.locals if a valid accessToken is present.
 * This does not protect routes; it only makes user info available to all views.
 */
export async function loadUser(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	// Make user available in templates by default
	res.locals.user = null;

	try {
		const accessToken = req.cookies.accessToken;

		if (accessToken) {
			try {
				const payload = AuthService.verifyAccessToken(accessToken);
				const user = await AuthService.getUserById(payload.sub);
				if (user) {
					res.locals.user = user;
				}
			} catch (error) {
				// Invalid access token, user is not authenticated for this request.
				// The webAuth middleware will handle refreshing the token on protected routes.
			}
		}
	} catch (error) {
		// Should not happen, but good to have a catch-all
		console.error("Unexpected error in loadUser middleware:", error);
	}

	next();
}
