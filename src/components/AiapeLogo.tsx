import React from 'react';

interface AiapeLogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'banner' | 'large';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  customLogoUrl?: string;
}

export function AiapeLogo({ variant = 'full', className = '', size = 'md', customLogoUrl }: AiapeLogoProps) {
  // Size mapping for icon size
  const iconSizes = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-28 h-28'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl'
  };

  // If a custom uploaded image URL is provided, render it directly!
  if (customLogoUrl) {
    if (variant === 'icon') {
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]} ${className}`}>
          <img src={customLogoUrl} alt="Logo AIAPE" className="w-full h-full object-contain drop-shadow-md" />
        </div>
      );
    }

    if (variant === 'compact') {
      return (
        <div className={`flex items-center gap-2.5 ${className}`}>
          <img src={customLogoUrl} alt="Logo AIAPE" className={`object-contain shrink-0 drop-shadow-md ${iconSizes[size]}`} />
          <div className="flex flex-col">
            <span className={`font-black tracking-wider text-white ${textSizes[size]}`}>AIAPE</span>
            <span className="text-[10px] text-slate-300 font-medium line-clamp-1">Instrutores de Trânsito PE</span>
          </div>
        </div>
      );
    }

    if (variant === 'banner') {
      return (
        <div className={`bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-white shadow-xl ${className}`}>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
            <img src={customLogoUrl} alt="Logo AIAPE" className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 drop-shadow-2xl" />
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">AIAPE</h2>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  Pernambuco
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-200 tracking-wide uppercase">
                ASSOCIAÇÃO DOS INSTRUTORES DE TRÂNSITO AUTÔNOMOS DE PERNAMBUCO
              </p>
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-1.5 text-[11px] font-semibold text-amber-400/90">
                <span>EDUCAÇÃO</span>
                <span className="text-slate-500">•</span>
                <span>RESPONSABILIDADE</span>
                <span className="text-slate-500">•</span>
                <span>SEGURANÇA NO TRÂNSITO</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img src={customLogoUrl} alt="Logo AIAPE" className={`object-contain shrink-0 drop-shadow-md ${iconSizes[size]}`} />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white tracking-wider text-base lg:text-lg">AIAPE</span>
            <span className="bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
              PERNAMBUCO
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-semibold line-clamp-1 max-w-[280px]">
            Associação dos Instrutores de Trânsito Autônomos de PE
          </p>
        </div>
      </div>
    );
  }

  // SVG Artwork meticulously matching the AIAPE Pernambuco official 3D emblem
  const EmblemSvg = ({ className: svgClass = '' }: { className?: string }) => (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${svgClass} filter drop-shadow-xl`}
    >
      <defs>
        {/* 3D Silver Metallic Frame Gradients */}
        <linearGradient id="silverOuter" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#64748b" />
          <stop offset="75%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        <linearGradient id="silverInner" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="40%" stopColor="#cbd5e1" />
          <stop offset="70%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        {/* Navy Blue 3D Metallic Text */}
        <linearGradient id="navyTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="35%" stopColor="#1e3a8a" />
          <stop offset="70%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Red Accent for PE */}
        <linearGradient id="redAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>

        {/* Green Accent */}
        <linearGradient id="greenAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>

        {/* Sun Gold Radial */}
        <radialGradient id="sunBright" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#facc15" />
          <stop offset="80%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </radialGradient>

        {/* Rainbow Multi-bar Line Gradient */}
        <linearGradient id="peFlagBar" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="30%" stopColor="#dc2626" />
          <stop offset="55%" stopColor="#eab308" />
          <stop offset="80%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        {/* Soft Drop Shadow Filter */}
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.4" />
        </filter>
        
        <filter id="glowLight" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* --- 1. OUTER 3D SILVER METALLIC RING --- */}
      <circle cx="250" cy="200" r="175" stroke="url(#silverOuter)" strokeWidth="22" fill="none" filter="url(#softShadow)" />
      <circle cx="250" cy="200" r="162" stroke="url(#silverInner)" strokeWidth="6" fill="none" />
      <circle cx="250" cy="200" r="158" stroke="#0f172a" strokeWidth="2" fill="#09132d" opacity="0.15" />

      {/* --- 2. PERNAMBUCO MAP SHAPE WITH PERNAMBUCO FLAG --- */}
      <g filter="url(#softShadow)">
        {/* Outline of Pernambuco state map */}
        <path
          d="M 80,185 C 95,140 135,115 190,125 C 245,135 295,95 360,110 C 410,120 435,145 420,185 C 410,210 375,200 330,210 C 280,220 220,195 160,225 C 110,230 85,210 80,185 Z"
          fill="#0a1d47"
          stroke="url(#silverOuter)"
          strokeWidth="6"
        />

        {/* Upper Half Blue Sky of Pernambuco Flag */}
        <path
          d="M 85,180 C 100,145 135,122 190,130 C 245,138 295,102 360,115 C 405,124 428,145 415,180 Z"
          fill="#1d4ed8"
        />

        {/* 3-Color Rainbow Arc across Pernambuco Flag */}
        {/* Red Stripe */}
        <path d="M 105,185 Q 250,90 395,185" stroke="#dc2626" strokeWidth="10" fill="none" strokeLinecap="round" />
        {/* Yellow Stripe */}
        <path d="M 110,188 Q 250,102 390,188" stroke="#eab308" strokeWidth="8" fill="none" strokeLinecap="round" />
        {/* Green Stripe */}
        <path d="M 115,191 Q 250,114 385,191" stroke="#16a34a" strokeWidth="8" fill="none" strokeLinecap="round" />

        {/* Sun of Pernambuco in center of blue field */}
        <circle cx="250" cy="130" r="26" fill="url(#sunBright)" filter="url(#glowLight)" />
        {/* 16 Sun rays */}
        {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((deg, idx) => (
          <polygon
            key={idx}
            points={`
              ${250 + Math.cos((deg * Math.PI) / 180) * 28},${130 + Math.sin((deg * Math.PI) / 180) * 28}
              ${250 + Math.cos(((deg - 6) * Math.PI) / 180) * 36},${130 + Math.sin(((deg - 6) * Math.PI) / 180) * 36}
              ${250 + Math.cos((deg * Math.PI) / 180) * 42},${130 + Math.sin((deg * Math.PI) / 180) * 42}
              ${250 + Math.cos(((deg + 6) * Math.PI) / 180) * 36},${130 + Math.sin(((deg + 6) * Math.PI) / 180) * 36}
            `}
            fill="#facc15"
          />
        ))}

        {/* Red Cross of Pernambuco Flag below sun */}
        <rect x="244" y="165" width="12" height="30" fill="#dc2626" rx="2" />
        <rect x="235" y="174" width="30" height="12" fill="#dc2626" rx="2" />
      </g>

      {/* --- 3. PERSPECTIVE ASPHALT ROAD & ZEBRA CROSSWALK --- */}
      <g filter="url(#softShadow)">
        {/* Road Surface */}
        <polygon points="150,335 220,205 280,205 350,335" fill="#1e293b" />
        {/* Road side borders (silver/white) */}
        <line x1="150" y1="335" x2="220" y2="205" stroke="#f8fafc" strokeWidth="4" />
        <line x1="350" y1="335" x2="280" y2="205" stroke="#f8fafc" strokeWidth="4" />

        {/* Center Dashed Lane Divider */}
        <line x1="250" y1="208" x2="250" y2="335" stroke="#ffffff" strokeWidth="5" strokeDasharray="14 10" />

        {/* Zebra Pedestrian Crosswalk Stripes */}
        <polygon points="160,330 340,330 340,320 160,320" fill="#ffffff" />
        <polygon points="172,312 328,312 328,303 172,303" fill="#ffffff" />
        <polygon points="184,295 316,295 316,287 184,287" fill="#ffffff" />
        <polygon points="195,279 305,279 305,272 195,272" fill="#ffffff" />
      </g>

      {/* --- 4. DRIVING INSTRUCTOR CHARACTER WALKING ON ROAD --- */}
      <g filter="url(#softShadow)">
        {/* Shadow under instructor */}
        <ellipse cx="250" cy="318" rx="20" ry="5" fill="#020617" opacity="0.6" />

        {/* Legs / Jeans */}
        <path d="M 243,268 L 240,300 L 246,316" stroke="#1d4ed8" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 257,268 L 260,302 L 254,316" stroke="#1e40af" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />

        {/* Shoes */}
        <ellipse cx="244" cy="317" rx="6" ry="3" fill="#0f172a" />
        <ellipse cx="256" cy="317" rx="6" ry="3" fill="#0f172a" />

        {/* Body / Black Polo Shirt */}
        <path d="M 238,232 Q 250,228 262,232 L 260,268 Q 250,270 240,268 Z" fill="#0f172a" />
        {/* Polo Collar & Placket */}
        <path d="M 246,231 L 250,242 L 254,231" fill="#1e293b" stroke="#ffffff" strokeWidth="1" />
        
        {/* "INSTRUTOR" Badge text on shirt */}
        <rect x="242" y="243" width="16" height="4" fill="#2563eb" rx="1" />
        <text x="250" y="246" textAnchor="middle" fill="#ffffff" fontSize="3" fontWeight="bold">INSTRUTOR</text>

        {/* Lanyard with ID Card */}
        <path d="M 247,232 L 250,250 L 253,232" stroke="#eab308" strokeWidth="1" fill="none" />
        <rect x="248" y="249" width="4" height="6" fill="#ffffff" stroke="#000000" strokeWidth="0.5" />

        {/* Arms */}
        <path d="M 238,234 L 232,252" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
        <path d="M 262,234 L 268,252" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />

        {/* Head & Skin Tone */}
        <circle cx="250" cy="220" r="9" fill="#fbcfe8" />

        {/* Black Cap with "INSTRUTOR" */}
        <path d="M 240,220 C 240,210 260,210 260,220 Z" fill="#0f172a" />
        <path d="M 238,220 L 255,220" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
        <rect x="244" y="213" width="12" height="3" fill="#2563eb" rx="0.5" />
      </g>

      {/* --- 5. BOLD 3D METALLIC LETTERS "AIAPE" --- */}
      <g filter="url(#softShadow)">
        {/* 3D Extrusion Shadow Layer behind letters */}
        <text
          x="250"
          y="410"
          textAnchor="middle"
          fill="#020617"
          fontSize="102"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="4"
        >
          AIAPE
        </text>
        <text
          x="252"
          y="408"
          textAnchor="middle"
          fill="#1e293b"
          fontSize="102"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="4"
        >
          AIAPE
        </text>

        {/* Main Navy Metallic Text */}
        <text
          x="250"
          y="404"
          textAnchor="middle"
          fill="url(#navyTextGrad)"
          stroke="url(#silverOuter)"
          strokeWidth="4"
          fontSize="102"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="4"
        >
          AIAPE
        </text>

        {/* Red Accent underline bar on 'PE' (referencing Pernambuco) */}
        <rect x="300" y="412" width="115" height="8" fill="url(#redAccentGrad)" rx="3" />
        <rect x="185" y="412" width="105" height="8" fill="url(#silverOuter)" rx="3" />
      </g>

      {/* --- 6. SUBTEXT BELOW AIAPE --- */}
      <text
        x="250"
        y="438"
        textAnchor="middle"
        fill="#0f172a"
        fontSize="16"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="1"
      >
        ASSOCIAÇÃO DOS INSTRUTORES
      </text>

      <text
        x="250"
        y="456"
        textAnchor="middle"
        fill="#0f172a"
        fontSize="15"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.5"
      >
        DE TRÂNSITO AUTÔNOMOS DE PERNAMBUCO
      </text>

      {/* Multi-color flag underline bar */}
      <rect x="60" y="465" width="380" height="4.5" fill="url(#peFlagBar)" rx="2" />

      {/* --- 7. MOTTO TEXT --- */}
      <text
        x="250"
        y="485"
        textAnchor="middle"
        fill="#1e3a8a"
        fontSize="13"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="1"
      >
        EDUCAÇÃO  •  RESPONSABILIDADE  •  SEGURANÇA NO TRÂNSITO
      </text>
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]} ${className}`}>
        <EmblemSvg className="w-full h-full" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
          <EmblemSvg className="w-full h-full" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-wider text-white ${textSizes[size]}`}>
              AIAPE
            </span>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
              PE
            </span>
          </div>
          <span className="text-[10px] text-slate-300 font-medium line-clamp-1">
            Instrutores de Trânsito PE
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'large') {
    return (
      <div className={`flex flex-col items-center text-center p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl ${className}`}>
        <div className="w-48 h-48 sm:w-64 sm:h-64 drop-shadow-2xl mb-4">
          <EmblemSvg className="w-full h-full" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-wider">AIAPE</h2>
        <p className="text-xs font-bold text-slate-300 uppercase mt-1 max-w-md">
          Associação dos Instrutores de Trânsito Autônomos de Pernambuco
        </p>
        <p className="text-[11px] text-amber-400 font-extrabold mt-2 tracking-widest uppercase">
          Educação • Responsabilidade • Segurança no Trânsito
        </p>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-white shadow-xl ${className}`}>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
          <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 drop-shadow-2xl">
            <EmblemSvg className="w-full h-full" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                AIAPE
              </h2>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-blue-400/30">
                Pernambuco
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-200 tracking-wide uppercase">
              Associação dos Instrutores de Trânsito Autônomos de Pernambuco
            </p>
            <div className="pt-1 flex items-center justify-center sm:justify-start gap-1.5 text-[11px] font-semibold text-amber-400/90">
              <span>EDUCAÇÃO</span>
              <span className="text-slate-500">•</span>
              <span>RESPONSABILIDADE</span>
              <span className="text-slate-500">•</span>
              <span>SEGURANÇA NO TRÂNSITO</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default 'full' variant
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <EmblemSvg className="w-full h-full" />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-white tracking-wider text-base lg:text-lg">
            AIAPE
          </span>
          <span className="bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
            PERNAMBUCO
          </span>
        </div>
        <p className="text-[11px] text-slate-300 font-semibold line-clamp-1 max-w-[280px]">
          Associação dos Instrutores de Trânsito Autônomos de PE
        </p>
      </div>
    </div>
  );
}
