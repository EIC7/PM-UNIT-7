/**
 * ==========================================================================
 * APP BOOTSTRAP
 * ==========================================================================
 */
(function () {
  'use strict';

  function boot() {
    try {
      window.TagManager.init();
      window.CommunicationManager.init();
      window.ChartManager.init(document.getElementById('trendChart'));
      window.UIManager.init();
      window.LiveTrendEngine.start(); // no-op selama LIVE_TREND_ENABLED=false

      // Muat data historical pertama kali secara otomatis (default range)
      window.UIManager.triggerLoad();

      console.log('[App] DCS Trend Monitoring System siap. Mode: HISTORICAL (SO2).');
    } catch (err) {
      console.error('[App] Fatal error saat inisialisasi:', err);
      var el = document.getElementById('trendChart');
      if (el) el.innerHTML = '<div style="color:#ff5e7a;padding:24px;font-family:monospace">SYSTEM ERROR: ' + err.message + '</div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
