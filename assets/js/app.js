/**
 * RIXLE PRIVATE LIMITED - ENTERPRISE CORE UI SCRIPT
 * Production Version 2026.2
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

    // 3. Client Portal Interactive Modal Handler
    const openPortalBtn = document.getElementById('openPortalBtn');
    const closePortalBtn = document.getElementById('closePortalBtn');
    const portalModal = document.getElementById('portalModal');
    const portalLoginForm = document.getElementById('portalLoginForm');

    const openModal = () => {
        if (portalModal) {
            portalModal.classList.add('is-active');
            portalModal.setAttribute('aria-hidden', 'false');
        }
    };

    const closeModal = () => {
        if (portalModal) {
            portalModal.classList.remove('is-active');
            portalModal.setAttribute('aria-hidden', 'true');
        }
    };

    if (openPortalBtn) openPortalBtn.addEventListener('click', openModal);
    if (closePortalBtn) closePortalBtn.addEventListener('click', closeModal);

    if (portalModal) {
        portalModal.addEventListener('click', (e) => {
            if (e.target === portalModal) {
                closeModal();
            }
        });
    }

    if (portalLoginForm) {
        portalLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Client portal authentication is restricted to onboarded enterprise accounts.');
        });
    }

    // 4. Workflow Interactive Rail Switching (Steps 1 to 10)
    const railNodes = document.querySelectorAll('.wf-rail-node');
    const stagePanels = document.querySelectorAll('.wf-stage-panel');
    const progressFill = document.getElementById('wfProgressFill');
    const progressText = document.getElementById('wfStageProgressText');

    railNodes.forEach((node, index) => {
        node.addEventListener('click', function() {
            const stepNum = this.getAttribute('data-step');

            railNodes.forEach(n => {
                n.classList.remove('active');
                n.setAttribute('aria-selected', 'false');
            });
            stagePanels.forEach(p => {
                p.classList.remove('active');
            });

            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');

            const activePanel = document.getElementById(`wf-panel-${stepNum}`);
            if (activePanel) {
                activePanel.classList.add('active');
            }

            if (progressFill) progressFill.style.width = `${(index + 1) * 10}%`;
            if (progressText) progressText.textContent = `${String(index + 1).padStart(2, '0')} / 10`;
        });
    });

    // 4b. Workflow Keyboard Navigation (Left/Right Arrow Keys)
    if (railNodes.length) {
        const railTrack = document.querySelector('.workflow-rail-track');
        if (railTrack) {
            railTrack.setAttribute('tabindex', '0');
            railTrack.addEventListener('keydown', (e) => {
                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                e.preventDefault();

                const activeIndex = Array.from(railNodes).findIndex(n => n.classList.contains('active'));
                let nextIndex = activeIndex;
                if (e.key === 'ArrowRight') nextIndex = Math.min(activeIndex + 1, railNodes.length - 1);
                if (e.key === 'ArrowLeft') nextIndex = Math.max(activeIndex - 1, 0);

                if (nextIndex !== activeIndex) {
                    railNodes[nextIndex].click();
                    railNodes[nextIndex].focus();
                }
            });
        }
    }

    // 4c. Copy-to-Clipboard Buttons (address / email / CIN)
    const copyButtons = document.querySelectorAll('.copy-inline-btn[data-copy]');
    copyButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const value = btn.getAttribute('data-copy');
            if (!value) return;
            try {
                await navigator.clipboard.writeText(value);
            } catch (err) {
                // Fallback for older/insecure contexts
                const tempInput = document.createElement('textarea');
                tempInput.value = value;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
            }
            btn.classList.add('copied');
            const originalLabel = btn.getAttribute('aria-label');
            btn.setAttribute('aria-label', 'Copied!');
            setTimeout(() => {
                btn.classList.remove('copied');
                if (originalLabel) btn.setAttribute('aria-label', originalLabel);
            }, 1500);
        });
    });

});
