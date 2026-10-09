import { GoogleGenAI } from '@google/genai';
import type { AIClassification, Priority } from '../types.js';

export interface StaffCandidate {
  id: string;
  name: string;
  department?: string | null;
  email: string;
}

export interface GeminiClassificationInput {
  title: string;
  description: string;
  departments: string[];
  staffCandidates: StaffCandidate[];
}

export const VALID_CATEGORIES = [
  'Academic',
  'Administrative',
  'Facility',
  'Complaints'
] as const;

export type ValidCategory = (typeof VALID_CATEGORIES)[number];

export const DEFAULT_DEPARTMENTS = [
  'Academic Affairs',
  'Registrar',
  'Maintenance',
  'Student Affairs',
  'Administration',
  'IT Support',
  'Finance',
  'CITE'
];

/**
 * Intelligent rule-based fallback in case Gemini API is unreachable, times out,
 * or API key is not yet configured.
 */
export function classifyWithHeuristics(input: GeminiClassificationInput): AIClassification {
  const text = `${input.title} ${input.description}`.toLowerCase();

  let concernCategory: ValidCategory = 'Academic';
  let subcategory = 'General Concern';
  let targetDepartment = 'Academic Affairs';
  let priority: Priority = 'medium';
  let concernSummary = input.title.trim();
  let reasoning = 'Rule-based heuristic matching based on concern keywords and context.';

  // Facility detection
  if (
    /\b(aircon|ac|air condition|air conditioner|broken|repair|leak|chair|desk|table|door|window|projector|fan|light|bulb|restroom|toilet|cr|bathroom|water|dirty|clean|socket|electricity|outlet|ceiling|maintenance|building|room)\b/.test(
      text
    )
  ) {
    concernCategory = 'Facility';
    subcategory = /\b(aircon|ac|cold|heat|cooling)\b/.test(text)
      ? 'Air Conditioning Maintenance'
      : /\b(chair|desk|table|furniture)\b/.test(text)
      ? 'Furniture Repair'
      : /\b(light|electrical|outlet|power)\b/.test(text)
      ? 'Electrical Issue'
      : 'Facility Maintenance';
    targetDepartment = 'Maintenance';
    priority = /\b(leak|flood|broken|hazard|danger|fire|urgent)\b/.test(text) ? 'high' : 'medium';
    concernSummary = `Facility maintenance request: ${input.title.trim()}`;
    reasoning =
      'The concern pertains to physical campus infrastructure, facilities, or room equipment.';
  }
  // Administrative detection
  else if (
    /\b(id|id card|lost id|tuition|fee|payment|receipt|refund|enroll|enrollment|cor|certificate of registration|transcript|tor|diploma|clearance|scholarship|drop|dropping|registrar|records|graduation)\b/.test(
      text
    )
  ) {
    concernCategory = 'Administrative';
    subcategory = /\b(id|id card|lost id)\b/.test(text)
      ? 'ID Replacement / Release'
      : /\b(tuition|fee|payment|receipt|refund)\b/.test(text)
      ? 'Tuition & Fees Inquiry'
      : /\b(transcript|tor|diploma|cor|records)\b/.test(text)
      ? 'Official Document Request'
      : 'Student Records & Enrollment';

    targetDepartment = /\b(tuition|fee|payment|receipt|refund|finance)\b/.test(text)
      ? 'Finance'
      : 'Registrar';
    priority = 'medium';
    concernSummary = `Administrative document or record inquiry: ${input.title.trim()}`;
    reasoning =
      'The concern relates to student IDs, records, tuition fees, clearances, or official administrative documents.';
  }
  // Complaints detection
  else if (
    /\b(complaint|harass|harassment|bully|bullying|rude|unfair|noise|loud|threat|threaten|shout|disrespect|bias|discrimination|violation|misconduct|security|guard)\b/.test(
      text
    )
  ) {
    concernCategory = 'Complaints';
    subcategory = /\b(harass|bully|threat|discrimination)\b/.test(text)
      ? 'Student Grievance / Misconduct'
      : 'Service Feedback & Complaints';
    targetDepartment = 'Student Affairs';
    priority = 'high';
    concernSummary = `Student grievance or complaint: ${input.title.trim()}`;
    reasoning =
      'The concern describes a student grievance, interpersonal conduct issue, or service complaint.';
  }
  // Academic default
  else {
    concernCategory = 'Academic';
    subcategory = /\b(grade|score|grading|exam|quiz|midterm|final|dispute)\b/.test(text)
      ? 'Grade Dispute / Verification'
      : /\b(schedule|subject|course|conflict|section|curriculum|prerequisite)\b/.test(text)
      ? 'Course & Schedule Inquiry'
      : /\b(professor|instructor|teacher|faculty|adviser)\b/.test(text)
      ? 'Faculty & Instruction Concern'
      : 'Academic Inquiry';

    // Route CITE / BSIT specifics to CITE if available
    if (/\b(cite|bsit|programming|coding|lab|computer|workstation|software)\b/.test(text)) {
      targetDepartment = input.departments.includes('CITE') ? 'CITE' : 'Academic Affairs';
    } else {
      targetDepartment = 'Academic Affairs';
    }
    priority = /\b(dispute|fail|graduation|urgent)\b/.test(text) ? 'high' : 'medium';
    concernSummary = `Academic concern regarding coursework, grading, or department facilities: ${input.title.trim()}`;
    reasoning =
      'The concern involves course performance, grading, instructors, or academic program matters.';
  }

  // Find best matching staff candidate in the determined department
  const staffInDept = input.staffCandidates.filter(
    (s) => (s.department || '').trim().toLowerCase() === targetDepartment.toLowerCase()
  );
  const chosenStaff =
    staffInDept.length > 0
      ? staffInDept[0]
      : input.staffCandidates.length > 0
      ? input.staffCandidates[0]
      : null;

  return {
    concernCategory,
    category: concernCategory,
    subcategory,
    department: targetDepartment,
    priority,
    concernSummary,
    suggestedStaffId: chosenStaff ? chosenStaff.id : null,
    suggestedStaffName: chosenStaff ? chosenStaff.name : null,
    confidence: 0.88,
    reasoning
  };
}

/**
 * Classify a concern using Google Gemini API with fallback to heuristics.
 */
export async function classifyConcernWithGemini(
  input: GeminiClassificationInput
): Promise<AIClassification> {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.GEMINI_KEY?.trim();
  const modelName = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';

  // Merge available departments
  const allDepartments = Array.from(
    new Set([...(input.departments || []), ...DEFAULT_DEPARTMENTS])
  ).filter(Boolean);

  if (!apiKey) {
    console.info(
      'Gemini API key not configured in GEMINI_API_KEY. Using intelligent heuristic classifier.'
    );
    return classifyWithHeuristics({ ...input, departments: allDepartments });
  }

  const prompt = `You are an expert AI Classifier and Routing Specialist for CITEzen, an automated university student concern and grievance handling system.

Analyze the following student's concern subject and description:
Subject: "${input.title}"
Description: "${input.description}"

Predefined Valid Categories:
- "Academic": Grades, grade disputes, subjects, professors/instructors, exams, schedules, prerequisites, thesis.
- "Administrative": Student IDs, certificates of registration, enrollment/dropping, transcripts, tuition fees, clearances, official university documents.
- "Facility": Campus classrooms, air conditioning, electrical/lighting, restrooms, broken chairs/tables, building cleanliness, physical maintenance.
- "Complaints": Interpersonal conflicts, harassment, bullying, staff/student misconduct, unfair treatment, campus security.

Predefined Available Departments:
${JSON.stringify(allDepartments)}

Determine the following fields:
1. "concernCategory": STRICTLY one of ["Academic", "Administrative", "Facility", "Complaints"].
2. "department": The university department responsible for this concern. Choose strictly from the available departments list.
3. "priority": Urgency level, strictly one of ["Low", "Medium", "High", "Urgent"].
4. "concernSummary": A clear, concise 1-sentence summary of the student's issue.
5. "reasoning": A clear 1-2 sentence explanation of why this category and department were selected.
6. "confidence": A decimal between 0.00 and 1.00 indicating classification confidence.`;

  try {
    let rawJson: string | null = null;

    // 1. Try GoogleGenAI SDK
    try {
      const ai = new GoogleGenAI({ apiKey });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              concernCategory: {
                type: 'STRING',
                enum: ['Academic', 'Administrative', 'Facility', 'Complaints']
              },
              department: {
                type: 'STRING',
                enum: allDepartments
              },
              priority: {
                type: 'STRING',
                enum: ['Low', 'Medium', 'High', 'Urgent']
              },
              concernSummary: { type: 'STRING' },
              reasoning: { type: 'STRING' },
              confidence: { type: 'NUMBER' }
            },
            required: [
              'concernCategory',
              'department',
              'priority',
              'concernSummary',
              'reasoning',
              'confidence'
            ]
          }
        }
      });

      clearTimeout(timeout);
      rawJson = response.text?.trim() ?? null;
    } catch (sdkErr: any) {
      console.warn(
        `Gemini SDK call failed (${sdkErr?.message ?? sdkErr}). Attempting REST fallback...`
      );

      // 2. Direct REST fallback to generativelanguage.googleapis.com
      const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        modelName
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const restController = new AbortController();
      const restTimeout = setTimeout(() => restController.abort(), 10000);

      const restResp = await fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        }),
        signal: restController.signal
      });

      clearTimeout(restTimeout);

      if (restResp.ok) {
        const restData: any = await restResp.json();
        rawJson = restData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
      } else {
        console.warn(`Gemini REST API returned HTTP ${restResp.status}.`);
      }
    }

    if (!rawJson) {
      console.warn('Gemini returned empty text. Falling back to heuristic classifier.');
      return classifyWithHeuristics({ ...input, departments: allDepartments });
    }

    // Clean potential markdown fences
    const cleanJson = rawJson.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Validate category
    let concernCategory: ValidCategory = 'Academic';
    const foundCat = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === String(parsed.concernCategory || parsed.category || '').toLowerCase()
    );
    if (foundCat) {
      concernCategory = foundCat;
    }

    // Validate department
    let targetDepartment = String(parsed.department || '').trim();
    const matchedDept = allDepartments.find(
      (d) => d.toLowerCase() === targetDepartment.toLowerCase()
    );
    if (matchedDept) {
      targetDepartment = matchedDept;
    } else {
      targetDepartment =
        concernCategory === 'Facility'
          ? 'Maintenance'
          : concernCategory === 'Administrative'
          ? 'Registrar'
          : concernCategory === 'Complaints'
          ? 'Student Affairs'
          : 'Academic Affairs';
    }

    // Validate priority
    const rawPriority = String(parsed.priority || '').toLowerCase();
    const priority: Priority =
      rawPriority === 'urgent'
        ? 'urgent'
        : rawPriority === 'high'
        ? 'high'
        : rawPriority === 'low'
        ? 'low'
        : 'medium';

    // Staff Recommendation: Query database staff in the department
    const staffInDept = input.staffCandidates.filter(
      (s) => (s.department || '').trim().toLowerCase() === targetDepartment.toLowerCase()
    );
    const chosenStaff =
      staffInDept.length > 0
        ? staffInDept[0]
        : input.staffCandidates.length > 0
        ? input.staffCandidates[0]
        : null;

    const confidence =
      typeof parsed.confidence === 'number' && !isNaN(parsed.confidence)
        ? Math.min(Math.max(parsed.confidence, 0.5), 1.0)
        : 0.92;

    const concernSummary = String(
      parsed.concernSummary || input.title
    ).trim();

    const reasoning = String(
      parsed.reasoning ||
        `Gemini AI classified this as ${concernCategory} and routed to ${targetDepartment}.`
    ).trim();

    return {
      concernCategory,
      category: concernCategory,
      subcategory: concernSummary,
      department: targetDepartment,
      priority,
      concernSummary,
      reasoning,
      confidence,
      suggestedStaffId: chosenStaff ? chosenStaff.id : null,
      suggestedStaffName: chosenStaff ? chosenStaff.name : null
    };
  } catch (err) {
    console.error('Gemini AI classification failed, falling back to heuristics:', err);
    return classifyWithHeuristics({ ...input, departments: allDepartments });
  }
}
