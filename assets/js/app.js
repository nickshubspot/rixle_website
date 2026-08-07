/**
 * Rixle Ecosol - Application Engine & Scroll Effects
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Rixle Ecosol Platform Engine Active.');

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

  // Image Fallback Guard
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('error', () => {
      img.src = 'assets/gallery/hero-bg.webp';
      img.alt = 'Rixle Ecosol Facility Operations';
    });
  });

  // Scroll Motion Animation Observer
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
});
