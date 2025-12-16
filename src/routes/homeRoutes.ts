import { Router } from "express";
import { HomeController } from "../controllers/HomeController";

const router = Router();
const homeController = new HomeController();

router.get("/", homeController.index);

export default router;
