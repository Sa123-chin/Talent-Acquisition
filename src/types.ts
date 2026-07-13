export interface MustHaveRequirement {
  requirement: string;
  met: boolean;
  details: string;
}

export interface MustHaveMissing {
  requirement: string;
  details: string;
}

export interface NiceToHaveRequirement {
  requirement: string;
  met: boolean;
  details: string;
}

export interface FlagConcern {
  issue: string;
  severity: "low" | "medium" | "high";
  details: string;
}

export interface PhoneScript {
  opening: string;
  context: string;
  section1Basic: string;
  section2Motivation: string;
  section3History: string;
  section4Communication: string;
  close: string;
  probes: string[];
}

export interface ScreeningResult {
  score: number;
  decision: "ADVANCE" | "REJECT";
  decisionReason: string;
  mustHavesMet: MustHaveRequirement[];
  mustHavesMissing: MustHaveMissing[];
  niceToHavesMet: NiceToHaveRequirement[];
  flags: FlagConcern[];
  strengths: string[];
  rejectionNote?: string;
  script?: PhoneScript;
}

export interface ScreeningRecord {
  id: string;
  candidateName: string;
  jobTitle: string;
  date: string;
  cvText: string;
  jdText: string;
  coreValues: string;
  result: ScreeningResult;
}

export interface PresetData {
  id: string;
  label: string;
  candidateName: string;
  jobTitle: string;
  cvText: string;
  jdText: string;
  coreValues: string;
}
