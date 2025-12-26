import { Router } from "express";
import homeRoutes from "./homeRoutes";
import authRoutes from "./authRoutes";
import webAuthRoutes from "./webAuthRoutes";
import dashboardRoutes from "./dashboardRoutes";
import profileRoutes from "./profileRoutes";
import weightRoutes from "./weightRoutes";
import teamRoutes from "./teamRoutes";
import postRoutes from "./postRoutes";
import challengeRoutes from "./challengeRoutes";
import achievementRoutes from "./achievementRoutes";
import achievementApiRoutes from "./achievementApiRoutes";
import settingsRoutes from "./settingsRoutes";
import adminRoutes from "./adminRoutes";
import resourcesRoutes from "./resourcesRoutes";
import aboutRoutes from "./aboutRoutes";
import donateRoutes from "./donateRoutes";
import newsRoutes from "./newsRoutes";
import contributeRoutes from "./contributeRoutes";
import { SettingsController } from "../controllers/SettingsController";
import { WeightController } from "../controllers/WeightController";
import { authenticate } from "../middleware/auth";
import { webAuthenticate } from "../middleware/webAuth";

const router = Router();

// Mount routes
router.use("/", homeRoutes);
router.use("/", webAuthRoutes); // Web auth pages (login, register, logout)
router.use("/", aboutRoutes); // About routes (public)
router.use("/", resourcesRoutes); // Resources routes (public)
router.use("/", donateRoutes); // Donate routes (public)
router.use("/", newsRoutes); // News routes (public)
router.use("/", contributeRoutes); // Contribute routes (public)
router.use("/api/auth", authRoutes); // API auth endpoints (JSON)
router.use("/achievements/api", achievementApiRoutes); // Achievement API endpoints
router.post(
	"/api/settings/theme",
	authenticate,
	SettingsController.updateTheme,
); // API theme update
router.delete("/photo/:photoId", webAuthenticate, WeightController.deletePhoto); // Delete progress photo
router.use("/dashboard", dashboardRoutes);
router.use("/profile", profileRoutes);
router.use("/progress", weightRoutes);
router.use("/teams", teamRoutes);
router.use("/", postRoutes); // Post and comment routes
router.use("/", challengeRoutes); // Challenge routes
router.use("/achievements", achievementRoutes); // Achievement routes
router.use("/", settingsRoutes); // Settings routes
router.use("/", adminRoutes); // Admin routes

// 404 handler
router.use((_req, res) => {
	res.status(404).render("errors/404", {
		title: "Page Not Found",
		message: "The page you are looking for does not exist.",
		user: res.locals.user,
	});
});

export default router;
