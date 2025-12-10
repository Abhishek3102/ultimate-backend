import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Challenge } from "../models/challenge.model.js";
import { ArenaEntry } from "../models/arenaEntry.model.js";
import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Video } from "../models/video.model.js";

// --- Helper: Lazy Time Check ---
// We check if a challenge MUST end now.
const checkAndEndChallenge = async (challenge) => {
    if (challenge.status === 'active' && new Date() > new Date(challenge.endDate)) {
        console.log(`⏳ Challenge ${challenge._id} expired. Calculating winners...`);
        
        // 1. Lock it
        challenge.status = 'completed';
        
        // 2. Find Top 3
        const winners = await ArenaEntry.find({ challengeId: challenge._id })
            .sort({ votes: -1, createdAt: 1 }) // Tie-breaker: earliest submission
            .limit(3)
            .populate("userId", "fullName username avatar email");

        // 3. Save winners
        challenge.winnerIds = winners.map((entry, index) => ({
            rank: index + 1,
            user: entry.userId,
            entry: entry._id
        }));

        await challenge.save();
        
        // 4. Award Certificates to Winners
        for (let i = 0; i < winners.length; i++) {
            const entry = winners[i];
            const rank = i + 1;
            const certName = rank === 1 ? "Gold Champion" : rank === 2 ? "Silver Runner-Up" : "Bronze Finalist";
            
            // Add to User Profile
            await User.findByIdAndUpdate(entry.userId._id, {
                $push: {
                    certificates: {
                        name: `${certName}: ${challenge.title}`,
                        challengeId: challenge._id,
                        entryId: entry.entry, 
                        rank: rank,
                        date: new Date()
                    }
                }
            });
            // Also notify them? (Optional, skipping for now)
        }

        console.log(`✅ Challenge ${challenge.title} ended. ${winners.length} winners recorded & certificates awarded.`);
        return true; // It was updated
    }
    return false; // No change
};


// --- Controllers ---

const createChallenge = asyncHandler(async (req, res) => {
    const { title, description, type, endDate, banner, badgeName } = req.body;

    // Basic Validation
    if (!title || !endDate) throw new ApiError(400, "Title and End Date are required");

    const challenge = await Challenge.create({
        title,
        description,
        type,
        endDate,
        banner,
        createdBy: req.user._id,
        rewardParams: { badgeName }
    });

    return res.status(201).json(
        new ApiResponse(201, challenge, "Challenge created successfully")
    );
});

const getActiveChallenges = asyncHandler(async (req, res) => {
    // 1. Fetch all 'active' challenges
    let challenges = await Challenge.find({ status: "active" }).sort({ endDate: 1 });

    // 2. Lazy Check: Have any expired?
    // We run this parallelly for efficiency
    const updates = challenges.map(c => checkAndEndChallenge(c));
    await Promise.all(updates);

    // 3. Re-fetch or filtering is safer to ensure we send correct status
    // (If one just expired, checkAndEndChallenge changed it to 'completed' in DB, 
    // but our local 'challenges' variable might still have 'active' depending on reference.
    // However, Mongoose objects merge, but let's be safe and separate lists.)
    
    // Simpler: Just re-query to get the clean list of what is ACTUALLY active now
    const activeChallenges = await Challenge.find({ status: "active" })
        .populate("createdBy", "fullName username avatar")
        .sort({ endDate: 1 });

    return res.status(200).json(
        new ApiResponse(200, activeChallenges, "Active challenges fetched")
    );
});

const getChallengeDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const challenge = await Challenge.findById(id).populate("winnerIds.user", "fullName username avatar");

    if (!challenge) throw new ApiError(404, "Challenge not found");

    // Lazy Check just in case accessed directly
    await checkAndEndChallenge(challenge);

    return res.status(200).json(
        new ApiResponse(200, challenge, "Challenge details")
    );
});

const enterChallenge = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { contentId, contentType, certificateName } = req.body;

    const challenge = await Challenge.findById(id);
    if (!challenge) throw new ApiError(404, "Challenge not found");

    // Double Check Expiry
    if (new Date() > new Date(challenge.endDate) || challenge.status !== 'active') {
        throw new ApiError(400, "Challenge has ended");
    }

    const existingEntry = await ArenaEntry.findOne({ challengeId: id, userId: req.user._id });
    if (existingEntry) throw new ApiError(400, "You have already entered this challenge");

    const entry = await ArenaEntry.create({
        challengeId: id,
        userId: req.user._id,
        contentId,
        contentType, // 'Tweet', 'Video'
        certificateName: certificateName || req.user.fullName
    });

    return res.status(201).json(
        new ApiResponse(201, entry, "You have entered the arena!")
    );
});

const voteEntry = asyncHandler(async (req, res) => {
    const { entryId } = req.params;
    const userId = req.user._id;

    const entry = await ArenaEntry.findById(entryId);
    if (!entry) throw new ApiError(404, "Entry not found");

    // Check if challenge is still active
    const challenge = await Challenge.findById(entry.challengeId);
    if (challenge.status !== 'active') throw new ApiError(400, "Voting is closed for this challenge");

    // Toggle Vote
    const alreadyVotedIndex = entry.voters.indexOf(userId);
    
    if (alreadyVotedIndex === -1) {
        // Vote
        entry.voters.push(userId);
        entry.votes += 1;
    } else {
        // Unvote
        entry.voters.splice(alreadyVotedIndex, 1);
        entry.votes -= 1;
    }

    await entry.save();

    return res.status(200).json(
        new ApiResponse(200, { votes: entry.votes, voted: alreadyVotedIndex === -1 }, "Vote updated")
    );
});

const getEntryDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const entry = await ArenaEntry.findById(id).populate("userId", "fullName username avatar");
    
    if (!entry) throw new ApiError(404, "Entry not found");
    
    const challenge = await Challenge.findById(entry.challengeId);

    // Only allow viewing certificate if challenge is completed and user is a winner? 
    // Or allow viewing any entry? Let's allow viewing any, but Certificate component handles rank logic (only renders for top 3?)
    // Actually, Certificate component is generic, but usually only winners get "Certificate".
    // Let's return everything.

    return res.status(200).json(
        new ApiResponse(200, { entry, challenge, user: entry.userId }, "Entry details fetched")
    );
});

const getChallengeLeaderboard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const challenge = await Challenge.findById(id);
    if (!challenge) throw new ApiError(404, "Challenge not found");

    const leaderboard = await ArenaEntry.find({ challengeId: id })
        .sort({ votes: -1, createdAt: 1 })
        .populate("userId", "fullName username avatar");

    return res.status(200).json(
        new ApiResponse(200, leaderboard, "Leaderboard fetched successfully")
    );
});

const getUserTrophies = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // 1. Find User
    const user = await User.findById(userId).select("certificates fullName username avatar");
    if (!user) throw new ApiError(404, "User not found");

    if (!user.certificates || user.certificates.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No trophies found"));
    }

    // 2. Enrich Certificates with Entry Content
    const trophies = await Promise.all(user.certificates.map(async (cert) => {
        const doc = cert.toObject(); // Convert to plain object

        // If no entryId, return basic cert
        if (!doc.entryId) return doc;

        // Fetch Entry
        const entry = await ArenaEntry.findById(doc.entryId);
        if (!entry) return doc;

        // Fetch Content based on Type
        let content = null;
        try {
            if (entry.contentType === 'Tweet') {
                content = await Tweet.findById(entry.contentId).select("content images");
            } else if (entry.contentType === 'Video') {
                content = await Video.findById(entry.contentId).select("title thumbnail duration description");
            } else if (entry.contentType === 'Image') {
                // Fallback: Check Tweet first for image content
                content = await Tweet.findById(entry.contentId).select("content images");
            }
        } catch (err) {
            console.error(`Failed to fetch content for trophy ${cert._id}`, err);
        }

        return {
            ...doc,
            entryDetails: {
                type: entry.contentType,
                content: content
            }
        };
    }));

    return res.status(200).json(
        new ApiResponse(200, trophies, "Trophies fetched successfully")
    );
});

export {
    createChallenge,
    getActiveChallenges,
    getChallengeDetails,
    enterChallenge,
    voteEntry,
    getChallengeLeaderboard,
    getEntryDetails,
    getUserTrophies
};
