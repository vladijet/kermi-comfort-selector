import { useEffect } from 'react';

/**
 * Sends the current document height to the parent window via postMessage
 * whenever the DOM changes (MutationObserver) or the window resizes.
 * The parent page should listen for { type: 'resize', height: <px> } and
 * adjust the iframe height accordingly.
 */
export function useIframeAutoResize() {
  useEffect(() => {
    let debounceTimer = null;

    const sendResize = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const height = document.documentElement.scrollHeight || document.body.scrollHeight;
        if (height > 0) {
          window.parent.postMessage({ type: 'resize', height }, '*');
        }
      }, 50);
    };

    // Send on mount (page load)
    sendResize();

    const observer = new MutationObserver(() => sendResize());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    window.addEventListener('resize', sendResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sendResize);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);
}