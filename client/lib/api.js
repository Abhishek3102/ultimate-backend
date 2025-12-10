

//   handleOfflineMode(endpoint, options) {
//     console.log(`Offline mode: ${options.method || "GET"} ${endpoint}`);

//     // Handle different endpoints in offline mode
//     switch (true) {
//       case endpoint === "/users/login":
//         return this.mockLogin(options);
//       case endpoint === "/users/register":
//         return this.mockRegister(options);
//       case endpoint === "/users/current-user":
//         return this.mockCurrentUser();
//       case endpoint === "/users/logout":
//         return this.mockLogout();
//       case endpoint.includes("/videos"):
//         return this.mockVideos(endpoint, options);
//       case endpoint.includes("/tweets"):
//         return this.mockTweets(endpoint, options);
//       case endpoint.includes("/likes"):
//         return this.mockLikes(endpoint, options);
//       case endpoint.includes("/playlist"):
//         return this.mockPlaylists(endpoint, options);
//       case endpoint.includes("/subscriptions"):
//         return this.mockSubscriptions(endpoint, options);
//       case endpoint === "/healthcheck":
//         return this.mockHealthCheck();
//       default:
//         return { data: [] };
//     }
//   }

//   mockLogin(options) {
//     try {
//       const credentials = JSON.parse(options.body);

//       // Simple mock validation
//       if (credentials.email && credentials.password) {
//         const mockUser = {
//           _id: "mock_user_id",
//           username: credentials.email.split("@")[0],
//           email: credentials.email,
//           fullName: "Mock User",
//           avatar: "/placeholder.svg?height=80&width=80",
//           createdAt: new Date().toISOString(),
//         };

//         const mockTokens = {
//           accessToken: "mock_access_token_" + Date.now(),
//           refreshToken: "mock_refresh_token_" + Date.now(),
//         };

//         return Promise.resolve({
//           data: {
//             user: mockUser,
//             ...mockTokens,
//           },
//         });
//       } else {
//         throw new Error("Invalid credentials");
//       }
//     } catch (error) {
//       return Promise.reject(new Error("Invalid login data"));
//     }
//   }

//   mockRegister(options) {
//     try {
//       // For FormData, we can't easily parse it, so just return success
//       const mockUser = {
//         _id: "mock_user_id_" + Date.now(),
//         username: "newuser",
//         email: "newuser@example.com",
//         fullName: "New User",
//         avatar: "/placeholder.svg?height=80&width=80",
//         createdAt: new Date().toISOString(),
//       };

//       return Promise.resolve({
//         data: mockUser,
//       });
//     } catch (error) {
//       return Promise.reject(new Error("Registration failed"));
//     }
//   }

//   mockCurrentUser() {
//     const storedUser = localStorage.getItem("user");
//     if (storedUser) {
//       try {
//         return Promise.resolve({
//           data: JSON.parse(storedUser),
//         });
//       } catch (error) {
//         return Promise.reject(new Error("Invalid user data"));
//       }
//     }
//     return Promise.reject(new Error("No user found"));
//   }

//   mockLogout() {
//     return Promise.resolve({ data: { message: "Logged out successfully" } });
//   }

//   mockVideos(endpoint, options) {
//     const mockVideos = [
//       {
//         _id: "mock_video_1",
//         title: "Sample Video 1",
//         description: "This is a sample video for demo purposes",
//         thumbnail: "/placeholder.svg?height=200&width=300",
//         duration: 1200,
//         views: 1500,
//         likesCount: 45,
//         commentsCount: 12,
//         owner: {
//           _id: "mock_user_1",
//           username: "creator1",
//           avatar: "/placeholder.svg?height=40&width=40",
//         },
//         createdAt: new Date().toISOString(),
//       },
//     ];

//     if (options.method === "POST") {
//       // Mock video upload
//       return Promise.resolve({
//         data: {
//           ...mockVideos[0],
//           _id: "mock_video_" + Date.now(),
//           title: "Uploaded Video",
//         },
//       });
//     }

//     return Promise.resolve({ data: mockVideos });
//   }

//   mockTweets(endpoint, options) {
//     const mockTweets = [
//       {
//         _id: "mock_tweet_1",
//         content: "This is a sample tweet in offline mode!",
//         owner: {
//           _id: "mock_user_1",
//           username: "user1",
//           avatar: "/placeholder.svg?height=40&width=40",
//         },
//         likesCount: 5,
//         commentsCount: 2,
//         createdAt: new Date().toISOString(),
//       },
//     ];

//     if (options.method === "POST") {
//       // Mock tweet creation
//       const content = JSON.parse(options.body).content;
//       return Promise.resolve({
//         data: {
//           _id: "mock_tweet_" + Date.now(),
//           content,
//           owner: {
//             _id: "mock_user_1",
//             username: "you",
//             avatar: "/placeholder.svg?height=40&width=40",
//           },
//           likesCount: 0,
//           commentsCount: 0,
//           createdAt: new Date().toISOString(),
//         },
//       });
//     }

//     return Promise.resolve({ data: mockTweets });
//   }

//   mockLikes(endpoint, options) {
//     return Promise.resolve({ data: [] });
//   }

//   mockPlaylists(endpoint, options) {
//     const mockPlaylists = [
//       {
//         _id: "mock_playlist_1",
//         name: "My Favorites",
//         description: "Collection of favorite videos",
//         videos: [],
//         owner: {
//           _id: "mock_user_1",
//           username: "you",
//         },
//         isPublic: true,
//         createdAt: new Date().toISOString(),
//       },
//     ];

//     return Promise.resolve({ data: mockPlaylists });
//   }

//   mockSubscriptions(endpoint, options) {
//     return Promise.resolve({ data: [] });
//   }

//   mockHealthCheck() {
//     return Promise.resolve({
//       status: "OFFLINE",
//       message: "Running in offline mode",
//       timestamp: new Date().toISOString(),
//     });
//   }

//   async handleResponse(response) {
//     const contentType = response.headers.get("content-type");

//     // Handle non-JSON responses
//     if (!contentType || !contentType.includes("application/json")) {
//       if (response.status === 404) {
//         throw new Error("Endpoint not found");
//       }
//       throw new Error("Invalid response format");
//     }

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.message || `HTTP error! status: ${response.status}`);
//     }

//     return data;
//   }

//   async refreshToken() {
//     try {
//       const refreshToken = localStorage.getItem("refreshToken");
//       if (!refreshToken) return false;

//       const response = await fetch(`${this.baseURL}/users/refresh-token`, {
//         method: "POST",
//         credentials: "include",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ refreshToken }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         if (data.data?.accessToken) {
//           localStorage.setItem("accessToken", data.data.accessToken);
//           if (data.data?.refreshToken) {
//             localStorage.setItem("refreshToken", data.data.refreshToken);
//           }
//         }
//         return true;
//       }
//       return false;
//     } catch {
//       return false;
//     }
//   }

//   clearAuth() {
//     localStorage.removeItem("accessToken");
//     localStorage.removeItem("refreshToken");
//     localStorage.removeItem("user");
//   }

//   // Auth endpoints
//   async login(credentials) {
//     return this.request("/users/login", {
//       method: "POST",
//       body: JSON.stringify(credentials),
//     });
//   }

//   async register(userData) {
//     const formData = new FormData();
//     formData.append("fullName", userData.fullName);
//     formData.append("email", userData.email);
//     formData.append("username", userData.username);
//     formData.append("password", userData.password);

//     if (userData.avatar) {
//       formData.append("avatar", userData.avatar);
//     }

//     if (userData.coverImage) {
//       formData.append("coverImage", userData.coverImage);
//     }

//     return this.request("/users/register", {
//       method: "POST",
//       body: formData,
//       headers: {},
//     });
//   }

//   async logout() {
//     try {
//       await this.request("/users/logout", { method: "POST" });
//     } catch (error) {
//       console.error("Logout API error:", error);
//     } finally {
//       this.clearAuth();
//     }
//   }

//   async checkBackendAvailability() {
//     try {
//       const response = await fetch(`${this.baseURL}/health-check`);
//       return response.ok;
//     } catch (error) {
//       console.error("Backend availability check failed:", error);
//       return false;
//     }
//   }

//   async getCurrentUser() {
//     return this.request("/users/current-user");
//   }

//   async updateProfile(userData) {
//     return this.request("/users/update-account", {
//       method: "PATCH",
//       body: JSON.stringify(userData),
//     });
//   }

//   // Video endpoints
//   async getVideos() {
//     try {
//       return await this.request("/videos");
//     } catch (error) {
//       console.error("Get videos error:", error);
//       return { data: [] };
//     }
//   }

//   async uploadVideo(formData) {
//     return this.request("/videos", {
//       method: "POST",
//       body: formData,
//       headers: {},
//     });
//   }

//   async deleteVideo(videoId) {
//     return this.request(`/videos/${videoId}`, { method: "DELETE" });
//   }

//   async updateVideo(videoId, updateData) {
//     return this.request(`/videos/${videoId}`, {
//       method: "PATCH",
//       body: JSON.stringify(updateData),
//     });
//   }

//   // Tweet endpoints
//   async getTweets() {
//     try {
//       return await this.request("/tweets");
//     } catch (error) {
//       console.error("Get tweets error:", error);
//       return { data: [] };
//     }
//   }

//   async createTweet(content) {
//     return this.request("/tweets", {
//       method: "POST",
//       body: JSON.stringify({ content }),
//     });
//   }

//   async updateTweet(tweetId, content) {
//     return this.request(`/tweets/${tweetId}`, {
//       method: "PATCH",
//       body: JSON.stringify({ content }),
//     });
//   }

//   async deleteTweet(tweetId) {
//     return this.request(`/tweets/${tweetId}`, { method: "DELETE" });
//   }

//   // Comment endpoints
//   async getVideoComments(videoId) {
//     try {
//       return await this.request(`/comments/v/${videoId}`);
//     } catch (error) {
//       console.error("Get video comments error:", error);
//       return { data: [] };
//     }
//   }

//   async getTweetComments(tweetId) {
//     try {
//       return await this.request(`/comments/t/${tweetId}`);
//     } catch (error) {
//       console.error("Get tweet comments error:", error);
//       return { data: [] };
//     }
//   }

//   async addVideoComment(videoId, content) {
//     return this.request(`/comments/v/${videoId}`, {
//       method: "POST",
//       body: JSON.stringify({ content }),
//     });
//   }

//   async addTweetComment(tweetId, content) {
//     return this.request(`/comments/t/${tweetId}`, {
//       method: "POST",
//       body: JSON.stringify({ content }),
//     });
//   }

//   async updateComment(commentId, content) {
//     return this.request(`/comments/c/${commentId}`, {
//       method: "PATCH",
//       body: JSON.stringify({ content }),
//     });
//   }

//   async deleteComment(commentId) {
//     return this.request(`/comments/c/${commentId}`, { method: "DELETE" });
//   }

//   // Like endpoints
//   async toggleVideoLike(videoId) {
//     return this.request(`/likes/toggle/v/${videoId}`, { method: "POST" });
//   }

//   async toggleTweetLike(tweetId) {
//     return this.request(`/likes/toggle/t/${tweetId}`, { method: "POST" });
//   }

//   async toggleCommentLike(commentId) {
//     return this.request(`/likes/toggle/c/${commentId}`, { method: "POST" });
//   }

//   async getLikedVideos() {
//     try {
//       return await this.request("/likes/videos");
//     } catch (error) {
//       console.error("Get liked videos error:", error);
//       return { data: [] };
//     }
//   }

//   async getLikedTweets() {
//     try {
//       return await this.request("/likes/tweets");
//     } catch (error) {
//       console.error("Get liked tweets error:", error);
//       body: JSON.stringify(playlistData),
//     });
//   }

//   async updatePlaylist(playlistId, updateData) {
//     return this.request(`/playlist/${playlistId}`, {
//       method: "PATCH",
//       body: JSON.stringify(updateData),
//     });
//   }

//   async deletePlaylist(playlistId) {
//     return this.request(`/playlist/${playlistId}`, { method: "DELETE" });
//   }

//   async addVideoToPlaylist(playlistId, videoId) {
//     return this.request(`/playlist/add/${videoId}/${playlistId}`, {
//       method: "PATCH",
//     });
//   }

//   async removeVideoFromPlaylist(playlistId, videoId) {
//     return this.request(`/playlist/remove/${videoId}/${playlistId}`, {
//       method: "PATCH",
//     });
//   }

//   // Subscription endpoints
//   async getSubscriptions() {
//     try {
//       return await this.request("/subscriptions/c/current-user");
//     } catch (error) {
//       console.error("Get subscriptions error:", error);
//       return { data: [] };
//     }
//   }

//   async toggleSubscription(channelId) {
//     return this.request(`/subscriptions/c/${channelId}`, { method: "POST" });
//   }

//   async getChannelSubscribers(channelId) {
//     try {
//       return await this.request(`/subscriptions/u/${channelId}`);
//     } catch (error) {
//       console.error("Get channel subscribers error:", error);
//       return { data: [] };
//     }
//   }

//   // User endpoints
//   async getUsers() {
//     try {
//       return await this.request("/users");
//     } catch (error) {
//       console.error("Get users error:", error);
//       return { data: [] };
//     }
//   }
//     return this.request(`/users/${userId}`);
//   }

//   // Dashboard endpoints
//   async getDashboardStats() {
//     try {
//       return await this.request("/dashboard/stats");
//     } catch (error) {
//       console.error("Get dashboard stats error:", error);
//       return { data: {} };
//     }
//   }

//   // Space endpoints
//   async createSpace(data) {
//     return this.request("/spaces", {
//       method: "POST",
//       body: JSON.stringify(data),
//     });
//   }

//   async getSpaceById(spaceId) {
//     return this.request(`/spaces/${spaceId}`);
//   }

//   async updateSpaceState(spaceId, data) {
//     return this.request(`/spaces/${spaceId}/state`, {
//       method: "PATCH",
//       body: JSON.stringify(data),
//     });
//   }

//   async getUserSpaces() {
//     return this.request("/spaces/u/current-user");
//   }

  // Health check
//   async healthCheck() {
//     try {
//       return await this.request("/healthcheck");
//     } catch (error) {
//       console.error("Health check error:", error);
//       return {
//         status: "ERROR",
//         message: "Health check failed",
//         timestamp: new Date().toISOString(),
//       };
//     }
//   }
// }

// export const api = new ApiClient();

"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isOfflineMode = false;
  }

  getAuthHeaders() {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  async request(endpoint, options = {}) {
    // If we're in offline mode, return mock data immediately
    if (this.isOfflineMode) {
      return this.handleOfflineMode(endpoint, options);
    }

    const url = `${this.baseURL}${endpoint}`;
    const config = {
      credentials: "include",
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    // Don't set Content-Type for FormData
    if (
      !(options.body instanceof FormData) &&
      !options.headers?.["Content-Type"]
    ) {
      config.headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 only if we have a token to refresh
      if (response.status === 401 && localStorage.getItem("accessToken")) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          config.headers = {
            ...config.headers,
            ...this.getAuthHeaders(),
          };
          const retryResponse = await fetch(url, config);
          return await this.handleResponse(retryResponse);
        } else {
          this.clearAuth();
          throw new Error("Session expired. Please login again.");
        }
      }

      return await this.handleResponse(response);
    } catch (error) {
      // Only switch to offline mode on network errors (fetch failure)
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        console.log(`Network Error: ${error.message}. Switching to offline mode.`);
        this.isOfflineMode = true;
        return this.handleOfflineMode(endpoint, options);
      }

      // Rethrow API errors (4xx/5xx) so they can be handled by the UI
      throw error;
    }
  }

  async handleResponse(response) {
    const contentType = response.headers.get("content-type");

    // Handle non-JSON responses
    if (!contentType || !contentType.includes("application/json")) {
      if (response.status === 404) {
        throw new Error("Endpoint not found");
      }
      throw new Error("Invalid response format");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  handleOfflineMode(endpoint, options) {
    console.log(`Offline mode: ${options.method || "GET"} ${endpoint}`);

    // Handle different endpoints in offline mode
    switch (true) {
      case endpoint === "/users/login":
        return this.mockLogin(options);
      case endpoint === "/users/register":
        return this.mockRegister(options);
      case endpoint === "/users/current-user":
        return this.mockCurrentUser();
      case endpoint === "/users/logout":
        return this.mockLogout();
      case endpoint.includes("/videos"):
        return this.mockVideos(endpoint, options);
      case endpoint.includes("/tweets"):
        return this.mockTweets(endpoint, options);
      case endpoint.includes("/comments"):
        return this.mockComments(endpoint, options);
      case endpoint.includes("/likes"):
        return this.mockLikes(endpoint, options);
      case endpoint.includes("/playlist"):
        return this.mockPlaylists(endpoint, options);
      case endpoint.includes("/subscriptions"):
        return this.mockSubscriptions(endpoint, options);
      case endpoint === "/users" || endpoint.includes("/users"):
        return this.mockUsers(endpoint, options);
      case endpoint === "/healthcheck":
        return this.mockHealthCheck();
      case endpoint === "/arena/challenges":
        return this.mockArenaChallenges();
      case endpoint.includes("/arena/challenge/"):
        // Handle details or leaderboard
        if (endpoint.includes("/leaderboard")) return { data: [] };
        return { data: null };
      default:
        return Promise.resolve({ data: [] });
    }
  }

  mockArenaChallenges() {
    return Promise.resolve({
      data: [
        {
          _id: "mock_challenge_1",
          title: "Creative Writing Contest [OFFLINE DEMO]",
          description: "Write a short story about a time traveler.",
          type: "text",
          status: "active",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(), // +1 day
          prizes: { first: "Gold Badge", second: "Silver Badge", third: "Bronze Badge" },
          createdBy: { _id: "mock_admin", username: "admin", fullName: "Admin" }
        },
        {
          _id: "mock_challenge_2",
          title: "Best Nature Photo [OFFLINE DEMO]",
          description: "Upload your best nature shot.",
          type: "image",
          status: "active",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 172800000).toISOString(), // +2 days
          prizes: { first: "Pro Camera", second: "Lens Kit", third: "Tripod" },
          createdBy: { _id: "mock_admin", username: "admin", fullName: "Admin" }
        }
      ]
    });
  }

  mockLogin(options) {
    try {
      const credentials = JSON.parse(options.body);
      const mockUser = {
        _id: "mock_user_id",
        username: credentials.email.split("@")[0],
        email: credentials.email,
        fullName: "Demo User",
        avatar: "/placeholder.svg?height=80&width=80",
        createdAt: new Date().toISOString(),
      };

      const mockTokens = {
        accessToken: "mock_access_token_" + Date.now(),
        refreshToken: "mock_refresh_token_" + Date.now(),
      };

      return Promise.resolve({
        data: {
          user: mockUser,
          ...mockTokens,
        },
      });
    } catch (error) {
      return Promise.reject(new Error("Invalid login data"));
    }
  }

  mockRegister(options) {
    const mockUser = {
      _id: "mock_user_id_" + Date.now(),
      username: "newuser",
      email: "newuser@example.com",
      fullName: "New User",
      avatar: "/placeholder.svg?height=80&width=80",
      createdAt: new Date().toISOString(),
    };

    return Promise.resolve({
      data: mockUser,
    });
  }

  mockCurrentUser() {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        return Promise.resolve({
          data: JSON.parse(storedUser),
        });
      } catch (error) {
        return Promise.reject(new Error("Invalid user data"));
      }
    }
    return Promise.reject(new Error("No user found"));
  }

  mockLogout() {
    return Promise.resolve({ data: { message: "Logged out successfully" } });
  }

  mockVideos(endpoint, options) {
    const mockVideos = [
      {
        _id: "mock_video_1",
        title: "Sample Video 1",
        description: "This is a sample video for demo purposes",
        thumbnail: "/placeholder.svg?height=200&width=300",
        duration: 1200,
        views: 1500,
        likesCount: 45,
        commentsCount: 12,
        owner: {
          _id: "mock_user_1",
          username: "creator1",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        createdAt: new Date().toISOString(),
      },
    ];

    if (options.method === "POST") {
      return Promise.resolve({
        data: {
          ...mockVideos[0],
          _id: "mock_video_" + Date.now(),
          title: "Uploaded Video",
        },
      });
    }

    return Promise.resolve({ data: mockVideos });
  }

  mockTweets(endpoint, options) {
    const mockTweets = [
      {
        _id: "mock_tweet_1",
        content: "This is a sample tweet in demo mode! 🚀",
        owner: {
          _id: "mock_user_1",
          username: "demouser",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        likesCount: 5,
        commentsCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    if (options.method === "POST") {
      const content = JSON.parse(options.body).content;
      return Promise.resolve({
        data: {
          _id: "mock_tweet_" + Date.now(),
          content,
          owner: {
            _id: "mock_user_1",
            username: "you",
            avatar: "/placeholder.svg?height=40&width=40",
          },
          likesCount: 0,
          commentsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    return Promise.resolve({ data: mockTweets });
  }

  mockComments(endpoint, options) {
    if (options.method === "POST") {
      return Promise.resolve({
        data: {
          _id: "mock_comment_" + Date.now(),
          content: JSON.parse(options.body).content,
          owner: {
            _id: "mock_user_1",
            username: "you",
            avatar: "/placeholder.svg?height=40&width=40",
          },
          createdAt: new Date().toISOString(),
        },
      });
    }
    return Promise.resolve({ data: [] });
  }

  mockLikes(endpoint, options) {
    if (options.method === "POST") {
      return Promise.resolve({
        data: { message: "Like toggled successfully" },
      });
    }
    return Promise.resolve({ data: [] });
  }

  mockPlaylists(endpoint, options) {
    const mockPlaylists = [
      {
        _id: "mock_playlist_1",
        name: "My Favorites",
        description: "Collection of favorite videos",
        videos: [],
        owner: {
          _id: "mock_user_1",
          username: "you",
        },
        isPublic: true,
        createdAt: new Date().toISOString(),
      },
    ];

    if (options.method === "POST") {
      const data = JSON.parse(options.body);
      return Promise.resolve({
        data: {
          _id: "mock_playlist_" + Date.now(),
          ...data,
          owner: {
            _id: "mock_user_1",
            username: "you",
          },
          videos: [],
          createdAt: new Date().toISOString(),
        },
      });
    }

    return Promise.resolve({ data: mockPlaylists });
  }

  mockSubscriptions(endpoint, options) {
    const mockSubscriptions = [
      {
        _id: "mock_sub_1",
        channel: {
          _id: "channel1",
          username: "TechGuru",
          fullName: "Tech Guru Official",
          avatar: "/placeholder.svg?height=60&width=60",
          subscribersCount: 125000,
          videosCount: 89,
        },
        createdAt: new Date().toISOString(),
      },
    ];

    if (options.method === "POST") {
      return Promise.resolve({
        data: { message: "Subscription toggled successfully" },
      });
    }

    return Promise.resolve({ data: mockSubscriptions });
  }

  mockUsers(endpoint, options) {
    const mockUsers = [
      {
        _id: "user1",
        username: "NatureExplorer",
        fullName: "Nature Explorer",
        avatar: "/placeholder.svg?height=60&width=60",
        subscribersCount: 45000,
        videosCount: 67,
      },
      {
        _id: "user2",
        username: "FitnessCoach",
        fullName: "Fitness Coach Pro",
        avatar: "/placeholder.svg?height=60&width=60",
        subscribersCount: 78000,
        videosCount: 134,
      },
    ];

    return Promise.resolve({ data: mockUsers });
  }

  mockHealthCheck() {
    return Promise.resolve({
      status: "DEMO",
      message: "Running in demo mode",
      timestamp: new Date().toISOString(),
    });
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/users/refresh-token`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.accessToken) {
          localStorage.setItem("accessToken", data.data.accessToken);
          if (data.data?.refreshToken) {
            localStorage.setItem("refreshToken", data.data.refreshToken);
          }
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  clearAuth() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  // Auth endpoints
  async login(credentials) {
    return this.request("/users/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    const formData = new FormData();
    formData.append("fullName", userData.fullName);
    formData.append("email", userData.email);
    formData.append("username", userData.username);
    formData.append("password", userData.password);

    if (userData.avatar) {
      formData.append("avatar", userData.avatar);
    }

    if (userData.coverImage) {
      formData.append("coverImage", userData.coverImage);
    }

    return this.request("/users/register", {
      method: "POST",
      body: formData,
      headers: {},
    });
  }

  async logout() {
    try {
      await this.request("/users/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      this.clearAuth();
    }
  }

  async getCurrentUser() {
    return this.request("/users/current-user");
  }

  async updateProfile(userData) {
    return this.request("/users/update-account", {
      method: "PATCH",
      body: JSON.stringify(userData),
    });
  }

  // Video endpoints
  async getVideos(userId) {
    const queryString = userId ? `?userId=${userId}` : "";
    return this.request(`/videos${queryString}`);
  }

  async getUserVideos(userId) {
    return this.getVideos(userId);
  }

  async uploadVideo(formData) {
    return this.request("/videos", {
      method: "POST",
      body: formData,
      headers: {},
    });
  }

  async deleteVideo(videoId) {
    return this.request(`/videos/${videoId}`, { method: "DELETE" });
  }

  async updateVideo(videoId, updateData) {
    return this.request(`/videos/${videoId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
  }

  async getVideoById(videoId) {
    try {
      return this.request(`/videos/${videoId}`);
    } catch (error) {
      console.error("Get video by id error:", error);
      return { data: null };
    }
  }

  // Tweet endpoints
  async getTweets() {
    return this.request("/tweets");
  }

  async getUserTweets(userId) {
      return this.request(`/tweets/user/${userId}`);
  }

  async getTweetById(tweetId) {
    return this.request(`/tweets/${tweetId}`);
  }

  async createTweet(content, images = []) {
    // If images present, send as FormData
    if (images.length > 0) {
        const formData = new FormData();
        formData.append("content", content);
        images.forEach(img => formData.append("images", img));
        return this.request("/tweets", {
            method: "POST",
            body: formData,
            // Header 'Content-Type': 'multipart/form-data' handled auto by browser with FormData
        });
    }

    // Default JSON
    return this.request("/tweets", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  async updateTweet(tweetId, content) {
    return this.request(`/tweets/${tweetId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
  }

  async deleteTweet(tweetId) {
    return this.request(`/tweets/${tweetId}`, { method: "DELETE" });
  }

  // Comment endpoints - Fixed to match backend routes
  async getVideoComments(videoId) {
    return this.request(`/comments/v/${videoId}`);
  }

  async getTweetComments(tweetId) {
    return this.request(`/comments/t/${tweetId}`);
  }

  async addVideoComment(videoId, content) {
    return this.request(`/comments/v/${videoId}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  async addTweetComment(tweetId, content) {
    return this.request(`/comments/t/${tweetId}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  async updateComment(commentId, content) {
    return this.request(`/comments/c/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(commentId) {
    return this.request(`/comments/c/${commentId}`, { method: "DELETE" });
  }

  // Like endpoints - Fixed to match backend routes
  async toggleVideoLike(videoId) {
    return this.request(`/likes/toggle/v/${videoId}`, { method: "POST" });
  }

  async toggleTweetLike(tweetId) {
    return this.request(`/likes/toggle/t/${tweetId}`, { method: "POST" });
  }

  async toggleCommentLike(commentId) {
    return this.request(`/likes/toggle/c/${commentId}`, { method: "POST" });
  }

  async getLikedVideos() {
    return this.request("/likes/videos");
  }

  async getLikedTweets() {
    return this.request("/likes/tweets");
  }

  // Playlist endpoints - Fixed to match backend routes
  async getPlaylists(userId) {
    return this.request(`/playlist/user/${userId}`);
  }

  async createPlaylist(playlistData) {
    return this.request("/playlist", {
      method: "POST",
      body: JSON.stringify(playlistData),
    });
  }

  async updatePlaylist(playlistId, updateData) {
    return this.request(`/playlist/${playlistId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
  }

  async deletePlaylist(playlistId) {
    return this.request(`/playlist/${playlistId}`, { method: "DELETE" });
  }

  async addVideoToPlaylist(playlistId, videoId) {
    return this.request(`/playlist/add/${videoId}/${playlistId}`, {
      method: "PATCH",
    });
  }

  async removeVideoFromPlaylist(playlistId, videoId) {
    return this.request(`/playlist/remove/${videoId}/${playlistId}`, {
      method: "PATCH",
    });
  }

  // Subscription endpoints - Fixed to match backend routes
  async getSubscribedChannels(subscriberId) {
    return this.request(`/subscriptions/u/${subscriberId}`);
  }

  async toggleSubscription(channelId) {
    return this.request(`/subscriptions/c/${channelId}`, { method: "POST" });
  }

  async getChannelSubscribers(channelId) {
    return this.request(`/subscriptions/c/${channelId}`);
  }

  async getFollowRequests() {
      return this.request("/subscriptions/requests/pending");
  }

  async respondToFollowRequest(subscriberId, action) {
      return this.request(`/subscriptions/requests/respond/${subscriberId}`, {
          method: "POST",
          body: JSON.stringify({ action })
      });
  }

  // User endpoints - Fixed to match backend routes
  async searchUsers(query) {
      return this.request(`/users/search?query=${query}`);
  }

  async togglePrivacy() {
      return this.request("/users/toggle-privacy", { method: "POST" });
  }



  async getUsers() {
    return this.request("/users");
  }

  async getUserById(userId) {
    return this.request(`/users/${userId}`);
  }

  async getMessages(userId) {
    return this.request(`/messages/${userId}`);
  }

  async getConversations() {
      return this.request("/conversations");
  }

  async getUserChannelProfile(username) {
    return this.request(`/users/c/${username}`);
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request("/dashboard/stats");
  }

  // Theater / Watch Party endpoints
  async createTheater(videoId) {
    return this.request("/theater", {
      method: "POST",
      body: JSON.stringify({ videoId }),
    });
  }

  async getTheater(roomId) {
    return this.request(`/users/${userId}`);
  }

  // Cinema endpoints
  async getTheater(roomId) {
    return this.request(`/theater/${roomId}`);
  }

  async createTheater(videoId) {
      return this.request("/theater", {
          method: "POST",
          body: JSON.stringify({ videoId })
      });
  }

  // --- Arena Endpoints ---
  async getChallenges() {
    try {
      return await this.request("/arena/challenges");
    } catch (error) {
      console.error("Get challenges error:", error);
      return { data: [] };
    }
  }

  async getChallengeDetails(id) {
    return this.request(`/arena/challenge/${id}`);
  }

  async getLeaderboard(id) {
    return this.request(`/arena/challenge/${id}/leaderboard`);
  }

  async getArenaEntry(id) {
    return this.request(`/arena/entry/${id}`);
  }

  async enterChallenge(id, data) {
    return this.request(`/arena/enter/${id}`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async voteEntry(entryId) {
    return this.request(`/arena/vote/${entryId}`, {
      method: "POST"
    });
  }

  // Dashboard endpointsh check
  async healthCheck() {
    return this.request("/healthcheck");
  }
  async uploadMessageAudio(formData) {
    return this.request("/messages/upload-audio", {
      method: "POST",
      body: formData,
      headers: {},
    });
  }

  async deleteMessage(messageId) {
    return this.request(`/messages/delete/${messageId}`, {
        method: "DELETE"
    });
  }

  // Prism endpoints
  async getTrendingTopics() {
    try {
      return await this.request("/prism/trending");
    } catch (error) {
      console.error("Get trending topics error:", error);
      return { data: [] };
    }
  }

  async getPrismFeed(topic) {
    const encodedTopic = encodeURIComponent(topic);
    try {
      return await this.request(`/prism/feed/${encodedTopic}`);
    } catch (error) {
      console.error("Get prism feed error:", error);
      return { data: { pro: [], anti: [], neutral: [] } };
    }
  }

  // AI endpoints
  async summarizeText(text) {
    return this.request("/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  }

  async getNotifications() {
    return this.request("/notifications");
  }

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, { method: "PATCH" });
  }

  async markAllNotificationsRead() {
    return this.request("/notifications/read-all", { method: "PATCH" });
  }

  async getUserConversations() {
    return this.request("/conversations");
  }

  // --- Arena Methods ---
  async getChallenges() {
    try {
      const response = await this.request("/arena/challenges");
      if (!response.data || response.data.length === 0) {
        console.warn("Backend returned empty list. Showing [OFFLINE DEMO] data.");
        return this.mockArenaChallenges();
      }
      return response;
    } catch (error) {
      console.warn("Arena API failed, falling back to demo mode:", error);
      return this.mockArenaChallenges();
    }
  }

  async getUserTrophies(userId) {
    try {
        return await this.request(`/arena/user/${userId}/trophies`);
    } catch(error) {
        console.error("Get trophies error", error);
        return { data: [] };
    }
  }

  async getChallengeDetails(id) {
    if (id?.toString().startsWith("mock_")) {
      return this.mockChallengeDetails(id);
    }
    return this.request(`/arena/challenge/${id}`);
  }

  async getLeaderboard(challengeId) {
    if (challengeId?.toString().startsWith("mock_")) {
       return { data: [] }; // Empty leaderboard for demo
    }
    return this.request(`/arena/challenge/${challengeId}/leaderboard`);
  }

  async enterChallenge(challengeId, data) {
    if (challengeId?.toString().startsWith("mock_")) {
       return { data: { message: "Entered demo challenge successfully!" } };
    }
    return this.request(`/arena/enter/${challengeId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async voteEntry(entryId) {
    if (entryId?.toString().startsWith("mock_")) {
        return { data: { message: "Voted successfully (Demo)" } };
    }
    return this.request(`/arena/vote/${entryId}`, {
      method: "POST",
    });
  }

  async getArenaEntry(entryId) {
    if (entryId?.toString().startsWith("mock_")) {
        return { data: null };
    }
    return this.request(`/arena/entry/${entryId}`);
  }

  async createChallenge(data) {
    return this.request("/admin/arena/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Mock Helpers ---
  mockChallengeDetails(id) {
    // Return the same data as the list, but maybe with more info if needed
    const mocks = this.mockArenaChallenges().then(res => res.data); // accessing the promise from earlier
    // For simplicity, just return a static object matching the ID
    return Promise.resolve({
        data: {
          _id: id,
          title: id === "mock_challenge_1" ? "Creative Writing Contest [OFFLINE DEMO]" : "Best Nature Photo [OFFLINE DEMO]",
          description: "This is a detailed description for the offline demo challenge. You can't actually win real prizes here, but you can test the UI.",
          type: id === "mock_challenge_1" ? "text" : "image",
          status: "active",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          prizes: { first: "Gold Badge", second: "Silver Badge", third: "Bronze Badge" },
          createdBy: { _id: "mock_admin", username: "admin", fullName: "Admin" }
        }
    });
  }
}

export const api = new ApiClient();
