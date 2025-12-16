import { Router } from "express";
import { SettingsController } from "../controllers/SettingsController";
import { webAuthenticate } from "../middleware/webAuth";

const router = Router();

// Apply auth middleware to all settings routes
router.use(webAuthenticate);

router.get("/settings", SettingsController.index);
router.post(
	"/settings/preferences",
	SettingsController.preferencesValidation,
	SettingsController.updatePreferences,
);
router.post(
	"/settings/password",
	SettingsController.passwordValidation,
	SettingsController.changePassword,
);
router.post("/settings/delete-account", SettingsController.deleteAccount);

export default router;
