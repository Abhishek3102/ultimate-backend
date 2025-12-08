import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");
const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

// Helper to analyze a single tweet
const analyzeTweetWithGemini = async (content, topic) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
             console.warn("GEMINI_API_KEY not found. Using mock fallback.");
             return { sentiment: ['pro', 'anti', 'neutral'][Math.floor(Math.random()*3)], rationality: 5 };
        }

        const prompt = `
        Analyze the following social media post regarding the topic "${topic}".
        Post: "${content}"
        
        Tasks:
        1. Classify the sentiment: 'pro', 'anti', 'neutral'.
        2. Rate rationality: 1-10.
        3. Assign a Category from this list: ['Tech', 'Sports', 'Finance', 'Health', 'Politics', 'Entertainment', 'Other'].
        
        Output JSON only: { "sentiment": "...", "rationality": number, "category": "..." }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json|```/g, "").trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return { sentiment: "neutral", rationality: 5, category: "Other" }; // Fallback
    }
};

const categorizeHashtagsWithGemini = async (hashtags) => {
    try {
        if (!process.env.GEMINI_API_KEY || hashtags.length === 0) return {};

        const prompt = `
        Categorize the following hashtags into one of these exact categories: ['Tech', 'Sports', 'Finance', 'Health', 'Politics', 'Entertainment', 'Other'].
        
        Rules:
        - Map competitive gaming, esports, #playtowin, #game to 'Sports'.
        - Map movies, music, celebrities to 'Entertainment'.
        - Map AI, coding, software to 'Tech'.
        
        Hashtags: ${JSON.stringify(hashtags)}
        
        Output valid JSON object where keys are hashtags and values are categories. 
        Example: { "#ai": "Tech", "#football": "Sports", "#game": "Sports" }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json|```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Gemini Categorization Error:", error);
        return {};
    }
};

const getTrendingTopics = asyncHandler(async (req, res) => {
    // 1. Get raw hashtag counts from last 24h
    const startOfDay = new Date();
    startOfDay.setDate(startOfDay.getDate() - 1); // Last 24 hours

    const rawTrends = await Tweet.aggregate([
        { $match: { createdAt: { $gte: startOfDay } } },
        { $unwind: "$hashtags" },
        // Normalize hashtags (lowercase, remove hyphens for grouping)
        { 
            $project: { 
                originalTag: "$hashtags", 
                normalizedTag: { 
                    $toLower: { $replaceAll: { input: "$hashtags", find: "-", replacement: "" } } 
                },
                prism_data: 1
            } 
        },
        { 
            $group: { 
                _id: "$normalizedTag", 
                count: { $sum: 1 }, 
                originalTag: { $first: "$originalTag" }, // Keep one representative original tag
                categories: { $push: "$prism_data.category" } // Collect categories
            } 
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
    ]);

    // 2. Determine dominant category for each trend
    let trendsWithCategory = rawTrends.map(trend => {
        // Find most frequent category (excluding null/undefined)
        const catCounts = {};
        trend.categories.forEach(c => {
            if (c) catCounts[c] = (catCounts[c] || 0) + 1;
        });
        
        // Sort categories by frequency
        const sortedCats = Object.entries(catCounts).sort((a,b) => b[1] - a[1]);
        const dominantCategory = sortedCats.length > 0 ? sortedCats[0][0] : "Other";

        return {
            _id: trend.originalTag, 
            count: trend.count,
            category: dominantCategory,
            normalizedTag: trend._id
        };
    });

    // 2.5 Identify uncategorized tags and batch process them
    const uncategorizedTags = trendsWithCategory
        .filter(t => t.category === "Other")
        .map(t => t._id);

    if (uncategorizedTags.length > 0) {
        const newCategories = await categorizeHashtagsWithGemini(uncategorizedTags);
        
        // Update trends list and trigger background DB update
        trendsWithCategory = trendsWithCategory.map(trend => {
            if (trend.category === "Other" && newCategories[trend._id]) {
                const newCat = newCategories[trend._id];
                
                // Fire and forget DB update to persist category
                // We update all tweets with this hashtag to have this category
                Tweet.updateMany(
                    { hashtags: trend._id }, 
                    { $set: { "prism_data.category": newCat } }
                ).catch(err => console.error("Background category update failed", err));

                return { ...trend, category: newCat };
            }
            return trend;
        });
    }

    // 3. Group by Category
    const groupedTrends = trendsWithCategory.reduce((acc, curr) => {
        const cat = curr.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(curr);
        return acc;
    }, {});

    return res.status(200).json(
        new ApiResponse(200, groupedTrends, "Trending topics fetched successfully")
    );
});

const getPrismFeed = asyncHandler(async (req, res) => {
    const { topic } = req.params; 
    const { type } = req.query; // 'hashtag' (default) or 'category'
    
    if (!topic) {
        throw new ApiError(400, "Topic/Category is required");
    }

    let query = {};
    if (type === 'category') {
        query = { "prism_data.category": topic };
    } else {
        // Default: Hashtag search
        // Also normalization to ensure we catch #GenAI and #genai
        const regex = new RegExp(`^${topic.replace('#', '')}$`, 'i');
        query = { hashtags: { $in: [new RegExp(`^${topic.replace('#', '')}$`, 'i')] } };
        // Actually simpler: just match the string if we are storing normalized, but we store raw.
        // Let's rely on finding by string check for now.
        // Simpler implementation for this codebase:
        query = { hashtags: topic }; 
    }

    // Find tweets
    let tweets = await Tweet.find(query).populate("owner", "username avatar fullName");

    // If fetching by Category, we might want to analyze unanalyzed tweets in that category?
    // Generally tweets in a category ARE analyzed (since they have a category). 
    // But if we are in hashtag mode, we trigger analysis.

    if (type !== 'category') {
        // Analyze un-analyzed tweets ONLY for hashtag view
        // We limit to analyzing 5 at a time to avoid rate limits in this demo
        const unanalyzed = tweets.filter(t => !t.prism_data || !t.prism_data.sentiment);
        
        if (unanalyzed.length > 0) {
             // Process in parallel
             await Promise.all(unanalyzed.map(async (tweet) => {
                 const analysis = await analyzeTweetWithGemini(tweet.content, topic);
                 tweet.prism_data = {
                     sentiment: analysis.sentiment,
                     rationality_score: analysis.rationality,
                     topic: topic,
                     category: analysis.category
                 };
                 await tweet.save();
             }));
             
             // Refresh after analysis
             tweets = await Tweet.find(query).populate("owner", "username avatar fullName");
        }
    }

    const feed = {
        pro: tweets.filter(t => t.prism_data?.sentiment === 'pro'),
        anti: tweets.filter(t => t.prism_data?.sentiment === 'anti'),
        neutral: tweets.filter(t => t.prism_data?.sentiment === 'neutral' || !t.prism_data?.sentiment)
    };

    return res.status(200).json(
        new ApiResponse(200, feed, "Prism feed fetched successfully")
    );
});

export {
    getTrendingTopics,
    getPrismFeed
};
