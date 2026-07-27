export default function ApocalypseBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', background: '#08070a' }}>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3a3428" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3a3428" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#161311" />
            <stop offset="55%" stopColor="#100d0b" />
            <stop offset="100%" stopColor="#0a0908" />
          </linearGradient>
          <linearGradient id="smoke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2420" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#2a2420" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#050403" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
        </defs>

        <rect width="1600" height="900" fill="url(#sky)" />
        <circle cx="1250" cy="160" r="70" fill="url(#moonGlow)" />
        <circle cx="1250" cy="160" r="34" fill="#4a4432" opacity="0.55" />

        {/* far ruined skyline */}
        <g opacity="0.35" fill="#0f0d0b">
          <rect x="40" y="480" width="60" height="260" />
          <rect x="110" y="440" width="40" height="300" />
          <polygon points="160,500 200,500 195,420 165,420" />
          <rect x="230" y="510" width="70" height="230" />
          <rect x="330" y="460" width="35" height="280" />
          <rect x="700" y="470" width="55" height="270" />
          <rect x="770" y="430" width="45" height="310" />
          <polygon points="830,480 870,480 865,400 835,400" />
          <rect x="1330" y="490" width="60" height="250" />
          <rect x="1410" y="450" width="40" height="290" />
          <rect x="1470" y="500" width="75" height="240" />
        </g>

        {/* near ruined skyline, jagged broken tops */}
        <g fill="#08070605" stroke="none">
          <path d="M0,900 L0,600 L40,600 L40,560 L80,560 L80,610 L130,610 L130,540 L150,570 L150,600 L200,600 L200,650 L260,650 L260,580 L300,610 L300,900 Z" fill="#050403" />
          <path d="M420,900 L420,640 L460,640 L460,590 L500,590 L510,540 L520,590 L560,590 L560,660 L620,660 L620,600 L660,600 L660,900 Z" fill="#050403" />
          <path d="M900,900 L900,610 L940,610 L950,550 L960,610 L1010,610 L1010,570 L1050,570 L1050,650 L1100,650 L1100,900 Z" fill="#050403" />
          <path d="M1200,900 L1200,650 L1240,650 L1240,590 L1290,590 L1290,630 L1340,630 L1340,560 L1360,600 L1360,650 L1420,650 L1420,900 Z" fill="#050403" />
          <path d="M1500,900 L1500,600 L1540,600 L1550,540 L1560,600 L1600,600 L1600,900 Z" fill="#050403" />
        </g>

        {/* smoke plumes */}
        <ellipse cx="150" cy="520" rx="90" ry="160" fill="url(#smoke)" />
        <ellipse cx="960" cy="500" rx="110" ry="200" fill="url(#smoke)" />
        <ellipse cx="1350" cy="480" rx="100" ry="180" fill="url(#smoke)" />

        <rect y="870" width="1600" height="30" fill="url(#ground)" />
      </svg>

      {/* vignette + grain overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, rgba(0,0,0,0.75) 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.05, mixBlendMode: 'overlay',
        backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 2px), repeating-linear-gradient(90deg, #fff 0px, transparent 1px, transparent 2px)',
      }} />
    </div>
  )
}
