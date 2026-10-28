# ONS Ecosystem - Sankey Workflow Visualizer

An interactive web application built with **Next.js (React)**, **Tailwind CSS**, and **D3.js** for visualizing complex data workflows, pipelines, and ecosystems through a dynamic Sankey diagram.

The diagram is driven by spreadsheet data (CSV or Excel `.xlsx`) and allows users to update and explore flows on the fly without refreshing the page.

---

## Features

- **Focal Sankey Diagram**:
  - Dominates the main viewport with dynamic responsiveness (`ResizeObserver`).
  - Smooth hover interactions: highlights connected upstream and downstream flows while gracefully dimming unrelated streams.
  - Interactive selection: click on any node or flow stream to inspect granular metrics.
  - Fullscreen expansion mode to maximize the visualizer workspace.
- **Client-Side Spreadsheet Ingestion**:
  - Upload CSV or Excel (`.xlsx`) files directly in the browser via drag-and-drop or file selector.
  - Automatic column detection for `Source`, `Target`, `Value`, and `Category` headers.
  - Built-in cycle detection and feedback loop handling to ensure the graph never crashes on cyclic data.
  - Downloadable CSV template for quick formatting.
  - Preloaded presets: *National Statistical Data Pipeline* and *DevOps Delivery Stream*.
- **Interactive Controls (Above Diagram)**:
  - **Live Search**: Instant node filtering by query string.
  - **Category Filter**: Filter flows by category or workflow stage.
  - **Threshold Slider**: Filter out low-volume connections to reduce noise.
  - **Real-time Metrics**: Live counters for total flow volume, visible nodes, and active connections.
- **Detailed Insights Panel (Below Diagram)**:
  - **Node View**: Inflow vs. outflow breakdowns, percentage allocations, and node metadata.
  - **Connection View**: Source-to-target details and full row-level spreadsheet attributes.
  - **Summary View**: Top volume pathways and bottlenecks when no item is selected.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 3. Run Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## Spreadsheet Data Format

The application expects at least two columns (`Source` and `Target`), with an optional `Value` (flow amount) and optional metadata columns:

| Source | Target | Value | Category | Description |
| :--- | :--- | :--- | :--- | :--- |
| Census Surveys | Ingestion & Decryption | 350 | Raw Feeds | Decennial / Annual batch |
| Admin Tax Records | Ingestion & Decryption | 420 | Raw Feeds | Monthly direct pipe |
| Ingestion & Decryption | Anonymization | 770 | Preprocessing | HashiCorp Vault / PySpark |
| Anonymization | Statistical Modeling | 770 | Analysis | Bayesian weights |
| Statistical Modeling | Dissemination Portal | 770 | Publication | Open API distribution |

You can click the **CSV Template** button inside the app header to download a pre-formatted template.
