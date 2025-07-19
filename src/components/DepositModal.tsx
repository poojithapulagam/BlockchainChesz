import { motion, AnimatePresence } from 'framer-motion';
import { DM_Sans } from 'next/font/google';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomAmount: number;
}

export default function DepositModal({ isOpen, onClose, roomAmount }: DepositModalProps) {
  const router = useRouter();
  
  const handleConfirmDeposit = () => {
    onClose();
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40"
            onClick={handleCancel}
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[340px] z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-xl bg-[#0A0A0A] border border-white/20 shadow-xl">
              <div className="p-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                  className="absolute right-4 top-4 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>

                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className={`${dmSans.className} text-xl font-medium text-white`}>
                       Fee
                    </h3>
                    <p className={`${dmSans.className} text-sm text-white/50`}>
                      Deposit to enter
                    </p>
                  </div>

                  <div className="py-2">
                    <div className="text-center space-y-1">
                      <div className={`${dmSans.className} text-[40px] font-medium text-white`}>
                        ${roomAmount}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmDeposit();
                      }}
                      className={`
                        ${dmSans.className} w-full h-11 relative rounded-lg
                        bg-white text-black text-sm font-medium
                        transition-all duration-200 
                        hover:opacity-90 active:opacity-100
                      `}
                    >
                      Confirm Deposit
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel();
                      }}
                      className={`
                        ${dmSans.className} w-full h-11 text-sm text-white/50
                        hover:text-white transition-colors
                      `}
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="text-center">
                    <p className={`${dmSans.className} text-xs text-white/30`}>
                      Funds will be in escrow until game completion
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 