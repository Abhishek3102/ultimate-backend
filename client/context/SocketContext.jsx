"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "@/components/AuthProvider"

const SocketContext = createContext(null)

export const useSocket = () => {
    return useContext(SocketContext)
}

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null)
    const { user } = useAuth()

    useEffect(() => {
        if (user) {
            const token = localStorage.getItem("accessToken")

            // Determine Socket URL: Use explicit var or derive from API URL (removing /api/v1 suffix)
            let socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER
            if (!socketUrl) {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
                socketUrl = apiUrl.replace(/\/api\/v1\/?$/, "")
            }

            const socketInstance = io(socketUrl, {
                auth: { token },
                query: { userId: user._id }, // Including userId in query as fallback/extra info
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            })

            socketInstance.on("connect", () => {
                console.log("Socket connected", socketInstance.id)
            })

            socketInstance.on("connect_error", (err) => {
                console.error("Socket connection error", err)
            })

            setSocket(socketInstance)

            return () => {
                socketInstance.disconnect()
            }
        } else {
            if (socket) {
                socket.disconnect()
                setSocket(null)
            }
        }
    }, [user])

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    )
}
