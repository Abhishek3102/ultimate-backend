import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createChallenge,
    getActiveChallenges,
    getChallengeDetails,
    enterChallenge,
    voteEntry,
    getChallengeLeaderboard,
    getEntryDetails,
    getUserTrophies
} from "../controllers/arena.controller.js";

const router = Router();

// Public Reads (but we might want auth for some, let's keep it open for "Sharing" visibility)
// The user asked for "Guest view", so some routes should be public.
// However, verifyJWT is standard for most. Let's make viewing public.

router.route("/challenges").get(getActiveChallenges); // Public feed
router.route("/challenge/:id").get(getChallengeDetails); // Public to handle shared links? Or require login? User said "if not logged in, ask them to create account". So maybe public GET but frontend handles redirect?
// Actually API should probably return 401 if strict. But to show "Title" we need public.
// Let's make details public, but entry/voting protected.

router.route("/challenge/:id/leaderboard").get(getChallengeLeaderboard);
router.route("/entry/:id").get(getEntryDetails); // Validation inside controller if needed

// Protected Actions
router.route("/create").post(verifyJWT, createChallenge);
router.route("/enter/:id").post(verifyJWT, enterChallenge);
router.route("/vote/:entryId").post(verifyJWT, voteEntry);
router.route("/user/:userId/trophies").get(getUserTrophies);

export default router;
