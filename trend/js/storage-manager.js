/**
 * ==========================================================================
 * STORAGE MANAGER — wrapper aman untuk localStorage
 * ==========================================================================
 * Semua akses localStorage di seluruh sistem WAJIB lewat modul ini supaya
 * ada fallback kalau localStorage penuh/diblokir browser (mode privasi dll).
 * Dipakai untuk menyimpan: tag custom hasil ADD TAG manual, preferensi
 * visibility tag, dan cache ringan (bukan data historical besar).
 * ==========================================================================
 */
(function () {
  'use strict';

  var PREFIX = (window.DCS_CONFIG && window.DCS_CONFIG.LOCAL_STORAGE_PREFIX) || 'dcsTrend_';

  function key(k) { return PREFIX + k; }

  function isAvailable() {
    try {
      var t = '__dcs_test__';
      window.localStorage.setItem(t, '1');
      window.localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  }

  var AVAILABLE = isAvailable();
  if (!AVAILABLE) {
    console.warn('[StorageManager] localStorage tidak tersedia — fallback ke memory-only (data hilang saat refresh).');
  }
  var memoryFallback = {};

  function getItem(k) {
    try {
      if (!AVAILABLE) return memoryFallback[key(k)] || null;
      return window.localStorage.getItem(key(k));
    } catch (e) {
      console.error('[StorageManager] getItem error:', e);
      return null;
    }
  }

  function setItem(k, value) {
    try {
      if (!AVAILABLE) { memoryFallback[key(k)] = value; return true; }
      window.localStorage.setItem(key(k), value);
      return true;
    } catch (e) {
      console.error('[StorageManager] setItem error (mungkin storage penuh):', e);
      return false;
    }
  }

  function removeItem(k) {
    try {
      if (!AVAILABLE) { delete memoryFallback[key(k)]; return true; }
      window.localStorage.removeItem(key(k));
      return true;
    } catch (e) {
      console.error('[StorageManager] removeItem error:', e);
      return false;
    }
  }

  function getJSON(k, fallback) {
    var raw = getItem(k);
    if (raw === null || raw === undefined) return fallback;
    try { return JSON.parse(raw); }
    catch (e) { console.error('[StorageManager] JSON parse error for key ' + k, e); return fallback; }
  }

  function setJSON(k, obj) {
    try { return setItem(k, JSON.stringify(obj)); }
    catch (e) { console.error('[StorageManager] JSON stringify error for key ' + k, e); return false; }
  }

  window.StorageManager = {
    isAvailable: function () { return AVAILABLE; },
    getItem: getItem,
    setItem: setItem,
    removeItem: removeItem,
    getJSON: getJSON,
    setJSON: setJSON
  };
})();
