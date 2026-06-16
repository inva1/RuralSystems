/* ============================================================
   RURAL SYSTEMS — Main JavaScript
   ruralsystems.org
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- 1. Header scroll effect ----
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- 2. Mobile navigation ----
  const navToggle = document.querySelector('.nav-toggle');
  const navMobile = document.querySelector('.nav-mobile');
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navMobile.classList.toggle('open');
      document.body.style.overflow = navMobile.classList.contains('open') ? 'hidden' : '';
    });
    // Close on link click
    navMobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        navMobile.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ---- 3. Scroll reveal animations ----
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });
    reveals.forEach(el => observer.observe(el));
  }

  // ---- 4. Animated counters ----
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => counterObserver.observe(el));
  }

  function animateCounter(el) {
    const target = el.getAttribute('data-counter');
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1500;
    const start = performance.now();

    // Check if target is a decimal
    const isDecimal = target.includes('.');
    const targetNum = parseFloat(target);

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = isDecimal
        ? (targetNum * eased).toFixed(1)
        : Math.floor(targetNum * eased);
      el.textContent = prefix + current + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  // ---- 5. Parallax effect on hero images ----
  const heroSection = document.querySelector('.hero');
  const heroBgImg = document.querySelector('.hero-bg img');
  if (heroSection && heroBgImg) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const heroHeight = heroSection.offsetHeight;
      if (scrolled < heroHeight) {
        const parallax = scrolled * 0.3;
        heroBgImg.style.transform = `translateY(${parallax}px) scale(1.05)`;
      }
    }, { passive: true });
  }

  // ---- 6. Active nav link highlighting ----
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-desktop a, .nav-mobile a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ---- 7. Form handling via Vercel Serverless + Brevo ----
  // All forms POST to /api/contact which sends emails via Brevo
  const CONTACT_API = '/api/contact';

  document.querySelectorAll('form[data-form]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      const originalBg = btn.style.background;
      const formType = form.getAttribute('data-form');

      // Loading state
      btn.textContent = 'Sending...';
      btn.disabled = true;
      btn.style.opacity = '0.7';

      // Collect form data as JSON
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData);
      payload._form_type = formType;

      try {
        const response = await fetch(CONTACT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Success
          btn.textContent = 'Message Received ✓';
          btn.style.background = 'var(--accent-green)';
          btn.style.opacity = '1';
          form.reset();

          setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
            btn.style.background = originalBg;
          }, 4000);
        } else {
          throw new Error(result.error || 'Submission failed');
        }
      } catch (error) {
        // Error state
        btn.textContent = 'Error — Please try again';
        btn.style.background = 'var(--accent-terracotta)';
        btn.style.opacity = '1';

        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
          btn.style.background = originalBg;
        }, 3000);
      }
    });
  });

  // ---- 8. Smooth scroll for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
