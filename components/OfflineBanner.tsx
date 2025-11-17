import React from 'react';

const OfflineBanner = () => {
    return (
        <div 
            className="w-full bg-yellow-500 text-black text-center p-2 text-sm font-semibold sticky top-0 z-50"
            role="status"
            aria-live="polite"
        >
            You are currently offline. Some features may be limited.
        </div>
    );
};

export default OfflineBanner;
