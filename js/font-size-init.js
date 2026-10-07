// Run in the head so the saved size is applied before the body renders.
(function () {
  'use strict';
  try {
    const size = Number(window.sessionStorage.getItem('indbase.currentFontSize'));
    if (Number.isInteger(size) && size >= 80 && size <= 150) {
      document.documentElement.style.setProperty('--indbase-body-font-size', size + '%');
    }
  } catch {
    // Use the stylesheet default when storage is unavailable.
  }
})();
