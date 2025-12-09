import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateText } from "../utils/gemini.js";

const summarizeText = asyncHandler(async (req, res) => {
    const { text } = req.body;
    
    if (!text) {
        throw new ApiError(400, "Text is required");
    }

    const prompt = `Summarize the following text (which might be a Tweet or Video Title) into a concise, interesting sticky note (max 15 words) that would look good on a collaborative canvas. Make it catchy:\n\n${text}`;

    const summary = await generateText(prompt);

    return res
        .status(200)
        .json(new ApiResponse(200, { summary }, "Text summarized successfully"));
});

export {
    summarizeText
};
