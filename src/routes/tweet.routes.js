import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getAllTweets,
    getUserTweets,
    getChannelTweets,
    updateTweet,
    getTweetById
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

import {upload} from "../middlewares/multer.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(
    upload.fields([
        {
            name: "images",
            maxCount: 4
        }
    ]),
    createTweet
).get(getAllTweets);
router.route("/user/:userId").get(getChannelTweets);
router.route("/:tweetId").get(getTweetById).patch(updateTweet).delete(deleteTweet);

export default router