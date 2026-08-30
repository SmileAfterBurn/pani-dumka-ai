## 🧩 Built on Google Agent Development Kit (ADK) Principles

To ensure complete compatibility with the Google Cloud ecosystem, the internal agents within Pani Dumka are architected following the **Google Agent Development Kit (ADK)** patterns:

- **Customer Service & Empathy (`customer-service`):** Our agents dynamically adapt tone and assess sentiment to provide empathetic, brand-aligned interactions.
- **Marketing, SEO & Creative Execution (`marketing-agency-adk`, `brand-search-optimization`, `brand-aligned-presentations`):** Our fleet orchestrates multi-channel campaign generation, optimizes brand search visibility, and autonomously generates corporate slide presentations with demographic-targeted copywriting.
- **Finance, Macroeconomics & Corporate Lending (`financial-advisor`, `invoice-processing`, `small-business-loan-agent`, `time-series-forecasting`, `fomc-research`, `economic-research-agent`):** The Finance Agent (Лівермор) performs advanced time-series forecasting, deciphers central bank policies (FOMC), extracts structured JSON from PDFs, and autonomously evaluates broader economic market health.
- **Data Science & Analytics (`data-science`):** The Data Agent autonomously writes Python code, manipulates dataframes, and generates statistical models directly from enterprise datasets.
- **Agile Planning, SDLC & Technical Design (`sdlc-task-planner`, `sdlc-user-story-refiner`, `sdlc-technical-designer`):** The Task Agent autonomously refines ambiguous user stories, breaks down complex software architectures into manageable sprints, and generates structured technical specifications and deterministic task routings.
- **Observability, QA & LLM Auditing (`software-bug-assistant`, `llm-auditor`, `agent-observability-bq`):** The Code and QA Agents autonomously diagnose complex runtime errors and synthesize patches. Enterprise-grade telemetry streams agent execution traces directly into BigQuery for zero-blind-spot observability and rigorous LLM schema compliance.
- **Recommendation & Personalization (`personalized-shopping`):** The Recommend Agent leverages collaborative filtering and content-aware algorithms to curate highly personalized digital experiences and precise matchmaking.
- **Logistics & Concierge Routing (`travel-concierge`):** The Logistics Agent dynamically plans complex itineraries, optimizes resource allocation, and manages multi-step operational routing with real-time API integrations.
- **Vision, Media & Policy Scoring (`genmedia-for-commerce`, `on-brand-genmedia`, `image-scoring`):** Media pipelines use deterministic state management and automated visual scoring to iteratively generate, evaluate, and refine brand-compliant multimodal assets against strict enterprise policies.
- **Enterprise RAG & High-Volume Processing (`rag-agent-search`, `deep-search`, `high-volume-document-analyzer`):** Orchestrates retrieval-augmented generation, autonomous multi-step deep research, and high-throughput ingestion of massive document corpora across both internal enterprise knowledge bases and external sources.
- **Cyber Security & Global Compliance (`global-kyc-agent`, `cyber-guardian-agent`):** The Security Agent (Луцик) enforces strict access controls, identity verification (KYC), and actively defends the ecosystem against vulnerabilities, intrusions, and cyber threats using deterministic anomaly detection.
- **Academic Research & Science (`academic-research`):** The Science Agent orchestrates deep literature reviews, verifies citations, and synthesizes complex scientific papers with deterministic precision and high reproducibility.
- **Contextual Memory & Handover (`nurse-handover`):** Our Archivist (Lytopisec) and Empathy (Stan) agents utilize critical-care context protocols to ensure zero-loss chronological memory transfers between active sessions and A2A agentic handoffs.
- **OSINT & Multimodal Video Analysis (`youtube-analyst`):** OSINT and Vision agents seamlessly ingest long-context video feeds, leveraging Gemini's 2M token window to analyze frames, transcripts, and metadata natively.

## 🏆 Hackathon Compliance: Gemini 3.5 Flash & Pro Integration

In strict adherence to the hackathon requirements, **Pani Dumka** is powered natively by the **Gemini 3.5** model family deployed via **Google Cloud Vertex AI**. 

Our architecture leverages the specific strengths of both models in the 3.5 tier:
- **Gemini 3.5 Pro (`gemini-3.5-pro`)**: Acts as the central Orchestrator (Core Assistant). It handles complex reasoning, A2A (Agent-to-Agent) delegation logic, and deep analytical tasks requiring maximum cognitive depth across our 20-agent fleet.
- **Gemini 3.5 Flash (`gemini-3.5-flash`)**: Powers our high-speed, multimodal agents (like the Vision and Data agents). It utilizes zero-copy multimodal execution by directly reading `gs://` URIs from Google Cloud Storage, ensuring massive scale and minimal latency for real-time video and image analysis.

**Vertex AI Integration Details:**
- Models are accessed via the enterprise endpoint: `aiplatform.googleapis.com`
- Official Model Paths: `publishers/google/models/gemini-3.5-pro` and `publishers/google/models/gemini-3.5-flash`
- Security: Authenticated exclusively via Google Cloud Application Default Credentials (ADC) to ensure enterprise-grade zero-trust security.

## 🛠️ Spin-up Instructions

Follow these steps to run the "Fortified Enterprise Fleet" locally:

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **Google Cloud Platform (GCP)** account with Vertex AI & Gemini APIs enabled.
- A valid **Gemini API Key** (`GEMINI_API_KEY`).
- *(Optional)* An **ElevenLabs API Key** (`ELEVENLABS_API_KEY`) for enhanced Voice TTS.

### 2. Environment Configuration

For Vertex AI Enterprise integration, configure your environment by exporting the following values (or add them to your `.env` file):

```bash
# Replace the `GOOGLE_CLOUD_PROJECT_ID` and `GOOGLE_CLOUD_LOCATION` values
# with appropriate values for your project.
export GOOGLE_CLOUD_PROJECT=pani-dumka-01
export GOOGLE_CLOUD_LOCATION=us-central1
export GOOGLE_GENAI_USE_ENTERPRISE=True
```

Additionally, create a `.env` file for API keys:
```env
# Required for fallback / AI Studio setup
GEMINI_API_KEY=your_api_key

# Optional (For Custom TTS)
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=XsDwVNgam5laFw4WF7S6
```

### 3. Installation & Run
```bash
# Install dependencies
npm install

# Build the client & server for production
npm run build

# Start the full-stack server (runs on port 3000)
npm run start
```
*The application will be available at `http://localhost:3000`.*

### 4. MCP Integrations (Model Context Protocol)

The ecosystem is built to natively consume external capabilities via MCP. For example, to arm the **Mcp Agent (@mcp)** with the official Google Developer Knowledge base, register the HTTP transport endpoint in your CLI environment:

```bash
gemini mcp add -t http -H "X-Goog-Api-Key: YOUR_API_KEY" google-developer-knowledge https://developerknowledge.googleapis.com/mcp --scope user
```

### 5. Deploying to Google Cloud Run
This project is container-ready. 
1. Authenticate with Google Cloud: `gcloud auth login`
2. Set your project: `gcloud config set project [pani-dumka-01]`
3. Deploy directly from source:
```bash
gcloud run deploy pani-dumka \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key
```

## 🎥 Demo Video Overview
Our 4-minute demo covers:
1. **The Problem:** The inefficiency of using single-threaded chat models for complex engineering/OSINT tasks.
2. **The Solution:** Introducing Pani Dumka. We show the UI and the 20-agent ecosystem.
3. **Live Demo:** 
   - We speak to Pani Dumka via the real-time Voice UI (powered by Gemini 3.1 Live).
   - We ask her to investigate a topic. She delegates it to the OSINT agent, synthesizes the results, and uses the Workspace MCP to draft the findings into a new Google Doc.
   - Finally, we generate a high-quality visualization using Imagen 3 directly in the studio.
4. **Cloud Infrastructure:** A quick look at the Cloud Run dashboard where the system is securely hosted.

---
*Built for the Google All Things Agentic Hackathon. 🇺🇦*
