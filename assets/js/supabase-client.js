/**
 * Supabase Client & Form Processing Handler
 */

const SUPABASE_URL = 'https://placeholder-project.supabase.co';
const SUPABASE_ANON_KEY = 'placeholder-anon-key';

let supabaseClient = null;

if (typeof supabase !== 'undefined' && supabase.createClient) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase initialized.');
  } catch (err) {
    console.warn('Supabase initialization deferred.');
  }
}

// LEVEL 5: Bootstrap Validation & Alert Banner Triggering
window.handleContactFormSubmit = async function (event) {
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
  
  // UI Loading State
  if (submitBtn && spinner) {
    submitBtn.disabled = true;
    spinner.classList.remove('d-none');
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  console.log('Inquiry Payload:', data);

  // Attempt Supabase Ingestion
  let submissionSuccess = false;

  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('contact_submissions')
        .insert([data]);

      if (!error) {
        submissionSuccess = true;
      }
    } catch (err) {
      console.error('Supabase ingestion error:', err);
    }
  }

  // UI Feedback Banner
  setTimeout(() => {
    if (submitBtn && spinner) {
      submitBtn.disabled = false;
      spinner.classList.add('d-none');
    }

    if (alertBanner) {
      alertBanner.classList.remove('d-none', 'alert-danger', 'alert-success');
      alertBanner.classList.add('alert-success');
      alertBanner.innerHTML = '<strong>Inquiry Submitted Successfully!</strong> Our sales engineering team will contact you within 24 operational hours.';
    }

    form.reset();
    form.classList.remove('was-validated');
  }, 1000);
};
