import React, { useEffect, useRef, useState } from 'react';
import { constructIframeHTML } from '../services/youtubeUtils';
import FactBubble from './FactBubble';
import { GeminiResponse, FactItem } from '../types';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface VideoPlayerProps {
  videoId: string;
  aiData: GeminiResponse | null;
  onError: (msg: string) => void;
  onReset: () => void;
  showWarning?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, aiData, onError, onReset, showWarning }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  
  // Overlay Logic State
  const [isFactVisible, setIsFactVisible] = useState(false);
  const [displayedFact, setDisplayedFact] = useState<FactItem | null>(null);
  
  // History State for Portrait Mode List
  const [factHistory, setFactHistory] = useState<FactItem[]>([]);
  const listEndRef = useRef<HTMLDivElement>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const factCycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        // API is ready, but we wait for videoId to init player
      };
    }
  }, []);

  // 2. Manual Iframe Construction & Player Initialization
  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    // Reset state on new video
    setIsPlayerReady(false);
    setIsFactVisible(false);
    setDisplayedFact(null);
    setFactHistory([]); // Reset history
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (factCycleRef.current) clearTimeout(factCycleRef.current);

    // Step 2 from TDD: Clear container and inject HTML string manually
    const iframeHTML = constructIframeHTML(videoId);
    containerRef.current.innerHTML = iframeHTML;

    // Step 3: Initialize YT.Player
    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player('player', {
          events: {
            'onReady': () => {
              // PRIME THE PLAYER:
              // Immediately mute and play to register a User Gesture token.
              // This ensures that when we later call unMute() + playVideo(), it works
              // even if the Gemini request took 10+ seconds.
              if (playerRef.current) {
                  playerRef.current.mute();
                  playerRef.current.playVideo();
                  
                  // Pause after a short burst to keep the session alive but not play the whole song silently
                  setTimeout(() => {
                      if (playerRef.current) {
                          playerRef.current.pauseVideo();
                          setIsPlayerReady(true);
                      }
                  }, 500);
              }
            },
            'onStateChange': (event: any) => {
               // 0 = ended
               if (event.data === 0) {
                 stopLoop();
                 // Reset to start screen after video ends (with small delay)
                 setTimeout(() => {
                    onReset();
                 }, 2000);
               }
            },
            'onError': (event: any) => {
                // TDD Error Handling: 101 or 150
                if (event.data === 101 || event.data === 150) {
                    onError("The owner of this video has disabled playback on external sites.");
                } else {
                    console.warn("YouTube Player Error:", event.data);
                }
            }
          }
        });
      } else {
        // Retry if API not ready yet (rare race condition handled by checking window.YT)
        setTimeout(initPlayer, 100);
      }
    };

    initPlayer();

    return () => {
      // Cleanup
      if (playerRef.current) {
        try {
            playerRef.current.destroy();
        } catch(e) { /* ignore */ }
      }
      stopLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // 3. Playback & Overlay Loop - Triggers only when AI Data arrives AND Player is Primed
  useEffect(() => {
    // Stop any previous loop if aiData is null (Fix for Stale Data bug)
    if (!aiData) {
        stopLoop();
        return;
    }

    // Only start if player is ready and we have valid AI data
    if (isPlayerReady && aiData.facts) {
      try {
          // Resume playback unmuted now that facts are ready
          playerRef.current.unMute();
          playerRef.current.playVideo();
          startLoop(aiData.facts);
      } catch (e) {
          console.error("Autoplay failed", e);
      }
    }
    
    // Cleanup ensures loop stops if we unmount or if aiData changes to null
    return () => {
        stopLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayerReady, aiData]);

  // Auto-scroll logic for portrait list
  useEffect(() => {
    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [factHistory]);

  const startLoop = (facts: FactItem[]) => {
    // Clear any existing loop
    stopLoop();

    let index = 0;
    
    const showFact = (factIndex: number) => {
        if (factIndex >= facts.length) {
            stopLoop();
            return;
        }

        const currentFact = facts[factIndex];

        // Update State
        setDisplayedFact(currentFact);
        setFactHistory(prev => {
            // Check if last item is same to avoid dupe in dev mode double-fire
            if (prev.length > 0 && prev[prev.length - 1].text === currentFact.text) return prev;
            return [...prev, currentFact];
        });
        
        setIsFactVisible(true);

        // Hide for overlay mode only (after 7s)
        factCycleRef.current = setTimeout(() => {
            setIsFactVisible(false);
        }, 7000);
    };
    
    // TDD Logic: setInterval runs every 10,000ms
    timerRef.current = setInterval(() => {
        index++;
        showFact(index);
    }, 10000);
    
    // Trigger first fact immediately (with slight delay for UX)
    setTimeout(() => {
        showFact(index);
    }, 1000); // Start 1s after play
  };

  const stopLoop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (factCycleRef.current) clearTimeout(factCycleRef.current);
  };

  return (
    // Root: Full height flex column.
    // Portrait: Standard flex col (Sticky Top Video -> Scrollable Middle -> Sticky Bottom CTA).
    // Landscape: Centered standard layout.
    <div className="relative w-full h-full flex flex-col landscape:items-center landscape:justify-center">
        
        {/* VIDEO CONTAINER (Sticky Header in Portrait) */}
        {/* Portrait: Full width, shrink-0 to prevent squash. */}
        {/* Landscape: 80vw, centered. Max-height 80vh prevents cutoff on short wide screens. */}
        <div className="relative w-full md:w-[80vw] md:max-h-[80vh] bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] z-20 overflow-hidden border-b border-gray-800 md:border md:rounded-lg shrink-0">
            {/* The Manual Injection Container */}
            {/* STRICT CSS APPLIED HERE FOR SAFARI/iOS */}
            <div 
              id="player-container" 
              ref={containerRef} 
              className="w-full h-full"
              style={{
                aspectRatio: '16 / 9',
                display: 'block',
                width: '100%',
                height: '100%',
                background: '#000'
              }}
            />
            
            {/* Overlay Layer for Facts (Landscape Only) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none portrait:hidden landscape:block">
                 <div className="pointer-events-auto w-full h-full">
                    <FactBubble fact={displayedFact} isVisible={isFactVisible} />
                 </div>
            </div>

            {/* Loading State - Only show if AI Data isn't ready yet (Priming phase is hidden by parent overlay) */}
            {!isPlayerReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-500 z-0 pointer-events-none">
                    <p className="font-whimsical animate-pulse">Initializing Player...</p>
                </div>
            )}

            {/* Warning Banner */}
            {showWarning && (
              <div className="absolute bottom-12 md:bottom-20 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 md:px-6 rounded-full font-bold shadow-lg z-[50] flex items-center gap-2 text-xs md:text-sm whitespace-nowrap animate-popIn border-2 border-yellow-300 opacity-90 hover:opacity-100 transition-opacity pointer-events-auto">
                 <span className="text-lg">⚠️</span>
                 <span className="truncate max-w-[200px] md:max-w-none">Gemini isn't sure if this is a music video.</span>
              </div>
            )}
        </div>

        {/* SCROLLABLE LIST (Portrait Mode Only) */}
        {/* Flex-1 ensures it takes all available space between Video and Footer */}
        <div className="portrait:flex landscape:hidden w-full flex-col gap-4 px-4 py-6 overflow-y-auto flex-1 bg-gray-900 scrollbar-thin scrollbar-thumb-gray-700 shadow-inner">
            {factHistory.length === 0 && (
                <div className="text-center text-gray-600 italic mt-10">
                    Waiting for first fact...
                </div>
            )}
            {factHistory.map((fact, i) => (
                <div key={i} className="flex flex-col gap-1 animate-popIn">
                    <div className="bg-white text-blue-900 p-4 rounded-2xl rounded-tl-none shadow-lg border-2 border-blue-400 self-start w-full relative">
                        <div className="text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">Pop-Up Info</div>
                        <p className="font-whimsical leading-snug text-base">{fact.text}</p>
                        
                        {/* Source Link */}
                        {fact.sourceUrl && (
                            <div className="mt-2 pt-2 border-t border-blue-100 flex justify-end">
                                <a 
                                    href={fact.sourceUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1"
                                >
                                    Source
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            <div ref={listEndRef} className="h-2" />
        </div>

        {/* STICKY CTA FOOTER (Portrait Mode Only) */}
        {/* Landscape: Standard button positioning */}
        <div className="shrink-0 portrait:w-full portrait:p-4 portrait:bg-gray-800 portrait:border-t portrait:border-gray-700 portrait:z-30 landscape:mt-6 landscape:mb-0">
             <button 
                onClick={onReset}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-full font-bold transition-all shadow-lg text-sm md:text-base uppercase tracking-wide border border-gray-500"
             >
                Create Another
             </button>
        </div>
    </div>
  );
};

export default VideoPlayer;