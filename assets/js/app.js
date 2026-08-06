/**
 * RIXLE PRIVATE LIMITED - ENTERPRISE CORE APPLICATION SCRIPT
 * Production Version 2026.1
 */

/* ==========================================================================
   1. RUNTIME CONFIGURATION & ENVIRONMENT CONSTANTS
   ========================================================================== */
const RIXLE_CONFIG = {
    SUPABASE_URL: window.ENV_SUPABASE_URL || 'https://xyzcompany.supabase.co',
    SUPABASE_ANON_KEY: window.ENV_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.exampleKey',
    WHATSAPP_NUMBER: '910000000000', // Format: Country Code + Mobile (e.g., 919876543210)
    WHATSAPP_DEFAULT_MSG: 'Hello Rixle Team, I would like to inquire about industrial resource recovery and scrap management services.',
    MAPS_EMBED_URL: 'https://maps.google.com/?q=MIDC+Latur+Maharashtra',
    OFFICIAL_EMAIL: 'info@rixle.co.in',
    OFFICIAL_CIN: 'U38210MH2024PTC420000',
    OFFICIAL_ADDRESS: 'MIDC Industrial Area, Latur, Maharashtra - 413512, India'
};

/* ==========================================================================
   2. GLOBAL BENCHMARK DATA OBJECT (Sensoneo Global Waste Index 2025)
   ========================================================================== */
const SENSONEO_BENCHMARK_2025 = {
    reportTitle: "Sensoneo Global Waste Index 2025",
    perCapitaMSW: [
        { country: "United States", val: 2.24, unit: "kg", color: "#D9A441", widthPct: 90 },
        { country: "Germany", val: 1.62, unit: "kg", color: "#D9A441", widthPct: 65 },
        { country: "China", val: 1.02, unit: "kg", color: "#6E7B76", widthPct: 42 },
        { country: "India", val: 0.57, unit: "kg", color: "#2F5233", widthPct: 25 }
    ],
    diversionRates: [
        { country: "Germany", val: 67.1, unit: "%", color: "#2F5233", widthPct: 85 },
        { country: "South Korea", val: 63.7, unit: "%", color: "#2F5233", widthPct: 80 },
        { country: "United States", val: 32.1, unit: "%", color: "#6E7B76", widthPct: 40 },
        { country: "India (Urban)", val: 28.4, unit: "%", color: "#D9A441", widthPct: 35 }
    ]
};

/* ==========================================================================
   3. DOM CONTENT LOADED MAIN EXECUTION ENTRY POINT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {

    /* ----------------------------------------------------------------------
       A. Dynamic Elements & Global Bindings
       ---------------------------------------------------------------------- */
    // Dynamic Copyright Year
    const currentYearEl = document.getElementById('currentYear');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // Dynamic WhatsApp Button URL Format
    const whatsappBtn = document.getElementById('whatsappDynamicBtn');
    if (whatsappBtn) {
        const encodedMsg = encodeURIComponent(RIXLE_CONFIG.WHATSAPP_DEFAULT_MSG);
        whatsappBtn.href = `https://wa.me/${RIXLE_CONFIG.WHATSAPP_NUMBER}?text=${encodedMsg}`;
    }

    // Dynamic Google Maps Location Link
    const mapsBtn = document.getElementById('mapsDynamicBtn');
    if (mapsBtn) {
        mapsBtn.href = RIXLE_CONFIG.MAPS_EMBED_URL;
    }

    /* ----------------------------------------------------------------------
       B. Navigation & Mobile Drawer Interaction
       ---------------------------------------------------------------------- */
    const menuToggle = document.getElementById('menuToggle');
    const navScrim = document.getElementById('navScrim');
    const mobileLinks = document.querySelectorAll('.mobile-menu a');

    const toggleMobileMenu = () => {
        const isOpen = document.body.classList.toggle('nav-open');
        if (menuToggle) {
            menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
    };

    const closeMobileMenu = () => {
        document.body.classList.remove('nav-open');
        if (menuToggle) {
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    };

    if (menuToggle) menuToggle.addEventListener('click', toggleMobileMenu);
    if (navScrim) navScrim.addEventListener('click', closeMobileMenu);
    mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

    // Smooth Scroll Navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId.includes('Modal')) return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* ----------------------------------------------------------------------
       C. Copy-to-Clipboard Functionality
       ---------------------------------------------------------------------- */
    const copyBtns = document.querySelectorAll('.copy-inline-btn');
    const toast = document.getElementById('copyToast');

    const showToast = (message) => {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('is-active');
        setTimeout(() => {
            toast.classList.remove('is-active');
        }, 2500);
    };

    copyBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const textToCopy = this.getAttribute('data-copy');
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast(`Copied: "${textToCopy}"`);
                }).catch(err => {
                    console.error('Copy failed:', err);
                    showToast('Failed to copy to clipboard');
                });
            }
        });
    });

    /* ----------------------------------------------------------------------
       D. SECTION 4: Operational Workflow Rail & Keyboard Navigation
       ---------------------------------------------------------------------- */
    const railNodes = Array.from(document.querySelectorAll('.wf-rail-node'));
    const stagePanels = document.querySelectorAll('.wf-stage-panel');
    const progressFill = document.getElementById('wfProgressFill');
    const progressText = document.getElementById('wfStageProgressText');

    if (railNodes.length > 0) {
        const activateWorkflowStep = (index) => {
            if (index < 0 || index >= railNodes.length) return;

            const targetNode = railNodes[index];
            const stepNum = targetNode.getAttribute('data-step');

            // Deactivate all nodes and panels
            railNodes.forEach((node) => {
                node.classList.remove('active');
                node.setAttribute('aria-selected', 'false');
                node.setAttribute('tabindex', '-1');
            });

            stagePanels.forEach((panel) => {
                panel.classList.remove('active');
                panel.setAttribute('hidden', 'true');
            });

            // Activate selected node and panel
            targetNode.classList.add('active');
            targetNode.setAttribute('aria-selected', 'true');
            targetNode.setAttribute('tabindex', '0');
            targetNode.focus();

            const activePanel = document.getElementById(`wf-panel-${stepNum}`);
            if (activePanel) {
                activePanel.classList.add('active');
                activePanel.removeAttribute('hidden');
            }

            // Update progress bar indicator
            const percentage = ((index + 1) / railNodes.length) * 100;
            if (progressFill) progressFill.style.width = `${percentage}%`;
            if (progressText) progressText.textContent = `${String(index + 1).padStart(2, '0')} / ${String(railNodes.length).padStart(2, '0')}`;
        };

        // Click event listeners
        railNodes.forEach((node, idx) => {
            node.addEventListener('click', () => activateWorkflowStep(idx));
        });

        // Keyboard navigation event listeners (ArrowLeft, ArrowRight, Home, End)
        const railContainer = document.querySelector('.workflow-rail-container');
        if (railContainer) {
            railContainer.addEventListener('keydown', (e) => {
                const currentIndex = railNodes.findIndex(n => n.classList.contains('active'));
                if (currentIndex === -1) return;

                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    const nextIdx = (currentIndex + 1) % railNodes.length;
                    activateWorkflowStep(nextIdx);
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prevIdx = (currentIndex - 1 + railNodes.length) % railNodes.length;
                    activateWorkflowStep(prevIdx);
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    activateWorkflowStep(0);
                } else if (e.key === 'End') {
                    e.preventDefault();
                    activateWorkflowStep(railNodes.length - 1);
                }
            });
        }
    }

    /* ----------------------------------------------------------------------
       E. SECTION 5: AIRWSS Technical Tabs & Keyboard Navigation
       ---------------------------------------------------------------------- */
    const airwssTabButtons = Array.from(document.querySelectorAll('.airwss-tab-btn'));
    const airwssTabPanels = document.querySelectorAll('.airwss-tab-panel');

    if (airwssTabButtons.length > 0) {
        const activateAirwssTab = (index) => {
            if (index < 0 || index >= airwssTabButtons.length) return;

            const targetButton = airwssTabButtons[index];
            const tabNum = targetButton.getAttribute('data-tab');

            // Deactivate all buttons and panels
            airwssTabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
                btn.setAttribute('tabindex', '-1');
            });
            airwssTabPanels.forEach(panel => {
                panel.classList.remove('active');
                panel.setAttribute('hidden', 'true');
            });

            // Activate target button and panel
            targetButton.classList.add('active');
            targetButton.setAttribute('aria-selected', 'true');
            targetButton.setAttribute('tabindex', '0');
            targetButton.focus();

            const targetPanel = document.getElementById(`airwss-tab-${tabNum}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.removeAttribute('hidden');
            }
        };

        // Click event listeners
        airwssTabButtons.forEach((btn, idx) => {
            btn.addEventListener('click', () => activateAirwssTab(idx));
        });

        // Keyboard navigation (ArrowLeft, ArrowRight, Home, End)
        const tabContainer = document.querySelector('.airwss-tab-buttons');
        if (tabContainer) {
            tabContainer.addEventListener('keydown', (e) => {
                const currentIndex = airwssTabButtons.findIndex(b => b.classList.contains('active'));
                if (currentIndex === -1) return;

                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    activateAirwssTab((currentIndex + 1) % airwssTabButtons.length);
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    activateAirwssTab((currentIndex - 1 + airwssTabButtons.length) % airwssTabButtons.length);
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    activateAirwssTab(0);
                } else if (e.key === 'End') {
                    e.preventDefault();
                    activateAirwssTab(airwssTabButtons.length - 1);
                }
            });
        }
    }

    /* ----------------------------------------------------------------------
       F. SECTION 6: Materials Catalog Filter Chips & Live Search
       ---------------------------------------------------------------------- */
    const filterChips = document.querySelectorAll('.mat-chip');
    const searchInput = document.getElementById('matSearchInput');
    const matCards = document.querySelectorAll('.mat-b2b-card');

    let currentFilter = 'all';
    let currentSearchTerm = '';

    const filterMaterials = () => {
        matCards.forEach(card => {
            const category = card.getAttribute('data-category');
            const searchData = (card.getAttribute('data-search') || '').toLowerCase();

            const matchesCategory = (currentFilter === 'all' || category === currentFilter);
            const matchesSearch = (!currentSearchTerm || searchData.includes(currentSearchTerm));

            if (matchesCategory && matchesSearch) {
                card.classList.remove('is-hidden');
            } else {
                card.classList.add('is-hidden');
            }
        });
    };

    filterChips.forEach(chip => {
        chip.addEventListener('click', function() {
            filterChips.forEach(c => {
                c.classList.remove('active');
                c.setAttribute('aria-selected', 'false');
            });
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            currentFilter = this.getAttribute('data-filter');
            filterMaterials();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            currentSearchTerm = e.target.value.trim().toLowerCase();
            filterMaterials();
        });
    }

    /* ----------------------------------------------------------------------
       G. SECTION 7: Global Waste Insights SVG Chart Dynamic Rendering & Animation
       ---------------------------------------------------------------------- */
    let chartsAnimatedOnce = false;

    const renderInsightsCharts = () => {
        const perCapitaContainer = document.getElementById('perCapitaChartContainer');
        const diversionContainer = document.getElementById('diversionChartContainer');

        if (!perCapitaContainer || !diversionContainer) return;

        // Render Chart 1: Per Capita MSW
        let svg1 = `<svg viewBox="0 0 400 180" class="chart-svg-full" aria-label="Per Capita Waste Generation Chart">`;
        svg1 += `<line x1="100" y1="30" x2="380" y2="30" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
        svg1 += `<line x1="100" y1="70" x2="380" y2="70" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
        svg1 += `<line x1="100" y1="110" x2="380" y2="110" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
        svg1 += `<line x1="100" y1="150" x2="380" y2="150" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;

        SENSONEO_BENCHMARK_2025.perCapitaMSW.forEach((item, index) => {
            const y = 24 + (index * 40);
            const textY = y + 12;
            const targetWidth = Math.round((item.widthPct / 100) * 250);

            svg1 += `<text x="90" y="${textY}" font-family="IBM Plex Mono" font-size="10" fill="#C8CDC4" text-anchor="end">${item.country}</text>`;
            svg1 += `<rect class="chart-bar-anim" id="bar1-${index}" x="100" y="${y}" width="0" height="16" rx="2" fill="${item.color}" data-width="${targetWidth}"/>`;
            svg1 += `<text x="${108 + targetWidth}" y="${textY}" font-family="IBM Plex Mono" font-size="10" fill="${item.color}" font-weight="bold">${item.val} ${item.unit}</text>`;
        });
        svg1 += `</svg>`;
        perCapitaContainer.innerHTML = svg1;

        // Render Chart 2: Diversion Rates
        let svg2 = `<svg viewBox="0 0 400 180" class="chart-svg-full" aria-label="Landfill Diversion Rates Chart">`;
        svg2 += `<line x1="100" y1="30" x2="380" y2="30" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
        svg2 += `<line x1="100" y1="70" x2="380" y2="70" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
        svg2 += `<line x1="100" y1="110" x2="380" y2="110" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
        svg2 += `<line x1="100" y1="150" x2="380" y2="150" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;

        SENSONEO_BENCHMARK_2025.diversionRates.forEach((item, index) => {
            const y = 24 + (index * 40);
            const textY = y + 12;
            const targetWidth = Math.round((item.widthPct / 100) * 250);

            svg2 += `<text x="90" y="${textY}" font-family="IBM Plex Mono" font-size="10" fill="#C8CDC4" text-anchor="end">${item.country}</text>`;
            svg2 += `<rect class="chart-bar-anim" id="bar2-${index}" x="100" y="${y}" width="0" height="16" rx="2" fill="${item.color}" data-width="${targetWidth}"/>`;
            svg2 += `<text x="${108 + targetWidth}" y="${textY}" font-family="IBM Plex Mono" font-size="10" fill="${item.color}" font-weight="bold">${item.val}${item.unit}</text>`;
        });
        svg2 += `</svg>`;
        diversionContainer.innerHTML = svg2;
    };

    const animateChartBars = () => {
        if (chartsAnimatedOnce) return;
        chartsAnimatedOnce = true;

        const allBars = document.querySelectorAll('.chart-bar-anim');
        allBars.forEach(bar => {
            const targetW = bar.getAttribute('data-width');
            setTimeout(() => {
                bar.setAttribute('width', targetW);
            }, 100);
        });
    };

    renderInsightsCharts();

    // Section reveal & single-trigger bar chart animation
    const insightsSection = document.querySelector('.insights-section');
    if (insightsSection && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateChartBars();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        observer.observe(insightsSection);
    } else {
        animateChartBars();
    }

    /* ----------------------------------------------------------------------
       H. SECTION 9: Accessible Legal Modals Handler
       ---------------------------------------------------------------------- */
    const legalTriggers = document.querySelectorAll('.legal-modal-trigger');
    const modalOverlay = document.getElementById('legalModalOverlay');
    const modalBody = document.getElementById('legalModalBody');
    const closeModalBtn = document.getElementById('closeLegalModal');

    const LEGAL_CONTENTS = {
        privacy: `
            <h3>Privacy Policy</h3>
            <p>Rixle Private Limited ("Rixle") is committed to protecting corporate and individual privacy. We collect personal information (such as name, email, phone, and company details) solely to fulfill business inquiries, material quotes, and regulatory compliance communications.</p>
            <p>Under no circumstances do we sell or commercialize visitor data. All submission records are encrypted and stored in compliance with Indian Information Technology regulations.</p>
        `,
        terms: `
            <h3>Terms of Service</h3>
            <p>All content, material specifications, and technical documentation provided on this website are for informational and B2B inquiry purposes. Secondary raw material specifications are subject to batch sampling protocols.</p>
            <p>Unauthorized copying of Rixle's proprietary process descriptions, vector schematics, or branding elements is prohibited under applicable intellectual property laws.</p>
        `,
        cookie: `
            <h3>Cookie Policy</h3>
            <p>This website utilizes essential session cookies solely to maintain UI state, accessibility preferences, and form anti-spam protection. We do not use intrusive third-party tracking or advertising cookies.</p>
        `,
        accessibility: `
            <h3>Accessibility Statement</h3>
            <p>Rixle Private Limited is dedicated to ensuring digital accessibility for all users, striving to conform to WCAG 2.1 AA guidelines. Features include keyboard navigation support, high-contrast typography ratios, and explicit screen-reader ARIA states.</p>
        `
    };

    legalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modalKey = trigger.getAttribute('data-modal');
            if (LEGAL_CONTENTS[modalKey] && modalOverlay && modalBody) {
                modalBody.innerHTML = LEGAL_CONTENTS[modalKey];
                modalOverlay.classList.add('is-active');
                modalOverlay.setAttribute('aria-hidden', 'false');
            }
        });
    });

    if (closeModalBtn && modalOverlay) {
        closeModalBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('is-active');
            modalOverlay.setAttribute('aria-hidden', 'true');
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('is-active');
                modalOverlay.setAttribute('aria-hidden', 'true');
            }
        });
    }

    /* ----------------------------------------------------------------------
       I. IntersectionObserver Reveal Animation Handlers
       ---------------------------------------------------------------------- */
    const revealSections = document.querySelectorAll('.about-section, .services-section, .tech-section, .case-studies-section, .contact-section');
    if (revealSections.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        revealSections.forEach(sec => observer.observe(sec));
    }
});
