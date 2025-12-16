import { Router } from "express";
import { ContributeController } from "../controllers/ContributeController";

const router = Router();
const contributeController = new ContributeController();

router.get("/contribute", contributeController.index);

export default router;
