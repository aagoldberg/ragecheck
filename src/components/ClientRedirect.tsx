"use client";

import { useEffect } from "react";

export function ClientRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.replace(url);
  }, [url]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${url}`} />
      </noscript>
      <p className="text-sm text-zinc-400">Redirecting...</p>
    </div>
  );
}
