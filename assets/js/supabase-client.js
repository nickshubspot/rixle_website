/**
 * RIXLE PRIVATE LIMITED - SUPABASE CLIENT & FORM HANDLERS
 * Production Version 2026.1
 */

// Initialize Client Instance
let supabase = null;

/**
 * Initializes the Supabase client using runtime configuration
 * @returns {object|null} The initialized Supabase client or null
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
 * Uploads applicant resume to Supabase Storage bucket
 * @param {File} file - The file object to upload
 * @param {string} fullName - The full name of the applicant for naming
 * @returns {Promise<string>} The storage path of the uploaded file
 */
async function uploadResume(file, fullName) {
    if (!supabase) {
        throw new Error('Supabase client is not initialized.');
    }

    const fileExt = file.name.split('.').pop().toLowerCase();
    const sanitizedName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileName = `${Date.now()}_${sanitizedName}.${fileExt}`;

    const { data, error } = await supabase
        .storage
        .from('resumes')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        throw error;
    }

    return data.path;
}

/**
 * Fallback mailto trigger for contact submission when backend is unavailable
 * @param {string} fullName - Name
 * @param {string} email - Email
 * @param {string} phone - Phone
 * @param {string} serviceType - Primary Service Interest
 * @param {string} message - Requirements
 */
function fallbackMailtoLead(fullName, email, phone, serviceType, message) {
    const mailtoBody = `Name: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nService Interest: ${serviceType}\n\nRequirements:\n${message}`;
    window.location.href = `mailto:${RIXLE_CONFIG.OFFICIAL_EMAIL}?subject=Commercial Consultation Request - ${encodeURIComponent(fullName)}&body=${encodeURIComponent(mailtoBody)}`;
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
    const phone = form.querySelector('#phone');
    const serviceType = form.querySelector('#serviceType');
    const message = form.querySelector('#message');
    const feedback = form.querySelector('#formFeedback');
    const submitBtn = form.querySelector('#leadSubmitBtn');
    const honeypot = form.querySelector('#website_hp');

    // Anti-Spam Honeypot Trap
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

    // Phone Validation
    const phoneRegex = /^[+]?[\d\s-]{8,15}$/;
    if (!phone || !phoneRegex.test(phone.value.trim())) {
        if (phone) phone.parentElement.classList.add('has-error');
        isValid = false;
    }

    // Service Selection Validation
    if (!serviceType || !serviceType.value) {
        if (serviceType) serviceType.parentElement.classList.add('has-error');
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
        email: email.value.trim(),
        phone: phone.value.trim(),
        service_type: serviceType.value,
        message: message ? message.value.trim() : ''
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
            showError(feedback, 'Opening email client to deliver your structured request...');
            fallbackMailtoLead(payload.full_name, payload.email, payload.phone, payload.service_type, payload.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('is-loading');
            }
        }
    } else {
        showSuccess(feedback, 'Opening email client with structured consultation request...');
        fallbackMailtoLead(payload.full_name, payload.email, payload.phone, payload.service_type, payload.message);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-loading');
        }
    }
}

/**
 * Handles validation and submission of the Career Application form
 * @param {Event} event - The form submission event
 */
async function submitCareerForm(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const fullName = form.querySelector('#cFullName');
    const email = form.querySelector('#cEmail');
    const phone = form.querySelector('#cPhone');
    const position = form.querySelector('#cPosition');
    const experience = form.querySelector('#cExperience');
    const resumeInput = form.querySelector('#cResume');
    const message = form.querySelector('#cMessage');
    const feedback = form.querySelector('#cFormFeedback');
    const submitBtn = form.querySelector('#careerSubmitBtn');
    const honeypot = form.querySelector('#career_hp');

    // Anti-Spam Honeypot Trap
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

    // Phone Validation
    const phoneRegex = /^[+]?[\d\s-]{8,15}$/;
    if (!phone || !phoneRegex.test(phone.value.trim())) {
        if (phone) phone.parentElement.classList.add('has-error');
        isValid = false;
    }

    // Position & Experience Validation
    if (!position || !position.value) {
        if (position) position.parentElement.classList.add('has-error');
        isValid = false;
    }
    if (!experience || !experience.value) {
        if (experience) experience.parentElement.classList.add('has-error');
        isValid = false;
    }

    // Resume Validation (File Type & 5MB Limit)
    let selectedFile = null;
    if (!resumeInput || !resumeInput.files || resumeInput.files.length === 0) {
        if (resumeInput) resumeInput.parentElement.classList.add('has-error');
        isValid = false;
    } else {
        selectedFile = resumeInput.files[0];
        const validTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        const maxSizeBytes = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(selectedFile.type) && !/\.(pdf|doc|docx)$/i.test(selectedFile.name)) {
            if (resumeInput) resumeInput.parentElement.classList.add('has-error');
            isValid = false;
        } else if (selectedFile.size > maxSizeBytes) {
            if (resumeInput) resumeInput.parentElement.classList.add('has-error');
            isValid = false;
        }
    }

    if (!isValid) {
        showError(feedback, 'Please upload a valid PDF, DOC, or DOCX file under 5MB and complete all required fields.');
        return;
    }

    // Toggle Loading State
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
    }

    if (supabase) {
        try {
            // Step 1: Upload Resume File to Storage
            const resumePath = await uploadResume(selectedFile, fullName.value.trim());

            // Step 2: Insert Candidate Record into Database
            const { error: dbError } = await supabase
                .from('job_applications')
                .insert([{
                    full_name: fullName.value.trim(),
                    email: email.value.trim(),
                    phone: phone.value.trim(),
                    position: position.value,
                    experience: experience.value,
                    resume_path: resumePath,
                    message: message ? message.value.trim() : ''
                }]);

            if (dbError) throw dbError;

            showSuccess(feedback, 'Your application and resume have been securely submitted to Rixle HR.');
            form.reset();
        } catch (err) {
            console.error('Supabase application submission error:', err);
            showError(feedback, `Submission error. Please email your resume directly to ${RIXLE_CONFIG.OFFICIAL_EMAIL}.`);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('is-loading');
            }
        }
    } else {
        showError(feedback, `Database service offline. Please email your resume directly to ${RIXLE_CONFIG.OFFICIAL_EMAIL}.`);
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

    const careerForm = document.getElementById('careerApplicationForm');
    if (careerForm) {
        careerForm.addEventListener('submit', submitCareerForm);
    }
});
