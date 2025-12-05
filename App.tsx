import React, { useState } from 'react';
import InputForm from './components/InputForm';
import VideoPlayer from './components/VideoPlayer';
import { generateFacts } from './services/geminiService';
import { AppState, GeminiResponse } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [aiData, setAiData] = useState<GeminiResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const handleGenerate = async (id: string) => {
    // Reset data state explicitly to prevent stale facts (The "Rickroll" fix)
    setAiData(null); 

    // 1. Mount the player immediately to capture user gesture context
    setVideoId(id);
    setAppState(AppState.GENERATING);
    setErrorMessage(null);
    setShowWarning(false);

    try {
      const response = await generateFacts(id);
      
      const hasFacts = response.facts && response.facts.length > 0;
      
      // Strict Logic: If it's definitely NOT a music video and we have NO facts, stop.
      if (!response.isValidMusicVideo && !hasFacts) {
        setAppState(AppState.ERROR);
        setErrorMessage(response.reason || "This doesn't look like a music video. Please try another!");
        return;
      }

      // Soft Warning Logic:
      // 1. AI is explicitly unsure
      // 2. AI said invalid, but managed to find facts anyway (likely a false negative on validation)
      if (response.isMusicVideoUnsure || (!response.isValidMusicVideo && hasFacts)) {
        setShowWarning(true);
      }

      setAiData(response);
      setAppState(AppState.PLAYING);

    } catch (error) {
      console.error("Generation Error:", error);
      setAppState(AppState.ERROR);
      setErrorMessage("Something went wrong while consulting the music spirits. Please try again.");
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setVideoId(null);
    setAiData(null);
    setErrorMessage(null);
    setShowWarning(false);
  };

  const handleErrorFromPlayer = (msg: string) => {
      setAppState(AppState.ERROR);
      setErrorMessage(msg);
  };

  // Layout Logic:
  // IDLE/ERROR: Centered vertically with padding.
  // GENERATING/PLAYING: Full viewport to allow VideoPlayer to exist and prime.
  const isPlayerMounted = appState === AppState.PLAYING || appState === AppState.GENERATING;
  
  const containerClasses = isPlayerMounted 
    ? "h-[100dvh] w-full bg-gray-900 text-white overflow-hidden flex flex-col"
    : "min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 selection:bg-pink-500 selection:text-white";

  return (
    <div className={containerClasses}>
      
      {/* Background Ambience (Fixed) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[100px]"></div>
      </div>

      {/* Main Content Area */}
      {/* In PlayerMounted mode, this div takes full height. In other modes, it centers content. */}
      <div className={`z-10 w-full ${isPlayerMounted ? 'h-full flex flex-col relative' : 'flex flex-col items-center'}`}>
        
        {appState === AppState.IDLE && (
          <InputForm onGenerate={handleGenerate} isLoading={false} />
        )}

        {/* 
          VideoPlayer Logic: 
          We render this as soon as GENERATING starts so the iframe injects and primes.
          During GENERATING, we overlay the Loading Spinner on top of it.
        */}
        {isPlayerMounted && videoId && (
          <>
            <VideoPlayer 
              videoId={videoId} 
              aiData={aiData} 
              onError={handleErrorFromPlayer}
              onReset={handleReset}
              showWarning={showWarning}
            />

            {/* Loading Overlay - Sits ON TOP of the video player while priming/generating */}
            {appState === AppState.GENERATING && (
               <div className="absolute inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center text-center animate-popIn">
                  <div className="w-16 h-16 border-4 border-t-blue-500 border-r-purple-500 border-b-pink-500 border-l-transparent rounded-full animate-spin mb-6"></div>
                  <h2 className="text-2xl font-whimsical mb-2">Analyzing the beat...</h2>
                  <p className="text-gray-400">Mining the internet for obscure facts.</p>
               </div>
            )}
          </>
        )}

        {appState === AppState.ERROR && (
           <div className="max-w-md p-8 bg-gray-800 rounded-2xl shadow-xl border border-red-500/50 text-center animate-popIn">
             <div className="text-5xl mb-4">🙅‍♂️</div>
             <h2 className="text-2xl font-bold text-white mb-2 font-whimsical">Oops!</h2>
             <p className="text-gray-300 mb-6">{errorMessage}</p>
             <button 
                onClick={handleReset}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-colors"
             >
                Try Again
             </button>
           </div>
        )}
      </div>

      {/* Footer - Hide when player mounted to avoid overlap */}
      {!isPlayerMounted && (
        <footer className="fixed bottom-4 text-xs text-gray-600 z-10 font-mono">
          v1.0 • Powered by Gemini Flash • YouTube IFrame API
        </footer>
      )}

      {/* Beta Badge & Disclaimer - Always Visible */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-1 pointer-events-none select-none">
        <div className="bg-orange-400 text-white px-4 py-1.5 rounded-full font-bold text-xs shadow-lg uppercase tracking-wide">
            BETA
        </div>
        <p className="text-[10px] text-gray-500 opacity-70 text-right font-sans">
            Issues may occur, optimized for Google Chrome
        </p>
      </div>
    </div>
  );
};

export default App;