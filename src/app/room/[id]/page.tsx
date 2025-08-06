'use client';

import { useParams, useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DM_Sans, Lexend_Deca } from 'next/font/google';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import DepositModal from '@/components/DepositModal';
import { Square } from 'chess.js';
import Image from 'next/image'

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});



// Function to shorten wallet address
const shortenAddress = (address: string) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};



// Add this after the imports
const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    scale: 0.98
  }
};

// Update the getPieceImage function
const getPieceImage = (piece: string, color: 'white' | 'black') => {
  const pieceType = piece.toLowerCase();
  return `https://www.chess.com/chess-themes/pieces/neo/150/${color[0]}${pieceType}.png`;
};

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id;
  const { publicKey } = useWallet();
  const [foundOpponent, setFoundOpponent] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [isDeposited, setIsDeposited] = useState(false);
  const [game, setGame] = useState<Chess>(new Chess());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [moves, setMoves] = useState<string[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{white: string[], black: string[]}>({white: [], black: []});
  const [chatMessages, setChatMessages] = useState<{sender: string, message: string}[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{from: Square, to: Square} | null>(null);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | 'draw' | 'resign' | 'timeout' | null>(null);
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  
  const opponentWallet = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';



  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    // Check if it's a pawn promotion move
    const gameCopy = new Chess(game.fen());
    const moves = gameCopy.moves({ verbose: true });
    const promotionMove = moves.find(
      move => 
        move.from === sourceSquare && 
        move.to === targetSquare && 
        move.flags.includes('p')
    );

    if (promotionMove) {
      setPromotionMove({ from: sourceSquare as Square, to: targetSquare as Square });
      setPromotionDialogOpen(true);
      return true;
    }

    // Handle regular moves
    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q' // Default to queen for now
    });

    if (move) {
      setGame(gameCopy);
      setLastMove({ from: sourceSquare, to: targetSquare });
      
      // Format move in standard chess notation
      let moveText = '';
      if (move.piece.toUpperCase() !== 'P') {
        moveText += move.piece.toUpperCase();
      }
      if (move.captured) {
        if (move.piece.toUpperCase() === 'P') {
          moveText += sourceSquare[0];
        }
        moveText += 'x';
      }
      moveText += targetSquare;
      if (move.promotion) {
        moveText += '=' + move.promotion.toUpperCase();
      }
      if (gameCopy.isCheck()) {
        moveText += gameCopy.isCheckmate() ? '#' : '+';
      }
      
      setMoves(prev => [...prev, moveText]);
      
      // Update captured pieces
      if (move.captured) {
        const pieceColor = move.color === 'w' ? 'black' : 'white';
        const capturedPiece = move.captured.toUpperCase();
        setCapturedPieces(prev => ({
          ...prev,
          [pieceColor]: [...prev[pieceColor], capturedPiece]
        }));
      }
      
      setIsPlayerTurn(false);
      return true;
    }
    return false;
  }

  function handlePromotion(promotionPiece: string) {
    if (!promotionMove) return;

    const gameCopy = new Chess(game.fen());
    const move = gameCopy.move({
      from: promotionMove.from,
      to: promotionMove.to,
      promotion: promotionPiece
    });

    if (move) {
      setGame(gameCopy);
      setLastMove({ from: promotionMove.from, to: promotionMove.to });
      
      // Format move notation with promotion
      const moveText = `${promotionMove.from[0]}${promotionMove.to}=${promotionPiece.toUpperCase()}`;
      setMoves(prev => [...prev, moveText]);
      
      setIsPlayerTurn(false);
    }

    setPromotionDialogOpen(false);
    setPromotionMove(null);
  }

  // Get room amount based on room ID
  const getRoomAmount = () => {
    switch (roomId) {
      case '1':
        return 10;
      case '2':
        return 20;
      case '3':
        return 40;
      default:
        return 10;
    }
  };

  // Get room time based on room ID
  const getRoomTime = () => {
    switch (roomId) {
      case '1':
        return 600; // 10 minutes
      case '2':
        return 720; // 12 minutes
      case '3':
        return 900; // 15 minutes
      default:
        return 600; // Default 10 minutes
    }
  };

  const [playerTime, setPlayerTime] = useState(getRoomTime());
  const [opponentTime, setOpponentTime] = useState(getRoomTime());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  // Timer effect
  useEffect(() => {
    if (isDeposited) {
      const timer = setInterval(() => {
        if (isPlayerTurn) {
          setPlayerTime(prev => Math.max(0, prev - 1));
        } else {
          setOpponentTime(prev => Math.max(0, prev - 1));
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isDeposited, isPlayerTurn]);

  // Format time to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Show deposit modal after opponent is found with delay
  useEffect(() => {
    if (foundOpponent) {
      const timer = setTimeout(() => {
        setShowDepositModal(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [foundOpponent]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFoundOpponent(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages(prev => [...prev, {sender: 'You', message: newMessage}]);
      setNewMessage('');
    }
  };

  // Add this effect to check for game end conditions
  useEffect(() => {
    if (isDeposited) {
      // Check for checkmate
      if (game.isCheckmate()) {
        setGameResult(isPlayerTurn ? 'lose' : 'win');
      }
      // Check for draw
      else if (game.isDraw()) {
        setGameResult('draw');
      }
      // Check for timeout
      else if (playerTime === 0 || opponentTime === 0) {
        setGameResult(playerTime === 0 ? 'timeout' : 'win');
      }
    }
  }, [game, isPlayerTurn, playerTime, opponentTime, isDeposited]);

  // Modify the resign button click handler
  const handleResign = () => {
    setShowResignConfirm(true);
  };

  const handleResignConfirm = (confirmed: boolean) => {
    setShowResignConfirm(false);
    if (confirmed) {
      setGameResult('resign');
      setShowGameOver(true);
      // Hide game over modal after 30 seconds
      setTimeout(() => {
        setShowGameOver(false);
        router.push('/');
      }, 30000);
    }
  };



  // If deposited, show chess board on black screen
  if (isDeposited) {
    return (
      <div className="fixed inset-0 bg-black overflow-y-auto min-h-screen">
        {/* Add Resign Confirmation Modal */}
        {showResignConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black p-8 rounded-xl border border-white/20 shadow-2xl max-w-md w-full mx-4 backdrop-blur-sm"
            >
              <div className="text-center">
                <div className="mb-6">
                  <h2 className={`${lexendDeca.className} text-3xl font-bold mb-2 text-white`}>
                    Resign Game?
                  </h2>
                  <p className={`${lexendDeca.className} text-white/70`}>
                    This will end the game & you will lose.
                  </p>
                </div>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleResignConfirm(true)}
                    className={`${lexendDeca.className} px-8 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-all duration-200 font-medium`}
                  >
                    Yes, Resign
                  </button>
                  <button
                    onClick={() => handleResignConfirm(false)}
                    className={`${lexendDeca.className} px-8 py-3 bg-black text-white rounded-lg hover:bg-white/10 transition-all duration-200 font-medium border border-white/20`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Game Over Modal */}
        {(gameResult && showGameOver) && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black p-8 rounded-xl border border-white/20 shadow-2xl max-w-md w-full mx-4 backdrop-blur-sm"
            >
              <div className="text-center">
                <div className="mb-6">
                  <h2 className={`${lexendDeca.className} text-4xl font-bold mb-2 text-white`}>
                    Game Over
                  </h2>
                  <h3 className={`${lexendDeca.className} text-2xl text-white/80`}>
                    Resigned
                  </h3>
                  <p className={`${lexendDeca.className} text-white/70 mt-2`}>
                    Thanks for playing!
                  </p>
                </div>
                <button
                  onClick={() => router.push('/')}
                  className={`${lexendDeca.className} px-8 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-all duration-200 font-medium`}
                >
                  Return to Lobby
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          {/* Main Game Container */}
          <div className="w-full max-w-[1200px] flex flex-col lg:flex-row items-start justify-center gap-6">
            {/* Left Side - Moves & Captured (Desktop) */}
            <div className="hidden lg:flex lg:w-[250px] flex-col gap-4 self-stretch">
              {/* Moves History */}
              <div className="bg-black/40 rounded-lg p-4 border border-gray-600/50 flex-1 flex flex-col">
                <div className={`${dmSans.className} text-sm text-white/50 mb-2`}>Moves History</div>
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
                  <div className="space-y-1 pr-2 max-h-[324px]">
                    {moves.map((move, index) => (
                      <div key={index} className={`${dmSans.className} text-sm flex items-center gap-2 h-[18px]`}>
                        <span className="text-gray-500 min-w-[24px] flex-shrink-0">{Math.floor(index/2) + 1}.</span>
                        <span className={`${index % 2 === 0 ? 'text-white' : 'text-white/70'}`}>
                          {move}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Captured Pieces */}
              <div className="bg-black/40 rounded-lg p-4 border border-gray-600/50">
                <div className={`${dmSans.className} text-sm text-white/50 mb-2`}>Captured Pieces</div>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className={`${dmSans.className} text-xs text-white/50 mb-1`}>White</div>
                    <div className="overflow-x-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
                      <div className="flex gap-1 min-w-min pb-2">
                        {capturedPieces.white.map((piece, index) => (
                          <div key={index} className="w-8 h-8 bg-white/5 rounded flex-shrink-0 flex items-center justify-center">
                            <Image
                              src={getPieceImage(piece, 'white')}
                              alt={`White ${piece}`}
                              width={24}
                              height={24}
                              className="w-6 h-6 object-contain drop-shadow-md"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className={`${dmSans.className} text-xs text-white/50 mb-1`}>Black</div>
                    <div className="overflow-x-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
                      <div className="flex gap-1 min-w-min pb-2">
                        {capturedPieces.black.map((piece, index) => (
                          <div key={index} className="w-8 h-8 bg-white/5 rounded flex-shrink-0 flex items-center justify-center">
                            <Image
                              src={getPieceImage(piece, 'black')}
                              alt={`Black ${piece}`}
                              width={24}
                              height={24}
                              className="w-6 h-6 object-contain drop-shadow-md"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center - Chess Board & Mobile Info */}
            <div className="flex flex-col items-center w-full lg:w-auto">
              {/* Chess Section */}
              <div className="w-full max-w-[500px]">
                {/* Wallet Addresses */}
                <div className="flex justify-between mb-4">
                  <div className="text-left">
                    <div className={`${dmSans.className} text-sm text-white/50`}>You</div>
                    <div className={`${dmSans.className} text-sm text-white`}>
                      {publicKey ? shortenAddress(publicKey.toString()) : '...'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`${dmSans.className} text-sm text-white/50`}>Opponent</div>
                    <div className={`${dmSans.className} text-sm text-white`}>
                      {shortenAddress(opponentWallet)}
                    </div>
                  </div>
                </div>

                {/* Timers */}
                <div className="flex justify-between mb-4">
                  <div className="text-left">
                    <div className={`${dmSans.className} text-xl font-medium text-white ${isPlayerTurn ? 'text-green-400' : ''}`}>
                      {formatTime(playerTime)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`${dmSans.className} text-xl font-medium text-white ${!isPlayerTurn ? 'text-green-400' : ''}`}>
                      {formatTime(opponentTime)}
                    </div>
                  </div>
                </div>

                {/* Chessboard */}
                <div className="relative aspect-square w-full max-w-[500px]">
                  <div className="absolute inset-0 bg-black/20 shadow-2xl" />
                  <Chessboard
                    id="StyledBoard"
                    boardOrientation="black"
                    position={game.fen()}
                    onPieceDrop={onDrop}
                    customBoardStyle={{
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                      overflow: "hidden"
                    }}
                    customDarkSquareStyle={{
                      backgroundColor: "#779952",
                      transition: "background-color 0.2s ease-in-out"
                    }}
                    customLightSquareStyle={{
                      backgroundColor: "#edeed1",
                      transition: "background-color 0.2s ease-in-out"
                    }}
                    customSquareStyles={{
                      ...(isPlayerTurn && lastMove ? {
                        [lastMove.from as string]: { backgroundColor: "rgba(255, 255, 0, 0.2)" },
                        [lastMove.to as string]: { backgroundColor: "rgba(255, 255, 0, 0.2)" }
                      } : {})
                    }}
                    promotionToSquare={promotionMove?.to}
                    showPromotionDialog={promotionDialogOpen}
                    areArrowsAllowed={true}
                    showBoardNotation={true}
                    boardWidth={Math.min(500, Math.min(window.innerWidth - 32, window.innerHeight - 200))}
                    animationDuration={200}
                    customPieces={{
                      wP: ({ squareWidth }) => (
                        <div style={{ width: squareWidth, height: squareWidth, position: 'relative' }}>
                          <Image
                            src={getPieceImage('p', 'white')}
                            alt="white pawn"
                            fill
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      ),
                      bP: ({ squareWidth }) => (
                        <div style={{ width: squareWidth, height: squareWidth, position: 'relative' }}>
                          <Image
                            src={getPieceImage('p', 'black')}
                            alt="black pawn"
                            fill
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      ),
                      wQ: ({ squareWidth }) => (
                        <div style={{ width: squareWidth, height: squareWidth, position: 'relative' }}>
                          <Image
                            src={getPieceImage('q', 'white')}
                            alt="white queen"
                            fill
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      ),
                      bQ: ({ squareWidth }) => (
                        <div style={{ width: squareWidth, height: squareWidth, position: 'relative' }}>
                          <Image
                            src={getPieceImage('q', 'black')}
                            alt="black queen"
                            fill
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      ),
                      wR: ({ squareWidth }) => (
                        <div style={{ width: squareWidth, height: squareWidth, position: 'relative' }}>
                          <Image
                            src={getPieceImage('r', 'white')}
                            alt="white rook"
                            fill
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      ),
                      bR: ({ squareWidth }) => (
                        <div style={{ width: squareWidth, height: squareWidth, position: 'relative' }}>
                          <Image
                            src={getPieceImage('r', 'black')}
                            alt="black rook"
                            fill
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      ),
                      wB: ({ squareWidth }) => (
                        <div style={{ width: squareWidth, height: squareWidth, position: 'relative' }}>
                          <Image
                            src={getPieceImage('b', 'white')}
                            alt="white bishop"
                            fill
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      ),
                      bB: ({ squareWidth }) => (
                        <div style={{ width: squareWidth, height: squareWidth, position: 'relative' }}>
                          <Image
                            src={getPieceImage('b', 'black')}
                            alt="black bishop"
                            fill
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      ),
                      wN: ({ squareWidth }) => (
                        <div style={{ width: squareWidth, height: squareWidth, position: 'relative' }}>
                          <Image
                            src={getPieceImage('n', 'white')}
                            alt="white knight"
                            fill
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      ),
                      bN: ({ squareWidth }) => (
                        <div style={{ width: squareWidth, height: squareWidth, position: 'relative' }}>
                          <Image
                            src={getPieceImage('n', 'black')}
                            alt="black knight"
                            fill
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      ),
                      wK: ({ squareWidth }) => (
                        <div style={{ width: squareWidth, height: squareWidth, position: 'relative' }}>
                          <Image
                            src={getPieceImage('k', 'white')}
                            alt="white king"
                            fill
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      ),
                      bK: ({ squareWidth }) => (
                        <div style={{ width: squareWidth, height: squareWidth, position: 'relative' }}>
                          <Image
                            src={getPieceImage('k', 'black')}
                            alt="black king"
                            fill
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      )
                    }}
                  />
                </div>

                {/* Resign Button */}
                <div className="flex justify-center mt-4">
                  <button
                    className="px-6 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                    onClick={handleResign}
                  >
                    Resign
                  </button>
                </div>
              </div>

              {/* Mobile Only Game Info */}
              <div className="lg:hidden w-full max-w-[500px] flex flex-col gap-4 mt-4">
                {/* Mobile Moves History */}
                <div className="bg-black/40 rounded-lg p-4 border border-gray-600/50 flex flex-col">
                  <div className={`${dmSans.className} text-sm text-white/50 mb-2`}>Moves History</div>
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
                    <div className="space-y-1 pr-2 max-h-[108px]">
                      {moves.map((move, index) => (
                        <div key={index} className={`${dmSans.className} text-sm flex items-center gap-2 h-[18px]`}>
                          <span className="text-gray-500 min-w-[24px] flex-shrink-0">{Math.floor(index/2) + 1}.</span>
                          <span className={`${index % 2 === 0 ? 'text-white' : 'text-white/70'}`}>
                            {move}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile Captured Pieces */}
                <div className="bg-black/40 rounded-lg p-4 border border-gray-600/50">
                  <div className={`${dmSans.className} text-sm text-white/50 mb-2`}>Captured Pieces</div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className={`${dmSans.className} text-xs text-white/50 mb-1`}>White</div>
                      <div className="overflow-x-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
                        <div className="flex gap-1 min-w-min pb-2">
                          {capturedPieces.white.map((piece, index) => (
                            <div key={index} className="w-8 h-8 bg-white/5 rounded flex-shrink-0 flex items-center justify-center">
                              <Image
                                src={getPieceImage(piece, 'white')}
                                alt={`White ${piece}`}
                                width={24}
                                height={24}
                                className="w-6 h-6 object-contain drop-shadow-md"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className={`${dmSans.className} text-xs text-white/50 mb-1`}>Black</div>
                      <div className="overflow-x-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
                        <div className="flex gap-1 min-w-min pb-2">
                          {capturedPieces.black.map((piece, index) => (
                            <div key={index} className="w-8 h-8 bg-white/5 rounded flex-shrink-0 flex items-center justify-center">
                              <Image
                                src={getPieceImage(piece, 'black')}
                                alt={`Black ${piece}`}
                                width={24}
                                height={24}
                                className="w-6 h-6 object-contain drop-shadow-md"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Chat */}
                <div className="bg-black/40 rounded-lg p-4 border border-gray-600/50">
                  <div className={`${dmSans.className} text-sm text-white/50 mb-2`}>Chat</div>
                  <div className="h-[120px] overflow-y-auto mb-4 custom-scrollbar">
                    <div className="space-y-2">
                      {chatMessages.map((msg, index) => (
                        <div key={index} className="space-y-1">
                          <div className={`${dmSans.className} text-xs text-white/50`}>{msg.sender}</div>
                          <div className={`${dmSans.className} text-sm text-white`}>{msg.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className={`${dmSans.className} w-full bg-black/40 border border-gray-600/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500`}
                      />
                      <button
                        onClick={handleSendMessage}
                        className="absolute right-2 px-4 py-1.5 bg-black/80 rounded text-sm font-medium text-white hover:bg-black/60 transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Chat (Desktop) */}
            <div className="hidden lg:flex lg:w-[250px] self-stretch">
              <div className="bg-black/40 rounded-lg p-4 border border-gray-600/50 w-full flex flex-col">
                <div className={`${dmSans.className} text-sm text-white/50 mb-2`}>Chat</div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className="space-y-1">
                        <div className={`${dmSans.className} text-xs text-white/50`}>{msg.sender}</div>
                        <div className={`${dmSans.className} text-sm text-white`}>{msg.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className={`${dmSans.className} w-full bg-black/40 border border-gray-600/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500`}
                    />
                    <button
                      onClick={handleSendMessage}
                      className="absolute right-2 px-4 py-1.5 bg-black/80 rounded text-sm font-medium text-white hover:bg-black/60 transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`${dmSans.className} relative min-h-screen bg-transparent text-white`}
    >
      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => {
          setShowDepositModal(false);
          setIsDeposited(true);
        }}
        roomAmount={getRoomAmount()}
      />

      {/* Main Content */}
      <div className="flex items-center justify-between h-screen px-2 sm:px-6 md:px-12 lg:px-24 xl:px-32 relative">
        {/* VS Text - Centered */}
        <motion.div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ 
            scale: [0.5, 1.2, 1],
            opacity: 1
          }}
          transition={{
            duration: 0.8,
            times: [0, 0.6, 1],
            ease: "easeOut"
          }}
        >
          <div className={`${lexendDeca.className} text-4xl sm:text-5xl md:text-6xl font-bold text-gray-500`}>
            VS
          </div>
        </motion.div>

        {/* Player Side */}
        <div className="flex-1 flex items-center justify-start max-w-[40%]">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-[200px] sm:max-w-[260px] md:max-w-[320px] lg:max-w-[600px]"
          >
            <div className={`${lexendDeca.className} text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-1.5 md:mb-2`}>
              You
            </div>
            <div className={`${dmSans.className} text-sm sm:text-base md:text-lg font-normal text-white/90 truncate backdrop-blur-sm bg-white/5 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 rounded-lg border border-white/10`}>
              {publicKey ? publicKey.toString() : 'Connecting...'}
            </div>
          </motion.div>
        </div>

        {/* Center Spacing */}
        <div className="w-[100px] sm:w-[120px] md:w-[140px] lg:w-[160px] flex-shrink-0" />

        {/* Opponent Side */}
        <div className="flex-1 flex items-center justify-end max-w-[40%]">
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-[200px] sm:max-w-[260px] md:max-w-[320px] lg:max-w-[600px]"
          >
            <AnimatePresence mode="wait">
              {!foundOpponent ? (
                /* Opponent Loading */
                <motion.div 
                  exit={{ opacity: 0, x: 20 }}
                  key="finding-opponent"
                >
                  <div className={`${lexendDeca.className} text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-1.5 md:mb-2 text-right`}>
                    Opponent
                  </div>
                  <div className="flex items-center justify-end gap-1.5 sm:gap-2 backdrop-blur-sm bg-white/5 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 rounded-lg border border-white/10">
                    <motion.div
                      animate={{ 
                        rotate: 360,
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        rotate: {
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "linear"
                        },
                        scale: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                    >
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400" />
                    </motion.div>
                    <motion.span 
                      className={`${dmSans.className} text-xs sm:text-sm md:text-base text-gray-300`}
                      animate={{
                        opacity: [1, 0.7, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      Finding opponent...
                    </motion.span>
                  </div>
                </motion.div>
              ) : (
                /* Connected Opponent */
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className={`${lexendDeca.className} text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-1.5 md:mb-2 text-right`}>
                    Opponent
                  </div>
                  <div className={`${dmSans.className} text-sm sm:text-base md:text-lg font-normal text-white/90 truncate text-right backdrop-blur-sm bg-white/5 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 rounded-lg border border-white/10`}>
                    {opponentWallet}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {promotionDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-600 shadow-xl">
            <div className={`${dmSans.className} text-white text-lg font-medium mb-4 text-center`}>
              Choose promotion piece
            </div>
            <div className="flex gap-4 p-2">
              {['q', 'r', 'b', 'n'].map((piece) => (
                <button
                  key={piece}
                  onClick={() => handlePromotion(piece)}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-white/5 rounded-lg transform transition-transform group-hover:scale-110" />
                  <div className="relative w-20 h-20 bg-gradient-to-b from-gray-700/50 to-gray-800/50 rounded-lg border border-gray-500 hover:border-white/30 transition-all duration-200 flex items-center justify-center">
                    <Image
                      src={getPieceImage(piece, isPlayerTurn ? 'white' : 'black')}
                      alt={piece.toUpperCase()}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-contain transform transition-transform group-hover:scale-110"
                      style={{
                        filter: 'brightness(1.3) drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))'
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
} 