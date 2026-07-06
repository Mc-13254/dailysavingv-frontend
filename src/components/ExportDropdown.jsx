import { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow } from 'docx';
import * as XLSX from 'xlsx';

/**
 * columns: [{ label, key, format? (row) => string }]
 * rows: array of plain objects
 * filename: base name without extension
 */
export default function ExportDropdown({ columns, rows, filename = 'EXPORT' }) {
  const [open, setOpen] = useState(false);

  const cell = (row, col) => (col.format ? col.format(row) : String(row[col.key] ?? '').toUpperCase());

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(8);
    doc.text(filename, 14, 10);
    autoTable(doc, {
      startY: 15,
      head: [columns.map((c) => c.label)],
      body: rows.map((row) => columns.map((c) => cell(row, c))),
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94], textColor: 255, fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
    });
    doc.save(`${filename}.pdf`);
  };

  const exportWord = () => {
    const table = new Table({
      width: { size: 100, type: 'pct' },
      rows: [
        new TableRow({
          children: columns.map((c) => new TableCell({ children: [new Paragraph({ text: c.label, bold: true })] })),
        }),
        ...rows.map((row) => new TableRow({
          children: columns.map((c) => new TableCell({ children: [new Paragraph(cell(row, c))] })),
        })),
      ],
    });

    const doc = new Document({
      sections: [{ properties: { page: { size: { orientation: 'landscape' } } }, children: [table] }],
    });

    Packer.toBlob(doc).then((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  const exportExcel = () => {
    const wsData = [columns.map((c) => c.label), ...rows.map((row) => columns.map((c) => cell(row, c)))];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, filename.slice(0, 31));
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportCSV = () => {
    const wsData = [columns.map((c) => c.label), ...rows.map((row) => columns.map((c) => cell(row, c)))];
    const csv = wsData.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handle = (type) => {
    if (type === 'pdf') exportPDF();
    else if (type === 'word') exportWord();
    else if (type === 'excel') exportExcel();
    else if (type === 'csv') exportCSV();
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="btn btn-outline">
        <Download size={14} /> Export
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border rounded shadow-md z-50 w-32 text-xs normal-case">
          <button className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-100" onClick={() => handle('pdf')}>
            <FileText size={13} /> PDF
          </button>
          <button className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-100" onClick={() => handle('word')}>
            <FileText size={13} /> Word
          </button>
          <button className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-100" onClick={() => handle('excel')}>
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-100" onClick={() => handle('csv')}>
            <FileSpreadsheet size={13} /> CSV
          </button>
        </div>
      )}
    </div>
  );
}
