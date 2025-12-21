import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { webAuthenticate } from "../middleware/webAuth";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

// All admin routes require authentication and admin privileges
router.use(webAuthenticate);
router.use(requireAdmin);

// User management
router.get("/admin/users", AdminController.listUsers);
router.get("/admin/users/:userId", AdminController.viewUser);
router.post(
	"/admin/users/:userId/reset-password",
	AdminController.resetPasswordValidation,
	AdminController.resetPassword,
);
router.post("/admin/users/:userId/toggle-admin", AdminController.toggleAdmin);
router.post(
	"/admin/users/:userId/toggle-active",
	AdminController.toggleActive,
);

export default router;
