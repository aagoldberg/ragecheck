"use client";

import { useState, useEffect } from "react";

export default function EmailPreviewPage() {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

  // Check if in dev mode (no auth needed for preview)
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    // Load admin key from localStorage
    const savedKey = localStorage.getItem("adminKey");
    if (savedKey) {
      setAdminKey(savedKey);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem("adminKey", adminKey);
    setIsAuthenticated(true);
  };

  const sendTestEmail = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/clearview/email-preview", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminKey}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: "success", message: `Test email sent! Check your inbox.` });
      } else {
        setStatus({ type: "error", message: data.error || "Failed to send test email" });
      }
    } catch {
      setStatus({ type: "error", message: "Failed to send test email" });
    }
    setLoading(false);
  };

  const sendToAll = async () => {
    if (!confirm("Are you sure you want to send to ALL subscribers?")) {
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/clearview/send-email", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: "clearview" }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({
          type: "success",
          message: `Sent to ${data.sent} subscribers! (${data.failed} failed)`,
        });
      } else {
        setStatus({ type: "error", message: data.error || "Failed to send emails" });
      }
    } catch {
      setStatus({ type: "error", message: "Failed to send emails" });
    }
    setLoading(false);
  };

  const fetchSubscriberCount = async () => {
    try {
      const res = await fetch("/api/admin", {
        headers: {
          Authorization: `Bearer ${adminKey}`,
        },
      });
      const data = await res.json();
      if (data.subscriberStats?.active) {
        setSubscriberCount(data.subscriberStats.active);
      }
    } catch {
      // Ignore errors
    }
  };

  useEffect(() => {
    if (isAuthenticated && adminKey) {
      fetchSubscriberCount();
    }
  }, [isAuthenticated, adminKey]);

  if (!isAuthenticated && !isDev) {
    return (
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <h1 style={styles.title}>Email Preview</h1>
          <p style={styles.subtitle}>Enter admin key to access</p>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Admin key"
            style={styles.input}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button onClick={handleLogin} style={styles.button}>
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>ClearView Email Preview</h1>
        <p style={styles.subtitle}>
          Preview today&apos;s email before sending
          {subscriberCount !== null && ` • ${subscriberCount} active subscribers`}
        </p>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <button
          onClick={sendTestEmail}
          disabled={loading}
          style={{ ...styles.button, ...styles.testButton }}
        >
          {loading ? "Sending..." : "Send Test Email"}
        </button>
        <button
          onClick={sendToAll}
          disabled={loading}
          style={{ ...styles.button, ...styles.sendButton }}
        >
          {loading ? "Sending..." : "Send to All Subscribers"}
        </button>
      </div>

      {/* Status */}
      {status && (
        <div
          style={{
            ...styles.status,
            backgroundColor: status.type === "success" ? "#ecfdf5" : "#fef2f2",
            color: status.type === "success" ? "#065f46" : "#991b1b",
          }}
        >
          {status.message}
        </div>
      )}

      {/* Preview iframe */}
      <div style={styles.previewContainer}>
        <iframe
          src={`/api/clearview/email-preview${!isDev ? `?auth=${adminKey}` : ""}`}
          style={styles.iframe}
          title="Email Preview"
        />
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f6f9fc",
    padding: "24px",
  },
  loginBox: {
    maxWidth: "400px",
    margin: "100px auto",
    backgroundColor: "white",
    padding: "48px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  header: {
    textAlign: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#111827",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#6b7280",
    fontSize: "14px",
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    marginBottom: "24px",
  },
  button: {
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  testButton: {
    backgroundColor: "#e5e7eb",
    color: "#374151",
  },
  sendButton: {
    backgroundColor: "#7c3aed",
    color: "white",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  status: {
    maxWidth: "600px",
    margin: "0 auto 24px",
    padding: "12px 16px",
    borderRadius: "8px",
    textAlign: "center",
    fontSize: "14px",
  },
  previewContainer: {
    maxWidth: "700px",
    margin: "0 auto",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  iframe: {
    width: "100%",
    height: "800px",
    border: "none",
  },
};
