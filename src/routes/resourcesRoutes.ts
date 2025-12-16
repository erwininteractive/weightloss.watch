import { Router } from "express";
import { ResourcesController } from "../controllers/ResourcesController";

const router = Router();
const resourcesController = new ResourcesController();

router.get("/resources", resourcesController.index);

export default router;
