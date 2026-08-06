/**
 * RIXLE PRIVATE LIMITED - SUPABASE CLIENT & FORM HANDLERS
 * Production Version 2026.1 (Bug-Fixed)
 */

// Runtime Configuration Safeguard
const RIXLE_CONFIG = window.RIXLE_CONFIG || {
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    OFFICIAL_EMAIL: 'info@rixle.co.in'
};

// Initialize Client Instance
let supabase = null;

/**
 * Initializes the Supabase client safely
 */
function initializeSupabase() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        if (RIXLE_CONFIG.SUPABASE_URL && RIXLE_CONFIG.SUPABASE_ANON_KEY) {
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

function showSuccess(feedbackEl, message) {
    if (!feedbackEl) return;
    feedbackEl.className = 'form-feedback success';
    feedbackEl.textContent = message;
}

function showError(feedbackEl, message) {
    if (!feedbackEl) return;
    feedbackEl.className = 'form-feedback error';
    feedbackEl.textContent = message;
}

/**
 * Fallback mailto trigger for contact submission
 */
function fallbackMailtoLead(fullName, email, phone, serviceType, message) {
    const targetEmail = RIXLE_CONFIG.OFFICIAL_EMAIL || 'info@rixle.co.in';
    const mailtoBody = `Name: ${fullName || ''}\nEmail: ${email || ''}\nPhone: ${phone || 'N/A'}\nService Interest: ${serviceType || 'General'}\n\nRequirements:\n${message || ''}`;
    window.location.href = `mailto:${targetEmail}?subject=Commercial Consultation Request - ${encodeURIComponent(fullName || 'Inquiry')}&body=${encodeURIComponent(mailtoBody)}`;
}

/**
 * Handles validation and submission of the Contact / Consultation form
 */
async function submitContactForm(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const fullName = form.querySelector('#fullName');
    const email = form.querySelector('#email');
    const phone = form.querySelector('#phone');
    const serviceType = form.querySelector('#serviceType');
    const message = form.querySelector('#message');
    const feedback = form.querySelector('#formFeedback');
    const submitBtn = form.querySelector('#leadSubmitBtn');
    const honeypot = form.querySelector('#website_hp');

    // Anti-Spam Trap
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

    if (!fullName || !fullName.value.trim()) {
        if (fullName && fullName.parentElement) fullName.parentElement.classList.add('has-error');
        isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.value.trim())) {
        if (email && email.parentElement) email.parentElement.classList.add('has-error');
        isValid = false;
    }

    if (!isValid) {
        showError(feedback, 'Please complete all required fields with valid details.');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
    }

    const payload = {
        full_name: fullName.value.trim(),
        email: email.value.trim(),
        phone: phone ? phone.value.trim() : '',
        service_type: serviceType ? serviceType.value : 'General Inquiry',
        message: message ? message.value.trim() : ''
    };

    if (supabase) {
        try {
            const { error } = await supabase.from('leads').insert([payload]);
            if (error) throw error;

            showSuccess(feedback, 'Thank you. Your consultation inquiry has been securely logged.');
            form.reset();
        } catch (err) {
            console.error('Supabase lead submission error:', err);
            showError(feedback, 'Opening email client to deliver your request...');
            fallbackMailtoLead(payload.full_name, payload.email, payload.phone, payload.service_type, payload.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('is-loading');
            }
        }
    } else {
        showSuccess(feedback, 'Opening email client with consultation request...');
        fallbackMailtoLead(payload.full_name, payload.email, payload.phone, payload.service_type, payload.message);
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
