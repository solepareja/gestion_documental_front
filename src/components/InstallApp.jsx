import { useEffect, useState } from 'react';

export default function InstallApp() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
  );
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const capture = (event) => {
      event.preventDefault();
      setPrompt(event);
    };
    const complete = () => {
      setInstalled(true);
      setPrompt(null);
    };
    const mode = window.matchMedia('(display-mode: standalone)');
    const change = () => setInstalled(mode.matches || navigator.standalone === true);
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', complete);
    mode.addEventListener('change', change);
    return () => {
      window.removeEventListener('beforeinstallprompt', capture);
      window.removeEventListener('appinstalled', complete);
      mode.removeEventListener('change', change);
    };
  }, []);

  async function install() {
    if (!prompt) {
      setHelp(!help);
      return;
    }
    setBusy(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      setHelp(true);
    } finally {
      setPrompt(null);
      setBusy(false);
    }
  }

  if (installed) return null;
  return (
    <aside className="install-app print:hidden" aria-label="Instalar aplicación">
      {help && (
        <div id="install-help" className="install-app-help">
          <strong>Instalar Gestión Documental</strong>
          <p>
            En iPhone o iPad: abre en Safari, pulsa Compartir y «Añadir a la pantalla de inicio».
          </p>
          <p>
            En Android o en el ordenador: abre el menú de Chrome o Edge y busca «Instalar
            aplicación» o «Añadir a pantalla de inicio».
          </p>
          <button type="button" onClick={() => setHelp(false)}>
            Cerrar
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={install}
        disabled={busy}
        aria-expanded={help}
        aria-controls={help ? 'install-help' : undefined}
      >
        {busy ? 'Instalando…' : 'Instalar app'}
      </button>
    </aside>
  );
}
