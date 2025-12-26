import { Router } from 'express';
import { AchievementController } from '../controllers/AchievementController';
import { webAuthenticate } from '../middleware/webAuth';

const router = Router();

// Web routes (require web authentication)
router.get('/', webAuthenticate, AchievementController.index);
router.get(
    '/user/:userId',
    webAuthenticate,
    AchievementController.userAchievements
);

export default router;
