import { Router } from "express";
import { getTrendingTopics, getPrismFeed } from "../controllers/prism.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Secure all prism routes

router.route("/trending").get(getTrendingTopics);
router.route("/feed/:topic").get(getPrismFeed);

export default router;
