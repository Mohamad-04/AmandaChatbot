/**
 * Mobile hamburger nav — shared across all public pages.
 * Toggles .is-open on .navlinks and manages the overlay.
 */
(function () {
  const toggle = document.getElementById('nav-toggle');
  const navlinks = document.querySelector('.navlinks');
  const overlay = document.getElementById('nav-overlay');

  if (!toggle || !navlinks) return;

  function open() {
    navlinks.classList.add('is-open');
    overlay && overlay.classList.add('visible');
    toggle.setAttribute('aria-expanded', 'true');
    // swap to X icon
    toggle.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>`;
  }

  function close() {
    navlinks.classList.remove('is-open');
    overlay && overlay.classList.remove('visible');
    toggle.setAttribute('aria-expanded', 'false');
    // swap back to hamburger icon
    toggle.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>`;
  }

  toggle.addEventListener('click', () => {
    navlinks.classList.contains('is-open') ? close() : open();
  });

  // close when a nav link is tapped
  navlinks.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  // close when overlay is tapped
  overlay && overlay.addEventListener('click', close);
})();
