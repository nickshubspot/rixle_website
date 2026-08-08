/**
 * Rixle - Contact Form Client
 *
 * Submits directly to Supabase (anon INSERT — see supabase/rls.sql)
 * and only shows the success banner after the insert actually
 * succeeds. On failure it shows an error banner instead of silently
 * pretending the submission worked.
 *
 * Field mapping note: the form inputs are named fullName/email/
 * phone/company/subject/message (see index.html), but the
 * contact_submissions table column is full_name, not fullName.
 * buildSubmission() below maps that explicitly.
 */

(function () {
  'use strict';

  const SUPABASE_URL = 'https://lumvxwwbfoucfckycdal.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_Lbfszemvg7eE8ieBfwzlJA_CKjHI_9k';

  const MAX_LENGTHS = {
    fullName: 200,
    email: 254,
    phone: 30,
    company: 200,
    subject: 200,
    message: 5000
  };

  let supabaseClient = null;

  function initSupabaseClient() {
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
      console.error('Supabase SDK failed to load. Contact form submissions are disabled.');
      return null;
    }
    try {
      return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    } catch (err) {
      console.error('Supabase client initialization failed:', err);
      return null;
    }
  }

  supabaseClient = initSupabaseClient();

  function setBanner(alertBanner, type, text) {
    if (!alertBanner) return;
    alertBanner.classList.remove('d-none', 'alert-danger', 'alert-success');
    alertBanner.classList.add(type === 'success' ? 'alert-success' : 'alert-danger');
    alertBanner.textContent = text;
  }

  function setSubmitting(submitBtn, spinner, isSubmitting) {
    if (submitBtn) submitBtn.disabled = isSubmitting;
    if (spinner) spinner.classList.toggle('d-none', !isSubmitting);
  }

  function sanitizeValue(value, maxLength) {
    return String(value || '').trim().slice(0, maxLength);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function buildSubmission(form) {
    const formData = new FormData(form);
    return {
      full_name: sanitizeValue(formData.get('fullName'), MAX_LENGTHS.fullName),
      email: sanitizeValue(formData.get('email'), MAX_LENGTHS.email).toLowerCase(),
      phone: sanitizeValue(formData.get('phone'), MAX_LENGTHS.phone),
      company: sanitizeValue(formData.get('company'), MAX_LENGTHS.company) || null,
      subject: sanitizeValue(formData.get('subject'), MAX_LENGTHS.subject),
      message: sanitizeValue(formData.get('message'), MAX_LENGTHS.message)
    };
  }

  window.handleContactFormSubmit = async function handleContactFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const alertBanner = document.getElementById('formAlertBanner');
    const submitBtn = document.getElementById('submitBtn');
    const spinner = document.getElementById('submitSpinner');

    if (!form.checkValidity()) {
      event.stopPropagation();
      form.classList.add('was-validated');
      return;
    }
    form.classList.add('was-validated');

    const submission = buildSubmission(form);

    if (!submission.full_name || !submission.email || !submission.phone ||
        !submission.subject || !submission.message) {
      setBanner(alertBanner, 'error', 'Please complete all required fields.');
      return;
    }
    if (!isValidEmail(submission.email)) {
      setBanner(alertBanner, 'error', 'Please enter a valid email address.');
      return;
    }
    if (!supabaseClient) {
      setBanner(alertBanner, 'error', 'Submission is temporarily unavailable. Please email us directly.');
      return;
    }

    setSubmitting(submitBtn, spinner, true);
    if (alertBanner) alertBanner.classList.add('d-none');

    try {
      const { error } = await supabaseClient
        .from('contact_submissions')
        .insert([submission]);

      if (error) throw error;

      setBanner(alertBanner, 'success', 'Inquiry Submitted! Our sales engineering team will contact you within 24 operational hours.');
      form.reset();
      form.classList.remove('was-validated');
    } catch (err) {
      console.error('Supabase ingestion error:', err);
      setBanner(alertBanner, 'error', 'Submission failed. Please try again, or reach us directly by phone or email.');
    } finally {
      setSubmitting(submitBtn, spinner, false);
    }
  };
})();
