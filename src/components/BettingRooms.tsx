'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { DM_Sans } from "next/font/google";
import nftHolders from '@/data/nftHolders.json';

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

interface Room {
  id: number;
  price: number;
  activePlayers: number;
  totalPot: number;
  winnerPrize: number;
  matchDuration: string;
}

const rooms: Room[] = [
  { 
    id: 1, 
    price: 10, 
    activePlayers: 14,
    totalPot: 20,
    winnerPrize: 17,
    matchDuration: '10 min'
  },
  { 
    id: 2, 
    price: 20, 
    activePlayers: 8,
    totalPot: 40,
    winnerPrize: 34,
    matchDuration: '12 min'
  },
  { 
    id: 3, 
    price: 40, 
    activePlayers: 6,
    totalPot: 80,
    winnerPrize: 68,
    matchDuration: '15 min'
  }
];

export default function BettingRooms() {
  const [expandedRooms, setExpandedRooms] = useState<number[]>([]);
  const [hasNFT, setHasNFT] = useState(false);
  const { connected, publicKey } = useWallet();
  const [increasedPrizes, setIncreasedPrizes] = useState<{[key: number]: number}>({});

  useEffect(() => {
    if (connected && publicKey) {
      const isNFTHolder = nftHolders.nftHolderWallets.includes(publicKey.toString());
      setHasNFT(isNFTHolder);
      
      if (isNFTHolder) {
        const newIncreasedPrizes = rooms.reduce((acc, room) => {
          acc[room.id] = room.totalPot * 0.90;
          return acc;
        }, {} as {[key: number]: number});
        setIncreasedPrizes(newIncreasedPrizes);
      } else {
        setIncreasedPrizes({});
      }
    } else {
      setHasNFT(false);
      setIncreasedPrizes({});
    }
  }, [connected, publicKey]);

  const toggleRoomExpansion = (roomId: number) => {
    setExpandedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 px-4 sm:px-6 pt-20 sm:pt-24 pb-6 max-w-4xl mx-auto min-h-screen items-center bg-black">
      {rooms.map((room) => (
        <motion.div
          key={room.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          className="bg-black rounded-lg shadow-lg overflow-hidden border border-gray-800 max-w-[260px] w-full relative mx-auto sm:max-w-[280px] lg:max-w-[260px]"
        >
          <motion.div className="absolute top-3 left-4 flex flex-col">
            <div className="flex items-center gap-1">
              {hasNFT ? (
                <>
                  <span className="text-yellow-400 text-[11px] tracking-wide font-medium">Premium</span>
                  <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                </>
              ) : (
                <>
                  <span className="text-gray-400 text-[11px] tracking-wide font-medium">Normal</span>
                  <Star className="w-2.5 h-2.5 text-gray-400" fill="currentColor" />
                </>
              )}
            </div>
            {hasNFT && (
              <div className="flex items-center gap-2 mt-0.5">
                <div className="relative">
                  <span className="text-gray-500 text-[11px] tracking-wide font-medium">15%</span>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-1/2 left-0 h-[1px] bg-red-500"
                  />
                </div>
                <span className="text-yellow-400 text-[11px] tracking-wide font-medium">10%</span>
              </div>
            )}
          </motion.div>

          <div className="p-4 sm:p-6 lg:p-8 relative z-10">
            <div className={`${dmSans.className} text-4xl font-light text-white mb-6 text-center`}>${room.price}</div>
            
            <div className="flex items-center justify-center gap-3 sm:gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                <span className="text-sm text-gray-400">{room.activePlayers} Players</span>
              </div>
              <div className="text-gray-600">|</div>
              <span className="text-sm text-gray-400">{room.matchDuration}</span>
            </div>

            <div className="bg-black/40 rounded-lg p-4 mb-6 border border-gray-800/50">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Entry Fee:</span>
                  <span className="text-sm text-white">${room.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Pot:</span>
                  <span className="text-sm text-white">${room.totalPot}</span>
                </div>
                <div className="border-t border-dashed border-gray-800 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Winner Gets:</span>
                  <motion.span 
                    className="text-sm text-green-400"
                    initial={false}
                    animate={{ scale: hasNFT ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    ${hasNFT ? increasedPrizes[room.id]?.toFixed(2) : room.winnerPrize}
                  </motion.span>
                </div>
                <button 
                  onClick={() => toggleRoomExpansion(room.id)}
                  className="w-full flex items-center justify-between px-1 mt-2 pt-2 border-t border-gray-800"
                >
                  <span className="text-sm text-gray-500">Advanced</span>
                  <motion.svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    animate={{ rotate: expandedRooms.includes(room.id) ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-gray-500"
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </motion.svg>
                </button>
                <AnimatePresence>
                  {expandedRooms.includes(room.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ 
                        duration: 0.4,
                        ease: "easeInOut",
                        height: {
                          duration: 0.4,
                          ease: [0.4, 0, 0.2, 1]
                        },
                        opacity: {
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1]
                        }
                      }}
                    >
                      <div className="pt-2 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Platform Fee:</span>
                          <motion.span 
                            className={`text-blue-400 ${!connected && 'text-gray-400'}`}
                            initial={false}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.3 }}
                          >
                            {hasNFT ? '10%' : '15%'}
                          </motion.span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Draw:</span>
                          <span className="text-sm text-white">2%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Potential Profit:</span>
                          <motion.span 
                            className="text-sm text-green-400"
                            initial={false}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.3 }}
                          >
                            ${hasNFT 
                              ? (increasedPrizes[room.id] - room.price).toFixed(2)
                              : (room.winnerPrize - room.price).toFixed(2)}
                          </motion.span>
                        </div>
                        {!hasNFT && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">NFT Holder:</span>
                            <motion.span 
                              className="text-sm text-yellow-400"
                              initial={false}
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 0.3 }}
                            >
                              10%
                            </motion.span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: connected ? 1.02 : 1 }}
              whileTap={{ scale: connected ? 0.98 : 1 }}
              className={`${dmSans.className} w-full mx-auto block ${
                connected 
                  ? 'bg-white text-black hover:bg-gray-100' 
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed'
              } py-2.5 px-4 rounded-lg font-medium transition-colors`}
              onClick={() => {
                if (connected) {
                  window.location.href = `/room/${room.id}`;
                }
              }}
              disabled={!connected}
              title={!connected ? "Please connect your wallet to join" : ""}
            >
              {connected ? "Quick Join" : "Quick Join"}
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
} 