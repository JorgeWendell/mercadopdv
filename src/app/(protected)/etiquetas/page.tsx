"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useProducts } from "@/hooks/queries/use-products";

export default function EtiquetasPage() {
  const { data, isLoading } = useProducts();
  const [query, setQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isPrinting, setIsPrinting] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [measureById, setMeasureById] = useState<Record<string, string>>({});
  const [layoutMode, setLayoutMode] = useState<"A4" | "80mm">("A4");
  const [columns, setColumns] = useState<2 | 3 | 4>(3);

  type ProductRow = {
    id: string;
    name: string;
    barcode: string | null;
    salePrice: string | number | null;
  };
  const products: ProductRow[] = (data as ProductRow[]) ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p: ProductRow) =>
      [p.name, p.barcode, p.id].some((v: string | null | undefined) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [products, query]);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const setQty = (id: string, v: number) => setQuantities((q) => ({ ...q, [id]: Math.max(1, Math.floor(v || 0)) }));
  const setMeasure = (id: string, m: string) => setMeasureById((s) => ({ ...s, [id]: m }));

  function escapeHtml(s: string) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function code39Svg(code: string, width = 200, height = 40) {
    const patterns: Record<string, string> = {
      "0": "nnnwwnwnn",
      "1": "wnnwnnnnw",
      "2": "nnwwnnnnw",
      "3": "wnwwnnnnn",
      "4": "nnnwwnnnw",
      "5": "wnnwwnnnn",
      "6": "nnwwwnnnn",
      "7": "nnnwnnwnw",
      "8": "wnnwnnwnn",
      "9": "nnwwnnwnn",
      A: "wnnnnwnnw",
      B: "nnwnnwnnw",
      C: "wnwnnwnnn",
      D: "nnnnwwnnw",
      E: "wnnnwwnnn",
      F: "nnwnwwnnn",
      G: "nnnnnwwnw",
      H: "wnnnnwwnn",
      I: "nnwnnwwnn",
      J: "nnnnwwwnn",
      K: "wnnnnnnww",
      L: "nnwnnnnww",
      M: "wnwnnnnwn",
      N: "nnnnwnnww",
      O: "wnnnwnnwn",
      P: "nnwnwnnwn",
      Q: "nnnnnnwww",
      R: "wnnnnnwwn",
      S: "nnwnnnwwn",
      T: "nnnnwnwwn",
      U: "wwnnnnnnw",
      V: "nwwnnnnnw",
      W: "wwwnnnnnn",
      X: "nwnnwnnnw",
      Y: "wwnnwnnnn",
      Z: "nwwnwnnnn",
      "-": "nwnnnnwnw",
      ".": "wwnnnnwnn",
      " ": "nwwnnnwnn",
      "$": "nwnwnwnnn",
      "/": "nwnwnnnwn",
      "+": "nwnnnwnwn",
      "%": "nnnwnwnwn",
      "*": "nwnnwnwnn",
    };
    const up = String(code || "").toUpperCase().replace(/[^0-9A-Z\. \-$/+%]/g, "-");
    const full = `*${up}*`;
    const seqs: string[] = [];
    for (const ch of full) {
      const p = patterns[ch];
      if (!p) continue;
      seqs.push(p);
      seqs.push("n");
    }
    const units = seqs.join("");
    let totalUnits = 0;
    for (let i = 0; i < units.length; i++) totalUnits += units[i] === "w" ? 3 : 1;
    const unitWidth = width / totalUnits;

    let x = 0;
    let isBar = true;
    const rects: string[] = [];
    for (let i = 0; i < units.length; i++) {
      const c = units[i];
      const w = (c === "w" ? 3 : 1) * unitWidth;
      if (isBar) rects.push(`<rect x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${height}" fill="#000" />`);
      x += w;
      isBar = !isBar;
    }
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${rects.join("")}</svg>`;
  }

  const handlePreview = () => {
    let items = products.filter((p) => selected[p.id]).map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.salePrice ?? 0),
      barcode: p.barcode || p.id,
      qty: Math.max(1, quantities[p.id] || 1),
      measure: measureById[p.id] || "un",
    }));
    if (items.length === 0) {
      const fallback = filtered[0] as ProductRow | undefined;
      if (fallback) {
        items = [
          {
            id: fallback.id,
            name: fallback.name,
            price: Number(fallback.salePrice ?? 0),
            barcode: fallback.barcode || fallback.id,
            qty: Math.max(1, quantities[fallback.id] || 1),
            measure: measureById[fallback.id] || "un",
          },
        ];
      } else {
        toast.error("Selecione ao menos um produto");
        return;
      }
    }

    const labelsHtml = items
      .map((it) => {
        const m = (it.measure === "kgs" ? "kg" : it.measure) || "un";
        const title = `${escapeHtml(it.name)} - R$ ${Number(it.price).toFixed(2)}/${escapeHtml(m)}`;
        const cards = Array.from({ length: it.qty })
          .map(
            () =>
              '<div class="label">' +
              '<div class="name">' + title + '</div>' +
              code39Svg(it.barcode ?? it.id, 200, 40) +
              '</div>'
          )
          .join("");
        return cards;
      })
      .join("");

    setPreviewHtml(labelsHtml);
    toast.success("Pré-visualização gerada");
  };

  const handlePrint = () => {
    if (!previewHtml) {
      handlePreview();
    }
    setTimeout(() => window.print(), 50);
  };

  const styleForLayout = `
    @media print { .no-print { display: none !important; } }
    .labels-grid { display: ${layoutMode === "A4" ? "grid" : "block"}; ${layoutMode === "A4" ? `grid-template-columns: repeat(${columns}, 1fr); gap: 8px;` : ""} }
    .label { ${layoutMode === "A4" ? "height: 110px;" : "width: 72mm; margin-bottom: 6px;"} border: 1px solid #ddd; padding: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .label .name { font-size: 12px; font-weight: 600; text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @page { ${layoutMode === "A4" ? "size: A4; margin: 10mm;" : "size: 80mm auto; margin: 4mm;"} }
  `;

  return (
    <div className="p-4 space-y-4">
      <style>{styleForLayout}</style>
      <h1 className="text-xl font-semibold no-print">Impressão de Etiquetas</h1>

      <div className="flex flex-wrap gap-2 items-end no-print">
        <div className="min-w-[220px]">
          <label className="text-sm">Buscar</label>
          <input className="w-full border rounded px-2 py-1" placeholder="Nome, código de barras ou ID" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Formato</label>
          <select className="border rounded px-2 py-1 block" value={layoutMode} onChange={(e) => setLayoutMode(e.target.value as any)}>
            <option value="A4">A4</option>
            <option value="80mm">80mm</option>
          </select>
        </div>
        <div>
          <label className="text-sm">Colunas</label>
          <select className="border rounded px-2 py-1 block" value={columns} onChange={(e) => setColumns(Number(e.target.value) as 2 | 3 | 4)} disabled={layoutMode !== "A4"}>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>
        <button className="px-3 py-2 rounded bg-secondary text-secondary-foreground" onClick={handlePreview} disabled={isLoading}>
          Visualizar
        </button>
        <button className="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50" onClick={handlePrint} disabled={isPrinting}>
          Imprimir
        </button>
      </div>

      <div className="overflow-x-auto no-print">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2">Sel</th>
              <th>Produto</th>
              <th>Código de barras</th>
              <th>Preço</th>
              <th>Qtd</th>
              <th>Medida</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: ProductRow) => (
              <tr key={p.id} className="border-t">
                <td className="py-2">
                  <input type="checkbox" checked={!!selected[p.id]} onChange={() => toggle(p.id)} />
                </td>
                <td>
                  <div className="font-medium">{p.name}</div>
                </td>
                <td>{p.barcode ?? "-"}</td>
                <td>R$ {Number(p.salePrice ?? 0).toFixed(2)}</td>
                <td>
                  <input className="w-20 border rounded px-2 py-1" type="number" min={1} step={1} value={quantities[p.id] ?? 1} onChange={(e) => setQty(p.id, Number(e.target.value))} />
                </td>
                <td>
                  <select className="border rounded px-2 py-1" value={measureById[p.id] ?? "un"} onChange={(e) => setMeasure(p.id, e.target.value)}>
                    <option value="pc">pc</option>
                    <option value="kg">kg</option>
                    <option value="mts">mts</option>
                    <option value="un">un</option>
                  </select>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td className="py-4" colSpan={6}>
                  Nenhum produto encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="print-sheet">
        <div className="labels-grid" dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </div>
    </div>
  );
}
