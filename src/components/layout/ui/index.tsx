import { X } from 'lucide-react';
import  type { AvatarProps, ButtonProps, BadgeProps, SearchBarProps, ModalProps, ToastProps, FormFieldProps } from './cons';

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center gap-2 text-sm font-normal leading-4 rounded cursor-pointer transition-all duration-150 border-none';

  const variants: Record<string, string> = {
    // Primary: #533AFD bg, white text, 4px radius, h-10 (~40px for compact use), hover #4329E8, active scale
    primary:   'bg-gradient-to-r from-[#FF9A00] via-[#FF6B00] to-[#E85500] hover:from-[#FFB020] hover:via-[#FF8020] hover:to-[#FF5500] active:from-[#E58800] active:to-[#CC4400] active:scale-[0.98] text-white font-bold border-0 px-6 h-10 shadow-[0_4px_18px_rgba(255,100,0,0.35)] hover:shadow-[0_8px_28px_rgba(255,120,0,0.45)] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed',
    // Secondary: white bg, #533AFD border + text, hover #F3F0FF bg
    secondary: 'bg-white hover:bg-[#F3F0FF] active:bg-[#E8E9FF] text-[#533AFD] border border-[#533AFD] hover:border-[#4329E8] active:border-[#3720D4] px-6 h-10',
    // Ghost: transparent, #533AFD text, hover purple tint bg
    ghost:     'bg-transparent hover:bg-[#533AFD]/[0.08] active:bg-[#533AFD]/[0.12] text-[#533AFD] hover:text-[#4329E8] active:text-[#3720D4] border-0 px-0 h-10',
    // Danger: red tint
    danger:    'bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 border border-red-200 hover:border-red-300 px-6 h-10',
    // Icon: small square borderless button
    icon:      'w-8 h-8 p-0 justify-center bg-transparent hover:bg-[#F3F3F3] text-[#50617A] border border-[#D4DEE9] hover:border-[#B8CCDB]',
  };

  return (
    <button className={`${base} ${variants[variant] ?? variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}


export function Badge({ type, children }: BadgeProps) {
  // File-type color map — light bg, dark text, subtle border per DESIGN.md badge spec
  const configs: Record<string, string> = {
    pdf:      'bg-red-50     text-red-700     border-red-200',
    docx:     'bg-blue-50    text-blue-700    border-blue-200',
    doc:      'bg-blue-50    text-blue-700    border-blue-200',
    xlsx:     'bg-emerald-50 text-emerald-700 border-emerald-200',
    xls:      'bg-emerald-50 text-emerald-700 border-emerald-200',
    pptx:     'bg-orange-50  text-orange-700  border-orange-200',
    zip:      'bg-[#E8E9FF]  text-[#533AFD]   border-[#C9C3F0]',  // info badge spec
    img:      'bg-amber-50   text-amber-700   border-amber-200',
    group:    'bg-[#D1FAE5]  text-[#065F46]   border-[#A7F3D0]',  // success badge spec
    personal: 'bg-[#E5EDF5]  text-[#273951]   border-[#D4DEE9]',
  };

  const imgTypes = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
  const resolvedType = imgTypes.includes(type ?? '') ? 'img' : (type || 'personal');
  const cls = configs[resolvedType] ?? configs.personal;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {children}
    </span>
  );
}

export function Avatar({ name = '', size = 'sm', className = '' }: AvatarProps) {
  const initials = name.split(' ').map((w: string) => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';

  const sizes: Record<string, string> = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  // Stripe-palette avatar colors derived from DESIGN.md primaries
  const palettes = [
    'bg-[#E8E9FF] text-[#533AFD]',  // purple — brand primary
    'bg-[#D1FAE5] text-[#065F46]',  // green
    'bg-[#FEE2E2] text-[#991B1B]',  // red
    'bg-amber-100 text-amber-800',
    'bg-[#E5EDF5] text-[#273951]',  // slate blue
  ];

  const idx = (name.charCodeAt(0) || 0) % palettes.length;

  return (
    <div className={`${sizes[size] ?? sizes.sm} ${palettes[idx]} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
}

// ── SearchBar ────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = 'Search…', className = '' }: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748D] text-sm pointer-events-none select-none">
        🔍
      </span>
      <input
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          'h-10 pl-9 pr-4 w-60 text-sm text-[#061B31] bg-white',
          'border border-[#D4DEE9] rounded',
          'placeholder-[#64748D]/70 outline-none',
          'focus:border-2 focus:border-[#533AFD] focus:ring-[3px] focus:ring-[#533AFD]/10',
          'transition-all duration-150',
        ].join(' ')}
      />
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────

export function Modal({ open, onClose, title, children, footer, width = 520 }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex flex-col max-h-[90vh] rounded-[5px] bg-white border border-[#D4DEE9] shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        style={{ width: Math.min(width, window.innerWidth - 32) }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-[#E5EDF5]">
          <h2 className="text-base font-normal text-[#061B31] leading-snug">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded border border-[#D4DEE9] text-[#50617A] hover:bg-[#F3F3F3] hover:border-[#B8CCDB] transition-colors duration-150"
          >
            <X size={13} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 px-8 py-4 border-t border-[#E5EDF5]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────


export function Toast({ toast }: ToastProps) {
  if (!toast) return null;

  // Per DESIGN.md status badge colors scaled to toast size
  const styles: Record<string, string> = {
    success: 'bg-[#D1FAE5] border-[#A7F3D0] text-[#065F46]',
    error:   'bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]',
    info:    'bg-[#E8E9FF] border-[#C9C3F0] text-[#533AFD]',
  };

  const icons: Record<string, string> = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-[5px] text-sm font-medium border shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 ${styles[toast.type] ?? styles.info}`}>
      <span>{icons[toast.type] ?? icons.info}</span>
      {toast.message}
    </div>
  );
}

// ── FormField ────────────────────────────────────────────────────────────


export function FormField({ label, auto, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Label: 14px/400, #061B31, mb-2 per DESIGN.md form label spec */}
      <label className="text-sm font-normal text-[#061B31] flex items-center gap-2">
        {label}
        {auto && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#E8E9FF] text-[#533AFD] border border-[#C9C3F0]">
            auto
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
