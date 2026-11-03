const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');

function closeMenu() {
  if (!menuButton || !mobileNav) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  mobileNav.hidden = true;
  document.body.classList.remove('menu-open');
}

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  if (isOpen) return closeMenu();
  menuButton.setAttribute('aria-expanded', 'true');
  menuButton.setAttribute('aria-label', 'Close menu');
  mobileNav.hidden = false;
  document.body.classList.add('menu-open');
});
mobileNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

const form = document.querySelector('#quote-form');
const success = document.querySelector('#form-success');
document.querySelectorAll('[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    if (!form) return;
    form.hidden = false;
    success.hidden = true;
    document.querySelector('#service').value = link.dataset.service;
  });
});

let requestId = crypto.randomUUID();
let submittedPayload = null;
form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const button = form.querySelector('[type="submit"]');
  const label = button.querySelector('.button-label');
  const error = document.querySelector('#form-error');
  const values = Object.fromEntries(new FormData(form).entries());
  const payload = JSON.stringify(values);
  // A timed-out retry uses the same key; an edited request becomes a new submission.
  if (submittedPayload !== null && submittedPayload !== payload) requestId = crypto.randomUUID();
  submittedPayload = payload;
  button.disabled = true;
  label.textContent = 'Sending your request…';
  error.hidden = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Idempotency-Key': requestId },
      body: payload,
      signal: controller.signal
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Your request could not be saved. Please try again.');
    if (!result.reference) throw new Error('We could not confirm receipt. Please try again or call us.');
    document.querySelector('#quote-reference').textContent = result.reference;
    document.querySelector('#artwork-link').href = `mailto:erik@gosolidsite.com?subject=${encodeURIComponent(`Signage project ${result.reference} — artwork and photos`)}`;
    form.hidden = true;
    success.hidden = false;
    success.focus({ preventScroll: true });
    success.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    form.reset();
    requestId = crypto.randomUUID();
    submittedPayload = null;
  } catch (failure) {
    error.textContent = failure.name === 'AbortError'
      ? 'We couldn’t confirm receipt in time. Your details are still here—try again, or call (713) 912-2151.'
      : `${failure.message} You can also call (713) 912-2151 or email erik@gosolidsite.com.`;
    error.hidden = false;
  } finally {
    clearTimeout(timeout);
    button.disabled = false;
    label.textContent = 'Request a quote';
  }
});

document.querySelector('#another-project')?.addEventListener('click', () => {
  success.hidden = true;
  form.hidden = false;
  document.querySelector('#name').focus();
});
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
