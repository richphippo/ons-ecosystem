'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Download, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { parseFile } from '@/utils/dataParser';
import type { SankeyDataset } from '@/types/sankey';
import { SAMPLE_DATASET_ONS, SAMPLE_CSV_TEMPLATE } from '@/utils/sampleData';

interface FileUploaderProps {
  currentDataset: SankeyDataset;
  onDatasetChange: (dataset: SankeyDataset) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  currentDataset,
  onDatasetChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setSuccessNotice(null);

    const result = await parseFile(file);

    if (result.error || !result.dataset) {
      setErrorMessage(result.error || 'Failed to parse spreadsheet.');
    } else {
      onDatasetChange(result.dataset);
      const surveyCount = result.dataset.surveys?.length || result.dataset.nodes.length;
      setSuccessNotice(`Successfully loaded "${file.name}" with ${surveyCount} surveys across GSBPM stages.`);
      setTimeout(() => setSuccessNotice(null), 6000);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const downloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ons_gsbpm_surveys_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg text-slate-100">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Drag and drop or upload button */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={onFileInputChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`cursor-pointer border-2 border-dashed rounded-lg px-4 py-2.5 transition flex items-center gap-3 ${
              isDragging
                ? 'border-indigo-400 bg-indigo-950/40 text-indigo-200'
                : 'border-slate-700 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <UploadCloud className="w-5 h-5 text-indigo-400 animate-pulse" />
            <div className="text-sm">
              <span className="font-semibold text-white">Upload GSBPM Spreadsheet</span>
              <span className="text-xs text-slate-400 ml-1.5 hidden sm:inline">(CSV or XLSX)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onDatasetChange(SAMPLE_DATASET_ONS);
              setSuccessNotice('Loaded ONS GSBPM Survey Portfolio preset.');
              setTimeout(() => setSuccessNotice(null), 3000);
            }}
            className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reset to ONS Presets</span>
          </button>
        </div>

        {/* Right: Active Dataset Info & Template download */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-right hidden md:block">
            <div className="text-slate-400">Current Dataset</div>
            <div className="font-semibold text-slate-200 truncate max-w-[240px]" title={currentDataset.name}>
              {currentDataset.name}
            </div>
          </div>

          <button
            type="button"
            onClick={downloadSampleTemplate}
            title="Download GSBPM Survey format template"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="mt-3 p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successNotice && (
        <div className="mt-3 p-2 bg-emerald-950/60 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}
    </div>
  );
};
