/**
 * Rixle Ops Console — Admin Authentication
 *
 * Handles Supabase Auth email/password login, session detection on
 * page load, logout, and switching between the login view and the
 * dashboard view. Delegates dashboard startup/teardown to
 * window.AdminDashboard (see admin-dashboard.js).
 *
 * Authorization note: having a valid Supabase Auth session is NOT
 * enough to see leads — RLS on contact_submissions only grants
 * SELECT/UPDATE to users present in public.admins (see
 * supabase/rls-admin-policies.sql). This file checks that same
 * table right after sign-in and signs the user back out with an
 * error if they authenticated but aren't an authorized admin, so a
 * non-admin Supabase account never sees the dashboard shell.
 */

(function () {
  'use strict';

  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');
  const loginForm = document.getElementById('loginForm');
  const loginEmailInput = document.getElementById('loginEmail');
  const loginPasswordInput = document.getElementById('loginPassword');
  const loginAlertBanner = document.getElementById('loginAlertBanner');
  const loginBtn = document.getElementById('loginBtn');
  const loginSpinner = document.getElementById('loginSpinner');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const sidebarUserEmail = document.getElementById('sidebarUserEmail');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const mobileAvatar = document.getElementById('mobileAvatar');

  let currentSession = null;

  function getClient() {
    return window.supabaseAdminClient;
  }

  function showLoginView() {
    if (dashboardView) dashboardView.classList.add('d-none');
    if (loginView) loginView.classList.remove('d-none');
  }

  function showDashboardView() {
    if (loginView) loginView.classList.add('d-none');
    if (dashboardView) dashboardView.classList.remove('d-none');
  }

  function setLoginBusy(isBusy) {
    if (loginBtn) loginBtn.disabled = isBusy;
    if (loginSpinner) loginSpinner.classList.toggle('d-none', !isBusy);
  }

  function showLoginError(message) {
    if (!loginAlertBanner) return;
    loginAlertBanner.textContent = message;
    loginAlertBanner.classList.remove('d-none');
  }

  function clearLoginError() {
    if (!loginAlertBanner) return;
    loginAlertBanner.classList.add('d-none');
    loginAlertBanner.textContent = '';
  }

  function initialsFromEmail(email) {
    if (!email) return '—';
    const namePart = email.split('@')[0] || '';
    const cleaned = namePart.replace(/[^a-zA-Z]/g, '');
    if (!cleaned) return email.charAt(0).toUpperCase();
    if (cleaned.length === 1) return cleaned.toUpperCase();
    return (cleaned.charAt(0) + cleaned.charAt(1)).toUpperCase();
  }

  function applyUserToChrome(user) {
    const email = user && user.email ? user.email : '—';
    if (sidebarUserEmail) sidebarUserEmail.textContent = email;
    const initials = initialsFromEmail(email);
    if (sidebarAvatar) sidebarAvatar.textContent = initials;
    if (mobileAvatar) mobileAvatar.textContent = initials;
  }

  // Returns true if the currently-signed-in user is a row in
  // public.admins. RLS on admins only lets a user read their own
  // row (see rls-admin-policies.sql), so this is a safe self-check
  // — it can't be used to enumerate other admins.
  async function isAuthorizedAdmin(client, userId) {
    try {
      const { data, error } = await client
        .from('admins')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Admin authorization check failed:', error);
        return false;
      }
      return !!data;
    } catch (err) {
      console.error('Admin authorization check error:', err);
      return false;
    }
  }

  async function handleAuthenticated(session) {
    const client = getClient();
    if (!client || !session || !session.user) {
      handleUnauthenticated();
      return;
    }

    const authorized = await isAuthorizedAdmin(client, session.user.id);
    if (!authorized) {
      // Valid Supabase login, but not an authorized Rixle admin —
      // do not show the dashboard. Sign out and redirect to login.
      try {
        await client.auth.signOut();
      } catch (err) {
        console.error('Sign-out after failed authorization check errored:', err);
      }
      currentSession = null;
      if (window.AdminDashboard && typeof window.AdminDashboard.teardown === 'function') {
        window.AdminDashboard.teardown();
      }
      showLoginView();
      showLoginError('This account is not authorized to access the Ops Console.');
      return;
    }

    currentSession = session;
    applyUserToChrome(session.user);
    showDashboardView();
    if (window.AdminDashboard && typeof window.AdminDashboard.init === 'function') {
      window.AdminDashboard.init(session);
    }
  }

  function handleUnauthenticated() {
    currentSession = null;
    if (window.AdminDashboard && typeof window.AdminDashboard.teardown === 'function') {
      window.AdminDashboard.teardown();
    }
    showLoginView();
  }

  async function detectExistingSession() {
    const client = getClient();
    if (!client) {
      showLoginError('Console is misconfigured. Contact the site administrator.');
      return;
    }

    try {
      const { data, error } = await client.auth.getSession();
      if (error) {
        console.error('getSession error:', error);
        handleUnauthenticated();
        return;
      }
      if (data && data.session) {
        await handleAuthenticated(data.session);
      } else {
        handleUnauthenticated();
      }
    } catch (err) {
      console.error('Unexpected error detecting session:', err);
      handleUnauthenticated();
    }
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    clearLoginError();

    if (!loginForm.checkValidity()) {
      event.stopPropagation();
      loginForm.classList.add('was-validated');
      return;
    }
    loginForm.classList.add('was-validated');

    const client = getClient();
    if (!client) {
      showLoginError('Console is misconfigured. Contact the site administrator.');
      return;
    }

    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    setLoginBusy(true);
    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        showLoginError('Invalid email or password. Please try again.');
        return;
      }
      if (data && data.session) {
        loginForm.reset();
        loginForm.classList.remove('was-validated');
        await handleAuthenticated(data.session);
      }
    } catch (err) {
      console.error('Login error:', err);
      showLoginError('Something went wrong signing in. Please try again.');
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleLogoutClick() {
    const client = getClient();
    if (!client) {
      handleUnauthenticated();
      return;
    }
    if (logoutBtn) logoutBtn.disabled = true;
    try {
      await client.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (logoutBtn) logoutBtn.disabled = false;
      handleUnauthenticated();
    }
  }

  function handleTogglePassword() {
    if (!loginPasswordInput || !togglePasswordBtn) return;
    const icon = togglePasswordBtn.querySelector('i');
    const isPassword = loginPasswordInput.type === 'password';
    loginPasswordInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    if (icon) {
      icon.classList.toggle('bi-eye', !isPassword);
      icon.classList.toggle('bi-eye-slash', isPassword);
    }
  }

  function wireEvents() {
    if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
    if (togglePasswordBtn) togglePasswordBtn.addEventListener('click', handleTogglePassword);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogoutClick);

    const client = getClient();
    if (client) {
      client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          handleUnauthenticated();
        } else if (event === 'SIGNED_IN' && session) {
          // Avoid re-running the authorization check twice for the
          // session we already handled via detectExistingSession()
          // or handleLoginSubmit() above.
          if (!currentSession || currentSession.access_token !== session.access_token) {
            handleAuthenticated(session);
          }
        } else if (event === 'TOKEN_REFRESHED' && session) {
          currentSession = session;
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    wireEvents();
    detectExistingSession();
  });

  // Exposed for admin-dashboard.js to re-run authenticated fetches
  // with a fresh token if needed.
  window.AdminAuth = {
    getSession: () => currentSession
  };
})();
