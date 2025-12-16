import { Router } from "express";
import { WebAuthController } from "../controllers/WebAuthController";
import { AuthController } from "../controllers/AuthController";

const router = Router();

// Login
router.get("/login", WebAuthController.loginPage);
router.post(
	"/login",
	AuthController.loginValidation,
	WebAuthController.loginSubmit,
);

// Register
router.get("/register", WebAuthController.registerPage);
router.post(
	"/register",
	AuthController.registerValidation,
	WebAuthController.registerSubmit,
);

// Logout
router.get("/logout", WebAuthController.logout);

export default router;
