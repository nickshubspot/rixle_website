/**
 * Rixle - Contact Form Client
 *
 * Secure flow:
 * Browser → Cloudflare Turnstile → Supabase Edge Function
 * → contact_submissions
 */

(function () {
  'use strict';

  const SUBMIT_CONTACT_URL =
    'https://lumvxwwbfoucfckycdal.supabase.co/functions/v1/submit-contact';

  const MAX_LENGTHS = {
    fullName: 200,
    email: 254,
    phone: 30,
    company: 200,
    subject: 200,
    message: 5000
  };

  function setBanner(alertBanner, type, text) {
    if (!alertBanner) return;

    alertBanner.classList.remove(
      'd-none',
      'alert-danger',
      'alert-success'
    );

    alertBanner.classList.add(
      type === 'success'
        ? 'alert-success'
        : 'alert-danger'
    );

    alertBanner.textContent = text;
  }

  function setSubmitting(submitBtn, spinner, isSubmitting) {
    if (submitBtn) {
      submitBtn.disabled = isSubmitting;
    }

    if (spinner) {
      spinner.classList.toggle(
        'd-none',
        !isSubmitting
      );
    }
  }

  function sanitizeValue(value, maxLength) {
    return String(value || '')
      .trim()
      .slice(0, maxLength);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function buildSubmission(form) {
    const formData = new FormData(form);

    return {
      full_name: sanitizeValue(
        formData.get('fullName'),
        MAX_LENGTHS.fullName
      ),

      email: sanitizeValue(
        formData.get('email'),
        MAX_LENGTHS.email
      ).toLowerCase(),

      phone: sanitizeValue(
        formData.get('phone'),
        MAX_LENGTHS.phone
      ),

      company: sanitizeValue(
        formData.get('company'),
        MAX_LENGTHS.company
      ),

      subject: sanitizeValue(
        formData.get('subject'),
        MAX_LENGTHS.subject
      ),

      message: sanitizeValue(
        formData.get('message'),
        MAX_LENGTHS.message
      ),

      // Honeypot field
      website: sanitizeValue(
        formData.get('website'),
        100
      )
    };
  }

  async function getTurnstileToken() {
    if (
      typeof turnstile === 'undefined' ||
      typeof turnstile.getResponse !== 'function'
    ) {
      throw new Error(
        'Security verification is unavailable.'
      );
    }

    const token = turnstile.getResponse();

    if (!token) {
      throw new Error(
        'Please complete the security verification.'
      );
    }

    return token;
  }

  window.handleContactFormSubmit =
    async function handleContactFormSubmit(event) {

      event.preventDefault();
      event.stopPropagation();

      const form = event.target;

      const alertBanner =
        document.getElementById('formAlertBanner');

      const submitBtn =
        document.getElementById('submitBtn');

      const spinner =
        document.getElementById('submitSpinner');

      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }

      form.classList.add('was-validated');

      const submission = buildSubmission(form);

      if (
        !submission.full_name ||
        !submission.email ||
        !submission.phone ||
        !submission.subject ||
        !submission.message
      ) {
        setBanner(
          alertBanner,
          'error',
          'Please complete all required fields.'
        );
        return;
      }

      if (!isValidEmail(submission.email)) {
        setBanner(
          alertBanner,
          'error',
          'Please enter a valid email address.'
        );
        return;
      }

      setSubmitting(
        submitBtn,
        spinner,
        true
      );

      if (alertBanner) {
        alertBanner.classList.add('d-none');
      }

      try {
        const turnstileToken =
          await getTurnstileToken();

        const response = await fetch(
          SUBMIT_CONTACT_URL,
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              ...submission,
              turnstileToken
            })
          }
        );

        let result = {};

        try {
          result = await response.json();
        } catch (_) {
          result = {};
        }

        if (!response.ok) {
          throw new Error(
            result.error ||
            'Submission failed.'
          );
        }

        setBanner(
          alertBanner,
          'success',
          'Inquiry Submitted! Our sales engineering team will contact you within 24 operational hours.'
        );

        form.reset();

        form.classList.remove(
          'was-validated'
        );

        if (
          typeof turnstile !== 'undefined' &&
          typeof turnstile.reset === 'function'
        ) {
          turnstile.reset();
        }

      } catch (err) {

        console.error(
          'Secure contact submission error:',
          err
        );

        setBanner(
          alertBanner,
          'error',
          err.message ||
          'Submission failed. Please try again, or reach us directly by phone or email.'
        );

        if (
          typeof turnstile !== 'undefined' &&
          typeof turnstile.reset === 'function'
        ) {
          turnstile.reset();
        }

      } finally {

        setSubmitting(
          submitBtn,
          spinner,
          false
        );
      }
    };

})();
