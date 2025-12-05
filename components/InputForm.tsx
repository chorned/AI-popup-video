import React, { useState, useEffect } from 'react';
import { parseVideoID } from '../services/youtubeUtils';

interface InputFormProps {
  onGenerate: (videoId: string) => void;
  isLoading: boolean;
}

const EXAMPLES = [
  { label: "Outkast - B.O.B", url: "https://youtu.be/lVehcuJXe6I?list=RDlVehcuJXe6I" },
  { label: "Jamiroquai - Virtual Insanity", url: "https://youtu.be/4JkIs37a2JE?list=RD4JkIs37a2JE" },
  { label: "Blink-182 - First Date", url: "https://youtu.be/vVy9Lgpg1m8?list=RDvVy9Lgpg1m8" },
  { label: "Talking Heads - Once in a Lifetime", url: "https://youtu.be/5IsSpAOD6K8?list=RD5IsSpAOD6K8" },
  { label: "Gazebo - I Like Chopin", url: "https://youtu.be/S485kTzaV-c?list=RDS485kTzaV-c" },
  { label: "Peter Gabriel - Sledgehammer", url: "https://youtu.be/OJWJE0x7T4Q?list=RDOJWJE0x7T4Q" },
  { label: "Gorillaz - Dirty Harry", url: "https://youtu.be/cLnkQAeMbIM?list=RDcLnkQAeMbIM" },
  { label: "Fatboy Slim - Right Here, Right Now", url: "https://youtu.be/ub747pprmJ8?list=RDub747pprmJ8" },
  { label: "Chemical Brothers - Hey Boy Hey Girl", url: "https://youtu.be/tpKCqp9CALQ?list=RDtpKCqp9CALQ" },
  { label: "CAKE - The Distance", url: "https://youtu.be/F_HoMkkRHv8?list=RDF_HoMkkRHv8" },
  { label: "Billie Eilish - You Should See Me In a Crown", url: "https://youtu.be/coLerbRvgsQ?list=RDcoLerbRvgsQ" }
];

const InputForm: React.FC<InputFormProps> = ({ onGenerate, isLoading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  
  // Rotating Examples State
  const [exampleIndex, setExampleIndex] = useState(0);
  const [isExampleVisible, setIsExampleVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setIsExampleVisible(false);
      
      // Change text after fade out completes
      setTimeout(() => {
        setExampleIndex((prev) => (prev + 1) % EXAMPLES.length);
        setIsExampleVisible(true); // Fade back in
      }, 500); // Half second fade out
      
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerGeneration(url);
  };

  const triggerGeneration = (inputUrl: string) => {
    setError('');

    if (!inputUrl.trim()) {
      setError('Please enter a URL.');
      return;
    }

    const videoId = parseVideoID(inputUrl);
    if (!videoId) {
      setError('Invalid YouTube URL. Please try again.');
      return;
    }

    onGenerate(videoId);
  };

  const handleExampleClick = (exampleUrl: string) => {
      setUrl(exampleUrl);
      triggerGeneration(exampleUrl);
  };
  
  const currentExample = EXAMPLES[exampleIndex];

  return (
    <div className="w-full max-w-2xl px-4 py-8 flex flex-col items-center animate-popIn">
      <h1 className="text-4xl md:text-6xl font-whimsical text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-2 drop-shadow-sm">
        AI Pop-Up Video
      </h1>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        Paste a YouTube Music Video URL below and let our AI trivia expert sprinkle it with nostalgic fun facts!
      </p>

      <form onSubmit={handleSubmit} className="w-full flex flex-col md:flex-row gap-4 relative">
        <div className="relative flex-grow">
            <input
            type="text"
            value={url}
            onChange={(e) => {
                setUrl(e.target.value);
                setError('');
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            className={`w-full px-6 py-4 rounded-full bg-gray-800 text-white placeholder-gray-500 border-2 focus:outline-none focus:ring-4 transition-all ${
                error 
                ? 'border-red-500 focus:ring-red-900/50' 
                : 'border-gray-700 focus:border-blue-500 focus:ring-blue-900/50'
            }`}
            disabled={isLoading}
            />
             {/* Decorative Icon */}
             <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`
            px-8 py-4 rounded-full font-bold text-lg shadow-lg transform transition-all
            ${isLoading 
                ? 'bg-gray-600 cursor-wait opacity-80' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-105 active:scale-95 text-white'
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
               Generating...
            </span>
          ) : (
            'Generate!'
          )}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-500 text-red-200 rounded-lg flex items-center gap-2 animate-popIn">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
        </div>
      )}
      
      {/* Rotating Examples Hint */}
      {!isLoading && !error && (
        <div className="mt-10 flex flex-col items-center gap-3 text-sm text-gray-400 h-16">
            <span className="uppercase tracking-widest text-xs font-bold text-gray-600">Give it a spin:</span>
            <button 
                onClick={() => handleExampleClick(currentExample.url)}
                className={`
                    text-xl md:text-2xl font-whimsical text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400
                    hover:from-blue-300 hover:to-purple-300 transition-all duration-500 transform
                    ${isExampleVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
                `}
            >
                {currentExample.label} ♫
            </button>
        </div>
      )}

      {/* Social / Portfolio Links */}
      {!isLoading && (
        <div className="mt-16 pt-8 border-t border-gray-800 w-full flex flex-col items-center gap-6 animate-popIn">
          
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
             <a href="https://horned.se" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-gray-500 hover:text-blue-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="font-medium text-sm">Portfolio</span>
             </a>
             
             <a href="https://github.com/chorned" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="font-medium text-sm">Github</span>
             </a>

             <a href="https://www.linkedin.com/in/carlhorned/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span className="font-medium text-sm">LinkedIn</span>
             </a>
          </div>

          <a href="https://ko-fi.com/chorned" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-gray-600 hover:text-pink-400 transition-colors text-xs md:text-sm mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:animate-pulse text-pink-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span>Hosting these projects isn't free, a donation is appreciated</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default InputForm;