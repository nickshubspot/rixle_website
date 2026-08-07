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

  // Animated Counters for Trust / Statistics Section
  const counters = document.querySelectorAll('.counter');
  let animated = false;

  const animateCounters = () => {
    counters.forEach(counter => {
      const target = +counter.getAttribute('data-target');
      const speed = 200;
      const increment = target / speed;

      const updateCount = () => {
        const count = +counter.innerText.replace('+', '');
        if (count < target) {
          counter.innerText = Math.ceil(count + increment);
          setTimeout(updateCount, 15);
        } else {
          counter.innerText = target.toLocaleString() + '+';
        }
      };

      updateCount();
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        animateCounters();
      }
    });
  }, { threshold: 0.5 });

  const statsSection = document.querySelector('#stats');
  if (statsSection) {
    observer.observe(statsSection);
  }
});
