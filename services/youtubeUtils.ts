
/**
 * Extracts the YouTube Video ID from various URL formats.
 * Supports:
 * - youtube.com/watch?v={ID}
 * - youtu.be/{ID}
 * - youtube.com/embed/{ID}
 * - youtube.com/shorts/{ID}
 */
export const parseVideoID = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

/**
 * Fetches the official video title using the public noembed service.
 * This acts as a client-side "YouTube API" call to get metadata without an API key.
 */
export const fetchVideoTitle = async (videoId: string): Promise<string | null> => {
  try {
    // noembed is a stable, public oEmbed wrapper
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.error || !data.title) return null;
    
    return data.title;
  } catch (error) {
    console.warn("Failed to fetch video title via oEmbed:", error);
    return null;
  }
};

/**
 * Constructs the HTML string for the iframe manually to prevent Origin errors.
 */
export const constructIframeHTML = (videoId: string): string => {
  const origin = window.location.origin;
  // Note: pointer-events: none is strictly requested by TDD for the 'lean-back' experience,
  // preventing user interaction with the video controls.
  // Added playsinline=1 to fix iOS native player hijack issues.
  // Added display: block and border: 0 to fix WebKit layout glitches.
  return `
    <iframe
      id="player"
      type="text/html"
      src="https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${origin}&controls=0&disablekb=1&modestbranding=1&rel=0&playsinline=1"
      frameborder="0"
      style="width: 100%; height: 100%; pointer-events: none; display: block; border: 0;"
      allow="autoplay; encrypted-media"
    ></iframe>
  `;
};
