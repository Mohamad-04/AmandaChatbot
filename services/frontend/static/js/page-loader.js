/**
 * Page transition loader
 * Shows an Amanda-branded overlay for at least 3 seconds on every page load.
 */
(function () {
  const MIN_MS = 3000;
  const startTime = Date.now();

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #amanda-loader {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      background: #C8A9A4;
      transition: opacity 0.4s ease, visibility 0.4s ease;
    }
    #amanda-loader.hidden {
      opacity: 0;
      visibility: hidden;
    }
    .loader {
      display: block;
      width: 84px;
      height: 84px;
      position: relative;
    }
    .loader:before, .loader:after {
      content: "";
      position: absolute;
      left: 50%;
      bottom: 0;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #6b3e38;
      transform: translate(-50%, -100%) scale(0);
      animation: push_401 1.2s infinite linear;
    }
    .loader:after {
      animation-delay: 0.6s;
    }
    @keyframes push_401 {
      0%, 50% { transform: translate(-50%, 0%) scale(1); }
      100%     { transform: translate(-50%, -100%) scale(0); }
    }
  `;
  document.head.appendChild(style);

  // Inject overlay
  const loader = document.createElement('div');
  loader.id = 'amanda-loader';
  loader.innerHTML = `<span class="loader"></span>`;
  document.body.appendChild(loader);

  function hideLoader() {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, MIN_MS - elapsed);
    setTimeout(() => {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 400);
    }, remaining);
  }

  // Hide after page fully loads
  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader);
  }

  // Handle browser back/forward (bfcache restore — load event never fires)
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      const stuck = document.getElementById('amanda-loader');
      if (stuck) stuck.remove();
    }
  });

  // Show loader on every link click (page transition)
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    // Only intercept same-origin, non-hash, non-external links
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
    if (link.target === '_blank') return;

    const overlay = document.createElement('div');
    overlay.id = 'amanda-loader';
    overlay.innerHTML = `<div class="spinner"><div class="spinner1"></div></div>`;
    document.body.appendChild(overlay);
  });
})();
