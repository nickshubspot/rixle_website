document.addEventListener('DOMContentLoaded', () => {

    // 1. Current Year
    const currentYearEl = document.getElementById('currentYear');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // 2. Mobile Nav Drawer
    const menuToggle = document.getElementById('menuToggle');
    const navScrim = document.getElementById('navScrim');
    const mobileLinks = document.querySelectorAll('.mobile-menu a');

    const toggleMobileMenu = () => {
        const isOpen = document.body.classList.toggle('nav-open');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };

    const closeMobileMenu = () => {
        document.body.classList.remove('nav-open');
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    };

    if (menuToggle) menuToggle.addEventListener('click', toggleMobileMenu);
    if (navScrim) navScrim.addEventListener('click', closeMobileMenu);
    mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

    // 3. Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // 4. Numeric Counter Animation
    const counters = document.querySelectorAll('.num-counter');
    let animated = false;

    const animateCounters = () => {
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'), 10);
            const suffix = counter.getAttribute('data-suffix') || '';
            let count = 0;
            const speed = target / 50;

            const updateCount = () => {
                count += speed;
                if (count < target) {
                    counter.innerText = Math.ceil(count) + suffix;
                    setTimeout(updateCount, 30);
                } else {
                    counter.innerText = target + suffix;
                }
            };
            updateCount();
        });
    };

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !animated) {
                    animateCounters();
                    animated = true;
                }
            });
        }, { threshold: 0.4 });
        statsObserver.observe(statsSection);
    }

    // 5. Contact Lead Form Validation
    const leadForm = document.getElementById('leadContactForm');
    if (leadForm) {
        leadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let isValid = true;

            const fullName = document.getElementById('fullName');
            const email = document.getElementById('email');
            const phone = document.getElementById('phone');
            const serviceType = document.getElementById('serviceType');
            const feedback = document.getElementById('formFeedback');

            document.querySelectorAll('.form-group').forEach(fg => fg.classList.remove('has-error'));
            feedback.className = 'form-feedback';
            feedback.textContent = '';

            if (!fullName.value.trim()) { fullName.parentElement.classList.add('has-error'); isValid = false; }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.value.trim())) { email.parentElement.classList.add('has-error'); isValid = false; }

            if (!phone.value.trim() || phone.value.trim().length < 8) { phone.parentElement.classList.add('has-error'); isValid = false; }

            if (!serviceType.value) { serviceType.parentElement.classList.add('has-error'); isValid = false; }

            if (isValid) {
                feedback.className = 'form-feedback success';
                feedback.textContent = 'Opening mail client...';
                
                const message = document.getElementById('message').value.trim();
                const mailtoBody = `Name: ${fullName.value}\nEmail: ${email.value}\nPhone: ${phone.value}\nService Area: ${serviceType.value}\n\nRequirements:\n${message}`;
                
                window.location.href = `mailto:info@rixle.co.in?subject=Consultation Request - ${encodeURIComponent(fullName.value)}&body=${encodeURIComponent(mailtoBody)}`;
            } else {
                feedback.className = 'form-feedback error';
                feedback.textContent = 'Please fill out all required fields correctly.';
            }
        });
    }

    // 6. Career Form Validation
    const careerForm = document.getElementById('careerApplicationForm');
    
    document.querySelectorAll('.apply-btn-trigger').forEach(btn => {
        btn.addEventListener('click', function() {
            const pos = this.getAttribute('data-position');
            const selectEl = document.getElementById('cPosition');
            if (selectEl && pos) selectEl.value = pos;
        });
    });

    if (careerForm) {
        careerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let isValid = true;

            const cFullName = document.getElementById('cFullName');
            const cEmail = document.getElementById('cEmail');
            const cPhone = document.getElementById('cPhone');
            const cPosition = document.getElementById('cPosition');
            const cExperience = document.getElementById('cExperience');
            const cResume = document.getElementById('cResume');
            const feedback = document.getElementById('cFormFeedback');

            document.querySelectorAll('.form-group').forEach(fg => fg.classList.remove('has-error'));
            feedback.className = 'form-feedback';
            feedback.textContent = '';

            if (!cFullName.value.trim()) { cFullName.parentElement.classList.add('has-error'); isValid = false; }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cEmail.value.trim())) { cEmail.parentElement.classList.add('has-error'); isValid = false; }

            if (!cPhone.value.trim()) { cPhone.parentElement.classList.add('has-error'); isValid = false; }
            if (!cPosition.value) { cPosition.parentElement.classList.add('has-error'); isValid = false; }
            if (!cExperience.value) { cExperience.parentElement.classList.add('has-error'); isValid = false; }

            if (!cResume.files || cResume.files.length === 0) {
                cResume.parentElement.classList.add('has-error'); isValid = false;
            } else {
                const file = cResume.files[0];
                const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                if (!validTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
                    cResume.parentElement.classList.add('has-error'); isValid = false;
                }
            }

            if (isValid) {
                feedback.className = 'form-feedback success';
                feedback.textContent = 'Application verified. Connecting to upload API...';
                setTimeout(() => {
                    alert('Profile verified! Attach backend endpoint URL in script.js to complete direct API transmission.');
                }, 600);
            } else {
                feedback.className = 'form-feedback error';
                feedback.textContent = 'Please upload a PDF/DOC resume under 5MB and complete required fields.';
            }
        });
    }

});
