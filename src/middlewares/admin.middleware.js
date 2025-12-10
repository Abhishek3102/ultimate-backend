import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyAdmin = asyncHandler(async (req, res, next) => {
    // verifyJWT must run BEFORE this to populate req.user
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (req.user.role !== "admin") {
        throw new ApiError(403, "Access denied. Admins only.");
    }

    next();
});
