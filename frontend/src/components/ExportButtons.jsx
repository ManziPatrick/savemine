import { useState } from 'react';
import { ArrowDownTrayIcon, ChevronDownIcon, TableCellsIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

/**
 * Reusable Export dropdown — offers "Spreadsheet (Excel/CSV)" and "PDF Report".
 * Props:
 *  - filename: base name for the CSV download (without extension)
 *  - title:    human title shown on the PDF report
 *  - sections: [{ title, columns: [{ key, header }], rows: [object] }]
 *  - disabled: optional, disables the button (e.g. while loading)
 */
function ExportButtons({ filename, title, sections = [], disabled = false }) {
  const [open, setOpen] = useState(false);

  const hasData = sections.some((s) => s.rows && s.rows.length > 0);

  const handleCSV = () => {
    if (!hasData) return;
    exportToCSV(filename, sections);
    setOpen(false);
  };

  const handlePDF = () => {
    if (!hasData) return;
    exportToPDF(filename, title, sections);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled || !hasData}
        className="btn btn-secondary"
        title={hasData ? 'Export data as spreadsheet or PDF' : 'Nothing to export yet'}
      >
        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
        Export
        <ChevronDownIcon className="h-4 w-4 ml-1" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
              Download as
            </div>
            <button
              type="button"
              onClick={handleCSV}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <TableCellsIcon className="h-4 w-4 mr-3 text-green-600" />
              <span>
                Spreadsheet (Excel/CSV)
                <span className="block text-xs text-gray-400">Opens in Excel / Google Sheets</span>
              </span>
            </button>
            <button
              type="button"
              onClick={handlePDF}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <DocumentTextIcon className="h-4 w-4 mr-3 text-red-500" />
              <span>
                PDF Report
                <span className="block text-xs text-gray-400">Print-ready report</span>
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ExportButtons;
