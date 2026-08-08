/**
 * Rixle - Application Engine & Scroll Effects
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Rixle Industrial Platform Engine Active.');

  // Navbar Scroll Trigger State
  const navbar = document.getElementById('mainNav');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // Local Gallery Fallback Guard
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('error', () => {
      img.src = 'assets/gallery/plant.jpg';
      img.alt = 'Rixle Facility Operations';
    });
  });

  // Safe Scroll Motion Animation Observer
  const scrollElements = document.querySelectorAll('.animate-on-scroll');
  
  const elementInView = (el) => {
    if (!el) return false;
    const elementTop = el.getBoundingClientRect().top;
    return (elementTop <= (window.innerHeight || document.documentElement.clientHeight) / 1.2);
  };

  const handleScrollAnimation = () => {
    scrollElements.forEach((el) => {
      if (elementInView(el)) {
        el.classList.add('animated');
      }
    });
  };

  window.addEventListener('scroll', handleScrollAnimation);
  handleScrollAnimation();

  // Smooth Anchor Navigation
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // Contact Form Submission Wiring
  // The actual validation + Supabase insert logic lives in
  // window.handleContactFormSubmit (assets/js/supabase-client.js).
  // This just connects the form's submit event to that handler so
  // the browser never performs its default full-page submission.
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      if (typeof window.handleContactFormSubmit === 'function') {
        window.handleContactFormSubmit(event);
      } else {
        event.preventDefault();
        console.error('Contact form handler is unavailable. Submission blocked.');
      }
    });
  }
});
