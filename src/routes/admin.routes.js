import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { createChallenge } from "../controllers/arena.controller.js";

const router = Router();

// All routes here are restricted to Admins
router.use(verifyJWT);
router.use(verifyAdmin);

// Arena Admin
router.route("/arena/create").post(createChallenge);

// Future: User Management
// router.route("/users").get(getAllUsersAdmin);

export default router;
