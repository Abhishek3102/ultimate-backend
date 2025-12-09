import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { summarizeText } from "../controllers/ai.controller.js";

const router = Router();

router.use(verifyJWT); // Secure routes

router.route("/summarize").post(summarizeText);

export default router;
