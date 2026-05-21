const Icon = ({ name, className = '' }) => {
    switch (name) {
        case 'target':
            return (
                <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
                    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M12 18v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M4 12h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M18 12h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="3.2" fill="currentColor" />
                </svg>
            );
        case 'calendar':
            return (
                <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
                    <rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M3 9h18" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M8 2v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M16 2v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            );
        case 'edit':
            return (
                <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
                    <path d="M4 20h4l10-10-4-4L4 16v4z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M14 6l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            );
        case 'plus':
            return (
                <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
                    <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            );
        case 'shield':
            return (
                <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
                    <path d="M12 3l7 3v5c0 4.97-3.73 9.45-7 11-3.27-1.55-7-6.03-7-11V6l7-3z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case 'user':
            return (
                <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
                    <circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M5 21c0-3.31 2.69-6 6-6s6 2.69 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
            );
        case 'search':
            return (
                <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
                    <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M16 16l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            );
        default:
            return null;
    }
};

export default Icon;
