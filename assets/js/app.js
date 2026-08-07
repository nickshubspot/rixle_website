/**
 * Rixle Ecosol - Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Rixle Ecosol application initialized.');

  // Image Fallback Handling for Network or Path Failures
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    img.addEventListener('error', () => {
      console.warn(`Failed to load image: ${img.src}. Applying resilient fallback.`);
      img.src = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80';
      img.alt = 'Material Recovery Facility - Recycling Operations Placeholder';
    });
  });

  // Smooth Scrolling for Internal Hash Anchors
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
