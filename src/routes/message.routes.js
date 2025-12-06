import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getConversationMessages } from "../controllers/message.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/:userId").get(getConversationMessages);

export default router;
