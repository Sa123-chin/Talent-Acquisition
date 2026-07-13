import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  User, 
  Briefcase, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Upload, 
  ArrowLeft, 
  Clock, 
  Sparkles, 
  BookOpen, 
  Heart, 
  Mail, 
  RefreshCw, 
  CheckSquare, 
  Square,
  FileCheck2,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { 
  ScreeningResult, 
  ScreeningRecord, 
  PresetData 
} from "./types";
import { PRESETS } from "./presets";
import { SAMPLE_SCREENINGS } from "./sampleScreenings";

const DEFAULT_CORE_VALUES = `1. Client-Centric Excellence: Sourcing and structuring premium Australian expat mortgages with absolute clarity, tailored to cross-border needs.
2. Extreme Ownership: End-to-end accountability for client outcomes, guiding expats from application to settlement.
3. Integrity & Trust: Honest, policy-driven financial advice for clients navigating complex expatriate rules.
4. Speed & Agility: Prompt, responsive operations across global time zones to secure swift lender approvals.`;

export default function App() {
  // Screening history records, stored in localStorage
  const [records, setRecords] = useState<ScreeningRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDecision, setFilterDecision] = useState<"ALL" | "ADVANCE" | "REJECT">("ALL");

  // Input states for a new screening
  const [candidateName, setCandidateName] = useState("");
  const [jobTitle, setJobTitle] = useState("Senior Expat Mortgage Broker");
  const [coreValues, setCoreValues] = useState(DEFAULT_CORE_VALUES);
  const [jdText, setJdText] = useState("");
  const [cvText, setCvText] = useState("");

  // UI state
  const [isScreeningMode, setIsScreeningMode] = useState(true); // true = form, false = record view
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Tab states for record detail view
  const [activeTab, setActiveTab] = useState<"analysis" | "script" | "rejection">("analysis");

  // Copy-state feedbacks
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [copiedFullScript, setCopiedFullScript] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Expanded sections in the Phone Screening Script
  const [expandedScriptSections, setExpandedScriptSections] = useState<Record<string, boolean>>({
    opening: true,
    context: false,
    section1: false,
    section2: false,
    section3: false,
    section4: false,
    close: false,
  });

  // Checklist for phone screen in real-time
  const [interviewChecklist, setInterviewChecklist] = useState<Record<string, boolean>>({
    rapport: false,
    noticePeriod: false,
    salaryExpectation: false,
    workingHours: false,
    motivation: false,
    historyDeepDive: false,
    followUpProbes: false,
    nextStepsExplained: false,
  });

  // Drag & drop file upload feedback
  const [isDragging, setIsDragging] = useState(false);
  const cvFileRef = useRef<HTMLInputElement>(null);
  
  // File parsing states
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileParsingError, setFileParsingError] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("odin_screening_history");
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
        setRecords(SAMPLE_SCREENINGS);
      }
    } else {
      // Seed default history records
      setRecords(SAMPLE_SCREENINGS);
      localStorage.setItem("odin_screening_history", JSON.stringify(SAMPLE_SCREENINGS));
    }
  }, []);

  // Sync records to localStorage
  const saveRecords = (newRecords: ScreeningRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem("odin_screening_history", JSON.stringify(newRecords));
  };

  // Preset selection handler
  const handleApplyPreset = (preset: PresetData) => {
    setCandidateName(preset.candidateName);
    setJobTitle(preset.jobTitle);
    setCoreValues(preset.coreValues);
    setJdText(preset.jdText);
    setCvText(preset.cvText);
  };

  // Reset inputs
  const handleResetInputs = () => {
    setCandidateName("");
    setJobTitle("Senior Expat Mortgage Broker");
    setCoreValues(DEFAULT_CORE_VALUES);
    setJdText("");
    setCvText("");
    setErrorMessage(null);
  };

  // File drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setFileParsingError(null);
    const fileName = file.name.toLowerCase();
    
    // Check if txt or md
    if (file.type === "text/plain" || fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      setIsParsingFile(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCvText(event.target.result as string);
          // Try to auto-extract candidate name from file name if possible, e.g. "John Doe Resume.txt"
          const cleanName = file.name
            .replace(/\.[^/.]+$/, "") // remove extension
            .replace(/(cv|resume|screening|odin|mortgage|evaluation|broker)/gi, "")
            .replace(/[-_]/g, " ")
            .trim();
          if (cleanName && !candidateName) {
            setCandidateName(cleanName.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
          }
        }
        setIsParsingFile(false);
      };
      reader.onerror = () => {
        setFileParsingError("Failed to read text file.");
        setIsParsingFile(false);
      };
      reader.readAsText(file);
    } else if (
      file.type === "application/pdf" || 
      fileName.endsWith(".pdf") || 
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
      fileName.endsWith(".docx") ||
      file.type === "application/msword" ||
      fileName.endsWith(".doc")
    ) {
      setIsParsingFile(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const result = event.target?.result as string;
          if (!result) {
            throw new Error("Could not read file content.");
          }
          const base64 = result.split(",")[1];
          
          const response = await fetch("/api/parse-cv", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              base64,
              fileName: file.name,
              mimeType: file.type,
            }),
          });
          
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server returned status ${response.status}`);
          }
          
          const data = await response.json();
          if (data.text) {
            setCvText(data.text);
            // Try to auto-extract candidate name from file name
            const cleanName = file.name
              .replace(/\.[^/.]+$/, "")
              .replace(/(cv|resume|screening|odin|mortgage|evaluation|broker)/gi, "")
              .replace(/[-_]/g, " ")
              .trim();
            if (cleanName && !candidateName) {
              setCandidateName(cleanName.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
            }
          } else {
            throw new Error("No readable text returned from server.");
          }
        } catch (err: any) {
          console.error("Parsing file error:", err);
          setFileParsingError(err.message || "Failed to parse file. Please copy-paste text directly.");
        } finally {
          setIsParsingFile(false);
        }
      };
      reader.onerror = () => {
        setFileParsingError("Failed to read binary file.");
        setIsParsingFile(false);
      };
      reader.readAsDataURL(file);
    } else {
      setFileParsingError("Unsupported file format. Please upload a PDF, Word (.doc/.docx), TXT, or MD file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Loading animation simulation
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < 4) {
            return prev + 1;
          }
          return prev;
        });
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Run AI Screening call to backend
  const handleRunScreening = async () => {
    if (!candidateName.trim()) {
      setErrorMessage("Please enter the Candidate's Name.");
      return;
    }
    if (!cvText.trim()) {
      setErrorMessage("Please paste or upload the Candidate's CV.");
      return;
    }
    if (!jdText.trim()) {
      setErrorMessage("Please enter the Job Description.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/screen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cv: cvText,
          jd: jdText,
          coreValues,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const result: ScreeningResult = await response.json();

      const newRecord: ScreeningRecord = {
        id: "rec-" + Date.now(),
        candidateName,
        jobTitle,
        date: new Date().toLocaleDateString(),
        cvText,
        jdText,
        coreValues,
        result,
      };

      const updatedHistory = [newRecord, ...records];
      saveRecords(updatedHistory);
      setSelectedRecordId(newRecord.id);
      setIsScreeningMode(false);
      setActiveTab(result.decision === "ADVANCE" ? "analysis" : "analysis");
      
      // Reset checklist
      setInterviewChecklist({
        rapport: false,
        noticePeriod: false,
        salaryExpectation: false,
        workingHours: false,
        motivation: false,
        historyDeepDive: false,
        followUpProbes: false,
        nextStepsExplained: false,
      });

    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "An error occurred while analyzing the CV. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a record
  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = records.filter(r => r.id !== id);
    saveRecords(updated);
    if (selectedRecordId === id) {
      setSelectedRecordId(null);
      setIsScreeningMode(true);
    }
  };

  // Filter & Search records list
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchesSearch = 
        rec.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (filterDecision === "ALL") return matchesSearch;
      return matchesSearch && rec.result.decision === filterDecision;
    });
  }, [records, searchQuery, filterDecision]);

  // Find currently selected record
  const selectedRecord = useMemo(() => {
    return records.find(r => r.id === selectedRecordId) || null;
  }, [records, selectedRecordId]);

  // Copy triggers
  const handleCopySection = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleCopyFullScript = (script: any) => {
    if (!script) return;
    const fullText = `ODIN MORTGAGE PHONE SCREENING SCRIPT\n==================================\n\n` +
      `A. OPENING (30-45s):\n${script.opening}\n\n` +
      `B. CONTEXT (20s):\n${script.context}\n\n` +
      `C. SECTION 1 - BASIC REQUIREMENTS (2-3m):\n${script.section1Basic}\n\n` +
      `D. SECTION 2 - MOTIVATION & ROLE FIT (2-4m):\n${script.section2Motivation}\n\n` +
      `E. SECTION 3 - JOB HISTORY & ACCOUNTABILITY (4-6m):\n${script.section3History}\n\n` +
      `F. SECTION 4 - COMMUNICATION SKILLS:\n${script.section4Communication}\n\n` +
      `G. FINAL CHECK + CLOSE (1-2m):\n${script.close}\n\n` +
      `CANDIDATE-SPECIFIC PROBES:\n${script.probes.map((p: string, i: number) => `[${i + 1}] ${p}`).join("\n")}`;

    navigator.clipboard.writeText(fullText);
    setCopiedFullScript(true);
    setTimeout(() => setCopiedFullScript(false), 2000);
  };

  const handleCopyRejectionEmail = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleScriptSection = (section: string) => {
    setExpandedScriptSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleChecklistItem = (key: string) => {
    setInterviewChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* Header Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shrink-0 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-inner">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight flex items-center">
              Candidate Screening Assistant
            </h1>
            <p className="text-xs text-slate-400 font-mono">Talent Acquisition SOP Automation Engine v2.0</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            id="new-screening-header-btn"
            onClick={() => {
              setIsScreeningMode(true);
              setSelectedRecordId(null);
            }}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow-md shadow-emerald-950/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Screening</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Screening Logs / History */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden print:hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="sidebar-search"
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                id="filter-all-btn"
                onClick={() => setFilterDecision("ALL")}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
                  filterDecision === "ALL" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All
              </button>
              <button
                id="filter-advance-btn"
                onClick={() => setFilterDecision("ADVANCE")}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
                  filterDecision === "ADVANCE" 
                    ? "bg-white text-emerald-700 shadow-sm" 
                    : "text-slate-500 hover:text-emerald-600"
                }`}
              >
                Advance
              </button>
              <button
                id="filter-reject-btn"
                onClick={() => setFilterDecision("REJECT")}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
                  filterDecision === "REJECT" 
                    ? "bg-white text-rose-700 shadow-sm" 
                    : "text-slate-500 hover:text-rose-600"
                }`}
              >
                Reject
              </button>
            </div>
          </div>

          {/* History records list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 px-4 text-slate-400 text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No screenings found</p>
              </div>
            ) : (
              filteredRecords.map((rec) => {
                const isSelected = selectedRecordId === rec.id && !isScreeningMode;
                const isPassed = rec.result.decision === "ADVANCE";
                return (
                  <div
                    id={`record-card-${rec.id}`}
                    key={rec.id}
                    onClick={() => {
                      setSelectedRecordId(rec.id);
                      setIsScreeningMode(false);
                      setActiveTab("analysis");
                    }}
                    className={`group p-3 rounded-lg cursor-pointer transition-all flex flex-col relative border ${
                      isSelected 
                        ? "bg-emerald-50/70 border-emerald-300 text-slate-900" 
                        : "bg-white hover:bg-slate-50 border-transparent text-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-semibold text-sm tracking-tight pr-6 group-hover:text-emerald-700 truncate">
                        {rec.candidateName}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold leading-none ${
                        isPassed 
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                          : "bg-rose-100 text-rose-800 border border-rose-200"
                      }`}>
                        {rec.result.score}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-500 truncate mt-1 flex items-center">
                      <Briefcase className="w-3 h-3 mr-1 shrink-0 text-slate-400" />
                      <span className="truncate">{rec.jobTitle}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                      <span className="font-mono">{rec.date}</span>
                      <button
                        id={`delete-record-${rec.id}`}
                        onClick={(e) => handleDeleteRecord(rec.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5"
                        title="Delete screening log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 font-mono text-center">
            SOP Standard Compliance: ACTIVE
          </div>
        </aside>

        {/* Right workspace: Main interactive container */}
        <main className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
          
          <AnimatePresence mode="wait">
            {isLoading ? (
              // Immersive Loading Screen with sequential milestones
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900 text-white min-h-[500px]"
              >
                <div className="max-w-md w-full text-center space-y-8">
                  <div className="relative inline-flex">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                      <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                    </div>
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-110 animate-pulse"></div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-2xl tracking-tight text-emerald-300">
                      Processing Candidate Screen
                    </h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto">
                      Gemini is evaluating the candidate's CV against the Job Description following Odin's TA Screening SOP.
                    </p>
                  </div>

                  {/* Progressive screening checklist milestones */}
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 text-left space-y-4">
                    <div className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-2 border-b border-slate-700 pb-2">
                      TA Screening SOP Progress Map
                    </div>

                    <div className="flex items-center space-x-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${loadingStep >= 0 ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                        {loadingStep > 0 ? <Check className="w-3.5 h-3.5" /> : "1"}
                      </div>
                      <span className={loadingStep === 0 ? "font-semibold text-emerald-400" : loadingStep > 0 ? "text-slate-400 line-through" : "text-slate-500"}>
                        Extracting core qualifications and career milestones
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${loadingStep >= 1 ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                        {loadingStep > 1 ? <Check className="w-3.5 h-3.5" /> : "2"}
                      </div>
                      <span className={loadingStep === 1 ? "font-semibold text-emerald-400" : loadingStep > 1 ? "text-slate-400 line-through" : "text-slate-500"}>
                        Mapping candidate experience to JD Must-Haves
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${loadingStep >= 2 ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                        {loadingStep > 2 ? <Check className="w-3.5 h-3.5" /> : "3"}
                      </div>
                      <span className={loadingStep === 2 ? "font-semibold text-emerald-400" : loadingStep > 2 ? "text-slate-400 line-through" : "text-slate-500"}>
                        Assessing integrity flags (gaps, relocation, salary markers)
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${loadingStep >= 3 ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                        {loadingStep > 3 ? <Check className="w-3.5 h-3.5" /> : "4"}
                      </div>
                      <span className={loadingStep === 3 ? "font-semibold text-emerald-400" : loadingStep > 3 ? "text-slate-400 line-through" : "text-slate-500"}>
                        Validating candidate match with Odin's core values
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${loadingStep >= 4 ? 'bg-emerald-500 text-slate-900 animate-pulse' : 'bg-slate-700 text-slate-400'}`}>
                        5
                      </div>
                      <span className={loadingStep === 4 ? "font-semibold text-emerald-400 animate-pulse" : "text-slate-500"}>
                        Drafting custom script & detailed probes
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 font-mono">
                    Usually takes 10-15 seconds. Please hold...
                  </div>
                </div>
              </motion.div>
            ) : isScreeningMode ? (
              // Screening Input Form Mode
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 md:p-8 max-w-4xl w-full mx-auto space-y-8"
              >
                {/* Form Title */}
                <div className="border-b border-slate-200 pb-5">
                  <h2 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-slate-900">
                    Candidate Evaluation Hub
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Execute candidate screening workflows. Use our presets for rapid SOP evaluations.
                  </p>
                </div>

                {/* Example Presets Bar */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-xs text-emerald-800 font-semibold uppercase tracking-wider mb-3">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Quick-Test Candidate Presets</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {PRESETS.map((preset) => (
                      <button
                        id={`preset-btn-${preset.id}`}
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="text-left bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 p-3 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 active:scale-95 group"
                      >
                        <div className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700 truncate">
                          {preset.candidateName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                          {preset.id === "expat-broker-fit" ? "STRONG FIT (LIAM)" : preset.id === "marketing-lead-nofit" ? "NO-FIT (AMARA)" : "BORDERLINE (SIDDHARTH)"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-4 flex items-start space-x-3 text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-semibold">Analysis Blocked:</span> {errorMessage}
                    </div>
                  </div>
                )}

                {/* Form fields */}
                <form onSubmit={(e) => { e.preventDefault(); handleRunScreening(); }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Candidate Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          id="candidate-name-input"
                          type="text"
                          required
                          placeholder="e.g. Liam Fletcher"
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Target Job Title
                      </label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          id="job-title-input"
                          type="text"
                          required
                          placeholder="e.g. Senior Expat Mortgage Broker"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Core Values Section */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Odin Core Values & Framework
                      </label>
                      <button
                        id="reset-core-values-btn"
                        type="button"
                        onClick={() => setCoreValues(DEFAULT_CORE_VALUES)}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold uppercase tracking-wider"
                      >
                        Reset to Defaults
                      </button>
                    </div>
                    <textarea
                      id="core-values-input"
                      rows={3}
                      value={coreValues}
                      onChange={(e) => setCoreValues(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  {/* Job Description Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Job Description (JD) Requirements
                    </label>
                    <textarea
                      id="jd-input"
                      rows={6}
                      required
                      placeholder="Paste the target job description here. Be sure to include 'Must-Have Requirements' and 'Nice-to-Have' criteria so the SOP evaluation can map them specifically."
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-mono text-xs leading-relaxed"
                    />
                  </div>

                  {/* Candidate CV Section with drag-and-drop support */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Candidate CV / Resume
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Supports PDF, Word (.docx, .doc), TXT, and MD
                      </span>
                    </div>
                    
                    <div
                      id="cv-drag-container"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl transition-all relative ${
                        isDragging 
                          ? "border-emerald-500 bg-emerald-50/50" 
                          : isParsingFile
                            ? "border-emerald-300 bg-slate-50/50"
                            : fileParsingError
                              ? "border-rose-300 bg-rose-50/10"
                              : cvText.trim() 
                                ? "border-slate-200 bg-white" 
                                : "border-slate-300 hover:border-slate-400 bg-white"
                      }`}
                    >
                      {/* Drag & drop overlay or inner loader */}
                      {isParsingFile && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-4 z-10">
                          <div className="relative flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                            <div className="absolute inset-0 bg-emerald-100 blur-md rounded-full -z-10 animate-pulse"></div>
                          </div>
                          <p className="text-sm font-bold text-slate-800 mt-3">Extracting CV Text...</p>
                          <p className="text-xs text-slate-500 mt-1">Reading document layout and structure</p>
                        </div>
                      )}

                      <div className="p-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="font-mono flex items-center space-x-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {cvText.trim() ? `${cvText.trim().split(/\s+/).length} words parsed` : "No CV uploaded or pasted yet"}
                          </span>
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            id="cv-file-picker"
                            ref={cvFileRef}
                            onChange={handleFileSelect}
                            accept=".pdf,.docx,.doc,.txt,.md"
                            className="hidden"
                          />
                          <button
                            id="upload-cv-file-btn"
                            type="button"
                            onClick={() => cvFileRef.current?.click()}
                            className="flex items-center space-x-1.5 text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors border border-emerald-100"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload CV / Resume File</span>
                          </button>
                        </div>
                      </div>

                      {fileParsingError && (
                        <div className="p-3 mx-3 mt-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-semibold">Parsing Error:</span> {fileParsingError}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setFileParsingError(null)}
                            className="text-slate-400 hover:text-slate-600 font-bold px-1"
                          >
                            ×
                          </button>
                        </div>
                      )}

                      <textarea
                        id="cv-input"
                        rows={10}
                        required
                        placeholder="Paste the candidate's CV/Resume text here... Or drag-and-drop a PDF, Word (.docx/.doc), TXT, or MD file."
                        value={cvText}
                        onChange={(e) => setCvText(e.target.value)}
                        className="w-full border-0 focus:ring-0 p-3 text-sm focus:outline-none text-slate-800 font-mono text-xs leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <button
                      id="reset-inputs-btn"
                      type="button"
                      onClick={handleResetInputs}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold uppercase tracking-wider"
                    >
                      Clear Fields
                    </button>

                    <button
                      id="submit-screening-btn"
                      type="submit"
                      className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-700/20 transition-all hover:shadow-xl hover:shadow-emerald-700/35 active:scale-95 text-sm"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
                      <span>Run AI Candidate Screening</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              // Screening Result Detail View Mode
              selectedRecord && (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6 print:p-0 print:bg-white"
                >
                  {/* Top nav path in details */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
                    <button
                      id="back-to-screenings-btn"
                      onClick={() => setIsScreeningMode(true)}
                      className="flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-800 uppercase tracking-wider"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Evaluation Form</span>
                    </button>

                    <button
                      id="print-analysis-btn"
                      onClick={handlePrint}
                      className="flex items-center space-x-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Export Analysis / Print</span>
                    </button>
                  </div>

                  {/* Candidate Briefing Banner */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden print:border-none print:shadow-none print:p-0">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-bold uppercase">SOP Completed</span>
                        <span>•</span>
                        <span>Screened on {selectedRecord.date}</span>
                      </div>
                      
                      <h2 className="font-display font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">
                        {selectedRecord.candidateName}
                      </h2>

                      <div className="text-sm font-semibold text-slate-600 flex items-center">
                        <Briefcase className="w-4 h-4 mr-1.5 text-slate-400" />
                        <span>Target Role: {selectedRecord.jobTitle}</span>
                      </div>
                    </div>

                    {/* Decision Badge Card */}
                    <div className="flex items-center space-x-4 shrink-0">
                      <div className="text-right hidden md:block">
                        <span className="text-slate-400 text-xs block font-mono">AI Screening Match</span>
                        <span className="text-xs font-bold text-slate-600">{selectedRecord.result.score}/100 Match Rating</span>
                      </div>

                      <div className={`px-4 py-3 rounded-xl flex items-center space-x-3 border ${
                        selectedRecord.result.decision === "ADVANCE"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}>
                        {selectedRecord.result.decision === "ADVANCE" ? (
                          <>
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            <div>
                              <div className="text-[10px] font-mono leading-none text-emerald-600 uppercase font-bold tracking-wider">DECISION</div>
                              <div className="font-extrabold text-sm leading-tight tracking-wide uppercase">ADVANCE TO PHONE SCREEN</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-6 h-6 text-rose-600" />
                            <div>
                              <div className="text-[10px] font-mono leading-none text-rose-600 uppercase font-bold tracking-wider">DECISION</div>
                              <div className="font-extrabold text-sm leading-tight tracking-wide uppercase">REJECT APPLICATION</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grid Layout for Score Circular Gauge and Decision summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Score Card */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                        AI Fit Score Mapped
                      </h3>
                      
                      <div className="relative flex items-center justify-center w-36 h-36">
                        {/* Circular Progress Ring */}
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          {/* Background Ring */}
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke="#e2e8f0"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          {/* Progress Ring */}
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            stroke={
                              selectedRecord.result.score >= 75 
                                ? "#10b981" // emerald-500
                                : selectedRecord.result.score >= 50 
                                  ? "#f59e0b" // amber-500
                                  : "#f43f5e" // rose-500
                            }
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 42}
                            strokeDashoffset={((100 - selectedRecord.result.score) / 100) * (2 * Math.PI * 42)}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute text-center space-y-0.5">
                          <span className="font-display font-extrabold text-3xl text-slate-900 block leading-none">
                            {selectedRecord.result.score}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                            / 100 max
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 text-xs font-mono text-slate-400">
                        Standard Assessment Rating
                      </div>
                    </div>

                    {/* Decision Reason Summary card */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm md:col-span-2 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                          <Award className="w-4 h-4 mr-1 text-slate-400" />
                          <span>Odin TA SOP Decision Justification</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-sans">
                          {selectedRecord.result.decisionReason}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                        <span className="text-slate-400 font-semibold uppercase font-mono py-1">Must-Haves Met:</span>
                        <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded font-mono font-bold">
                          {selectedRecord.result.mustHavesMet.filter(m => m.met).length} / {selectedRecord.result.mustHavesMet.length + selectedRecord.result.mustHavesMissing.length} Met
                        </span>
                        {selectedRecord.result.mustHavesMissing.length > 0 && (
                          <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded font-mono font-bold border border-rose-100">
                            {selectedRecord.result.mustHavesMissing.length} Missing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tabs Selector for Details (CV Match vs. Phone Script / Rejection email) */}
                  <div className="flex border-b border-slate-200 print:hidden bg-white rounded-lg p-1 border shadow-sm">
                    <button
                      id="tab-analysis"
                      onClick={() => setActiveTab("analysis")}
                      className={`flex-1 py-2.5 rounded-md font-medium text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                        activeTab === "analysis"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>SOP Match Analysis</span>
                    </button>

                    {selectedRecord.result.decision === "ADVANCE" ? (
                      <button
                        id="tab-script"
                        onClick={() => setActiveTab("script")}
                        className={`flex-1 py-2.5 rounded-md font-medium text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                          activeTab === "script"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>Interactive Interview Script</span>
                      </button>
                    ) : (
                      <button
                        id="tab-rejection"
                        onClick={() => setActiveTab("rejection")}
                        className={`flex-1 py-2.5 rounded-md font-medium text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                          activeTab === "rejection"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                        <span>Rejection Note Composer</span>
                      </button>
                    )}
                  </div>

                  {/* Dynamic Tab Contents */}
                  <div>
                    {activeTab === "analysis" && (
                      <div className="space-y-6">
                        
                        {/* Requirement Checklist */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
                            <span>JD Must-Have Requirements Checklist</span>
                          </h4>

                          <div className="space-y-4 divide-y divide-slate-100">
                            {/* Met Must-Haves */}
                            {selectedRecord.result.mustHavesMet.map((item, idx) => (
                              <div key={`met-${idx}`} className={`pt-4 ${idx === 0 ? 'pt-0' : ''} flex items-start space-x-3`}>
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <div className="text-sm font-semibold text-slate-900">{item.requirement}</div>
                                  <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg p-2.5 font-mono">
                                    <strong className="text-slate-700 block text-[10px] uppercase font-sans font-bold tracking-wider mb-0.5">Evidence from CV:</strong>
                                    {item.details}
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Missing Must-Haves */}
                            {selectedRecord.result.mustHavesMissing.map((item, idx) => (
                              <div key={`missing-${idx}`} className="pt-4 flex items-start space-x-3">
                                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <div className="text-sm font-semibold text-rose-900">{item.requirement}</div>
                                  <div className="text-xs text-rose-600 bg-rose-50/50 border border-rose-100 rounded-lg p-2.5 leading-relaxed font-mono">
                                    <strong className="text-rose-800 block text-[10px] uppercase font-sans font-bold tracking-wider mb-0.5">SOP Flag:</strong>
                                    {item.details}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Nice-to-Haves Checklist if any exist */}
                        {selectedRecord.result.niceToHavesMet.length > 0 && (
                          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center">
                              <BookOpen className="w-4 h-4 text-emerald-600 mr-1.5" />
                              <span>Nice-to-Have Requirements Mapped</span>
                            </h4>
                            <div className="space-y-4 divide-y divide-slate-100">
                              {selectedRecord.result.niceToHavesMet.map((item, idx) => (
                                <div key={`nice-${idx}`} className={`pt-4 ${idx === 0 ? 'pt-0' : ''} flex items-start space-x-3`}>
                                  <div className={`p-0.5 rounded-full mt-0.5 ${item.met ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300'}`}>
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                  <div className="space-y-1">
                                    <div className={`text-sm font-semibold ${item.met ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                                      {item.requirement}
                                    </div>
                                    {item.met && (
                                      <div className="text-xs text-slate-500 leading-relaxed font-mono bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                                        {item.details}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Standout Strengths & Risks / Gaps comparison card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Strengths Card */}
                          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center">
                              <Award className="w-4 h-4 text-emerald-600 mr-1.5" />
                              <span>Standout Candidate Strengths</span>
                            </h4>
                            <ul className="space-y-3">
                              {selectedRecord.result.strengths.map((str, idx) => (
                                <li key={`strength-${idx}`} className="flex items-start space-x-2 text-sm text-slate-700 leading-relaxed">
                                  <span className="w-5 h-5 bg-emerald-50 text-emerald-600 font-bold rounded-full flex items-center justify-center shrink-0 text-xs mt-0.5 font-mono">
                                    {idx + 1}
                                  </span>
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Concerns & Flags Card */}
                          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center">
                              <AlertTriangle className="w-4 h-4 text-rose-500 mr-1.5" />
                              <span>SOP Concerns & Integrity Flags</span>
                            </h4>
                            {selectedRecord.result.flags.length === 0 ? (
                              <div className="text-sm text-slate-500 flex items-center space-x-2 bg-slate-50 p-4 rounded-lg border border-dashed border-slate-200">
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span>No significant job-hopping, gaps, or mismatch flags detected.</span>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {selectedRecord.result.flags.map((flag, idx) => (
                                  <div key={`flag-${idx}`} className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-sm text-slate-800">{flag.issue}</span>
                                      <span className={`text-[9px] font-mono font-bold leading-none uppercase px-1.5 py-0.5 rounded border ${
                                        flag.severity === "high"
                                          ? "bg-rose-100 text-rose-800 border-rose-200"
                                          : flag.severity === "medium"
                                            ? "bg-orange-100 text-orange-800 border-orange-200"
                                            : "bg-amber-100 text-amber-800 border-amber-200"
                                      }`}>
                                        {flag.severity} severity
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                      {flag.details}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    )}

                    {/* INTERACTIVE PHONE INTERVIEW SCRIPT TAB */}
                    {activeTab === "script" && selectedRecord.result.script && (
                      <div className="space-y-6">
                        
                        {/* Script instructions header */}
                        <div className="bg-emerald-900 text-white rounded-xl p-6 shadow-sm space-y-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5">
                            <Sparkles className="w-32 h-32 text-white" />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h4 className="font-display font-bold text-lg tracking-tight">
                                Live Interviewer Board
                              </h4>
                              <p className="text-xs text-emerald-200">
                                Conduct the candidate screening call. Use checklists, timings, and custom probes.
                              </p>
                            </div>

                            <button
                              id="copy-full-script-btn"
                              onClick={() => handleCopyFullScript(selectedRecord.result.script)}
                              className="flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all border border-emerald-700"
                            >
                              {copiedFullScript ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Full Script Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Full Script</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Interactive Timeline & Script Sections */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                          
                          {/* Script Core timeline */}
                          <div className="lg:col-span-2 space-y-4">
                            
                            {/* Section A: Opening */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                              <button
                                onClick={() => toggleScriptSection("opening")}
                                className="w-full text-left px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-100"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="font-mono text-xs font-extrabold bg-slate-200 text-slate-700 px-2 py-1 rounded">A</span>
                                  <div>
                                    <span className="font-semibold text-sm text-slate-800 block">Opening & Introduction</span>
                                    <span className="text-[10px] text-slate-400 font-mono">Timing: 30–45 seconds</span>
                                  </div>
                                </div>
                                {expandedScriptSections.opening ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              </button>
                              
                              {expandedScriptSections.opening && (
                                <div className="p-5 space-y-3">
                                  <p className="text-sm text-slate-700 leading-relaxed font-serif p-4 bg-amber-50/50 border-l-4 border-amber-400 rounded-r-lg">
                                    "{selectedRecord.result.script.opening}"
                                  </p>
                                  <div className="flex justify-end">
                                    <button
                                      id="copy-sec-a"
                                      onClick={() => handleCopySection("opening", selectedRecord.result.script!.opening)}
                                      className="text-xs text-slate-500 hover:text-emerald-600 font-semibold uppercase tracking-wider flex items-center space-x-1"
                                    >
                                      {copiedSection === "opening" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>{copiedSection === "opening" ? "Copied" : "Copy Section"}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Section B: Set Context */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                              <button
                                onClick={() => toggleScriptSection("context")}
                                className="w-full text-left px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-100"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="font-mono text-xs font-extrabold bg-slate-200 text-slate-700 px-2 py-1 rounded">B</span>
                                  <div>
                                    <span className="font-semibold text-sm text-slate-800 block">Set the Context</span>
                                    <span className="text-[10px] text-slate-400 font-mono">Timing: 20 seconds</span>
                                  </div>
                                </div>
                                {expandedScriptSections.context ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              </button>
                              
                              {expandedScriptSections.context && (
                                <div className="p-5 space-y-3">
                                  <p className="text-sm text-slate-700 leading-relaxed font-serif p-4 bg-amber-50/50 border-l-4 border-amber-400 rounded-r-lg">
                                    "{selectedRecord.result.script.context}"
                                  </p>
                                  <div className="flex justify-end">
                                    <button
                                      id="copy-sec-b"
                                      onClick={() => handleCopySection("context", selectedRecord.result.script!.context)}
                                      className="text-xs text-slate-500 hover:text-emerald-600 font-semibold uppercase tracking-wider flex items-center space-x-1"
                                    >
                                      {copiedSection === "context" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>{copiedSection === "context" ? "Copied" : "Copy Section"}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Section C: Basic Requirements */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                              <button
                                onClick={() => toggleScriptSection("section1")}
                                className="w-full text-left px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-100"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="font-mono text-xs font-extrabold bg-slate-200 text-slate-700 px-2 py-1 rounded">C</span>
                                  <div>
                                    <span className="font-semibold text-sm text-slate-800 block">Section 1: Basic Requirements Check</span>
                                    <span className="text-[10px] text-slate-400 font-mono">Timing: 2–3 minutes</span>
                                  </div>
                                </div>
                                {expandedScriptSections.section1 ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              </button>
                              
                              {expandedScriptSections.section1 && (
                                <div className="p-5 space-y-3">
                                  <p className="text-sm text-slate-700 leading-relaxed font-serif p-4 bg-amber-50/50 border-l-4 border-amber-400 rounded-r-lg whitespace-pre-line">
                                    {selectedRecord.result.script.section1Basic}
                                  </p>
                                  <div className="flex justify-end">
                                    <button
                                      id="copy-sec-c"
                                      onClick={() => handleCopySection("section1", selectedRecord.result.script!.section1Basic)}
                                      className="text-xs text-slate-500 hover:text-emerald-600 font-semibold uppercase tracking-wider flex items-center space-x-1"
                                    >
                                      {copiedSection === "section1" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>{copiedSection === "section1" ? "Copied" : "Copy Section"}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Section D: Motivation & Fit */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                              <button
                                onClick={() => toggleScriptSection("section2")}
                                className="w-full text-left px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-100"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="font-mono text-xs font-extrabold bg-slate-200 text-slate-700 px-2 py-1 rounded">D</span>
                                  <div>
                                    <span className="font-semibold text-sm text-slate-800 block">Section 2: Motivation & Role Fit</span>
                                    <span className="text-[10px] text-slate-400 font-mono">Timing: 2–4 minutes</span>
                                  </div>
                                </div>
                                {expandedScriptSections.section2 ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              </button>
                              
                              {expandedScriptSections.section2 && (
                                <div className="p-5 space-y-3">
                                  <p className="text-sm text-slate-700 leading-relaxed font-serif p-4 bg-amber-50/50 border-l-4 border-amber-400 rounded-r-lg whitespace-pre-line">
                                    {selectedRecord.result.script.section2Motivation}
                                  </p>
                                  <div className="flex justify-end">
                                    <button
                                      id="copy-sec-d"
                                      onClick={() => handleCopySection("section2", selectedRecord.result.script!.section2Motivation)}
                                      className="text-xs text-slate-500 hover:text-emerald-600 font-semibold uppercase tracking-wider flex items-center space-x-1"
                                    >
                                      {copiedSection === "section2" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>{copiedSection === "section2" ? "Copied" : "Copy Section"}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Section E: Job History */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                              <button
                                onClick={() => toggleScriptSection("section3")}
                                className="w-full text-left px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-100"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="font-mono text-xs font-extrabold bg-slate-200 text-slate-700 px-2 py-1 rounded">E</span>
                                  <div>
                                    <span className="font-semibold text-sm text-slate-800 block">Section 3: Job History & Accountability</span>
                                    <span className="text-[10px] text-slate-400 font-mono">Timing: 4–6 minutes</span>
                                  </div>
                                </div>
                                {expandedScriptSections.section3 ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              </button>
                              
                              {expandedScriptSections.section3 && (
                                <div className="p-5 space-y-4">
                                  <p className="text-sm text-slate-700 leading-relaxed font-serif p-4 bg-amber-50/50 border-l-4 border-amber-400 rounded-r-lg whitespace-pre-line">
                                    {selectedRecord.result.script.section3History}
                                  </p>
                                  
                                  {/* Section E deep candidate probes */}
                                  <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-lg space-y-2.5">
                                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span>Candidate-Specific Critical Probes (Hot List)</span>
                                    </div>
                                    <ul className="space-y-2">
                                      {selectedRecord.result.script.probes.map((probe, idx) => (
                                        <li key={`probe-${idx}`} className="flex items-start space-x-2 text-xs text-slate-700 leading-relaxed">
                                          <span className="w-5 h-5 bg-emerald-200 text-emerald-800 rounded flex items-center justify-center font-bold font-mono shrink-0">
                                            {idx + 1}
                                          </span>
                                          <span>{probe}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="flex justify-end">
                                    <button
                                      id="copy-sec-e"
                                      onClick={() => handleCopySection("section3", selectedRecord.result.script!.section3History)}
                                      className="text-xs text-slate-500 hover:text-emerald-600 font-semibold uppercase tracking-wider flex items-center space-x-1"
                                    >
                                      {copiedSection === "section3" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>{copiedSection === "section3" ? "Copied" : "Copy Section"}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Section F: Communication Assess */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                              <button
                                onClick={() => toggleScriptSection("section4")}
                                className="w-full text-left px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-100"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="font-mono text-xs font-extrabold bg-slate-200 text-slate-700 px-2 py-1 rounded">F</span>
                                  <div>
                                    <span className="font-semibold text-sm text-slate-800 block">Section 4: Communication Evaluation Guidelines</span>
                                    <span className="text-[10px] text-slate-400 font-mono">Timing: Assessed throughout</span>
                                  </div>
                                </div>
                                {expandedScriptSections.section4 ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              </button>
                              
                              {expandedScriptSections.section4 && (
                                <div className="p-5 space-y-3">
                                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                                    <strong className="text-slate-800 block text-xs uppercase font-sans font-bold tracking-wider mb-2">Interviewer Grading Rubric:</strong>
                                    {selectedRecord.result.script.section4Communication}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Section G: Close */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                              <button
                                onClick={() => toggleScriptSection("close")}
                                className="w-full text-left px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between transition-colors hover:bg-slate-100"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="font-mono text-xs font-extrabold bg-slate-200 text-slate-700 px-2 py-1 rounded">G</span>
                                  <div>
                                    <span className="font-semibold text-sm text-slate-800 block">Final Check & Closure</span>
                                    <span className="text-[10px] text-slate-400 font-mono">Timing: 1–2 minutes</span>
                                  </div>
                                </div>
                                {expandedScriptSections.close ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              </button>
                              
                              {expandedScriptSections.close && (
                                <div className="p-5 space-y-3">
                                  <p className="text-sm text-slate-700 leading-relaxed font-serif p-4 bg-amber-50/50 border-l-4 border-amber-400 rounded-r-lg whitespace-pre-line">
                                    {selectedRecord.result.script.close}
                                  </p>
                                  <div className="flex justify-end">
                                    <button
                                      id="copy-sec-g"
                                      onClick={() => handleCopySection("close", selectedRecord.result.script!.close)}
                                      className="text-xs text-slate-500 hover:text-emerald-600 font-semibold uppercase tracking-wider flex items-center space-x-1"
                                    >
                                      {copiedSection === "close" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                      <span>{copiedSection === "close" ? "Copied" : "Copy Section"}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>

                          {/* Right interactive interview checks sidebar */}
                          <div className="space-y-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 sticky top-24">
                              <div className="border-b border-slate-100 pb-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                                  <CheckSquare className="w-4 h-4 mr-1.5 text-emerald-600" />
                                  <span>Live Interview Tracker</span>
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">Check off milestones as you verify them on the call.</p>
                              </div>

                              <div className="space-y-3">
                                <button
                                  type="button"
                                  onClick={() => toggleChecklistItem("rapport")}
                                  className="w-full flex items-center space-x-2.5 text-left text-xs transition-colors hover:bg-slate-50 p-1.5 rounded"
                                >
                                  {interviewChecklist.rapport ? (
                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <div className="w-4.5 h-4.5 border border-slate-300 rounded shrink-0"></div>
                                  )}
                                  <span className={interviewChecklist.rapport ? "text-slate-400 line-through" : "text-slate-700 font-medium"}>
                                    Build initial rapport & set agenda
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleChecklistItem("noticePeriod")}
                                  className="w-full flex items-center space-x-2.5 text-left text-xs transition-colors hover:bg-slate-50 p-1.5 rounded"
                                >
                                  {interviewChecklist.noticePeriod ? (
                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <div className="w-4.5 h-4.5 border border-slate-300 rounded shrink-0"></div>
                                  )}
                                  <span className={interviewChecklist.noticePeriod ? "text-slate-400 line-through" : "text-slate-700 font-medium"}>
                                    Log notice period details
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleChecklistItem("salaryExpectation")}
                                  className="w-full flex items-center space-x-2.5 text-left text-xs transition-colors hover:bg-slate-50 p-1.5 rounded"
                                >
                                  {interviewChecklist.salaryExpectation ? (
                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <div className="w-4.5 h-4.5 border border-slate-300 rounded shrink-0"></div>
                                  )}
                                  <span className={interviewChecklist.salaryExpectation ? "text-slate-400 line-through" : "text-slate-700 font-medium"}>
                                    Verify salary expectations bracket
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleChecklistItem("workingHours")}
                                  className="w-full flex items-center space-x-2.5 text-left text-xs transition-colors hover:bg-slate-50 p-1.5 rounded"
                                >
                                  {interviewChecklist.workingHours ? (
                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <div className="w-4.5 h-4.5 border border-slate-300 rounded shrink-0"></div>
                                  )}
                                  <span className={interviewChecklist.workingHours ? "text-slate-400 line-through" : "text-slate-700 font-medium"}>
                                    Confirm timezone & shift alignment
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleChecklistItem("motivation")}
                                  className="w-full flex items-center space-x-2.5 text-left text-xs transition-colors hover:bg-slate-50 p-1.5 rounded"
                                >
                                  {interviewChecklist.motivation ? (
                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <div className="w-4.5 h-4.5 border border-slate-300 rounded shrink-0"></div>
                                  )}
                                  <span className={interviewChecklist.motivation ? "text-slate-400 line-through" : "text-slate-700 font-medium"}>
                                    Probe role & core values fit
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleChecklistItem("historyDeepDive")}
                                  className="w-full flex items-center space-x-2.5 text-left text-xs transition-colors hover:bg-slate-50 p-1.5 rounded"
                                >
                                  {interviewChecklist.historyDeepDive ? (
                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <div className="w-4.5 h-4.5 border border-slate-300 rounded shrink-0"></div>
                                  )}
                                  <span className={interviewChecklist.historyDeepDive ? "text-slate-400 line-through" : "text-slate-700 font-medium"}>
                                    Ask custom resume accountability Qs
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleChecklistItem("followUpProbes")}
                                  className="w-full flex items-center space-x-2.5 text-left text-xs transition-colors hover:bg-slate-50 p-1.5 rounded"
                                >
                                  {interviewChecklist.followUpProbes ? (
                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <div className="w-4.5 h-4.5 border border-slate-300 rounded shrink-0"></div>
                                  )}
                                  <span className={interviewChecklist.followUpProbes ? "text-slate-400 line-through" : "text-slate-700 font-medium"}>
                                    Run the custom follow-up probes
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleChecklistItem("nextStepsExplained")}
                                  className="w-full flex items-center space-x-2.5 text-left text-xs transition-colors hover:bg-slate-50 p-1.5 rounded"
                                >
                                  {interviewChecklist.nextStepsExplained ? (
                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <div className="w-4.5 h-4.5 border border-slate-300 rounded shrink-0"></div>
                                  )}
                                  <span className={interviewChecklist.nextStepsExplained ? "text-slate-400 line-through" : "text-slate-700 font-medium"}>
                                    Detail timeline & next stages
                                  </span>
                                </button>
                              </div>

                              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Interview Complete</div>
                                <div className="text-sm font-bold text-slate-800 mt-1 font-mono">
                                  {Math.round(
                                    (Object.values(interviewChecklist).filter(Boolean).length / 
                                    Object.values(interviewChecklist).length) * 100
                                  )}% Done
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>

                      </div>
                    )}

                    {/* REJECTION EMAIL COMPOSER TAB */}
                    {activeTab === "rejection" && selectedRecord.result.rejectionNote && (
                      <div className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                          
                          {/* Composer headers */}
                          <div className="p-4 bg-slate-50 border-b border-slate-150 space-y-2">
                            <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                              <span className="w-16 block font-bold text-slate-400">To:</span>
                              <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-sans font-medium">
                                {selectedRecord.candidateName.toLowerCase().replace(/\s+/g, ".")}@example.com
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                              <span className="w-16 block font-bold text-slate-400">From:</span>
                              <span className="text-slate-600">careers@odinmortgage.com</span>
                            </div>

                            <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                              <span className="w-16 block font-bold text-slate-400">Subject:</span>
                              <span className="text-slate-800 font-semibold font-sans">
                                Application Status: Senior Expat Mortgage Broker at Odin Mortgage
                              </span>
                            </div>
                          </div>

                          {/* Composer body */}
                          <div className="p-6">
                            <textarea
                              id="rejection-email-text"
                              rows={14}
                              value={selectedRecord.result.rejectionNote}
                              readOnly
                              className="w-full border-0 p-0 text-slate-700 text-sm leading-relaxed focus:outline-none focus:ring-0 font-serif resize-none"
                            />
                          </div>

                          {/* Composer footer */}
                          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                              id="copy-rejection-email-btn"
                              onClick={() => handleCopyRejectionEmail(selectedRecord.result.rejectionNote!)}
                              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all"
                            >
                              {copiedEmail ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Email Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Email Draft</span>
                                </>
                              )}
                            </button>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>

                </motion.div>
              )
            )}
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}
