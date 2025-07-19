'use client';

import { motion } from 'framer-motion';

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-yellow-900/20" />
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
} 