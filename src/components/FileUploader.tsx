'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Download, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
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
      setSuccessNotice(`Successfully loaded "${file.name}" (${surveyCount} surveys across GSBPM stages).`);
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
    <div className="bg-white border border-[#D0D2D3] rounded-lg p-4 shadow-sm text-[#222222]">
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
            className={`cursor-pointer border-2 border-dashed rounded-md px-4 py-2.5 transition flex items-center gap-3 ${
              isDragging
                ? 'border-[#206095] bg-[#EBF2F7] text-[#206095]'
                : 'border-[#BCBCBD] bg-[#F8F9FA] hover:border-[#206095] hover:bg-[#F0F4F7] text-[#414042]'
            }`}
          >
            <UploadCloud className="w-5 h-5 text-[#206095]" />
            <div className="text-sm">
              <span className="font-bold text-[#003C57]">Upload Spreadsheet</span>
              <span className="text-xs text-[#595959] ml-1.5 hidden sm:inline">(CSV or XLSX)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onDatasetChange(SAMPLE_DATASET_ONS);
              setSuccessNotice('Reset to default ONS Survey Portfolio.');
              setTimeout(() => setSuccessNotice(null), 3000);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-md bg-white hover:bg-[#F0F4F7] border border-[#206095] text-[#206095] transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default Preset</span>
          </button>
        </div>

        {/* Right: Active Dataset Info & Template download */}
        <div className="flex items-center gap-4">
          <div className="text-xs text-right hidden md:block">
            <div className="text-[#595959] uppercase tracking-wider text-[10px] font-semibold">Active Dataset</div>
            <div className="font-bold text-[#003C57] truncate max-w-[260px]" title={currentDataset.name}>
              {currentDataset.name}
            </div>
          </div>

          <button
            type="button"
            onClick={downloadSampleTemplate}
            title="Download CSV format template"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-md bg-[#0F8243] hover:bg-[#0c6b37] text-white shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="mt-3 p-3 bg-[#FDF2F2] border-l-4 border-[#D0021B] rounded-r-md text-xs text-[#D0021B] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {successNotice && (
        <div className="mt-3 p-3 bg-[#F0FDF4] border-l-4 border-[#0F8243] rounded-r-md text-xs text-[#0F8243] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{successNotice}</span>
        </div>
      )}
    </div>
  );
};
