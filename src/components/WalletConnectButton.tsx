'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { Lexend_Deca } from 'next/font/google';

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["400"],
});

// Dynamically import the WalletMultiButton with no SSR
const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export default function WalletConnectButton() {
  const { connected, publicKey } = useWallet();

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 3)}...${address.slice(-3)}`;
  };

  return (
    <div className={lexendDeca.className}>
      <WalletMultiButton
        style={{ 
          backgroundColor: 'white', 
          fontFamily: 'Lexend Deca',
          fontWeight: 400,
          color: 'black'
        }}
        className={`text-black px-4 py-1.5 rounded-full transition-colors tracking-tighter w-32 font-normal hover:bg-gray-100`}
      >
        {connected && publicKey ? formatAddress(publicKey.toString()) : 'Connect'}
      </WalletMultiButton>
    </div>
  );
} 