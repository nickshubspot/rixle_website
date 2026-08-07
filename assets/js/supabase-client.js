/**
 * Supabase Client & Form Processing Handler
 */

const SUPABASE_URL = 'https://placeholder-project.supabase.co';
const SUPABASE_ANON_KEY = 'placeholder-anon-key';

let supabaseClient = null;

if (typeof supabase !== 'undefined' && supabase.createClient) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn('Supabase initialization deferred.');
  }
}

// Client Validation & Inline Alert Banner
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
  
  if (submitBtn && spinner) {
    submitBtn.disabled = true;
    spinner.classList.remove('d-none');
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  if (supabaseClient) {
    try {
      await supabaseClient
        .from('contact_submissions')
        .insert([data]);
    } catch (err) {
      console.error('Supabase ingestion error:', err);
    }
  }

  setTimeout(() => {
    if (submitBtn && spinner) {
      submitBtn.disabled = false;
      spinner.classList.add('d-none');
    }

    if (alertBanner) {
      alertBanner.classList.remove('d-none', 'alert-danger', 'alert-success');
      alertBanner.classList.add('alert-success');
      alertBanner.innerHTML = '<strong>Inquiry Submitted!</strong> Our sales engineering team will contact you within 24 operational hours.';
    }

    form.reset();
    form.classList.remove('was-validated');
  }, 1000);
};
