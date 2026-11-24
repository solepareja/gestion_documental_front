export default function RequiredField({ value, message, disabled, children }) {
  return (
    <div>
      <div data-validation-control tabIndex={-1} className="rounded-2xl">
        {children}
      </div>
      <input
        className="sr-only"
        type="text"
        tabIndex={-1}
        aria-label={message}
        data-validation-message={message}
        required
        disabled={disabled}
        value={value ? 'completo' : ''}
        onChange={() => {}}
      />
    </div>
  );
}
