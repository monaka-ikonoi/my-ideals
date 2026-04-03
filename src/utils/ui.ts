export function scrollPageToTop() {
  // For long-distance scroll on virtualized lists, native smooth scroll
  // may not animate reliably, so first jump near the top, then smooth scroll.
  if (window.scrollY > window.innerHeight) {
    window.scrollTo(0, window.innerHeight);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 10);

    return;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
