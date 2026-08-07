/**
 * Rixle Ecosol - Application Engine & Scroll Effects
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Rixle Ecosol Platform Loaded.');

  // Dynamic Navbar Scroll State
  const navbar = document.getElementById('mainNav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Image Fallback Guard
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('error', () => {
      console.warn(`Fallback triggered for: ${img.src}`);
      img.src = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80';
      img.alt = 'Rixle Ecosol Industrial Operations';
    });
  });

  // Scroll Motion Animation Observer
  const scrollElements = document.querySelectorAll('.animate-on-scroll');
  
  const elementInView = (el, dividend = 1.25) => {
    const elementTop = el.getBoundingClientRect().top;
    return (elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend);
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
