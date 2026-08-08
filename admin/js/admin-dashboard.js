/**
 * Rixle Ops Console — Dashboard
 *
 * Drives every control already present in admin/index.html: panel
 * navigation, metric cards, category breakdown, the leads table
 * (search / filter / sort / paginate), the lead details modal,
 * status updates, and CSV export.
 *
 * All reads/writes go through window.supabaseAdminClient using the
 * anon key + the authenticated session set up by admin-auth.js.
 * Row Level Security on contact_submissions is the security
 * boundary — this file assumes RLS denies anything an authenticated
 * admin shouldn't be able to do.
 */

(function () {
  'use strict';

  const TABLE = 'contact_submissions';
  const PAGE_SIZE = 15;
  const STATUS_VALUES = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];
  const OPEN_STATUSES = ['New', 'Contacted', 'Qualified'];

  // value = subject column value stored in the DB (see index.html
  // contact form). label = short text shown in the admin console,
  // matching the categoryFilter <select> already in admin/index.html.
  const CATEGORY_OPTIONS = [
    { value: 'Industrial Waste Collection', label: 'Commercial Waste Pickup' },
    { value: 'Material Purchase', label: 'Polymer Procurement' },
    { value: 'AIRWSS Systems', label: 'AIRWSS Integration' },
    { value: 'EPR Consulting', label: 'EPR Advisory' },
    { value: 'General Inquiry', label: 'General Inquiry' }
  ];

  const state = {
    search: '',
    status: '',
    category: '',
    dateRange: '',
    sortColumn: 'created_at',
    sortDir: 'desc',
    page: 1,
    totalCount: 0,
    leads: [],
    selectedLeadId: null,
    initialized: false
  };

  let els = {};
  let searchDebounceTimer = null;
  let leadDetailsModalInstance = null;
  let adminToastInstance = null;

  function cacheEls() {
    els = {
      lastUpdatedLabel: document.getElementById('lastUpdatedLabel'),
      metricTotalLeads: document.getElementById('metricTotalLeads'),
      metricTotalLeadsDelta: document.getElementById('metricTotalLeadsDelta'),
      metricNewThisWeek: document.getElementById('metricNewThisWeek'),
      metricNewThisWeekDelta: document.getElementById('metricNewThisWeekDelta'),
      metricOpenLeads: document.getElementById('metricOpenLeads'),
      metricOpenLeadsDelta: document.getElementById('metricOpenLeadsDelta'),
      metricWonRate: document.getElementById('metricWonRate'),
      metricWonRateDelta: document.getElementById('metricWonRateDelta'),
      categoryBreakdown: document.getElementById('categoryBreakdown'),

      sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
      sidebar: document.getElementById('sidebar'),
      sidebarBackdrop: document.getElementById('sidebarBackdrop'),
      sidebarLinks: Array.prototype.slice.call(document.querySelectorAll('.sidebar-link')),

      exportCsvBtn: document.getElementById('exportCsvBtn'),
      leadSearchInput: document.getElementById('leadSearchInput'),
      statusFilter: document.getElementById('statusFilter'),
      categoryFilter: document.getElementById('categoryFilter'),
      dateFilter: document.getElementById('dateFilter'),
      clearFiltersBtn: document.getElementById('clearFiltersBtn'),

      leadsTableBody: document.getElementById('leadsTableBody'),
      sortableHeaders: Array.prototype.slice.call(document.querySelectorAll('th.sortable')),
      paginationSummary: document.getElementById('paginationSummary'),
      paginationControls: document.getElementById('paginationControls'),

      leadDetailsModalEl: document.getElementById('leadDetailsModal'),
      leadDetailsBody: document.getElementById('leadDetailsBody'),
      statusUpdateSelect: document.getElementById('statusUpdateSelect'),
      saveStatusBtn: document.getElementById('saveStatusBtn'),
      saveStatusSpinner: document.getElementById('saveStatusSpinner'),

      adminToastEl: document.getElementById('adminToast'),
      adminToastBody: document.getElementById('adminToastBody')
    };
  }

  function getClient() {
    return window.supabaseAdminClient;
  }

  /* ----------------------------------------------------------
     Helpers
     ---------------------------------------------------------- */

  function categoryLabelFor(value) {
    const match = CATEGORY_OPTIONS.find((c) => c.value === value);
    return match ? match.label : (value || 'Uncategorized');
  }

  function statusBadgeClass(status) {
    const key = (status || 'New').toLowerCase();
    return 'status-badge status-' + key;
  }

  function formatDateTime(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function escapeCsvField(value) {
    const str = value === null || value === undefined ? '' : String(value);
    if (/[",\n\r]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function sanitizeSearchTerm(term) {
    // Strip characters that have special meaning in PostgREST's
    // .or()/.ilike() filter syntax so a search string can't break
    // out of the intended filter or reach into other columns.
    return term.replace(/[,()%*]/g, ' ').trim();
  }

  function daysAgoIso(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  }

  function startOfTodayIso() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  function showToast(message, variant) {
    if (!els.adminToastEl || !els.adminToastBody) return;
    els.adminToastBody.textContent = message;
    els.adminToastEl.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-dark');
    els.adminToastEl.classList.add(variant === 'error' ? 'text-bg-danger' : (variant === 'success' ? 'text-bg-success' : 'text-bg-dark'));

    if (window.bootstrap && window.bootstrap.Toast) {
      if (!adminToastInstance) {
        adminToastInstance = new window.bootstrap.Toast(els.adminToastEl, { delay: 4000 });
      }
      adminToastInstance.show();
    }
  }

  /* ----------------------------------------------------------
     Panel navigation (sidebar)
     ---------------------------------------------------------- */

  function switchPanel(panelId) {
    document.querySelectorAll('.dashboard-panel').forEach((panel) => {
      panel.classList.toggle('d-none', panel.id !== panelId);
    });
    els.sidebarLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('data-panel') === panelId);
    });
    closeMobileSidebar();
  }

  function openMobileSidebar() {
    if (!els.sidebar || !els.sidebarBackdrop || !els.sidebarToggleBtn) return;
    els.sidebar.classList.add('open');
    els.sidebarBackdrop.classList.add('show');
    els.sidebarToggleBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMobileSidebar() {
    if (!els.sidebar || !els.sidebarBackdrop || !els.sidebarToggleBtn) return;
    els.sidebar.classList.remove('open');
    els.sidebarBackdrop.classList.remove('show');
    els.sidebarToggleBtn.setAttribute('aria-expanded', 'false');
  }

  /* ----------------------------------------------------------
     Metrics
     ---------------------------------------------------------- */

  async function loadMetrics() {
    const client = getClient();
    if (!client) return;

    try {
      const [
        totalRes,
        newWeekRes,
        prevWeekRes,
        openRes,
        wonRes
      ] = await Promise.all([
        client.from(TABLE).select('id', { count: 'exact', head: true }),
        client.from(TABLE).select('id', { count: 'exact', head: true }).gte('created_at', daysAgoIso(7)),
        client.from(TABLE).select('id', { count: 'exact', head: true }).gte('created_at', daysAgoIso(14)).lt('created_at', daysAgoIso(7)),
        client.from(TABLE).select('id', { count: 'exact', head: true }).in('status', OPEN_STATUSES),
        client.from(TABLE).select('id', { count: 'exact', head: true }).eq('status', 'Won')
      ]);

      const total = totalRes.count || 0;
      const newThisWeek = newWeekRes.count || 0;
      const prevWeek = prevWeekRes.count || 0;
      const openCount = openRes.count || 0;
      const wonCount = wonRes.count || 0;
      const wonRate = total > 0 ? ((wonCount / total) * 100).toFixed(1) + '%' : '—';

      if (els.metricTotalLeads) els.metricTotalLeads.textContent = String(total);
      if (els.metricTotalLeadsDelta) els.metricTotalLeadsDelta.textContent = 'All time';

      if (els.metricNewThisWeek) els.metricNewThisWeek.textContent = String(newThisWeek);
      if (els.metricNewThisWeekDelta) {
        const diff = newThisWeek - prevWeek;
        const sign = diff > 0 ? '+' : '';
        els.metricNewThisWeekDelta.textContent = diff === 0
          ? 'Same as prior 7d'
          : sign + diff + ' vs prior 7d';
        els.metricNewThisWeekDelta.classList.toggle('text-success', diff > 0);
        els.metricNewThisWeekDelta.classList.toggle('text-danger', diff < 0);
      }

      if (els.metricOpenLeads) els.metricOpenLeads.textContent = String(openCount);
      if (els.metricOpenLeadsDelta) els.metricOpenLeadsDelta.textContent = 'Needs follow-up';

      if (els.metricWonRate) els.metricWonRate.textContent = wonRate;
      if (els.metricWonRateDelta) {
        els.metricWonRateDelta.textContent = total > 0 ? wonCount + ' won of ' + total : 'No leads yet';
      }

      await loadCategoryBreakdown(total);

      if (els.lastUpdatedLabel) {
        els.lastUpdatedLabel.textContent = 'Last updated ' + new Date().toLocaleTimeString();
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
      showToast('Could not load dashboard metrics.', 'error');
    }
  }

  async function loadCategoryBreakdown(totalCount) {
    const client = getClient();
    if (!client || !els.categoryBreakdown) return;

    try {
      const results = await Promise.all(
        CATEGORY_OPTIONS.map((cat) =>
          client.from(TABLE).select('id', { count: 'exact', head: true }).eq('subject', cat.value)
        )
      );

      const counts = results.map((r) => r.count || 0);
      const maxCount = Math.max.apply(null, counts.concat([1]));

      els.categoryBreakdown.innerHTML = '';
      CATEGORY_OPTIONS.forEach((cat, idx) => {
        const count = counts[idx];
        const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

        const row = document.createElement('div');
        row.className = 'category-breakdown-row';

        const label = document.createElement('div');
        label.className = 'category-breakdown-label';
        label.textContent = cat.label;

        const track = document.createElement('div');
        track.className = 'category-breakdown-bar-track';
        const fill = document.createElement('div');
        fill.className = 'category-breakdown-bar-fill';
        fill.style.width = pct + '%';
        track.appendChild(fill);

        const countEl = document.createElement('div');
        countEl.className = 'category-breakdown-count';
        countEl.textContent = String(count);

        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(countEl);
        els.categoryBreakdown.appendChild(row);
      });

      if (totalCount === 0) {
        const empty = document.createElement('div');
        empty.className = 'text-secondary fs-8';
        empty.textContent = 'No leads yet.';
        els.categoryBreakdown.appendChild(empty);
      }
    } catch (err) {
      console.error('Failed to load category breakdown:', err);
      els.categoryBreakdown.innerHTML = '<div class="text-secondary fs-8">Could not load breakdown.</div>';
    }
  }

  /* ----------------------------------------------------------
     Leads table — query building
     ---------------------------------------------------------- */

  function buildLeadsQuery(client, { forExport } = {}) {
    let query = client.from(TABLE).select('*', { count: 'exact' });

    const term = sanitizeSearchTerm(state.search || '');
    if (term) {
      const pattern = '%' + term + '%';
      query = query.or(
        'full_name.ilike.' + pattern +
        ',email.ilike.' + pattern +
        ',company.ilike.' + pattern
      );
    }

    if (state.status) query = query.eq('status', state.status);
    if (state.category) query = query.eq('subject', state.category);

    if (state.dateRange === 'today') {
      query = query.gte('created_at', startOfTodayIso());
    } else if (state.dateRange === '7d') {
      query = query.gte('created_at', daysAgoIso(7));
    } else if (state.dateRange === '30d') {
      query = query.gte('created_at', daysAgoIso(30));
    }

    query = query.order(state.sortColumn, { ascending: state.sortDir === 'asc' });

    if (!forExport) {
      const from = (state.page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);
    }

    return query;
  }

  async function loadLeads() {
    const client = getClient();
    if (!client || !els.leadsTableBody) return;

    els.leadsTableBody.closest('.table-responsive').classList.add('is-loading');

    try {
      const { data, error, count } = await buildLeadsQuery(client);
      if (error) throw error;

      state.leads = data || [];
      state.totalCount = count || 0;
      renderLeadsTable();
      renderPagination();
    } catch (err) {
      console.error('Failed to load leads:', err);
      els.leadsTableBody.innerHTML = '';
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 6;
      cell.className = 'text-center text-danger py-5';
      cell.textContent = 'Could not load leads. Please try again.';
      row.appendChild(cell);
      els.leadsTableBody.appendChild(row);
      showToast('Could not load leads.', 'error');
    } finally {
      els.leadsTableBody.closest('.table-responsive').classList.remove('is-loading');
    }
  }

  function renderLeadsTable() {
    els.leadsTableBody.innerHTML = '';

    if (state.leads.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 6;
      cell.className = 'text-center text-secondary py-5';
      cell.textContent = 'No leads match the current filters.';
      row.appendChild(cell);
      els.leadsTableBody.appendChild(row);
      return;
    }

    state.leads.forEach((lead) => {
      const tr = document.createElement('tr');

      // Name (+ email as secondary line)
      const nameTd = document.createElement('td');
      nameTd.className = 'lead-name-cell';
      const nameStrong = document.createElement('span');
      nameStrong.className = 'lead-primary-text';
      nameStrong.textContent = lead.full_name || '—';
      const emailSpan = document.createElement('span');
      emailSpan.className = 'lead-secondary-text';
      emailSpan.textContent = lead.email || '';
      nameTd.appendChild(nameStrong);
      nameTd.appendChild(emailSpan);
      tr.appendChild(nameTd);

      // Company
      const companyTd = document.createElement('td');
      companyTd.className = 'd-none d-md-table-cell';
      companyTd.textContent = lead.company || '—';
      tr.appendChild(companyTd);

      // Category
      const categoryTd = document.createElement('td');
      categoryTd.className = 'd-none d-lg-table-cell';
      categoryTd.textContent = categoryLabelFor(lead.subject);
      tr.appendChild(categoryTd);

      // Status
      const statusTd = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = statusBadgeClass(lead.status);
      badge.textContent = lead.status || 'New';
      statusTd.appendChild(badge);
      tr.appendChild(statusTd);

      // Received
      const receivedTd = document.createElement('td');
      receivedTd.className = 'd-none d-sm-table-cell';
      receivedTd.textContent = formatDateTime(lead.created_at);
      tr.appendChild(receivedTd);

      // Actions
      const actionsTd = document.createElement('td');
      actionsTd.className = 'text-end';
      const viewBtn = document.createElement('button');
      viewBtn.type = 'button';
      viewBtn.className = 'row-action-btn';
      viewBtn.innerHTML = '<i class="bi bi-eye" aria-hidden="true"></i> View';
      viewBtn.addEventListener('click', () => openLeadDetails(lead.id));
      actionsTd.appendChild(viewBtn);
      tr.appendChild(actionsTd);

      els.leadsTableBody.appendChild(tr);
    });
  }

  function renderPagination() {
    const totalPages = Math.max(1, Math.ceil(state.totalCount / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;

    const from = state.totalCount === 0 ? 0 : (state.page - 1) * PAGE_SIZE + 1;
    const to = Math.min(state.page * PAGE_SIZE, state.totalCount);

    if (els.paginationSummary) {
      els.paginationSummary.textContent = state.totalCount === 0
        ? 'No leads'
        : 'Showing ' + from + '–' + to + ' of ' + state.totalCount + ' leads';
    }

    if (!els.paginationControls) return;
    els.paginationControls.innerHTML = '';

    function makePageItem(label, targetPage, opts) {
      opts = opts || {};
      const li = document.createElement('li');
      li.className = 'page-item' + (opts.disabled ? ' disabled' : '') + (opts.active ? ' active' : '');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'page-link';
      btn.textContent = label;
      if (!opts.disabled && !opts.active) {
        btn.addEventListener('click', () => {
          state.page = targetPage;
          loadLeads();
        });
      }
      li.appendChild(btn);
      return li;
    }

    els.paginationControls.appendChild(makePageItem('Prev', state.page - 1, { disabled: state.page <= 1 }));

    const windowSize = 5;
    let start = Math.max(1, state.page - Math.floor(windowSize / 2));
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    for (let p = start; p <= end; p++) {
      els.paginationControls.appendChild(makePageItem(String(p), p, { active: p === state.page }));
    }

    els.paginationControls.appendChild(makePageItem('Next', state.page + 1, { disabled: state.page >= totalPages }));
  }

  /* ----------------------------------------------------------
     Lead details modal
     ---------------------------------------------------------- */

  function openLeadDetails(leadId) {
    const lead = state.leads.find((l) => l.id === leadId);
    if (!lead || !els.leadDetailsBody) return;

    state.selectedLeadId = lead.id;
    els.leadDetailsBody.innerHTML = '';

    const fields = [
      ['Full Name', lead.full_name],
      ['Email', lead.email],
      ['Phone', lead.phone],
      ['Company', lead.company || '—'],
      ['Category', categoryLabelFor(lead.subject)],
      ['Received', formatDateTime(lead.created_at)],
      ['Message', lead.message]
    ];

    fields.forEach(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'lead-detail-row';
      const labelEl = document.createElement('div');
      labelEl.className = 'lead-detail-label';
      labelEl.textContent = label;
      const valueEl = document.createElement('div');
      valueEl.className = 'lead-detail-value';
      valueEl.textContent = value || '—';
      row.appendChild(labelEl);
      row.appendChild(valueEl);
      els.leadDetailsBody.appendChild(row);
    });

    if (els.statusUpdateSelect) {
      els.statusUpdateSelect.value = STATUS_VALUES.includes(lead.status) ? lead.status : 'New';
    }

    if (els.leadDetailsModalEl && window.bootstrap && window.bootstrap.Modal) {
      leadDetailsModalInstance = window.bootstrap.Modal.getOrCreateInstance(els.leadDetailsModalEl);
      leadDetailsModalInstance.show();
    }
  }

  async function handleSaveStatus() {
    const client = getClient();
    if (!client || !state.selectedLeadId || !els.statusUpdateSelect) return;

    const newStatus = els.statusUpdateSelect.value;
    if (!STATUS_VALUES.includes(newStatus)) return;

    if (els.saveStatusBtn) els.saveStatusBtn.disabled = true;
    if (els.saveStatusSpinner) els.saveStatusSpinner.classList.remove('d-none');

    try {
      const { error } = await client
        .from(TABLE)
        .update({ status: newStatus })
        .eq('id', state.selectedLeadId);

      if (error) throw error;

      const localLead = state.leads.find((l) => l.id === state.selectedLeadId);
      if (localLead) localLead.status = newStatus;
      renderLeadsTable();
      showToast('Lead status updated to ' + newStatus + '.', 'success');
      loadMetrics();

      if (leadDetailsModalInstance) leadDetailsModalInstance.hide();
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Could not update lead status.', 'error');
    } finally {
      if (els.saveStatusBtn) els.saveStatusBtn.disabled = false;
      if (els.saveStatusSpinner) els.saveStatusSpinner.classList.add('d-none');
    }
  }

  /* ----------------------------------------------------------
     CSV export
     ---------------------------------------------------------- */

  async function handleExportCsv() {
    const client = getClient();
    if (!client || !els.exportCsvBtn) return;

    const originalHtml = els.exportCsvBtn.innerHTML;
    els.exportCsvBtn.disabled = true;
    els.exportCsvBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Exporting…';

    try {
      const { data, error } = await buildLeadsQuery(client, { forExport: true });
      if (error) throw error;

      const rows = data || [];
      const header = ['Full Name', 'Email', 'Phone', 'Company', 'Category', 'Status', 'Received At', 'Message'];
      const lines = [header.map(escapeCsvField).join(',')];

      rows.forEach((lead) => {
        lines.push([
          lead.full_name,
          lead.email,
          lead.phone,
          lead.company || '',
          categoryLabelFor(lead.subject),
          lead.status || 'New',
          formatDateTime(lead.created_at),
          lead.message
        ].map(escapeCsvField).join(','));
      });

      const csvContent = lines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = 'rixle-leads-' + stamp + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Exported ' + rows.length + ' lead(s) to CSV.', 'success');
    } catch (err) {
      console.error('CSV export failed:', err);
      showToast('Could not export leads.', 'error');
    } finally {
      els.exportCsvBtn.disabled = false;
      els.exportCsvBtn.innerHTML = originalHtml;
    }
  }

  /* ----------------------------------------------------------
     Filters & sorting
     ---------------------------------------------------------- */

  function handleSearchInput() {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      state.search = els.leadSearchInput.value || '';
      state.page = 1;
      loadLeads();
    }, 300);
  }

  function handleFilterChange() {
    state.status = els.statusFilter ? els.statusFilter.value : '';
    state.category = els.categoryFilter ? els.categoryFilter.value : '';
    state.dateRange = els.dateFilter ? els.dateFilter.value : '';
    state.page = 1;
    loadLeads();
  }

  function handleClearFilters() {
    state.search = '';
    state.status = '';
    state.category = '';
    state.dateRange = '';
    state.page = 1;
    if (els.leadSearchInput) els.leadSearchInput.value = '';
    if (els.statusFilter) els.statusFilter.value = '';
    if (els.categoryFilter) els.categoryFilter.value = '';
    if (els.dateFilter) els.dateFilter.value = '';
    loadLeads();
  }

  function handleSortClick(event) {
    const th = event.currentTarget;
    const column = th.getAttribute('data-sort');
    if (!column) return;

    if (state.sortColumn === column) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortColumn = column;
      state.sortDir = 'asc';
    }

    els.sortableHeaders.forEach((h) => h.classList.remove('sort-active'));
    th.classList.add('sort-active');

    state.page = 1;
    loadLeads();
  }

  /* ----------------------------------------------------------
     Wiring / lifecycle
     ---------------------------------------------------------- */

  function wireEventsOnce() {
    if (state.initialized) return;
    state.initialized = true;

    els.sidebarLinks.forEach((link) => {
      link.addEventListener('click', () => switchPanel(link.getAttribute('data-panel')));
    });

    if (els.sidebarToggleBtn) {
      els.sidebarToggleBtn.addEventListener('click', () => {
        const isOpen = els.sidebar && els.sidebar.classList.contains('open');
        if (isOpen) closeMobileSidebar(); else openMobileSidebar();
      });
    }
    if (els.sidebarBackdrop) els.sidebarBackdrop.addEventListener('click', closeMobileSidebar);

    if (els.leadSearchInput) els.leadSearchInput.addEventListener('input', handleSearchInput);
    if (els.statusFilter) els.statusFilter.addEventListener('change', handleFilterChange);
    if (els.categoryFilter) els.categoryFilter.addEventListener('change', handleFilterChange);
    if (els.dateFilter) els.dateFilter.addEventListener('change', handleFilterChange);
    if (els.clearFiltersBtn) els.clearFiltersBtn.addEventListener('click', handleClearFilters);

    els.sortableHeaders.forEach((th) => th.addEventListener('click', handleSortClick));

    if (els.exportCsvBtn) els.exportCsvBtn.addEventListener('click', handleExportCsv);
    if (els.saveStatusBtn) els.saveStatusBtn.addEventListener('click', handleSaveStatus);

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 992) closeMobileSidebar();
    });
  }

  function resetState() {
    state.search = '';
    state.status = '';
    state.category = '';
    state.dateRange = '';
    state.sortColumn = 'created_at';
    state.sortDir = 'desc';
    state.page = 1;
    state.totalCount = 0;
    state.leads = [];
    state.selectedLeadId = null;
  }

  function init() {
    cacheEls();
    wireEventsOnce();
    switchPanel('panel-dashboard');
    loadMetrics();
    loadLeads();
  }

  function teardown() {
    resetState();
    if (els.leadsTableBody) {
      els.leadsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-5">Loading leads…</td></tr>';
    }
    if (els.categoryBreakdown) {
      els.categoryBreakdown.innerHTML = '<div class="text-secondary fs-8">Loading breakdown…</div>';
    }
  }

  window.AdminDashboard = { init, teardown };
})();
