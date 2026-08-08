/**
 * Supabase Admin Client
 * Requires: migrations/0002_admin_dashboard.sql applied
 *           (status column + authenticated select/update policies).
 */

window.RixleAdmin = window.RixleAdmin || {};

(function () {
  'use strict';

  const SUPABASE_URL = 'https://lumvxwwbfoucfckycdal.supabase.co/rest/v1/';
  const SUPABASE_ANON_KEY = 'sb_publishable_Lbfszemvg7eE8ieBfwzlJA_CKjHI_9k';

  const PAGE_SIZE = 10;
  const STATUSES = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];

  function initClient() {
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
      console.error('Supabase SDK failed to load.');
      return null;
    }
    try {
      return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storageKey: 'rixle-admin-auth'
        }
      });
    } catch (err) {
      console.error('Supabase admin client initialization failed:', err);
      return null;
    }
  }

  const client = initClient();

  window.RixleAdmin.supabase = client;
  window.RixleAdmin.PAGE_SIZE = PAGE_SIZE;
  window.RixleAdmin.STATUSES = STATUSES;

  // admin-auth.js and admin-dashboard.js read window.supabaseAdminClient
  // directly (see getClient() in each file) — expose the same client
  // instance under that name so both entry points share one client.
  window.supabaseAdminClient = client;

  window.RixleAdmin.escapeHtml = function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  window.RixleAdmin.showToast = function showToast(message, type) {
    const toastEl = document.getElementById('adminToast');
    const bodyEl = document.getElementById('adminToastBody');
    if (!toastEl || !bodyEl) return;

    bodyEl.textContent = message;
    toastEl.classList.remove('text-bg-dark', 'text-bg-success', 'text-bg-danger');
    toastEl.classList.add(type === 'success' ? 'text-bg-success' : type === 'error' ? 'text-bg-danger' : 'text-bg-dark');

    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
      const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 4000 });
      toast.show();
    }
  };

  window.RixleAdmin.formatDate = function formatDate(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
})();
