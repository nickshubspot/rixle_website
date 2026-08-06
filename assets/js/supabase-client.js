/**
 * RIXLE PRIVATE LIMITED - SUPABASE CLIENT & FORM HANDLER
 * Production Version 2026.2
 *
 * NOTE: Trimmed to match the current contact form (#leadContactForm), which
 * only collects Full Name + Corporate Email. The previous version of this
 * file also handled Phone/Service Type/Message and a Career Application
 * form, but no matching HTML exists in index.html today. If/when a fuller
 * lead form or Careers section is added back to the site, those handlers
 * (uploadResume, submitCareerForm) can be restored from version control.
 */

// Initialize Client Instance
let supabase = null;

/**
 * Initializes the Supabase client using runtime configuration
 * @returns {object|null} The initialized Supabase client or null
 */
function initializeSupabase() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        if (window.RIXLE_CONFIG && RIXLE_CONFIG.SUPABASE_URL && RIXLE_CONFIG.SUPABASE_ANON_KEY) {
            try {
                supabase = window.supabase.createClient(
                    RIXLE_CONFIG.SUPABASE_URL,
                    RIXLE_CONFIG.SUPABASE_ANON_KEY
                );
                return supabase;
            } catch (err) {
                console.error('Failed to initialize Supabase client:', err);
                return null;
            }
        }
    }
    return null;
}

/**
 * Displays a success message in the designated feedback element
 * @param {HTMLElement} feedbackEl - The DOM element to render feedback
 * @param {string} message - The success message to display
 */
function showSuccess(feedbackEl, message) {
    if (!feedbackEl) return;
    feedbackEl.className = 'form-feedback success';
    feedbackEl.textContent = message;
}

/**
 * Displays an error message in the designated feedback element
 * @param {HTMLElement} feedbackEl - The DOM element to render feedback
 * @param {string} message - The error message to display
 */
function showError(feedbackEl, message) {
    if (!feedbackEl) return;
    feedbackEl.className = 'form-feedback error';
    feedbackEl.textContent = message;
}

/**
 * Fallback mailto trigger for contact submission when backend is unavailable
 * @param {string} fullName - Name
 * @param {string} email - Email
 */
function fallbackMailtoLead(fullName, email) {
    const officialEmail = (window.RIXLE_CONFIG && RIXLE_CONFIG.OFFICIAL_EMAIL) || 'info@rixle.co.in';
    const mailtoBody = `Name: ${fullName}\nEmail: ${email}\n\nRequesting consultation for Rixle Industrial Services.`;
    window.location.href = `mailto:${officialEmail}?subject=Consultation Request - ${encodeURIComponent(fullName)}&body=${encodeURIComponent(mailtoBody)}`;
}

/**
 * Handles validation and submission of the Contact / Consultation form
 * @param {Event} event - The form submission event
 */
async function submitContactForm(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const fullName = form.querySelector('#fullName');
    const email = form.querySelector('#email');
    const feedback = form.querySelector('#formFeedback');
    const submitBtn = form.querySelector('#leadSubmitBtn');
    const honeypot = form.querySelector('#website_hp');

    // Anti-Spam Honeypot Trap (only checked if the field exists in the HTML)
    if (honeypot && honeypot.value !== '') {
        return;
    }

    // Reset Validation States
    form.querySelectorAll('.form-group').forEach(fg => fg.classList.remove('has-error'));
    if (feedback) {
        feedback.className = 'form-feedback';
        feedback.textContent = '';
    }

    let isValid = true;

    // Name Validation
    if (!fullName || !fullName.value.trim()) {
        if (fullName) fullName.parentElement.classList.add('has-error');
        isValid = false;
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.value.trim())) {
        if (email) email.parentElement.classList.add('has-error');
        isValid = false;
    }

    if (!isValid) {
        showError(feedback, 'Please correct the highlighted fields.');
        return;
    }

    // Toggle Loading State
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
    }

    const payload = {
        full_name: fullName.value.trim(),
        email: email.value.trim()
    };

    if (supabase) {
        try {
            const { error } = await supabase
                .from('leads')
                .insert([payload]);

            if (error) throw error;

            showSuccess(feedback, 'Thank you. Your consultation inquiry has been securely logged. Our commercial team will reach out shortly.');
            form.reset();
        } catch (err) {
            console.error('Supabase lead submission error:', err);
            showError(feedback, 'Opening email client to deliver your request...');
            fallbackMailtoLead(payload.full_name, payload.email);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('is-loading');
            }
        }
    } else {
        showSuccess(feedback, 'Opening email client with your consultation request...');
        fallbackMailtoLead(payload.full_name, payload.email);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
        }
    }
}

// DOM Event Listener Initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeSupabase();

    const contactForm = document.getElementById('leadContactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', submitContactForm);
    }
});
