// Unifica los avisos de validación nativa, incluidos los selectores personalizados.
export function installFormValidation(container) {
  const errors = new Map();
  let frame;
  let sequence = 0;

  const clear = (input) => {
    const entry = errors.get(input);
    if (!entry) return;
    entry.message.remove();
    if (entry.invalid === null) entry.control.removeAttribute('aria-invalid');
    else entry.control.setAttribute('aria-invalid', entry.invalid);
    if (entry.description === null) entry.control.removeAttribute('aria-describedby');
    else entry.control.setAttribute('aria-describedby', entry.description);
    errors.delete(input);
  };

  const refresh = () => {
    for (const input of errors.keys()) {
      if (!container.contains(input) || input.disabled || input.validity.valid) clear(input);
    }
  };

  const invalid = (event) => {
    const input = event.target;
    if (!input.matches('input, select, textarea')) return;
    event.preventDefault();
    if (!errors.has(input)) {
      const custom = input.classList.contains('sr-only');
      const radio = input.type === 'radio';
      const control = radio
        ? input.closest('label')
        : custom
          ? input.parentElement.querySelector('[data-validation-control], button')
          : input;
      if (!control) return;
      const message = document.createElement('p');
      message.id = `form-validation-${++sequence}-${crypto.randomUUID()}`;
      message.className = 'field-error';
      message.setAttribute('role', 'alert');
      message.textContent =
        input.dataset.validationMessage ||
        (input.validity.valueMissing
          ? input.type === 'checkbox'
            ? 'Debes marcar esta casilla.'
            : custom || input.tagName === 'SELECT'
              ? 'Selecciona una opción.'
              : 'Este campo es obligatorio.'
          : input.validity.typeMismatch && input.type === 'email'
            ? 'Introduce un correo electrónico válido.'
            : input.validationMessage);
      const description = control.getAttribute('aria-describedby');
      const previousInvalid = control.getAttribute('aria-invalid');
      control.setAttribute('aria-invalid', 'true');
      control.setAttribute('aria-describedby', [description, message.id].filter(Boolean).join(' '));
      (radio ? control : custom ? input.parentElement : input).after(message);
      errors.set(input, { control, message, description, invalid: previousInvalid });
    }
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const first = [...errors.values()][0]?.control;
      if (first && !first.matches('input, select, textarea, button, [tabindex]'))
        first.tabIndex = -1;
      first?.focus({ preventScroll: true });
      first?.scrollIntoView({ block: 'center', behavior: 'auto' });
    });
  };

  const observer = new MutationObserver(refresh);
  observer.observe(container, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['value', 'disabled', 'required'],
  });
  container.addEventListener('invalid', invalid, true);
  container.addEventListener('input', refresh);
  container.addEventListener('change', refresh);
  return () => {
    observer.disconnect();
    container.removeEventListener('invalid', invalid, true);
    container.removeEventListener('input', refresh);
    container.removeEventListener('change', refresh);
    cancelAnimationFrame(frame);
    for (const input of errors.keys()) clear(input);
  };
}
