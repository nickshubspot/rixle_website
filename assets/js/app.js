/**
 * Rixle — Application Engine & Scroll Effects  v2.0
 *
 * PROTECTED: Do not modify contact form submission logic.
 * That lives in assets/js/supabase-client.js.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Rixle Industrial Platform Engine Active.');

  // ──────────────────────────────────────────────────────────────
  // 1. NAVBAR — Scrolled State
  //    Adds .scrolled when user scrolls beyond 60px.
  //    CSS in main.css responds to .navbar-transparent.scrolled
  // ──────────────────────────────────────────────────────────────
  const navbar = document.getElementById('mainNav');

  if (navbar) {
    const onNavScroll = () => {
      if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onNavScroll, { passive: true });
    onNavScroll(); // Run once on load in case page is already scrolled
  }

  // ──────────────────────────────────────────────────────────────
  // 2. ACTIVE NAV LINK TRACKING
  //    Uses IntersectionObserver to highlight the current section
  //    link in the nav bar as the user scrolls.
  // ──────────────────────────────────────────────────────────────
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('#navbarNav .nav-link[href^="#"]');

  const setActiveLink = (id) => {
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      // Map section IDs to nav link hrefs
      const isMatch =
        href === '#' + id ||
        // pillars section → "Waste Management" link
        (id === 'pillars' && href === '#pillars') ||
        // solutions/textile → "Material Trading" or "Textile Recycling"
        (id === 'solutions' && href === '#solutions') ||
        (id === 'textile' && href === '#textile');
      link.classList.toggle('active', isMatch);
    });
  };

  if (sections.length > 0 && navLinks.length > 0) {
    const navHeight = navbar ? navbar.offsetHeight : 80;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: `-${navHeight + 10}px 0px -55% 0px`,
        threshold: 0,
      }
    );

    sections.forEach(section => observer.observe(section));
  }

  // ──────────────────────────────────────────────────────────────
  // 3. SCROLL ANIMATION (IntersectionObserver)
  //    Elements with .animate-on-scroll receive .animated when
  //    they enter the viewport. CSS in main.css handles the
  //    opacity + transform transition.
  // ──────────────────────────────────────────────────────────────
  const scrollElements = document.querySelectorAll('.animate-on-scroll');

  if (scrollElements.length > 0) {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReduced) {
      // Skip animation entirely — reveal immediately
      scrollElements.forEach(el => el.classList.add('animated'));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animated');
              // Stop observing once animated — improves performance
              revealObserver.unobserve(entry.target);
            }
          });
        },
        {
          root: null,
          rootMargin: '0px 0px -8% 0px',
          threshold: 0.08,
        }
      );

      scrollElements.forEach(el => revealObserver.observe(el));
    }
  }

  // ──────────────────────────────────────────────────────────────
  // 4. SCROLL-TO-TOP BUTTON
  //    Shows after user scrolls down 400px.
  // ──────────────────────────────────────────────────────────────
  const scrollToTopBtn = document.getElementById('scrollToTop');

  if (scrollToTopBtn) {
    window.addEventListener(
      'scroll',
      () => {
        scrollToTopBtn.classList.toggle('visible', window.scrollY > 400);
      },
      { passive: true }
    );

    scrollToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ──────────────────────────────────────────────────────────────
  // 5. IMAGE ERROR FALLBACK (scoped — card images only)
  //    Replaces broken card images with hero.jpg fallback.
  //    Logo and nav images are intentionally excluded.
  // ──────────────────────────────────────────────────────────────
  const cardImages = document.querySelectorAll('.card-img-top, .card-img-sm');
  cardImages.forEach(img => {
    img.addEventListener('error', () => {
      const fallbackSrc = 'assets/gallery/hero.jpg';
      if (!img.src.endsWith(fallbackSrc)) {
        img.src = fallbackSrc;
        img.alt = 'Rixle Industrial Operations';
      }
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 6. SMOOTH ANCHOR NAVIGATION
  //    Also closes the mobile navbar collapse after click.
  // ──────────────────────────────────────────────────────────────
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          const navHeight = navbar ? navbar.offsetHeight : 80;
          const targetTop =
            targetElement.getBoundingClientRect().top +
            window.scrollY -
            navHeight;
          window.scrollTo({ top: targetTop, behavior: 'smooth' });

          // Close mobile collapse if open
          const navCollapse = document.getElementById('navbarNav');
          if (navCollapse && navCollapse.classList.contains('show')) {
            const bsCollapse = window.bootstrap
              ? window.bootstrap.Collapse.getInstance(navCollapse)
              : null;
            if (bsCollapse) bsCollapse.hide();
          }
        }
      }
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 7. CONTACT FORM WIRING
  //    Connects the form's submit event to window.handleContactFormSubmit
  //    which is defined in assets/js/supabase-client.js.
  //    DO NOT modify the form ID or the handler name.
  // ──────────────────────────────────────────────────────────────
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      if (typeof window.handleContactFormSubmit === 'function') {
        window.handleContactFormSubmit(event);
      } else {
        event.preventDefault();
        console.error(
          'Contact form handler is unavailable. Submission blocked.'
        );
      }
    });
  }

  // ──────────────────────────────────────────────────────────────
  // 8. FAQ ACCORDION HANDLER
  //    Ensures FAQ items open on click/tap, close on second click/tap,
  //    synchronize aria-expanded attributes, and support keyboard
  //    accessibility with zero console errors. Uses stopPropagation()
  //    to prevent event bubbling to Bootstrap's global listener.
  // ──────────────────────────────────────────────────────────────
  const faqAccordion = document.getElementById('faqAccordion');
  if (faqAccordion) {
    const faqButtons = faqAccordion.querySelectorAll('.accordion-button');
    faqButtons.forEach(button => {
      button.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const targetId = this.getAttribute('data-bs-target');
        const targetEl = targetId ? document.querySelector(targetId) : null;
        if (!targetEl) return;

        const isCurrentlyOpen = targetEl.classList.contains('show');

        // Close all accordion collapses in parent
        const siblingButtons = faqAccordion.querySelectorAll('.accordion-button');
        const siblingCollapses = faqAccordion.querySelectorAll('.accordion-collapse');
        siblingCollapses.forEach(c => c.classList.remove('show'));
        siblingButtons.forEach(b => {
          b.classList.add('collapsed');
          b.setAttribute('aria-expanded', 'false');
        });

        // Toggle current item
        if (!isCurrentlyOpen) {
          targetEl.classList.add('show');
          this.classList.remove('collapsed');
          this.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // ──────────────────────────────────────────────────────────────
  // 9. FLOATING CONTACT BAR FOOTER OBSERVER
  //    Detects when page footer enters viewport and toggles
  //    .footer-active on the floating bar so legal links remain
  //    unobscured and 100% clickable at all times.
  // ──────────────────────────────────────────────────────────────
  const quickBar = document.getElementById('quickContactBar');
  const pageFooter = document.querySelector('footer');
  if (quickBar && pageFooter) {
    const footerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            quickBar.classList.add('footer-active');
          } else {
            quickBar.classList.remove('footer-active');
          }
        });
      },
      {
        root: null,
        threshold: 0.02,
      }
    );
    footerObserver.observe(pageFooter);
  }
});
