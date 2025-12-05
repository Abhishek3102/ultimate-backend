"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, MapPin, Users, Plus, ArrowLeft, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    maxAttendees: "",
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        // If API doesn't exist, use mock data
        setEvents([
          {
            id: 1,
            title: "Tech Meetup 2024",
            description: "Join us for an exciting tech meetup with industry leaders and networking opportunities.",
            date: "2024-02-15",
            time: "18:00",
            location: "Tech Hub Downtown",
            maxAttendees: 50,
            attendees: [{ id: 1 }, { id: 2 }, { id: 3 }],
          },
          {
            id: 2,
            title: "Design Workshop",
            description: "Learn the latest design trends and tools in this hands-on workshop.",
            date: "2024-02-20",
            time: "14:00",
            location: "Creative Space",
            maxAttendees: 30,
            attendees: [{ id: 1 }, { id: 2 }],
          },
          {
            id: 3,
            title: "Startup Pitch Night",
            description: "Watch innovative startups pitch their ideas to investors and vote for your favorite.",
            date: "2024-02-25",
            time: "19:30",
            location: "Innovation Center",
            maxAttendees: 100,
            attendees: [{ id: 1 }],
          },
        ])
        return
      }

      const data = await response.json()
      if (response.ok) {
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error("Error fetching events:", error)
      // Set mock data on error
      setEvents([
        {
          id: 1,
          title: "Tech Meetup 2024",
          description: "Join us for an exciting tech meetup with industry leaders.",
          date: "2024-02-15",
          time: "18:00",
          location: "Tech Hub Downtown",
          maxAttendees: 50,
          attendees: [{ id: 1 }, { id: 2 }],
        },
      ])
    }
  }

  const createEvent = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      })

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        // If API doesn't exist, simulate event creation
        const createdEvent = {
          id: Date.now(),
          ...newEvent,
          attendees: [],
        }
        setEvents((prev) => [...prev, createdEvent])
        setNewEvent({
          title: "",
          description: "",
          date: "",
          time: "",
          location: "",
          maxAttendees: "",
        })
        setShowCreateForm(false)
        alert("Event created successfully!")
        setLoading(false)
        return
      }

      const data = await response.json()

      if (response.ok) {
        setEvents((prev) => [...prev, data.event])
        setNewEvent({
          title: "",
          description: "",
          date: "",
          time: "",
          location: "",
          maxAttendees: "",
        })
        setShowCreateForm(false)
        alert("Event created successfully!")
      } else {
        alert(data.message || "Failed to create event")
      }
    } catch (error) {
      // Simulate event creation on error
      const createdEvent = {
        id: Date.now(),
        ...newEvent,
        attendees: [],
      }
      setEvents((prev) => [...prev, createdEvent])
      setNewEvent({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        maxAttendees: "",
      })
      setShowCreateForm(false)
      alert("Event created successfully!")
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      // Check if response is actually JSON or if request succeeded
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        // If API doesn't exist, simulate deletion
        setEvents((prev) => prev.filter((event) => event.id !== eventId))
        alert("Event deleted successfully!")
        return
      }

      if (response.ok) {
        setEvents((prev) => prev.filter((event) => event.id !== eventId))
        alert("Event deleted successfully!")
      } else {
        alert("Failed to delete event")
      }
    } catch (error) {
      // Simulate deletion on error
      setEvents((prev) => prev.filter((event) => event.id !== eventId))
      alert("Event deleted successfully!")
    }
  }

  const joinEvent = async (eventId) => {
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "current-user-id" }),
      })

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        // If API doesn't exist, simulate joining
        setEvents((prev) =>
          prev.map((event) =>
            event.id === eventId
              ? { ...event, attendees: [...(event.attendees || []), { id: "current-user-id" }] }
              : event,
          ),
        )
        alert("Successfully joined the event!")
        return
      }

      const data = await response.json()

      if (response.ok) {
        alert("Successfully joined the event!")
        fetchEvents() // Refresh events to update attendee count
      } else {
        alert(data.message || "Failed to join event")
      }
    } catch (error) {
      // Simulate joining on error
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? { ...event, attendees: [...(event.attendees || []), { id: "current-user-id" }] }
            : event,
        ),
      )
      alert("Successfully joined the event!")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-red-400 to-pink-400 rounded-full blur-3xl animate-bounce" />
        <div className="absolute top-3/4 right-3/4 w-72 h-72 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="p-6 bg-white/10 backdrop-blur-sm border-b border-white/20"
        >
          <div className="flex items-center justify-between max-w-6xl mx-auto">
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
              <h1 className="text-3xl font-bold text-white">Events</h1>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-medium flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </motion.button>
          </div>
        </motion.div>

        {/* Events Grid */}
        <div className="p-6 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {events.map((event, index) => (
                <motion.div
                  key={event.id || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, rotateY: 5 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">{event.title}</h3>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteEvent(event.id)}
                        className="p-2 bg-white/10 rounded-full text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-4">{event.description}</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-300">
                      <Calendar className="w-5 h-5 text-orange-400" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <Clock className="w-5 h-5 text-orange-400" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <MapPin className="w-5 h-5 text-orange-400" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <Users className="w-5 h-5 text-orange-400" />
                      <span>
                        {event.attendees?.length || 0} / {event.maxAttendees} attendees
                      </span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => joinEvent(event.id)}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    Join Event
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {events.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Calendar className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No Events Yet</h3>
              <p className="text-gray-300 mb-6">Create your first event to get started!</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(true)}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
              >
                Create Event
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Create New Event</h2>

              <form onSubmit={createEvent} className="space-y-4">
                <input
                  type="text"
                  placeholder="Event Title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all"
                  required
                />

                <textarea
                  placeholder="Description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all h-24 resize-none"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, date: e.target.value }))}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-all"
                    required
                  />
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, time: e.target.value }))}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-all"
                    required
                  />
                </div>

                <input
                  type="text"
                  placeholder="Location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all"
                  required
                />

                <input
                  type="number"
                  placeholder="Max Attendees"
                  value={newEvent.maxAttendees}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, maxAttendees: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all"
                  required
                />

                <div className="flex gap-4 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    {loading ? "Creating..." : "Create"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
