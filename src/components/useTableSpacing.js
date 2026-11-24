import { useEffect } from 'react';

// Reparte el espacio libre entre columnas, sin dejarlo dentro de la última.
function balanceTable(table) {
  const headers = Array.from(table.rows[0]?.cells || []);
  if (headers.length < 2 || headers.some((cell) => cell.colSpan !== 1)) return;
  headers.forEach((cell) => cell.style.removeProperty('width'));
  table.style.removeProperty('table-layout');
  const available = table.getBoundingClientRect().width;
  if (!available) return;

  const sample = table.cloneNode(true);
  sample.setAttribute('aria-hidden', 'true');
  sample.inert = true;
  sample.style.cssText =
    'position:fixed;left:-100000px;top:0;width:max-content;min-width:0;max-width:none;table-layout:auto;visibility:hidden;pointer-events:none';
  sample.querySelectorAll('th, td').forEach((cell) => {
    cell.style.width = 'auto';
    cell.style.minWidth = '0';
    cell.style.whiteSpace = 'nowrap';
  });
  const measureCells = table.classList.contains('table-measure-content');
  if (measureCells) {
    // Medir cada celda por separado evita que el algoritmo nativo de tablas
    // infle una columna por sus textos largos o sus grupos flexibles.
    sample.style.display = 'block';
    sample.querySelectorAll('thead, tbody, tfoot, tr').forEach((element) => {
      element.style.display = 'block';
    });
    sample.querySelectorAll('th, td').forEach((cell) => {
      cell.style.display = 'inline-block';
      cell.style.width = 'max-content';
      cell.style.maxWidth = 'none';
    });
  }
  table.parentElement.appendChild(sample);
  const widths = measureCells
    ? headers.map((_, index) => {
        const values = Array.from(sample.rows)
          .filter(
            (row) =>
              row.cells.length === headers.length &&
              Array.from(row.cells).every((cell) => cell.colSpan === 1),
          )
          .map((row) => row.cells[index].getBoundingClientRect().width);
        const headerWidth = values.shift();
        values.sort((a, b) => a - b);
        // Una entrega excepcional con muchos materiales no debe ensanchar
        // toda la columna. Los textos largos pueden ajustarse a varias líneas.
        const contentWidth =
          index === headers.length - 1
            ? Math.max(0, ...values)
            : values[Math.floor(values.length / 2)] || 0;
        return Math.max(headerWidth, contentWidth);
      })
    : Array.from(sample.rows[0].cells, (cell) => cell.getBoundingClientRect().width);
  sample.remove();

  const required = widths.reduce((sum, width) => sum + width, 0);
  // En pantallas estrechas conservamos el ajuste de texto y el scroll habituales.
  if (required > available) return;
  const gap = (available - required) / (widths.length - 1);
  table.style.tableLayout = 'fixed';
  headers.forEach((cell, index) => {
    cell.style.width = `${widths[index] + (index < widths.length - 1 ? gap : 0)}px`;
  });
}

export default function useTableSpacing() {
  useEffect(() => {
    let frame;
    let stopped = false;
    const observed = new Set();
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const resize = new ResizeObserver(schedule);
    const mutations = new MutationObserver(schedule);
    function update() {
      mutations.disconnect();
      const tables = new Set(document.querySelectorAll('table'));
      observed.forEach((table) => {
        if (!tables.has(table)) {
          resize.unobserve(table);
          observed.delete(table);
        }
      });
      tables.forEach((table) => {
        balanceTable(table);
        if (!observed.has(table)) {
          observed.add(table);
          resize.observe(table);
        }
      });
      mutations.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    schedule();
    document.fonts.ready.then(() => {
      if (!stopped) schedule();
    });
    window.addEventListener('resize', schedule);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      window.removeEventListener('resize', schedule);
      observed.forEach((table) => {
        table.style.removeProperty('table-layout');
        Array.from(table.rows[0]?.cells || []).forEach((cell) =>
          cell.style.removeProperty('width'),
        );
      });
    };
  }, []);
}
