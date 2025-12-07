import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { getConversationMessages, uploadMessageAudio, deleteMessage } from "../controllers/message.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/upload-audio").post(upload.single("audio"), uploadMessageAudio);
router.route("/delete/:messageId").delete(deleteMessage);
router.route("/:userId").get(getConversationMessages);

export default router;
