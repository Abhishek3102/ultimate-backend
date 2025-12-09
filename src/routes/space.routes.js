import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createSpace,
    getSpaceById,
    updateSpaceState,
    getUserSpaces
} from "../controllers/space.controller.js";

const router = Router();

router.use(verifyJWT); // Secure all routes

router.route("/").post(createSpace);
router.route("/u/current-user").get(getUserSpaces);
router.route("/:spaceId").get(getSpaceById);
router.route("/:spaceId/state").patch(updateSpaceState);

export default router;
