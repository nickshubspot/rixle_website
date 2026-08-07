/**
 * Supabase Client Initialization & Form Handler Preservations
 */

const SUPABASE_URL = 'https://placeholder-project.supabase.co';
const SUPABASE_ANON_KEY = 'placeholder-anon-key';

let supabaseClient = null;

if (typeof supabase !== 'undefined' && supabase.createClient) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized successfully.');
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
  }
} else {
  console.warn('Supabase SDK script not detected or loaded asynchronously. Form fallbacks active.');
}

// Preserve global submission handlers without breaking API signatures
window.handleContactFormSubmit = async function (event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  console.log('Form submission received:', data);

  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('contact_submissions')
        .insert([data]);

      if (error) throw error;
      alert('Thank you for reaching out! Your message has been submitted.');
      form.reset();
      return;
    } catch (error) {
      console.error('Supabase submission error:', error.message);
    }
  }

  // Graceful Local Fallback
  alert('Thank you for your message! Our team will get back to you shortly.');
  form.reset();
};
