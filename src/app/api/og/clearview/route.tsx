import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fafafa",
          position: "relative",
          fontFamily: 'sans-serif',
        }}
      >
        {/* Gradient accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "linear-gradient(90deg, #6366f1, #a855f7)", // Indigo to Purple for ClearView
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "60px",
          }}
        >
          {/* Logo and title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#18181b",
                borderRadius: "16px",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Simple icon shape */}
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span
              style={{
                fontSize: "72px",
                fontWeight: "800",
                color: "#18181b",
                letterSpacing: "-2px",
              }}
            >
              RageCheck
            </span>
          </div>

          {/* Feature Badge */}
           <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 32px",
              backgroundColor: "#e0e7ff", // indigo-100
              borderRadius: "50px",
              marginBottom: "32px",
            }}
          >
            <span
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#4338ca", // indigo-700
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              ClearView Daily Briefing
            </span>
          </div>


          {/* Tagline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              maxWidth: "900px",
            }}
          >
            <span
              style={{
                fontSize: "56px",
                fontWeight: "700",
                color: "#18181b",
                textAlign: "center",
                lineHeight: 1.1,
                letterSpacing: "-1px",
              }}
            >
              What actually happened. Minus the spin.
            </span>
            <span
              style={{
                fontSize: "28px",
                color: "#52525b",
                textAlign: "center",
                marginTop: "16px",
                maxWidth: "800px",
                lineHeight: 1.4,
              }}
            >
              We analyze stories from across the political spectrum to synthesize the core facts and show you how different outlets are framing the narrative.
            </span>
          </div>

           {/* Source Spectrum Visual */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "48px",
              alignItems: "center",
            }}
          >
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '80px', height: '12px', background: '#3b82f6', borderRadius: '6px' }} />
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>LEFT</span>
             </div>
             <div style={{ width: '40px', height: '2px', background: '#cbd5e1' }} />
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '80px', height: '12px', background: '#94a3b8', borderRadius: '6px' }} />
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>CENTER</span>
             </div>
             <div style={{ width: '40px', height: '2px', background: '#cbd5e1' }} />
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '80px', height: '12px', background: '#ef4444', borderRadius: '6px' }} />
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>RIGHT</span>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            left: "60px",
            right: "60px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "20px",
              color: "#a1a1aa",
            }}
          >
            ragecheck.com/clearview
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
