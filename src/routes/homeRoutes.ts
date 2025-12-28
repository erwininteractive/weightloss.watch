import { Router } from "express";
import { HomeController } from "../controllers/HomeController";

const router = Router();

// Public pages (no authentication required)
router.get("/", HomeController.index);
router.get("/about", HomeController.about);
router.get("/resources", HomeController.resources);
router.get("/contribute", HomeController.contribute);

export default router;
