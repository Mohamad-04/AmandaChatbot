/**
 * background-loader.js
 * Preloads the background image so it appears without a flash on page load.
 */
(function () {
  const src = '/images/background.png';
  const img = new Image();
  img.src = src;
})();
