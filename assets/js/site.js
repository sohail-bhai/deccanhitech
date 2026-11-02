(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Make the return-to-top link useful on all pages.
  if (!document.body.id) document.body.id = 'top';
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  // Mobile navigation: expandable, keyboard-friendly and dismisses after navigation.
  const toggle = $('.menu-toggle');
  const nav = $('#primary-nav');
  if (toggle && nav) {
    const closeNav = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      nav.classList.remove('is-open');
      document.body.classList.remove('menu-open');
    };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
    });
    $$('a', nav).forEach(link => link.addEventListener('click', closeNav));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeNav(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 860) closeNav(); });
  }

  // Highlight the current section in the primary navigation.
  const current = location.pathname.split('/').pop() || 'index.html';
  $$('.primary-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === current) {
      link.classList.add('is-current');
      link.setAttribute('aria-current', 'page');
    }
  });

  // Reveal content only when motion is acceptable and IntersectionObserver is available.
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -10px 0px' });
    revealEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('is-visible');
      } else {
        observer.observe(el);
      }
    });
  } else revealEls.forEach(el => el.classList.add('is-visible'));

  // 1. Dynamic Statistics Numerical Counters
  const counters = $$('[data-counter]');
  if (counters.length) {
    const runCounter = el => {
      const target = parseFloat(el.dataset.counter);
      const suffix = el.dataset.suffix || '';
      const duration = 1600;
      const start = performance.now();
      
      const step = now => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out
        const current = Math.floor(ease * target);
        el.textContent = current + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target + suffix;
        }
      };
      requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const counterObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      counters.forEach(c => counterObserver.observe(c));
    } else {
      counters.forEach(c => c.textContent = c.dataset.counter + (c.dataset.suffix || ''));
    }
  }

  // 2. Interactive Before & After Road Comparison Slider
  const slider = document.getElementById('beforeAfterSlider');
  if (slider) {
    let isDragging = false;
    
    const setPosition = (clientX) => {
      const rect = slider.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      slider.style.setProperty('--clip-pos', `${percent}%`);
      const handle = document.getElementById('baHandle');
      if (handle) {
        handle.setAttribute('aria-valuenow', Math.round(percent).toString());
      }
    };

    const startDrag = (clientX) => {
      isDragging = true;
      slider.classList.add('is-dragging');
      setPosition(clientX);
    };

    const moveDrag = (clientX) => {
      if (!isDragging) return;
      setPosition(clientX);
    };

    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      slider.classList.remove('is-dragging');
    };

    // Robust pointer events (covers mouse, touch, and stylus)
    if (window.PointerEvent) {
      slider.addEventListener('pointerdown', (e) => {
        startDrag(e.clientX);
        try { slider.setPointerCapture(e.pointerId); } catch (_) {}
      });
      slider.addEventListener('pointermove', (e) => {
        if (isDragging) moveDrag(e.clientX);
      });
      slider.addEventListener('pointerup', (e) => {
        stopDrag();
        try { slider.releasePointerCapture(e.pointerId); } catch (_) {}
      });
      slider.addEventListener('pointercancel', stopDrag);
    } else {
      // Mouse events
      slider.addEventListener('mousedown', (e) => startDrag(e.clientX));
      window.addEventListener('mousemove', (e) => moveDrag(e.clientX));
      window.addEventListener('mouseup', stopDrag);

      // Touch events
      slider.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 0) startDrag(e.touches[0].clientX);
      }, { passive: true });
      window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 0) moveDrag(e.touches[0].clientX);
      }, { passive: true });
      window.addEventListener('touchend', stopDrag);
    }

    // Keyboard accessibility for the handle
    const handle = document.getElementById('baHandle');
    if (handle) {
      handle.addEventListener('keydown', (e) => {
        let currentPos = parseFloat(getComputedStyle(slider).getPropertyValue('--clip-pos')) || 50;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          const nextPos = Math.max(0, currentPos - 5);
          slider.style.setProperty('--clip-pos', `${nextPos}%`);
          handle.setAttribute('aria-valuenow', Math.round(nextPos).toString());
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          const nextPos = Math.min(100, currentPos + 5);
          slider.style.setProperty('--clip-pos', `${nextPos}%`);
          handle.setAttribute('aria-valuenow', Math.round(nextPos).toString());
        }
      });
    }
  }

  // Portfolio category filters.
  const filters = $$('.filter-button');
  const cards = $$('.project-gallery .gallery-card');
  const count = $('[data-gallery-count]');
  if (filters.length && cards.length) {
    const filterCards = category => {
      let shown = 0;
      cards.forEach(card => {
        const visible = category === 'all' || card.dataset.category === category;
        card.hidden = !visible;
        if (visible) shown++;
      });
      if (count) count.textContent = String(shown);
      filters.forEach(button => {
        const active = button.dataset.filter === category;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    };
    filters.forEach(button => button.addEventListener('click', () => filterCards(button.dataset.filter)));
    const hash = location.hash.replace('#', '');
    if (['roads', 'buildings', 'structures', 'interiors'].includes(hash)) filterCards(hash);
  }

  // Accessible image lightbox for the project gallery.
  const lightbox = $('#lightbox');
  const lightboxImg = lightbox && $('figure img', lightbox);
  const lightboxCaption = lightbox && $('figcaption', lightbox);
  const lightboxItems = () => $$('button[data-lightbox]', $('.project-gallery')).filter(btn => !btn.closest('.gallery-card').hidden);
  let lightboxIndex = 0;
  let returnFocus = null;
  const showLightboxItem = index => {
    const items = lightboxItems();
    if (!items.length || !lightbox) return;
    lightboxIndex = (index + items.length) % items.length;
    const item = items[lightboxIndex];
    lightboxImg.src = item.dataset.lightbox;
    lightboxImg.alt = $('img', item)?.alt || item.dataset.title || 'Project photograph';
    lightboxCaption.textContent = item.dataset.title || '';
  };
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (returnFocus) returnFocus.focus();
  };
  if (lightbox && lightboxImg) {
    $$('button[data-lightbox]').forEach(button => button.addEventListener('click', () => {
      returnFocus = button;
      const visibleItems = lightboxItems();
      lightboxIndex = visibleItems.indexOf(button);
      showLightboxItem(lightboxIndex);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      $('.lightbox-close', lightbox).focus();
    }));
    $('.lightbox-close', lightbox).addEventListener('click', closeLightbox);
    $('.lightbox-prev', lightbox).addEventListener('click', () => showLightboxItem(lightboxIndex - 1));
    $('.lightbox-next', lightbox).addEventListener('click', () => showLightboxItem(lightboxIndex + 1));
    lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', event => {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showLightboxItem(lightboxIndex - 1);
      if (event.key === 'ArrowRight') showLightboxItem(lightboxIndex + 1);
    });
  }

  // Format project enquiries and open a prefilled WhatsApp message.
  const form = $('#enquiry-form');
  const feedback = $('#form-feedback');
  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const fields = new FormData(form);
      const value = name => String(fields.get(name) || '').trim();
      const message = [
        'PROJECT ENQUIRY — DECCAN HI-TECH CONSTRUCTIONS',
        '',
        `Name: ${value('name')}`,
        `Company: ${value('company') || 'Not provided'}`,
        `Email: ${value('email')}`,
        `Phone: ${value('phone') || 'Not provided'}`,
        `Area of interest: ${value('service')}`,
        '',
        'Project details:',
        value('message')
      ].join('\n');
      const whatsappUrl = `https://wa.me/919246520788?text=${encodeURIComponent(message)}`;
      const link = document.createElement('a');
      link.href = whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Open the prepared WhatsApp message';

      if (feedback) {
        feedback.dataset.state = 'success';
        feedback.textContent = 'Your message is ready in WhatsApp. Review it and tap Send. If WhatsApp did not open, ';
        feedback.append(link);
      }
      link.click();
    });
  }
})();
