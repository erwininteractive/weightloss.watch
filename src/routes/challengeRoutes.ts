import { Router } from "express";
import { ChallengeController } from "../controllers/ChallengeController";
import { webAuthenticate } from "../middleware/webAuth";

const router = Router();

// All challenge routes require authentication
router.use(webAuthenticate);

// Team challenges
router.get("/teams/:teamId/challenges", ChallengeController.listTeamChallenges);
router.get("/teams/:teamId/challenges/new", ChallengeController.createForm);
router.post(
	"/teams/:teamId/challenges",
	ChallengeController.challengeValidation,
	ChallengeController.create,
);

// Individual challenge operations
router.get("/challenges/:id", ChallengeController.show);
router.post("/challenges/:id/join", ChallengeController.join);
router.post("/challenges/:id/leave", ChallengeController.leave);
router.post("/challenges/:id/update-progress", ChallengeController.updateProgress);

export default router;
