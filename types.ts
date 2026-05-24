/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TravelLog {
  id: string;
  countryCode: string;
  countryName: string;
  entryDate: string; // ISO String or date YYYY-MM-DD
  exitDate: string | null; // null if currently present
  notes?: string;
  isSimulated?: boolean;
  verifiedMethod: 'GPS' | 'Manual' | 'Boarding Pass' | 'Digital Stamp';
}

export interface TaxRule {
  id: string;
  countryCode: string;
  countryName: string;
  maxDaysLimit: number; // e.g., 183
  minDaysRequired?: number; // e.g., 90 for Dubai / Monaco minimums
  warningThresholdDays: number; // warn if within e.g. 20 days of limit
  description: string;
}

export interface EvidenceFile {
  id: string;
  fileName: string;
  fileType: 'Boarding Pass' | 'Passport Stamp' | 'Hotel Receipt' | 'Rental Contract';
  uploadDate: string;
  fileSize: string;
  countryCode: string;
  status: 'Verified' | 'Analyzing' | 'Ready';
  notes?: string;
}

export interface SimulationPlan {
  id: string;
  countryCode: string;
  countryName: string;
  days: number;
  startDate: string;
}

export interface SimulatedStay {
  id: string;
  countryCode: string;
  countryName: string;
  days: number;
  month: string; // e.g. "July", "October"
  description: string; // e.g. "Summer Holiday", "Weekend rally"
}

export interface SimulationScenario {
  id: string;
  name: string; // e.g. "Summer Plan"
  stays: SimulatedStay[];
  isPredefined?: boolean;
  createdAt: string;
}

export interface AISuggestion {
  countryCode: string;
  riskLevel: 'GREEN' | 'YELLOW' | 'RED';
  title: string;
  bulletPoints: string[];
  fullAnalysis: string;
}
