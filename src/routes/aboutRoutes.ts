import { Router } from "express";
import { AboutController } from "../controllers/AboutController";

const router = Router();
const aboutController = new AboutController();

router.get("/about", aboutController.index);

export default router;
