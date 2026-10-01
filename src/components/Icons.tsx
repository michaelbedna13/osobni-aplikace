const base = {
  width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const, "aria-hidden": true,
};

export const TodayIcon = () => (
  <svg {...base}><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" /></svg>
);
export const ModulesIcon = () => (
  <svg {...base}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><circle cx="17" cy="17" r="3.5" />
  </svg>
);
export const MapIcon = () => (
  <svg {...base}><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const ProfileIcon = () => (
  <svg {...base}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0z" /></svg>
);
export const PlusIcon = () => (
  <svg {...base} strokeWidth={3}><path d="M12 5v14M5 12h14" /></svg>
);
export const BackIcon = () => (
  <svg {...base} width={18} height={18} strokeWidth={2.5}><path d="M15 5l-7 7 7 7" /></svg>
);
export const UpIcon = () => (
  <svg {...base} width={18} height={18} strokeWidth={2.5}><path d="M6 15l6-6 6 6" /></svg>
);
export const DownIcon = () => (
  <svg {...base} width={18} height={18} strokeWidth={2.5}><path d="M6 9l6 6 6-6" /></svg>
);
