import { useEffect } from 'react';

/**
 * Sends the current document height to the parent window via postMessage
 * whenever the DOM changes (MutationObserver) or the window resizes.
 * The parent page should listen for { type: 'resize', height: <px> } and
 * adjust the iframe height accordingly.
 */
export function useIframeAutoResize() {
  useEffect(() => {
    let lastHeight = 0;
    let debounceTimer = null;

    const sendHeight = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const height = document.body.scrollHeight;
        if (height && height !== lastHeight) {
          lastHeight = height;
          window.parent.postMessage({ type: 'resize', height }, '*');
        }
      }, 100);
    };

    sendHeight();

    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    window.addEventListener('resize', sendHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sendHeight);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);
}