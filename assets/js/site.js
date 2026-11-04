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

  // Interactive Project Details Pop-up Modal / Lightbox
  const lightbox = $('#lightbox');
  if (lightbox) {
    const lightboxImg = $('.lightbox-img', lightbox);
    const lightboxBadge = $('#lightboxBadge', lightbox);
    const lightboxCat = $('#lightboxCat', lightbox);
    const lightboxTitle = $('#lightboxTitle', lightbox);
    const lightboxDesc = $('#lightboxDesc', lightbox);
    const lightboxSpecs = $('#lightboxSpecs', lightbox);
    const lightboxWaBtn = $('#lightboxWaBtn', lightbox);
    const lightboxCallBtn = $('#lightboxCallBtn', lightbox);
    const prevBtn = $('#lightboxPrev', lightbox) || $('.lightbox-prev', lightbox);
    const nextBtn = $('#lightboxNext', lightbox) || $('.lightbox-next', lightbox);

    const getProjectItems = () => {
      // Find cards in gallery (filter out hidden by category filter) or featured items
      const galleryCards = $$('.project-gallery .gallery-card').filter(card => !card.hidden);
      if (galleryCards.length) return galleryCards;
      const featured = $$('.project-feature[data-lightbox]');
      return featured.length ? featured : $$('[data-lightbox]');
    };

    let currentIndex = 0;
    let returnFocus = null;

    const extractItemData = el => {
      const btn = $('button[data-lightbox]', el) || el;
      const img = $('img', el);
      const title = el.dataset.title || btn.dataset.title || $('h3', el)?.textContent || $('strong', el)?.textContent || 'Deccan Hi-Tech Project';
      const category = el.dataset.categoryTag || $('.gallery-category', el)?.textContent || $('small', el)?.textContent || 'INFRASTRUCTURE';
      const imgSrc = el.dataset.lightbox || btn.dataset.lightbox || img?.src || '';
      const desc = el.dataset.desc || $('p', el)?.textContent || 'High-durability civil and road infrastructure executed in strict compliance with MoRTH and IRC standards.';
      const rawSpecs = el.dataset.specs || '';
      const specs = rawSpecs ? rawSpecs.split('|').map(s => s.trim()) : [
        'Class-A Registered Special Contractor Execution',
        'Strict MoRTH & IRC Technical Code Compliance',
        'Mobilized Heavy Fleet & Continuous QC Testing'
      ];
      return { title, category, imgSrc, desc, specs };
    };

    const showItem = index => {
      const items = getProjectItems();
      if (!items.length) return;
      currentIndex = (index + items.length) % items.length;
      const el = items[currentIndex];
      const data = extractItemData(el);

      if (lightboxImg) {
        lightboxImg.src = data.imgSrc;
        lightboxImg.alt = data.title;
      }
      if (lightboxBadge) {
        lightboxBadge.textContent = data.category.split('/')[0].trim() || 'PROJECT DETAILS';
      }
      if (lightboxCat) {
        lightboxCat.textContent = data.category;
      }
      if (lightboxTitle) {
        lightboxTitle.textContent = data.title;
      }
      if (lightboxDesc) {
        lightboxDesc.textContent = data.desc;
      }
      if (lightboxSpecs) {
        lightboxSpecs.innerHTML = data.specs.map(s => `<li>${s}</li>`).join('');
      }
      if (lightboxWaBtn) {
        const text = encodeURIComponent(`Hello Deccan Hi-Tech (Managing Partners: Abubakar Bahamam / Omer Bahamam), I would like to inquire regarding project: ${data.title} (${data.category}). Please provide scope details and technical credentials.`);
        lightboxWaBtn.href = `https://wa.me/919849950133?text=${text}`;
      }
      if (lightboxCallBtn) {
        lightboxCallBtn.href = 'tel:+919849950133';
      }
    };

    const openLightbox = (el, index) => {
      returnFocus = el;
      showItem(index);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const closeBtn = $('.lightbox-close', lightbox);
      if (closeBtn) closeBtn.focus();
    };

    const closeLightbox = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (returnFocus) returnFocus.focus();
    };

    // Bind triggers on gallery cards and buttons
    const bindTriggers = () => {
      const allCards = $$('.gallery-card');
      if (allCards.length) {
        allCards.forEach(card => {
          card.addEventListener('click', e => {
            const visibleItems = getProjectItems();
            const idx = visibleItems.indexOf(card);
            if (idx !== -1) {
              e.preventDefault();
              openLightbox(card, idx);
            }
          });
        });
      } else {
        const triggers = $$('[data-lightbox]');
        triggers.forEach((trigger, idx) => {
          trigger.addEventListener('click', e => {
            e.preventDefault();
            const visibleItems = getProjectItems();
            const index = visibleItems.indexOf(trigger) !== -1 ? visibleItems.indexOf(trigger) : idx;
            openLightbox(trigger, index);
          });
        });
      }
    };

    bindTriggers();

    // Close buttons & overlay click
    $$('[data-close-lightbox]', lightbox).forEach(btn => btn.addEventListener('click', closeLightbox));
    const closeBtn = $('.lightbox-close', lightbox);
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

    if (prevBtn) prevBtn.addEventListener('click', e => { e.stopPropagation(); showItem(currentIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', e => { e.stopPropagation(); showItem(currentIndex + 1); });

    lightbox.addEventListener('click', e => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-overlay')) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showItem(currentIndex - 1);
      if (e.key === 'ArrowRight') showItem(currentIndex + 1);
    });
  }

  // Format project enquiries and open a prefilled WhatsApp message to Abubakar Bahamam (+91 98499 50133).
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
        `Attention: Abubakar bin Mohammed Bahamam / Omer bin Mohammed Bahamam (Managing Partners)`,
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
      const whatsappUrl = `https://wa.me/919849950133?text=${encodeURIComponent(message)}`;
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
