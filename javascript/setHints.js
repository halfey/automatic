let locale = {
  data: [],
  timeout: null,
  finished: false,
  type: 2,
  el: null,
}

function tooltipCreate() {
  locale.el = document.createElement('div');
  locale.el.className = 'tooltip';
  locale.el.id = 'tooltip-container';
  locale.el.innerText = 'this is a hint'
  gradioApp().appendChild(locale.el);
  if (window.opts.tooltips === 'None') locale.type = 0;
  if (window.opts.tooltips === 'Browser default') locale.type = 1;
  if (window.opts.tooltips === 'UI tooltips') locale.type = 2;
}

async function tooltipShow(e) {
  if (e.target.dataset.hint) {
    locale.el.classList.add('tooltip-show');
    locale.el.innerHTML = `<b>${e.target.textContent}</b><br>${e.target.dataset.hint}`;
  }
}

async function tooltipHide(e) {
  locale.el.classList.remove('tooltip-show');
}

async function validateHints(elements, data) {
  let original = elements.map(e => e.textContent.trim()).sort((a, b) => a > b)
  original = [...new Set(original)];
  console.log('hints-differences', { elements: original.length, hints: data.length });
  const current = data.map(e => e.label).sort((a, b) => a > b)
  let missing = [];
  for (let i = 0; i < original.length; i++) {
    if (!current.includes(original[i])) missing.push(original[i]);
  }
  console.log('missing in locale:', missing)
  missing = [];
  for (let i = 0; i < current.length; i++) {
    if (!original.includes(current[i])) missing.push(current[i]);
  }
  console.log('in locale but not ui:', missing)
}

async function setHints() {
  if (locale.finished) return;
  if (locale.data.length === 0) {
    const res = await fetch('/file=html/locale_en.json');
    const json = await res.json(); 
    locale.data = Object.values(json).flat();
  }
  const elements = [
    ...Array.from(gradioApp().querySelectorAll('button')),
    ...Array.from(gradioApp().querySelectorAll('label > span')),
  ];
  if (elements.length === 0) return;
  if (Object.keys(opts).length === 0) return;
  if (!locale.el) {
    tooltipCreate();
    logMonitorCreate();
  }
  let localized = 0;
  let hints = 0;
  locale.finished = true;
  for (el of elements) {
    const found = locale.data.find(l => l.label === el.textContent.trim());
    if (found?.localized?.length > 0) {
      localized++;
      el.textContent = found.localized;
    }
    if (found?.hint?.length > 0) {
      hints++;
      if (locale.type === 1) {
        el.title = found.hint;
      } else if (locale.type === 2) {
        el.dataset.hint = found.hint;
        el.addEventListener('mouseover', tooltipShow);
        el.addEventListener('mouseout', tooltipHide);
      } else {
        // tooltips disabled
      }
    }
  }
  console.log('set-hints', { type: locale.type, elements: elements.length, localized, hints, data: locale.data.length });
  // validateHints(elements, locale.data)
}

onAfterUiUpdate(async () => {
  if (locale.timeout) clearTimeout(locale.timeout);
  locale.timeout = setTimeout(setHints, 250)
});
