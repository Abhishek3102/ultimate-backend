# Chai Backend & Frontend Project

A full-stack video hosting and social media platform built with the MERN stack (MongoDB, Express, React/Next.js, Node.js). This project features video uploading, playlists, tweets, likes, comments, subscriptions, and a comprehensive dashboard.

[Model link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj?origin=share)

## 🚀 Features

-   **Authentication**: Secure JWT-based auth with detailed user profiles.
-   **Videos**: Upload, watch, like, and comment on videos.
-   **Playlists**: Create, edit, privacy-control, and manage video playlists.
-   **Tweets**: Social feed for short updates, including comments and likes.
-   **Subscriptions**: Subscribe to channels and see a personalized feed.
-   **Dashboard**: Real-time channel statistics (views, subscribers, likes).
-   **Responsive Design**: Modern, glass-morphism UI fully responsive on all devices.

## 🛠️ Tech Stack

**Frontend:**
-   Next.js 14 (App Router)
-   Tailwind CSS (Styling)
-   Framer Motion (Animations)
-   Axios (API Requests)
-   Lucide React (Icons)

**Backend:**
-   Node.js & Express
-   MongoDB & Mongoose
-   Cloudinary (Image/Video Storage)
-   Multer (File Uploads)
-   JWT & Bcrypt (Security)

## ⚙️ Environment Variables

### Backend (`.env`)
```env
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/videotube
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET=<your_secret>
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=<your_secret>
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
```

### Frontend (`client/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 🏃‍♂️ Getting Started

### Backend
1.  Navigate to the root directory `c:\chai-backend-main`.
2.  Install dependencies: `npm install`
3.  Start the server: `npm run dev`

### Frontend
1.  Navigate to the client directory `c:\chai-backend-main\client`.
2.  Install dependencies: `npm install`
3.  Start the development server: `npm run dev`

## 📝 Recent Updates

-   **UI Overhaul**: Fixed global navbar overlap issues and applied consistent padding across all pages.
-   **Feature Sync**: Fully synchronized frontend with backend APIs for Videos, Playlists, and Tweets.
-   **Comments**: Added support for comments on Tweets (view, add, edit, delete).
-   **Bug Fixes**: Resolved auth persistence, CORS issues, and registration bugs.
