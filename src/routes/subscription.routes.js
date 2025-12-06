import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
    getFollowRequests,
    respondToFollowRequest,
    removeFollower
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .get(getUserChannelSubscribers) // Fixed: Now correctly calls getUserChannelSubscribers with channelId
    .post(toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels); // Fixed: Now correctly calls getSubscribedChannels with subscriberId

router.route("/requests/pending").get(getFollowRequests);
router.route("/requests/respond/:subscriberId").post(respondToFollowRequest);
router.route("/remove/:subscriberId").post(removeFollower);

export default router