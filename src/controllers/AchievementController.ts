import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { AchievementService } from '../services/achievement.service';
import prisma from '../services/database';

/**
 * Controller for user achievements
 */
export class AchievementController {
    /**
     * GET /achievements
     * Display user's achievements page
     */
    static async index(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.sub;

            if (!userId) {
                res.redirect('/login');
                return;
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                res.redirect('/login');
                return;
            }

            // Get user's achievements
            const { unlocked, locked, totalPoints } =
                await AchievementService.getUserAchievements(userId);

            // Sort locked by progress (highest first)
            locked.sort((a, b) => b.progress - a.progress);

            res.render('achievements/index', {
                title: 'My Achievements',
                user,
                unlocked,
                locked,
                totalPoints,
                unlockedCount: unlocked.length,
                totalCount: unlocked.length + locked.length,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/achievements
     * Get user's achievements (API endpoint)
     */
    static async getAchievements(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.sub;

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const achievements = await AchievementService.getUserAchievements(
                userId
            );

            res.json({
                success: true,
                data: achievements,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /profile/:userId/achievements
     * View another user's unlocked achievements
     */
    static async userAchievements(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { userId } = req.params;
            const currentUserId = req.user?.sub;

            const user = await prisma.user.findUnique({
                where: { id: userId, deletedAt: null },
            });

            if (!user) {
                res.status(404).render('errors/404', {
                    title: 'User Not Found',
                    message: 'This user does not exist.',
                });
                return;
            }

            // Only show if profile is public or it's the current user
            if (!user.profilePublic && userId !== currentUserId) {
                res.status(403).render('errors/403', {
                    title: 'Private Profile',
                    message: 'This user\'s profile is private.',
                });
                return;
            }

            const { unlocked, totalPoints } =
                await AchievementService.getUserAchievements(userId);

            res.render('achievements/user', {
                title: `${user.displayName || user.username}'s Achievements`,
                user: currentUserId
                    ? await prisma.user.findUnique({ where: { id: currentUserId } })
                    : null,
                profileUser: user,
                unlocked,
                totalPoints,
                unlockedCount: unlocked.length,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/achievements/check
     * Manually trigger achievement check (for testing)
     */
    static async checkAchievements(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.sub;

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const unlocked = [];

            // Check all types
            const weightAchievements =
                await AchievementService.checkWeightAchievements(userId);
            unlocked.push(...weightAchievements);

            const streakAchievements =
                await AchievementService.checkStreakAchievements(userId);
            unlocked.push(...streakAchievements);

            const engagementAchievements =
                await AchievementService.checkEngagementAchievements(userId);
            unlocked.push(...engagementAchievements);

            res.json({
                success: true,
                message: `Checked achievements. Unlocked ${unlocked.length} new achievements.`,
                unlocked,
            });
        } catch (error) {
            next(error);
        }
    }
}
