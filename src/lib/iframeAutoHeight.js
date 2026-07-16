let cleanup = null;

export function initIframeAutoHeight() {
  if (cleanup) return cleanup;

  let lastHeight = 0;
  let timer = null;

  const sendHeight = () => {
    timer = null;
    const height = document.body.scrollHeight || document.documentElement.scrollHeight;
    if (height === lastHeight) return;
    lastHeight = height;
    window.parent.postMessage({ type: 'setIframeHeight', height }, '*');
  };

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(sendHeight, 150);
  };

  window.addEventListener('resize', schedule);

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  schedule();

  cleanup = () => {
    window.removeEventListener('resize', schedule);
    observer.disconnect();
    if (timer) clearTimeout(timer);
    cleanup = null;
  };

  return cleanup;
}