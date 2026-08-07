/**
 * Rixle Ecosol - Industrial Application & Motion Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Rixle Ecosol Industrial Platform Initialized.');

  // LEVEL 13: Image Fallback & Laziness Guard
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('error', () => {
      console.warn(`Fallback triggered for: ${img.src}`);
      img.src = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80';
      img.alt = 'Rixle Ecosol Industrial Facility Operations';
    });
  });

  // LEVEL 4: Scroll Animation Observer (Fade Up & Slide In)
  const scrollElements = document.querySelectorAll('.animate-on-scroll');
  
  const elementInView = (el, dividend = 1.25) => {
    const elementTop = el.getBoundingClientRect().top;
    return (elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend);
  };

  const displayScrollElement = (element) => {
    element.classList.add('animated');
  };

  const handleScrollAnimation = () => {
    scrollElements.forEach((el) => {
      if (elementInView(el)) {
        displayScrollElement(el);
      }
    });
  };

  window.addEventListener('scroll', () => {
    handleScrollAnimation();
  });

  // Trigger once on load for above-the-fold
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
