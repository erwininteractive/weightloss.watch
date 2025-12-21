import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import prisma from "../services/database";

/**
 * Middleware to check if the authenticated user is an admin
 * Must be used after webAuthenticate or authenticate middleware
 */
export async function requireAdmin(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> {
	try {
		if (!req.user) {
			res.status(401).render("errors/401", {
				title: "Unauthorized",
				message: "Please log in to access this page",
			});
			return;
		}

		// Check if user is admin
		const user = await prisma.user.findUnique({
			where: { id: req.user.sub },
			select: { isAdmin: true },
		});

		if (!user || !user.isAdmin) {
			res.status(403).render("errors/403", {
				title: "Access Denied",
				message: "You must be an administrator to access this page",
			});
			return;
		}

		next();
	} catch (error) {
		next(error);
	}
}
