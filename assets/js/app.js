/**
 * RIXLE PRIVATE LIMITED - ENTERPRISE CORE UI SCRIPT
 */
document.addEventListener('DOMContentLoaded', () => {

    // 1. Dynamic Copyright Year
    const currentYearEl = document.getElementById('currentYear');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // 2. Mobile Nav Drawer Toggle
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

    // 3. Workflow Interactive Rail Switching & Keyboard Navigation (Steps 1 to 10)
    const railNodes = document.querySelectorAll('.wf-rail-node');
    const stagePanels = document.querySelectorAll('.wf-stage-panel');
    const progressFill = document.getElementById('wfProgressFill');
    const progressText = document.getElementById('wfStageProgressText');

    let currentStepIndex = 0;

    const activateWorkflowStep = (index) => {
        if (index < 0 || index >= railNodes.length) return;
        currentStepIndex = index;
        const targetNode = railNodes[currentStepIndex];
        const stepNum = targetNode.getAttribute('data-step');

        railNodes.forEach(n => {
            n.classList.remove('active');
            n.setAttribute('aria-selected', 'false');
        });
        stagePanels.forEach(p => {
            p.classList.remove('active');
        });

        targetNode.classList.add('active');
        targetNode.setAttribute('aria-selected', 'true');

        const activePanel = document.getElementById(`wf-panel-${stepNum}`);
        if (activePanel) {
            activePanel.classList.add('active');
        }

        if (progressFill) progressFill.style.width = `${(currentStepIndex + 1) * 10}%`;
        if (progressText) progressText.textContent = `${String(currentStepIndex + 1).padStart(2, '0')} / 10`;

        targetNode.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    };

    railNodes.forEach((node, index) => {
        node.addEventListener('click', function() {
            activateWorkflowStep(index);
        });
    });

    // Arrow keys navigation for Workflow section when focused or visible
    document.addEventListener('keydown', (e) => {
        const workflowSection = document.getElementById('infrastructure');
        if (!workflowSection) return;
        
        const rect = workflowSection.getBoundingClientRect();
        const isInViewport = rect.top <= window.innerHeight && rect.bottom >= 0;

        if (isInViewport) {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                currentStepIndex = (currentStepIndex + 1) % railNodes.length;
                activateWorkflowStep(currentStepIndex);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                currentStepIndex = (currentStepIndex - 1 + railNodes.length) % railNodes.length;
                activateWorkflowStep(currentStepIndex);
            }
        }
    });

    // 4. Clipboard Copy Logic for .copy-inline-btn
    const copyButtons = document.querySelectorAll('.copy-inline-btn');
    copyButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const textToCopy = btn.getAttribute('data-copy');
            if (!textToCopy) return;

            try {
                await navigator.clipboard.writeText(textToCopy);
                const originalContent = btn.textContent;
                btn.textContent = '✓';
                setTimeout(() => {
                    btn.textContent = originalContent;
                }, 1500);
            } catch (err) {
                console.error('Failed to copy text:', err);
            }
        });
    });

    // 5. Contact Form Handler (Fallback to mailto)
    const leadForm = document.getElementById('leadContactForm');
    if (leadForm) {
        leadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nameEl = document.getElementById('fullName');
            const emailEl = document.getElementById('email');

            if (!nameEl.value.trim() || !emailEl.value.trim()) {
                alert('Please complete all required fields.');
                return;
            }

            const mailtoBody = `Name: ${nameEl.value}\nEmail: ${emailEl.value}\nRequesting consultation for Rixle Industrial Services.`;
            window.location.href = `mailto:info@rixle.co.in?subject=Consultation Request - ${encodeURIComponent(nameEl.value)}&body=${encodeURIComponent(mailtoBody)}`;
        });
    }

});
