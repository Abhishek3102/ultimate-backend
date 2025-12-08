# Socioverse - Where every social world comes together

A next-generation social media platform built with the MERN stack (MongoDB, Express, React/Next.js, Node.js) that combines video hosting, short-form content, and real-time connection into a seamless "universe" of possibilities.

[Model link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj?origin=share)

## 🌟 Over-the-Top Features (Innovation Layer)

These are the standout features that define Socioverse's unique value proposition, pushing the boundaries of what a standard social app can do.

### 🧠 MindMeld (The Serendipity Engine)
*   **Context & Need**: Social media often feels isolating. MindMeld solves this by creating instant, deep connections based on shared thoughts rather than polished profiles.
*   **How it works**: Users type a fleeting thought into the "Pulse Bar" (e.g., "I feel lonely when it rains"). The system generates a vector embedding (using Google Gemini AI) and searches for another user with a semantically similar thought submitted within the last 10 minutes.
*   **Experience**: If a match is found (Similarity > 70%), both users are instantly dropped into an anonymous, ephemeral chat room with a 5-minute timer. They can choose to "Reveal Identity" to connect permanently or let the moment pass.

### 💎 Prism (AI Sentiment Analysis)
*   **Context & Need**: Online misunderstandings fuel toxicity. Prism aims to break echo chambers by showing the spectrum of public opinion.
*   **How it works**: Every tweet and video comment is analyzed by AI to determine its sentiment (Pro/Anti/Neutral) and assigned a "Rationality Score".
*   **Experience**: Users can view a "Prism Feed" for any trending topic, which categorizes opinions into opposing viewpoints, encouraging users to see the other side of an argument rather than just popular opinions.

### 🍿 Cinema (Watch Parties)
*   **Context & Need**: Watching videos is better with friends. Cinema brings the "living room" experience online.
*   **How it works**: A synchronized video viewing experience using WebSockets. Users can create a "Cinema Room", invite friends, and every pause, play, or seek action is instantly synced across all devices.
*   **Experience**: Includes a real-time side chat for discussing the video as it plays, ensuring no one misses a beat.

---

## 🚀 Normal Features (Core Foundation)

The essential building blocks that make Socioverse a robust, fully-functional social platform.

### 🔐 Authentication & User System
*   **Features**: Secure JWT-based auth with access/refresh tokens, detailed user profiles, and avatar management.
*   **Need**: Ensures platform security and allows users to build their digital identity.

### 📹 Video Platform
*   **Features**: Full video upload pipeline (Cloudinary), custom video player with quality controls, Like/Dislike system, and view counting.
*   **Need**: The core content engine of the platform, enabling creators to share long-form content.

### 📝 Tweets & Community
*   **Features**: Twitter-style feed for short text updates, support for engaging discussions via nested comments.
*   **Need**: Allows for quick updates and community building beyond video content.

### 📂 Playlists
*   **Features**: Create unlimited public or private playlists. Add any video to a playlist for personal curation or public sharing.
*   **Need**: Helps users organize content and discover curated collections.

### 👥 User Connections
*   **Features**: Subscription system (Follow creators), "Following" feeds, and direct user profiles.
*   **Need**: Builds the "Social Graph", ensuring users see content from people they care about.

### 📊 Dashboard
*   **Features**: Real-time analytics for creators (Views, Subscribers, Likes).
*   **Need**: empowers creators to track their growth and understand their audience.

---

## 📂 File Folder Structure

A quick guide to navigating the codebase:

### Backend (`src/`)
*   `models/`: Mongoose schemas defining the data structure (User, Video, Tweet, Pulse, etc.).
*   `controllers/`: The business logic for each feature.
    *   `gemini.controller.js`: AI integration logic.
    *   `prism.controller.js`: Sentiment analysis logic.
    *   `pulse.controller.js`: MindMeld thought processing.
*   `routes/`: API route definitions mapping URLs to controllers.
*   `middlewares/`: 
    *   `auth.middleware.js`: Verifies JWT tokens.
    *   `multer.middleware.js`: Handles file uploads locally before Cloudinary.
*   `utils/`: Helper functions.
    *   `gemini.js`: Google Gemini AI embedding and generation utilities.
    *   `cloudinary.js`: Cloud file upload handling.
*   `socket/`: Real-time event handlers.
    *   `index.js`: The central hub for socket connections, handling MindMeld matching, Cinema sync, and Chat.

### Frontend (`client/`)
*   `app/`: Next.js 14 App Router pages.
    *   `page.jsx`: The Home page (Landing + MindMeld Pulse Bar).
    *   `c/[username]/`: Dynamic user profile pages.
    *   `(auth)/`: Login and Register routes.
*   `components/`: Reusable UI components.
    *   `MindMeld/`: Components for the Pulse Bar and Ephemeral Chat modal.
    *   `Cinema/`: Watch party interface.
    *   `common/`: Buttons, inputs, and layout wrappers.
*   `context/`: React Context providers.
    *   `SocketContext.jsx`: Manages the global Socket.io connection.
    *   `AuthProvider.jsx`: Manages user login state.
*   `lib/`: Configuration.
    *   `api.js`: Centralized Axios instance for making API calls.

---

## 🛠️ Tech Stack

**Frontend:**
*   **Framework**: Next.js 14 (App Router)
*   **Styling**: Tailwind CSS
*   **Animations**: Framer Motion
*   **HTTP Client**: Axios
*   **Real-time**: Socket.io-client
*   **Icons**: Lucide React

**Backend:**
*   **Runtime**: Node.js & Express
*   **Database**: MongoDB & Mongoose
*   **WebSockets**: Socket.io
*   **AI**: Google Gemini API (GenAI)
*   **Storage**: Cloudinary

---

## ⚙️ Environment Variables

### Backend (`.env`)
```env
PORT=8000
MONGODB_URI=mongodb+srv://...
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GEMINI_API_KEY=... # or GEMINI_API_KEYS="key1,key2,key3" (for rotation)
```

### Frontend (`client/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SOCKET_SERVER=http://localhost:8000
```

## 🏃‍♂️ Getting Started

### Backend
1.  Navigate to `c:\chai-backend-main`.
2.  Install dependencies: `npm install`
3.  Start server: `npm run dev`

### Frontend
1.  Navigate to `c:\chai-backend-main\client`.
2.  Install dependencies: `npm install`
3.  Start client: `npm run dev`
