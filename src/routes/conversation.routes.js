import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getUserConversations } from "../controllers/conversation.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getUserConversations);

export default router;
