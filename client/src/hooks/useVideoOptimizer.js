import { useState, useCallback, useRef } from 'react';

/**
 * Hook for optimizing video loading and playback
 */
const useVideoOptimizer = () => {
  const [preloadedVideos, setPreloadedVideos] = useState(new Set());
  const preloadQueueRef = useRef([]);
  const isProcessingRef = useRef(false);

  /**
   * Adds a video URL to the preload queue and creates a preload link in the document head
   */
  const preloadVideo = useCallback((videoUrl) => {
    if (!videoUrl || preloadedVideos.has(videoUrl)) return;

    // Add to our tracked set
    setPreloadedVideos(prev => new Set([...prev, videoUrl]));
    
    // Add to preload queue
    preloadQueueRef.current.push(videoUrl);
    
    // Start processing the queue if not already processing
    if (!isProcessingRef.current) {
      processPreloadQueue();
    }
  }, [preloadedVideos]);

  /**
   * Processes the preload queue by adding link elements to the document head
   */
  const processPreloadQueue = useCallback(() => {
    if (preloadQueueRef.current.length === 0) {
      isProcessingRef.current = false;
      return;
    }

    isProcessingRef.current = true;
    const videoUrl = preloadQueueRef.current.shift();
    
    // Create preload link
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = videoUrl;
    link.as = 'video';
    link.type = 'video/mp4'; // Adjust if you have different video types
    
    // Add event listeners to track loading
    link.onload = () => {
      console.log(`Preloaded video: ${videoUrl}`);
      // Process next in queue
      setTimeout(processPreloadQueue, 100);
    };
    
    link.onerror = (err) => {
      console.error(`Failed to preload video: ${videoUrl}`, err);
      // Continue with next in queue even on error
      setTimeout(processPreloadQueue, 100);
    };
    
    // Add to document
    document.head.appendChild(link);
  }, []);

  /**
   * Preloads initial videos from a list of posts
   */
  const preloadInitialVideos = useCallback((posts, limit = 3) => {
    if (!posts || !posts.length) return;
    
    const videosToPreload = posts
      .filter(post => post.videoLink)
      .slice(0, limit)
      .map(post => post.videoLink);
    
    videosToPreload.forEach(videoUrl => {
      preloadVideo(videoUrl);
    });
  }, [preloadVideo]);

  return {
    preloadVideo,
    preloadInitialVideos,
    preloadedVideos: [...preloadedVideos]
  };
};

export default useVideoOptimizer; 