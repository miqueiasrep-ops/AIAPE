/**
 * AIAPE Official Vector Emblem & Logo utilities for PDF and Document generation
 */

export function getAiapeEmblemSvgString(): string {
  return `<svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="silverOuter" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="25%" stop-color="#cbd5e1" />
        <stop offset="50%" stop-color="#64748b" />
        <stop offset="75%" stop-color="#94a3b8" />
        <stop offset="100%" stop-color="#334155" />
      </linearGradient>
      <linearGradient id="silverInner" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="40%" stop-color="#cbd5e1" />
        <stop offset="70%" stop-color="#475569" />
        <stop offset="100%" stop-color="#1e293b" />
      </linearGradient>
      <linearGradient id="navyTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1d4ed8" />
        <stop offset="35%" stop-color="#1e3a8a" />
        <stop offset="70%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="redAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ef4444" />
        <stop offset="50%" stop-color="#dc2626" />
        <stop offset="100%" stop-color="#991b1b" />
      </linearGradient>
      <radialGradient id="sunBright" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="40%" stop-color="#facc15" />
        <stop offset="80%" stop-color="#eab308" />
        <stop offset="100%" stop-color="#ca8a04" />
      </radialGradient>
      <linearGradient id="peFlagBar" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#3b82f6" />
        <stop offset="30%" stop-color="#dc2626" />
        <stop offset="55%" stop-color="#eab308" />
        <stop offset="80%" stop-color="#16a34a" />
        <stop offset="100%" stop-color="#2563eb" />
      </linearGradient>
    </defs>

    <!-- Outer 3D Silver Metallic Ring -->
    <circle cx="250" cy="200" r="175" stroke="url(#silverOuter)" stroke-width="22" fill="#09132d" />
    <circle cx="250" cy="200" r="162" stroke="url(#silverInner)" stroke-width="6" fill="#0f172a" />

    <!-- Pernambuco Map & Flag Field -->
    <path
      d="M 80,185 C 95,140 135,115 190,125 C 245,135 295,95 360,110 C 410,120 435,145 420,185 C 410,210 375,200 330,210 C 280,220 220,195 160,225 C 110,230 85,210 80,185 Z"
      fill="#0a1d47"
      stroke="url(#silverOuter)"
      stroke-width="6"
    />
    <path
      d="M 85,180 C 100,145 135,122 190,130 C 245,138 295,102 360,115 C 405,124 428,145 415,180 Z"
      fill="#1d4ed8"
    />

    <!-- Rainbow Arc -->
    <path d="M 105,185 Q 250,90 395,185" stroke="#dc2626" stroke-width="10" fill="none" stroke-linecap="round" />
    <path d="M 110,188 Q 250,102 390,188" stroke="#eab308" stroke-width="8" fill="none" stroke-linecap="round" />
    <path d="M 115,191 Q 250,114 385,191" stroke="#16a34a" stroke-width="8" fill="none" stroke-linecap="round" />

    <!-- Sun & Cross -->
    <circle cx="250" cy="130" r="26" fill="url(#sunBright)" />
    <rect x="244" y="165" width="12" height="30" fill="#dc2626" rx="2" />
    <rect x="235" y="174" width="30" height="12" fill="#dc2626" rx="2" />

    <!-- Road & Crosswalk -->
    <polygon points="150,335 220,205 280,205 350,335" fill="#1e293b" />
    <line x1="150" y1="335" x2="220" y2="205" stroke="#f8fafc" stroke-width="4" />
    <line x1="350" y1="335" x2="280" y2="205" stroke="#f8fafc" stroke-width="4" />
    <line x1="250" y1="208" x2="250" y2="335" stroke="#ffffff" stroke-width="5" stroke-dasharray="14 10" />

    <polygon points="160,330 340,330 340,320 160,320" fill="#ffffff" />
    <polygon points="172,312 328,312 328,303 172,303" fill="#ffffff" />
    <polygon points="184,295 316,295 316,287 184,287" fill="#ffffff" />
    <polygon points="195,279 305,279 305,272 195,272" fill="#ffffff" />

    <!-- Instructor Figure -->
    <circle cx="250" cy="220" r="9" fill="#fbcfe8" />
    <path d="M 240,220 C 240,210 260,210 260,220 Z" fill="#0f172a" />
    <path d="M 238,232 Q 250,228 262,232 L 260,268 Q 250,270 240,268 Z" fill="#0f172a" />
    <path d="M 243,268 L 240,300 L 246,316" stroke="#1d4ed8" stroke-width="7" stroke-linecap="round" />
    <path d="M 257,268 L 260,302 L 254,316" stroke="#1e40af" stroke-width="7" stroke-linecap="round" />

    <!-- AIAPE Metallic Text -->
    <text x="250" y="406" text-anchor="middle" fill="#1e3a8a" stroke="#ffffff" stroke-width="4" font-size="104" font-weight="900" font-family="Arial, Helvetica, sans-serif" letter-spacing="4">
      AIAPE
    </text>
    <rect x="300" y="414" width="115" height="8" fill="#dc2626" rx="3" />
    <rect x="185" y="414" width="105" height="8" fill="#94a3b8" rx="3" />

    <!-- Subtitle -->
    <text x="250" y="438" text-anchor="middle" fill="#0f172a" font-size="16" font-weight="900" font-family="Arial, Helvetica, sans-serif">
      ASSOCIAÇÃO DOS INSTRUTORES
    </text>
    <text x="250" y="456" text-anchor="middle" fill="#0f172a" font-size="15" font-weight="800" font-family="Arial, Helvetica, sans-serif">
      DE TRÂNSITO AUTÔNOMOS DE PERNAMBUCO
    </text>
    <rect x="60" y="465" width="380" height="4.5" fill="url(#peFlagBar)" rx="2" />
    <text x="250" y="485" text-anchor="middle" fill="#1e3a8a" font-size="13" font-weight="900" font-family="Arial, Helvetica, sans-serif">
      EDUCAÇÃO  •  RESPONSABILIDADE  •  SEGURANÇA NO TRÂNSITO
    </text>
  </svg>`;
}

/**
 * Converte a logo (customizada ou emblema oficial vetorial da AIAPE) em um Data URL PNG de alta resolução.
 */
export async function getAiapeLogoPngDataUrl(customLogoUrl?: string): Promise<string> {
  // Se for uma imagem customizada fornecida
  if (customLogoUrl && customLogoUrl.trim() !== '') {
    try {
      if (customLogoUrl.startsWith('data:image/')) {
        return customLogoUrl;
      }
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 400;
          canvas.height = img.height || 400;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(fallbackCanvasLogo());
          }
        };
        img.onerror = () => resolve(fallbackCanvasLogo());
        img.src = customLogoUrl;
      });
    } catch {
      // Fallback para o emblema oficial se falhar
    }
  }

  // Gera a partir do SVG oficial
  try {
    const svgStr = getAiapeEmblemSvgString();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const dataUrl = await new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 500, 500);
          ctx.drawImage(img, 0, 0, 500, 500);
          const res = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          resolve(res);
        } else {
          URL.revokeObjectURL(url);
          resolve(fallbackCanvasLogo());
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(fallbackCanvasLogo());
      };
      img.src = url;
    });

    return dataUrl;
  } catch {
    return fallbackCanvasLogo();
  }
}

function fallbackCanvasLogo(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background circle
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.arc(200, 200, 190, 0, Math.PI * 2);
  ctx.fill();

  // Border ring
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#facc15';
  ctx.stroke();

  // Text AIAPE
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AIAPE', 200, 170);

  // Subtext
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#facc15';
  ctx.fillText('PERNAMBUCO', 200, 230);

  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('INSTRUTORES DE TRÂNSITO', 200, 265);

  return canvas.toDataURL('image/png');
}
