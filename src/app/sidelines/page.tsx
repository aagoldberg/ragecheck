"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface EventSummary {
  id: number;
  name: string;
  description: string;
  platform: string;
  keywords: string[];
  startTs: string;
  endTs: string;
  status: string;
  createdAt: string;
  postCount: number;
  userCount: number;
  edgeCount: number;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400", label: "Draft" },
  collecting: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Collecting" },
  collected: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Collected" },
  analyzing: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", label: "Analyzing" },
  ready: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", label: "Ready" },
  error: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Error" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

export default function SideLinesPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [platform] = useState("bluesky");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const res = await fetch("/api/sidelines/events");
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/sidelines/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          platform,
          keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          seedPostUris: [],
          startTs: new Date(startDate).toISOString(),
          endTs: new Date(endDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setName("");
        setDescription("");
        setKeywords("");
        setStartDate("");
        setEndDate("");
        fetchEvents();
      }
    } catch (err) {
      console.error("Failed to create event:", err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/sidelines" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-emerald-600 dark:bg-emerald-500 rounded-sm" />
            <span className="font-bold text-lg tracking-tight">SideLines</span>
          </Link>
          <div className="flex gap-4 text-sm font-medium text-zinc-500">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Analyzer</Link>
            <Link href="/clearview" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">ClearView</Link>
            <Link href="/sidelines" className="text-zinc-900 dark:text-zinc-100">SideLines</Link>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <Link href="/sidelines/methodology" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</Link>
            <Link href="/sidelines/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">SideLines</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Measuring the sporting dynamics of political discourse.
          </p>
        </div>

        {/* AI Experiment Banner */}
        <div className="mb-8 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
          Experimental research tool. Metrics are proxies for discourse dynamics, not measures of persuasion or radicalization.
        </div>

        {/* Create Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            {showCreate ? "Cancel" : "New Event"}
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="mb-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 2026 State of the Union Reactions"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What discourse event are you tracking?"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Keywords (comma-separated)</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. state of the union, SOTU, biden address"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
            <div className="text-sm text-zinc-500">
              Platform: Bluesky (Phase 1)
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {creating ? "Creating..." : "Create Event"}
            </button>
          </form>
        )}

        {/* Event List */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 mb-2">No events yet.</p>
            <p className="text-sm text-zinc-400">Create an event to start tracking discourse dynamics.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/sidelines/events/${event.id}`}
                className="block p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-lg font-bold">{event.name}</h2>
                  <StatusBadge status={event.status} />
                </div>
                {event.description && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{event.description}</p>
                )}
                <div className="flex gap-4 text-sm text-zinc-500">
                  <span>{event.postCount.toLocaleString()} posts</span>
                  <span>{event.userCount.toLocaleString()} users</span>
                  <span>{event.edgeCount.toLocaleString()} edges</span>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {event.keywords.slice(0, 5).map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-400"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
