/**
 * Rixle - Careers Application Form Client
 *
 * Direct secure submission to Supabase:
 * 1. Uploads resume/CV file to private 'job-applications' Storage bucket
 * 2. Inserts application record into public.job_applications table
 */

(function () {
  'use strict';

  const SUPABASE_URL = 'https://lumvxwwbfoucfckycdal.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_Lbfszemvg7eE8ieBfwzlJA_CKjHI_9k';
  const BUCKET_NAME = 'job-applications';
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];
  const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream'
  ];

  function getSupabaseClient() {
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
      console.error('Supabase SDK failed to load.');
      return null;
    }
    return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  function setBanner(alertBanner, type, text) {
    if (!alertBanner) return;
    alertBanner.classList.remove('d-none', 'alert-danger', 'alert-success');
    alertBanner.classList.add(type === 'success' ? 'alert-success' : 'alert-danger');
    alertBanner.textContent = text;
  }

  function setSubmitting(submitBtn, spinner, isSubmitting) {
    if (submitBtn) {
      submitBtn.disabled = isSubmitting;
    }
    if (spinner) {
      spinner.classList.toggle('d-none', !isSubmitting);
    }
  }

  function sanitize(val, maxLen) {
    return String(val || '').trim().slice(0, maxLen || 250);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateFile(file) {
    if (!file) return 'Please select your resume/CV file.';
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size exceeds the 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Invalid file format (.${ext}). Only PDF, DOC, and DOCX files are allowed.`;
    }
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return `Invalid file type (${file.type}). Only PDF, DOC, and DOCX files are allowed.`;
    }
    return null;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const careersForm = document.getElementById('careersForm');
    if (!careersForm) return;

    const alertBanner = document.getElementById('careersAlertBanner');
    const submitBtn = document.getElementById('careersSubmitBtn');
    const spinner = document.getElementById('careersSubmitSpinner');
    const positionSelect = document.getElementById('careersPosition');

    // Handle "Apply Now" buttons from position cards
    document.querySelectorAll('.apply-now-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const posTitle = this.getAttribute('data-position');
        if (positionSelect && posTitle) {
          for (let i = 0; i < positionSelect.options.length; i++) {
            if (positionSelect.options[i].text.includes(posTitle) || positionSelect.options[i].value.includes(posTitle)) {
              positionSelect.selectedIndex = i;
              break;
            }
          }
        }
        careersForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    careersForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const client = getSupabaseClient();
      if (!client) {
        setBanner(alertBanner, 'error', 'Database connection error. Please try again later.');
        return;
      }

      // Check form validity
      if (!careersForm.checkValidity()) {
        careersForm.classList.add('was-validated');
        setBanner(alertBanner, 'error', 'Please complete all required fields.');
        return;
      }

      // Extract form values
      const formData = new FormData(careersForm);
      const fullName = sanitize(formData.get('fullName'), 200);
      const email = sanitize(formData.get('email'), 254).toLowerCase();
      const phone = sanitize(formData.get('phone'), 30);
      const position = sanitize(formData.get('position'), 200);
      const experience = sanitize(formData.get('experience'), 100);
      const location = sanitize(formData.get('location'), 150);
      const linkedinUrl = sanitize(formData.get('linkedinUrl'), 300);
      const coverMessage = sanitize(formData.get('coverMessage'), 3000);
      const websiteHoneypot = sanitize(formData.get('website'), 100);

      // Honeypot check
      if (websiteHoneypot) {
        setBanner(alertBanner, 'success', 'Thank you! Your application has been submitted successfully.');
        careersForm.reset();
        careersForm.classList.remove('was-validated');
        return;
      }

      // Basic validations
      if (!fullName || !email || !phone || !position) {
        setBanner(alertBanner, 'error', 'Please fill in all required fields (*).');
        return;
      }

      if (!isValidEmail(email)) {
        setBanner(alertBanner, 'error', 'Please enter a valid email address.');
        return;
      }

      // Resume file validation
      const resumeInput = document.getElementById('careersResume');
      const file = resumeInput && resumeInput.files ? resumeInput.files[0] : null;
      const fileErr = validateFile(file);
      if (fileErr) {
        setBanner(alertBanner, 'error', fileErr);
        return;
      }

      setSubmitting(submitBtn, spinner, true);
      if (alertBanner) alertBanner.classList.add('d-none');

      try {
        // Step 1: Upload resume to Supabase Storage
        const fileExt = file.name.split('.').pop().toLowerCase();
        const safeName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const timestamp = Date.now();
        const storagePath = `resumes/${timestamp}_${safeName}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await client.storage
          .from(BUCKET_NAME)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error('Failed to upload resume file. Please ensure it is a PDF or Word document under 5MB.');
        }

        // Step 2: Insert application into public.job_applications table
        const { error: insertError } = await client
          .from('job_applications')
          .insert([
            {
              full_name: fullName,
              email: email,
              phone: phone,
              position: position,
              experience: experience || null,
              location: location || null,
              linkedin_url: linkedinUrl || null,
              resume_path: storagePath,
              cover_message: coverMessage || null,
              status: 'New'
            }
          ]);

        if (insertError) {
          console.error('Database insert error:', insertError);
          throw new Error('Failed to submit application data. Please try again.');
        }

        // Success
        setBanner(
          alertBanner,
          'success',
          'Thank you for applying! Your application and resume have been received successfully. Our hiring team will review your profile.'
        );
        careersForm.reset();
        careersForm.classList.remove('was-validated');

      } catch (err) {
        console.error('Careers submission exception:', err);
        setBanner(alertBanner, 'error', err.message || 'An unexpected error occurred. Please try again.');
      } finally {
        setSubmitting(submitBtn, spinner, false);
      }
    });
  });
})();
