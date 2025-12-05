"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Activity, ArrowLeft, CheckCircle, AlertCircle, Clock, Server, Database, Zap } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"

export default function HealthCheckPage() {
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealthData()
    const interval = setInterval(fetchHealthData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchHealthData = async () => {
    try {
      const response = await api.healthCheck()
      setHealthData(response.data || response)
    } catch (error) {
      console.error("Error fetching health data:", error)
      setHealthData({
        status: "ERROR",
        timestamp: new Date().toISOString(),
        error: "Failed to fetch health data",
        message: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatUptime = (seconds) => {
    if (!seconds) return "N/A"
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "ok":
        return "text-green-400"
      case "warning":
        return "text-yellow-400"
      case "error":
      case "unhealthy":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "ok":
        return <CheckCircle className="w-5 h-5" />
      case "warning":
        return <AlertCircle className="w-5 h-5" />
      case "error":
      case "unhealthy":
        return <AlertCircle className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 to-teal-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Checking system health...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/placeholder.svg?height=1080&width=1920')",
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-teal-900/90 to-cyan-900/90" />

      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full blur-3xl animate-bounce" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-10 p-6 bg-white/10 backdrop-blur-sm border-b border-white/20"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.button>
            </Link>
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-emerald-400" />
              <h1 className="text-3xl font-bold text-white">System Health</h1>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchHealthData}
            className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-full font-medium hover:bg-emerald-500/30 transition-all border border-emerald-500/30"
          >
            Refresh
          </motion.button>
        </div>
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Overall Status */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">System Status</h2>
            <div className={`flex items-center gap-2 ${getStatusColor(healthData?.status)}`}>
              {getStatusIcon(healthData?.status)}
              <span className="font-semibold text-lg">{healthData?.status || "Unknown"}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-2">Uptime</p>
              <p className="text-white text-xl font-semibold">
                {healthData?.uptime ? formatUptime(healthData.uptime) : "N/A"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-2">Last Check</p>
              <p className="text-white text-xl font-semibold">
                {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : "N/A"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-2">Response Time</p>
              <p className="text-white text-xl font-semibold">{healthData?.responseTime || "N/A"}ms</p>
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-2">Version</p>
              <p className="text-white text-xl font-semibold">{healthData?.version || "1.0.0"}</p>
            </div>
          </div>
        </motion.div>

        {/* Services Status */}
        {healthData?.services && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-3 gap-6 mb-8"
          >
            {Object.entries(healthData.services).map(([serviceName, serviceData], index) => (
              <motion.div
                key={serviceName}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {serviceName === "database" && <Database className="w-6 h-6 text-blue-400" />}
                    {serviceName === "server" && <Server className="w-6 h-6 text-purple-400" />}
                    {serviceName === "api" && <Zap className="w-6 h-6 text-yellow-400" />}
                    <h3 className="text-white font-semibold capitalize">{serviceName}</h3>
                  </div>
                  <div className={`flex items-center gap-2 ${getStatusColor(serviceData.status)}`}>
                    {getStatusIcon(serviceData.status)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Status</span>
                    <span className={`text-sm font-medium ${getStatusColor(serviceData.status)}`}>
                      {serviceData.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Response Time</span>
                    <span className="text-white text-sm">{serviceData.responseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Last Checked</span>
                    <span className="text-white text-sm">{new Date(serviceData.lastChecked).toLocaleTimeString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Error Display */}
        {healthData?.error && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h3 className="text-red-300 font-semibold">System Error</h3>
            </div>
            <p className="text-red-200">{healthData.error}</p>
            {healthData.message && <p className="text-red-200 mt-2">{healthData.message}</p>}
          </motion.div>
        )}

        {/* API Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl"
        >
          <h2 className="text-2xl font-bold text-white mb-6">API Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-2">Environment</h4>
              <p className="text-gray-300">{healthData?.environment || "Production"}</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">API Version</h4>
              <p className="text-gray-300">{healthData?.apiVersion || "v1"}</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Database Status</h4>
              <p className={getStatusColor(healthData?.database?.status || "unknown")}>
                {healthData?.database?.status || "Unknown"}
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Memory Usage</h4>
              <p className="text-gray-300">{healthData?.memory || "N/A"}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
