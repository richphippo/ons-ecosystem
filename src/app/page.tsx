'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { SAMPLE_DATASET_ONS } from '@/utils/sampleData';
import { parseSpreadsheetRows } from '@/utils/dataParser';
import type { BaseLinkData, BaseNodeData, SankeyDataset, SelectedElement } from '@/types/sankey';
import { FileUploader } from '@/components/FileUploader';
import { FilterControls } from '@/components/FilterControls';
import { SankeyDiagram } from '@/components/SankeyDiagram';
import { DetailsPanel } from '@/components/DetailsPanel';
import { SingleSurveyFlow } from '@/components/SingleSurveyFlow';
import { Maximize2, Minimize2, HelpCircle, Loader2 } from 'lucide-react';

export default function Home() {
  const [dataset, setDataset] = useState<SankeyDataset>(SAMPLE_DATASET_ONS);
  const [isLoadingDefault, setIsLoadingDefault] = useState(true);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Automatically fetch and load 'Business Survey Platforms.csv' on page load
  useEffect(() => {
    async function loadDefaultDataset() {
      try {
        const response = await fetch('/data/business_survey_platforms.csv');
        if (response.ok) {
          const csvText = await response.text();
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: results => {
              const parsed = parseSpreadsheetRows(
                results.data as Record<string, any>[],
                'Business Survey Platforms'
              );
              if (parsed.dataset) {
                setDataset(parsed.dataset);
                if (parsed.dataset.surveys && parsed.dataset.surveys.length > 0) {
                  setSelectedSurveyId(parsed.dataset.surveys[0].id);
                }
              }
              setIsLoadingDefault(false);
            },
            error: () => setIsLoadingDefault(false)
          });
        } else {
          setIsLoadingDefault(false);
        }
      } catch (err) {
        console.warn('Failed to fetch initial dataset:', err);
        setIsLoadingDefault(false);
      }
    }

    loadDefaultDataset();
  }, []);

  // Extract all unique GSBPM categories/stages present in the dataset
  const categories = useMemo(() => {
    const catSet = new Set<string>();
    dataset.nodes.forEach(n => {
      if (n.stage) catSet.add(n.stage);
      else if (n.category) catSet.add(n.category);
    });
    return Array.from(catSet);
  }, [dataset]);

  const allSurveys = useMemo(() => {
    return dataset.surveys || [];
  }, [dataset]);

  // Filtered links and nodes for the main Sankey diagram
  const { filteredNodes, filteredLinks, totalFlow } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const links = dataset.links.filter(link => {
      if (selectedCategory) {
        const linkMatches = link.category === selectedCategory || link.sourceStage === selectedCategory || link.targetStage === selectedCategory;
        const sourceMatches = dataset.nodes.find(n => n.id === link.source)?.stage === selectedCategory;
        const targetMatches = dataset.nodes.find(n => n.id === link.target)?.stage === selectedCategory;
        if (!linkMatches && !sourceMatches && !targetMatches) {
          return false;
        }
      }

      if (query) {
        const matchesSource = link.source.toLowerCase().includes(query);
        const matchesTarget = link.target.toLowerCase().includes(query);
        const matchesSurvey = link.surveys?.some(s => s.toLowerCase().includes(query));
        if (!matchesSource && !matchesTarget && !matchesSurvey) {
          return false;
        }
      }

      return true;
    });

    const activeNodeIds = new Set<string>();
    links.forEach(l => {
      activeNodeIds.add(l.source);
      activeNodeIds.add(l.target);
    });

    const nodes = dataset.nodes.filter(n => activeNodeIds.has(n.id));
    const flow = allSurveys.length > 0 ? allSurveys.length : links.reduce((sum, l) => sum + l.value, 0);

    return { filteredNodes: nodes, filteredLinks: links, totalFlow: flow };
  }, [dataset, searchQuery, selectedCategory, allSurveys]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedElement(null);
  };

  const handleDatasetChange = (newDataset: SankeyDataset) => {
    setDataset(newDataset);
    setSelectedElement(null);
    setSearchQuery('');
    setSelectedCategory(null);
    if (newDataset.surveys && newDataset.surveys.length > 0) {
      setSelectedSurveyId(newDataset.surveys[0].id);
    } else {
      setSelectedSurveyId(null);
    }
  };

  const handleSelectSurveyByName = (surveyName: string) => {
    const found = allSurveys.find(s => s.name === surveyName || s.id === surveyName);
    if (found) {
      setSelectedSurveyId(found.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#222222] flex flex-col font-sans">
      {/* Official ONS Header in Night Blue (#003C57) */}
      <header className="bg-[#003C57] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* ONS Crest Logo Emblem */}
            <div className="w-9 h-9 rounded-md bg-[#206095] border border-[#27A0CC] flex items-center justify-center font-bold text-white text-base shadow-sm">
              ONS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">
                  Office for National Statistics
                </span>
                <span className="text-[#27A0CC] font-normal hidden sm:inline">|</span>
                <span className="text-sm font-semibold text-[#27A0CC] hidden sm:inline">
                  Survey Ecosystem
                </span>
                {isLoadingDefault && (
                  <span className="flex items-center gap-1.5 text-xs text-[#27A0CC] ml-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading...</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#BCDCF0] hidden md:block">
                Generic Statistical Business Process Model (GSBPM) Platform Visualizer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#27A0CC] bg-[#003C57] hover:bg-[#206095] text-xs font-semibold text-white transition"
            >
              <HelpCircle className="w-4 h-4 text-[#27A0CC]" />
              <span>User Guide</span>
            </button>
          </div>
        </div>
      </header>

      {/* Guide Dropdown Modal with ONS Information Styling */}
      {showHelp && (
        <div className="bg-[#EBF2F7] border-b-2 border-[#206095] px-4 py-4 animate-in slide-in-from-top-2 duration-150">
          <div className="max-w-7xl mx-auto text-xs text-[#222222] grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 bg-white rounded-md border border-[#D0D2D3] shadow-xs">
              <span className="font-bold text-[#003C57] block mb-1">1. Default Business Survey Platforms</span>
              The application automatically loads <code className="text-[#206095] font-bold">Business Survey Platforms.csv</code> on startup. You can upload an updated spreadsheet at any time.
            </div>
            <div className="p-3.5 bg-white rounded-md border border-[#D0D2D3] shadow-xs">
              <span className="font-bold text-[#003C57] block mb-1">2. All Surveys Sankey Diagram</span>
              The diagram shows all surveys, outlining how the ecosystem of statistical platforms are used to support each GSBPM phase and the quantity of surveys using each end to end path.
            </div>
            <div className="p-3.5 bg-white rounded-md border border-[#D0D2D3] shadow-xs">
              <span className="font-bold text-[#003C57] block mb-1">3. Single Survey Process Flow</span>
              The component at the bottom isolates any chosen survey from the dropdown, displaying its step-by-step platforms across all 8 GSBPM phases.
            </div>
          </div>
        </div>
      )}

      {/* Main Content Shell */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6 flex-1">
        {/* Above Diagram: File Ingestion & Data Management */}
        <section aria-label="Spreadsheet Upload">
          <FileUploader
            currentDataset={dataset}
            onDatasetChange={handleDatasetChange}
          />
        </section>

        {/* Above Diagram: Dynamic Filters & Metrics */}
        <section aria-label="Workflow Controls">
          <FilterControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onReset={handleResetFilters}
            totalFlow={totalFlow}
            visibleNodeCount={filteredNodes.length}
            totalNodeCount={dataset.nodes.length}
            visibleLinkCount={filteredLinks.length}
            totalLinkCount={dataset.links.length}
          />
        </section>

        {/* Focal Main Viewport: Sankey Diagram */}
        <section
          aria-label="Focal GSBPM Sankey Diagram"
          className={`flex flex-col transition-all duration-300 ${
            isExpanded ? 'fixed inset-4 z-50 bg-[#F5F5F5] p-4 rounded-xl shadow-2xl border-2 border-[#003C57]' : 'relative'
          }`}
        >
          {/* Viewport Control Bar */}
          <div className="flex items-center justify-between pb-2 text-xs text-[#595959]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#003C57] text-sm">
                ONS Survey Portfolio: {allSurveys.length} Surveys across GSBPM Process Stages
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#D0D2D3] hover:border-[#206095] text-[#206095] hover:text-[#003C57] font-semibold transition"
              title={isExpanded ? 'Restore view' : 'Maximize diagram'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-[#206095]" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-[#206095]" />
                  <span>Expand Viewport</span>
                </>
              )}
            </button>
          </div>

          {/* Focal Visualizer Canvas */}
          <div className={`w-full ${isExpanded ? 'flex-1' : 'h-[62vh] min-h-[520px]'}`}>
            <SankeyDiagram
              nodes={filteredNodes}
              links={filteredLinks}
              selectedElement={selectedElement}
              onSelectElement={setSelectedElement}
              valueUnitName="Surveys"
            />
          </div>
        </section>

        {/* Selected Platform / Link Drilldown Panel (when user clicks an element in Sankey) */}
        {!isExpanded && selectedElement && (
          <section aria-label="Selected Element Details">
            <DetailsPanel
              selectedElement={selectedElement}
              onClearSelection={() => setSelectedElement(null)}
              allNodes={dataset.nodes}
              allLinks={dataset.links}
              onSelectSurvey={handleSelectSurveyByName}
            />
          </section>
        )}

        {/* Below Diagram: Single Survey Process Flow Component */}
        {!isExpanded && (
          <section aria-label="Single Survey Process Flow">
            <SingleSurveyFlow
              surveys={allSurveys}
              selectedSurveyId={selectedSurveyId}
              onSelectSurvey={setSelectedSurveyId}
            />
          </section>
        )}
      </main>

      {/* Official ONS Design System Footer */}
      <footer className="border-t border-[#D0D2D3] bg-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#595959] gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#003C57] text-white flex items-center justify-center font-bold text-[10px]">
              ONS
            </div>
            <span className="font-semibold text-[#003C57]">
              Office for National Statistics
            </span>
          </div>
          <div>
            Built with the ONS Design System • Generic Statistical Business Process Model (GSBPM)
          </div>
        </div>
      </footer>
    </div>
  );
}
