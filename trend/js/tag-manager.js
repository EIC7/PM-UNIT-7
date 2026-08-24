/**
 * ==========================================================================
 * TAG MANAGER
 * ==========================================================================
 * Registry pusat untuk semua tag (default + hasil ADD TAG manual dari
 * localStorage). Tidak menyimpan nilai historical di sini — itu tugas
 * DataManager. TagManager hanya mengurus METADATA tag.
 * ==========================================================================
 */
(function () {
  'use strict';

  var TAGS_STORAGE_KEY = 'customTags';
  var tags = {}; // id -> tag object

  function loadDefaults() {
    (window.DCS_DEFAULT_TAGS || []).forEach(function (t) {
      tags[t.id] = Object.assign({}, t);
    });
  }

  function loadCustomFromStorage() {
    var custom = window.StorageManager.getJSON(TAGS_STORAGE_KEY, []);
    custom.forEach(function (t) {
      if (t && t.id) tags[t.id] = t;
    });
  }

  function persistCustomTags() {
    // Hanya simpan tag yang source='manual' (bukan default bawaan sistem)
    var custom = Object.keys(tags)
      .map(function (id) { return tags[id]; })
      .filter(function (t) { return t.source === 'manual'; });
    window.StorageManager.setJSON(TAGS_STORAGE_KEY, custom);
  }

  function registerTag(tag) {
    if (!tag || !tag.id) {
      console.error('[TagManager] registerTag gagal: tag.id wajib ada');
      return { ok: false, error: 'TAG_INVALID' };
    }
    if (tags[tag.id]) {
      console.warn('[TagManager] Tag ' + tag.id + ' sudah ada, akan di-overwrite.');
    }
    var merged = Object.assign({
      visible: true, enabled: true, color: '#00ff88', unit: '',
      min: 0, max: 100, engineeringLow: 0, engineeringHigh: 100,
      updateInterval: 1000, source: 'manual', timestamp: null, value: null
    }, tag);
    tags[tag.id] = merged;
    persistCustomTags();
    window.dispatchEvent(new CustomEvent('dcsTagRegistered', { detail: merged }));
    return { ok: true, tag: merged };
  }

  function updateTagMeta(id, patch) {
    if (!tags[id]) return { ok: false, error: 'TAG_NOT_FOUND' };
    Object.assign(tags[id], patch);
    if (tags[id].source === 'manual') persistCustomTags();
    return { ok: true, tag: tags[id] };
  }

  function deleteTag(id) {
    if (!tags[id]) return { ok: false, error: 'TAG_NOT_FOUND' };
    delete tags[id];
    persistCustomTags();
    window.dispatchEvent(new CustomEvent('dcsTagDeleted', { detail: { id: id } }));
    return { ok: true };
  }

  function getTag(id) { return tags[id] || null; }
  function getAllTags() { return Object.keys(tags).map(function (id) { return tags[id]; }); }

  function setVisibility(id, visible) {
    return updateTagMeta(id, { visible: !!visible });
  }

  function init() {
    loadDefaults();
    loadCustomFromStorage();
    console.log('[TagManager] Loaded ' + Object.keys(tags).length + ' tag(s).');
  }

  window.TagManager = {
    init: init,
    registerTag: registerTag,
    updateTagMeta: updateTagMeta,
    deleteTag: deleteTag,
    getTag: getTag,
    getAllTags: getAllTags,
    setVisibility: setVisibility
  };
})();
