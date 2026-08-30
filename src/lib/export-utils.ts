/** Client-side export helpers (CSV download and printable PDF). */

export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[",;\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(","),
    )
    .join("\r\n");
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const blob = new Blob(["\uFEFF" + toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );

/**
 * Opens a print-ready window with a simple table; the browser's print dialog
 * lets the teacher save it as PDF.
 */
export function printTablePdf(options: {
  title: string;
  subtitle?: string;
  head: string[];
  rows: (string | number)[][];
  footer?: string;
}) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    throw new Error("Popup diblokir browser. Izinkan popup untuk mengekspor PDF.");
  }
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8" />
<title>${escapeHtml(options.title)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#111;margin:32px}
  h1{font-size:20px;margin:0 0 4px}
  p.sub{margin:0 0 20px;color:#555;font-size:12px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{border:1px solid #d4d4d8;padding:6px 8px;text-align:left}
  th{background:#f4f4f5;text-transform:uppercase;font-size:10px;letter-spacing:.05em}
  tr:nth-child(even) td{background:#fafafa}
  footer{margin-top:18px;font-size:11px;color:#666}
  @media print{body{margin:12mm}}
</style></head><body>
<h1>${escapeHtml(options.title)}</h1>
${options.subtitle ? `<p class="sub">${escapeHtml(options.subtitle)}</p>` : ""}
<table><thead><tr>${options.head.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
<tbody>${options.rows
    .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(String(c ?? ""))}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>
${options.footer ? `<footer>${escapeHtml(options.footer)}</footer>` : ""}
<script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script>
</body></html>`;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
