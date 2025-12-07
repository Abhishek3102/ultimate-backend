import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTheater, getTheater } from "../controllers/theater.controller.js";

const router = Router();

router.use(verifyJWT); // Secure all theater routes

router.route("/").post(createTheater);
router.route("/:roomId").get(getTheater);

export default router;
