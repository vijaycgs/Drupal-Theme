(function (Drupal, once) {
  'use strict';

  function closeMegaPanels() {
    document.querySelectorAll('.mega-panel').forEach(panel => {
      panel.hidden = true;
      panel.previousElementSibling?.setAttribute('aria-expanded', 'false');
    });
  }

  Drupal.behaviors.indMegaMenu = {
    attach(context) {
      once('mega-menu', '.level-0-link[data-toggle="mega"]', context).forEach(link => {
        link.addEventListener('click', function (event) {
          event.preventDefault();
          const panel = this.closest('.menu-item')?.querySelector('.mega-panel');
          if (!panel) return;
          const isOpen = !panel.hidden;
          closeMegaPanels();
          if (!isOpen) {
            panel.hidden = false;
            this.setAttribute('aria-expanded', 'true');
          }
        });
      });
      once('mega-menu-global', document.documentElement).forEach(() => {
        document.addEventListener('click', event => {
          if (!event.target.closest('.main-navigation')) closeMegaPanels();
        });
        document.addEventListener('keydown', event => {
          if (event.key === 'Escape') closeMegaPanels();
        });
      });
    }
  };

  // Superfish can create its mobile toggle after Drupal behaviors attach.
  function initMobileToggle() {
    const toggle = document.getElementById('superfish-main-toggle');
    if (!toggle || toggle.classList.contains('processed')) return;
    toggle.classList.add('processed');
    toggle.replaceChildren(...Array.from({ length: 3 }, () => {
      const bar = document.createElement('span');
      bar.className = 'bar';
      return bar;
    }));
    toggle.addEventListener('click', event => {
      event.preventDefault();
      toggle.setAttribute('aria-expanded', String(toggle.classList.toggle('open')));
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileToggle);
  } else {
    initMobileToggle();
  }
  window.addEventListener('resize', initMobileToggle);

  Drupal.behaviors.footerToggle = {
    attach(context) {
      once('footer-toggle', '.footer-toggle', context).forEach(button => {
        button.addEventListener('click', () => {
          const expanded = button.getAttribute('aria-expanded') === 'true';
          button.setAttribute('aria-expanded', String(!expanded));
          document.getElementById('footerMenu')?.classList.toggle('is-open');
        });
      });
    }
  };

  const fontSizeStorageKey = 'indbase.currentFontSize';
  let currentFontSize = 100;
  let hasSavedFontSize = false;
  try {
    const savedFontSize = Number(window.sessionStorage.getItem(fontSizeStorageKey));
    if (Number.isInteger(savedFontSize) && savedFontSize >= 80 && savedFontSize <= 150) {
      currentFontSize = savedFontSize;
      hasSavedFontSize = true;
    }
  } catch {
    // Font controls still work when browser storage is unavailable.
  }
  Drupal.behaviors.fontResize = {
    attach(context) {
      if (hasSavedFontSize) {
        document.documentElement.style.setProperty('--indbase-body-font-size', currentFontSize + '%');
      }
      once('font-resize', '.font-increase, .font-decrease, .font-reset', context).forEach(button => {
        button.addEventListener('click', () => {
          if (button.classList.contains('font-increase')) {
            currentFontSize = Math.min(150, currentFontSize + 10);
          } else if (button.classList.contains('font-decrease')) {
            currentFontSize = Math.max(80, currentFontSize - 10);
          } else {
            currentFontSize = 100;
          }
          document.documentElement.style.setProperty('--indbase-body-font-size', currentFontSize + '%');
          hasSavedFontSize = true;
          try {
            window.sessionStorage.setItem(fontSizeStorageKey, String(currentFontSize));
          } catch {
            // Keep the selected size for this page when storage is unavailable.
          }
        });
      });
    }
  };

  Drupal.behaviors.scrollTop = {
    attach(context) {
      once('scroll-top', '#scrollTopBtn', context).forEach(button => {
        const update = () => button.classList.toggle('show', window.scrollY > 300);
        window.addEventListener('scroll', update, { passive: true });
        update();
        button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      });
    }
  };

  Drupal.behaviors.externalLinks = {
    attach(context) {
      once('external-links', 'a[href]', context).forEach(link => {
        if (link.href && link.hostname && link.hostname !== window.location.hostname) {
          link.classList.add('external-link');
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        }
      });
    }
  };

  Drupal.behaviors.downloadModal = {
    attach(context) {
      once('downloadModal', '.download-link,a[target="_blank"],.external-link', context).forEach(link => {
        link.addEventListener('click', event => {
          const modal = document.getElementById('downloadModal');
          const proceed = document.getElementById('proceedDownload');
          const description = document.getElementById('modalDescription');
          if (!modal || !proceed || !description) return;
          event.preventDefault();
          description.textContent = link.classList.contains('download-link')
            ? 'Are you sure you want to download this utility?'
            : 'This screen shall take you to a web page outside IND Portal.For any queries regarding the content of the linked page, please contact the webmaster of the concerned website.';
          const href = link.getAttribute('href');
          if (href !== null) proceed.setAttribute('href', href);
          modal.classList.add('show');
        });
      });
      once('close-download-modal', '#proceedDownload, #cancelDownload', context).forEach(button => {
        button.addEventListener('click', () => document.getElementById('downloadModal')?.classList.remove('show'));
      });
    }
  };

  Drupal.behaviors.externalLinkIcon = {
    attach(context) {
      once('externalLinkIcon', 'a.external-link-square', context).forEach(link => {
        const icon = document.createElement('i');
        icon.className = 'fa fa-external-link-square';
        icon.setAttribute('aria-hidden', 'true');
        link.append(' ', icon);
      });
    }
  };

  // Native animations retain the loader's 100 ms fade and cancel previous fades.
  let loaderAnimation;
  function fadeLoader(show) {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    const opacity = getComputedStyle(loader).display === 'none' ? '0' : getComputedStyle(loader).opacity;
    loaderAnimation?.cancel();
    if (show) loader.style.display = 'block';
    const animation = loader.animate([{ opacity }, { opacity: show ? 1 : 0 }], { duration: 100, fill: 'forwards' });
    loaderAnimation = animation;
    animation.onfinish = () => {
      loader.style.display = show ? 'block' : 'none';
      animation.cancel();
      if (loaderAnimation === animation) loaderAnimation = null;
    };
  }
  window.addEventListener('pageshow', () => fadeLoader(false));
  window.addEventListener('load', () => fadeLoader(false));
  if (document.readyState === 'complete') fadeLoader(false);

  Drupal.behaviors.pageLoader = {
    attach(context) {
      if (document.body.classList.contains('path-admin')) return;
      once('page-loader', 'a', context).forEach(link => {
        link.addEventListener('click', event => {
          const href = link.getAttribute('href');
          if (!event.defaultPrevented && !link.classList.contains('use-ajax') &&
              href && !href.startsWith('#') && href !== '/' && !link.getAttribute('target')) {
            fadeLoader(true);
          }
        });
      });
    }
  };

  Drupal.behaviors.policyPage = {
    attach(context) {
      once('policy-page', '.policy-page', context).forEach(page => {
        const right = page.querySelector('.policy-right');
        const contents = Array.from(page.querySelectorAll('.policy-contents'));
        const links = Array.from(page.querySelectorAll('.policy-link'));
        contents.forEach(content => {
          if (right) right.append(content);
          content.style.display = 'none';
        });
        if (contents[0]) contents[0].style.display = 'block';
        links[0]?.classList.add('active');
        links.forEach(link => {
          link.addEventListener('click', () => {
            links.forEach(button => button.classList.remove('active'));
            link.classList.add('active');
            contents.forEach(content => { content.style.display = 'none'; });
            const target = document.getElementById(link.dataset.policy);
            if (target) target.style.display = 'block';
          });
        });
      });
    }
  };

  Drupal.behaviors.skipLink = {
    attach(context) {
      once('skip-link', '.skip-link', context).forEach(link => {
        link.addEventListener('click', event => {
          event.preventDefault();
          const main = document.getElementById('main-content');
          if (!main) return;
          main.setAttribute('tabindex', '-1');
          main.focus({ preventScroll: true });
          main.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }
  };
})(Drupal, once);
