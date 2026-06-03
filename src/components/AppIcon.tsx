import { Monitor } from 'lucide-react';

interface AppIconProps {
  type: string;
  size?: number;
  disabled?: boolean;
}

export function BlenderIcon({ size = 24, disabled = false }: { size?: number; disabled?: boolean }) {
  const opacity = disabled ? 0.45 : 1;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity, flexShrink: 0 }}>
      {/* Blender Orange & Blue Eye logo */}
      <circle cx="11" cy="13" r="5" fill="var(--color-blender)" />
      <circle cx="11" cy="13" r="2" fill="#fff" />
      <path d="M11 5.5C14.5 5.5 18 8 19 11.5M19 11.5L22.5 11M19 11.5L20.5 8" stroke="var(--color-blender)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 14.5C18.5 16.5 20.5 19.5 20.5 22.5" stroke="var(--color-blender)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="15.5" cy="8.5" r="2.5" fill="hsl(200, 95%, 55%)" />
    </svg>
  );
}

export function HoudiniIcon({ size = 24, disabled = false }: { size?: number; disabled?: boolean }) {
  const opacity = disabled ? 0.45 : 1;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity, flexShrink: 0 }}>
      {/* Node network forming an H */}
      <circle cx="6" cy="6" r="2.5" fill="var(--color-houdini)" />
      <circle cx="6" cy="18" r="2.5" fill="var(--color-houdini)" />
      <circle cx="18" cy="6" r="2.5" fill="var(--color-houdini)" />
      <circle cx="18" cy="18" r="2.5" fill="var(--color-houdini)" />
      <circle cx="12" cy="12" r="3" fill="var(--color-houdini)" />
      <line x1="6" y1="8.5" x2="6" y2="15.5" stroke="var(--color-houdini)" strokeWidth="2" />
      <line x1="18" y1="8.5" x2="18" y2="15.5" stroke="var(--color-houdini)" strokeWidth="2" />
      <line x1="8.5" y1="9" x2="15.5" y2="9" stroke="var(--color-houdini)" strokeWidth="1.5" strokeDasharray="2 2" />
      <line x1="8.5" y1="15" x2="15.5" y2="15" stroke="var(--color-houdini)" strokeWidth="1.5" strokeDasharray="2 2" />
      <line x1="8.5" y1="12" x2="15.5" y2="12" stroke="var(--color-houdini)" strokeWidth="2" />
    </svg>
  );
}

export function NukeIcon({ size = 24, disabled = false }: { size?: number; disabled?: boolean }) {
  const opacity = disabled ? 0.45 : 1;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity, flexShrink: 0 }}>
      {/* Layered composites N logo */}
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="var(--color-nuke)" strokeWidth="1.5" strokeDasharray="4 2" />
      <path d="M7 7V17M7 7L17 17M17 17V7" stroke="var(--color-nuke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="7" r="1.5" fill="#fff" />
      <circle cx="17" cy="17" r="1.5" fill="#fff" />
    </svg>
  );
}

export function USDIcon({ size = 24, disabled = false }: { size?: number; disabled?: boolean }) {
  const opacity = disabled ? 0.45 : 1;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity, flexShrink: 0 }}>
      {/* 3D Sphere USD stage symbol */}
      <circle cx="12" cy="12" r="10" stroke="var(--color-usd)" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="var(--color-usd)" strokeWidth="1.2" strokeDasharray="2 1" />
      <ellipse cx="12" cy="12" rx="4" ry="10" stroke="var(--color-usd)" strokeWidth="1.2" strokeDasharray="2 1" />
      <line x1="2" y1="12" x2="22" y2="12" stroke="var(--color-usd)" strokeWidth="1.5" />
      <line x1="12" y1="2" x2="12" y2="22" stroke="var(--color-usd)" strokeWidth="1.5" />
    </svg>
  );
}

export function MariIcon({ size = 24, disabled = false }: { size?: number; disabled?: boolean }) {
  const opacity = disabled ? 0.45 : 1;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity, flexShrink: 0 }}>
      {/* Layered paint-sphere/grid logo for Mari */}
      <circle cx="12" cy="12" r="9" stroke="var(--color-mari)" strokeWidth="1.5" />
      <path d="M12 3C8 3 4.5 6.5 4.5 12C4.5 17.5 8 21 12 21" stroke="var(--color-mari)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 7C9.5 7 7.5 9 7.5 12C7.5 15 9.5 17 12 17" stroke="var(--color-mari)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.5" fill="var(--color-mari)" />
    </svg>
  );
}

export function ComfyUIIcon({ size = 24, disabled = false }: { size?: number; disabled?: boolean }) {
  const opacity = disabled ? 0.45 : 1;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity, flexShrink: 0 }}>
      {/* Flow network representing ComfyUI */}
      <rect x="2" y="5" width="6" height="4" rx="1.5" fill="var(--color-comfyui)" />
      <rect x="16" y="15" width="6" height="4" rx="1.5" fill="var(--color-comfyui)" />
      <circle cx="12" cy="11" r="3" stroke="var(--color-comfyui)" strokeWidth="2" />
      <path d="M8 7H10C11 7 11 11 12 11" stroke="var(--color-comfyui)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 11C13 11 13 17 14 17H16" stroke="var(--color-comfyui)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AppIcon({ type, size = 24, disabled = false }: AppIconProps) {
  const normType = type.toLowerCase();
  if (normType === 'blender') {
    return <BlenderIcon size={size} disabled={disabled} />;
  }
  if (normType === 'houdini') {
    return <HoudiniIcon size={size} disabled={disabled} />;
  }
  if (normType === 'nuke') {
    return <NukeIcon size={size} disabled={disabled} />;
  }
  if (normType === 'mari') {
    return <MariIcon size={size} disabled={disabled} />;
  }
  if (normType === 'comfyui') {
    return <ComfyUIIcon size={size} disabled={disabled} />;
  }
  if (normType === 'usd_web' || normType === 'usd') {
    return <USDIcon size={size} disabled={disabled} />;
  }
  return <Monitor size={size} style={{ color: 'var(--text-secondary)', opacity: disabled ? 0.45 : 1, flexShrink: 0 }} />;
}
