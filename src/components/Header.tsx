'use client';

import Image from "next/image";
import Link from "next/link";
import NavigationLinks from "./NavigationLinks";
import WalletConnectButton from "./WalletConnectButton";

export default function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <Link href="/" className="logo-link">
            <Image
              src="/logo.jpg"
              alt="Logo"
              width={120}
              height={120}
              className="logo-image"
              priority
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="desktop-nav">
          <NavigationLinks />
        </div>

        {/* Desktop Actions */}
        <div className="desktop-actions">
          <WalletConnectButton />
        </div>

        {/* Mobile Navigation */}
        <div className="mobile-nav">
          <NavigationLinks />
        </div>
      </div>
    </header>
  );
} 