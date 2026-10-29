'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { SAMPLE_DATASET_ONS } from '@/utils/sampleData';
import { parseSpreadsheetRows } from '@/utils/dataParser';
import type { BaseLinkData, BaseNodeData, SankeyDataset, SelectedElement, ViewMode } from '@/types/sankey';
import { FileUploader } from '@/components/FileUploader';
import { FilterControls } from '@/components/FilterControls';
import { SankeyDiagram } from '@/components/SankeyDiagram';
import { DetailsPanel } from '@/components/DetailsPanel';
import { Maximize2, Minimize2, Workflow, HelpCircle, Loader2 } from 'lucide-react';

export default function Home() {
  const [dataset, setDataset] = useState<SankeyDataset>(SAMPLE_DATASET_ONS);
  const [isLoadingDefault, setIsLoadingDefault] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('all-surveys');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [minValue, setMinValue] = useState(0);
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

  // Max value among all links for setting slider bounds
  const maxPossibleValue = useMemo(() => {
    return dataset.links.reduce((max, l) => Math.max(max, l.value), 0);
  }, [dataset]);

  const allSurveys = useMemo(() => {
    return dataset.surveys || [];
  }, [dataset]);

  const currentSelectedSurvey = useMemo(() => {
    if (!selectedSurveyId) return allSurveys[0] || null;
    return allSurveys.find(s => s.id === selectedSurveyId || s.name === selectedSurveyId) || null;
  }, [allSurveys, selectedSurveyId]);

  // Filtered links and nodes based on user controls and ViewMode
  const { filteredNodes, filteredLinks, totalFlow } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // In Single Survey Mode: isolate only this survey's path
    if (viewMode === 'single-survey' && currentSelectedSurvey) {
      const surveyName = currentSelectedSurvey.name;

      const links = dataset.links
        .filter(l => l.surveys?.includes(surveyName))
        .map(l => ({ ...l, value: 1 }));

      const activeNodeIds = new Set<string>();
      links.forEach(l => {
        activeNodeIds.add(l.source);
        activeNodeIds.add(l.target);
      });

      const nodes = dataset.nodes
        .filter(n => activeNodeIds.has(n.id))
        .map(n => ({ ...n, totalValue: 1 }));

      return {
        filteredNodes: nodes,
        filteredLinks: links,
        totalFlow: 1
      };
    }

    // In All Surveys Mode: apply user search, threshold, and category filters
    const links = dataset.links.filter(link => {
      if (minValue > 0 && link.value < minValue) {
        return false;
      }

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
  }, [dataset, viewMode, currentSelectedSurvey, searchQuery, minValue, selectedCategory, allSurveys]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setMinValue(0);
    setSelectedCategory(null);
    setSelectedElement(null);
  };

  const handleDatasetChange = (newDataset: SankeyDataset) => {
    setDataset(newDataset);
    setSelectedElement(null);
    setSearchQuery('');
    setMinValue(0);
    setSelectedCategory(null);
    if (newDataset.surveys && newDataset.surveys.length > 0) {
      setSelectedSurveyId(newDataset.surveys[0].id);
    } else {
      setSelectedSurveyId(null);
    }
  };

  const handleSwitchToSurvey = (surveyName: string) => {
    const found = allSurveys.find(s => s.name === surveyName || s.id === surveyName);
    if (found) {
      setSelectedSurveyId(found.id);
      setViewMode('single-survey');
      setSelectedElement(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  ONS Survey Ecosystem
                </h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  GSBPM Architecture
                </span>
                {isLoadingDefault && (
                  <span className="flex items-center gap-1 text-[11px] text-indigo-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Loading default dataset...</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Modeling ONS statistical surveys and platforms across GSBPM process phases
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">GSBPM Guide</span>
            </button>
          </div>
        </div>
      </header>

      {/* Guide Dropdown Modal */}
      {showHelp && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 animate-in slide-in-from-top-2 duration-150">
          <div className="max-w-7xl mx-auto text-xs text-slate-300 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="font-semibold text-white block mb-1">1. Default Business Survey Platforms</span>
              The app automatically loads <code className="text-indigo-300">Business Survey Platforms.csv</code> on startup. You can upload an updated version anytime above.
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="font-semibold text-white block mb-1">2. All Surveys vs. Single Survey Flow</span>
              Toggle between the aggregated <strong>Ecosystem View</strong> (showing all surveys flowing through ONS platforms) and the <strong>Single Survey Process Flow</strong> (isolating one survey&apos;s end-to-end path).
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="font-semibold text-white block mb-1">3. Clickable Platforms &amp; Transitions</span>
              Click on any platform bar or flow link to inspect the exact list of surveys using that capability, with one-click drilldown into individual survey pathways.
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5 flex-1">
        {/* Above Diagram: File Ingestion & Data Management */}
        <section aria-label="Spreadsheet Upload">
          <FileUploader
            currentDataset={dataset}
            onDatasetChange={handleDatasetChange}
          />
        </section>

        {/* Above Diagram: Dynamic Filters & View Mode */}
        <section aria-label="Workflow Controls">
          <FilterControls
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            surveys={allSurveys}
            selectedSurveyId={selectedSurveyId}
            onSelectedSurveyChange={setSelectedSurveyId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            minValue={minValue}
            maxPossibleValue={maxPossibleValue}
            onMinValueChange={setMinValue}
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
            isExpanded ? 'fixed inset-4 z-50 bg-slate-950 p-4 rounded-2xl shadow-2xl border border-slate-800' : 'relative'
          }`}
        >
          {/* Viewport Control Bar */}
          <div className="flex items-center justify-between pb-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">
                {viewMode === 'all-surveys'
                  ? `ONS Survey Portfolio: ${allSurveys.length} Surveys across GSBPM Process Stages`
                  : `Single Survey Flow: ${currentSelectedSurvey?.name || 'Selected Survey'}`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title={isExpanded ? 'Restore view' : 'Maximize diagram'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
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

        {/* Below Diagram: Interactive Details Panel */}
        {!isExpanded && (
          <section aria-label="Details and Insights Panel" className="mt-2">
            <DetailsPanel
              viewMode={viewMode}
              selectedSurvey={currentSelectedSurvey}
              onSelectSurvey={handleSwitchToSurvey}
              selectedElement={selectedElement}
              onClearSelection={() => setSelectedElement(null)}
              allNodes={dataset.nodes}
              allLinks={dataset.links}
              allSurveys={allSurveys}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-500">
          ONS Ecosystem GSBPM Process Visualizer • Generic Statistical Business Process Model
        </div>
      </footer>
    </div>
  );
}
