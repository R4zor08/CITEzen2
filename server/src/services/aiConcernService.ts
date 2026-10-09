import type { AIClassification } from '../types.js';

export interface StaffCandidate {
  id: string;
  name: string;
  department?: string | null;
  email: string;
}

export interface AIClassificationInput {
  title: string;
  description: string;
  departments: string[];
  staffCandidates: StaffCandidate[];
}

const DEFAULT_DEPARTMENTS = [
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
 * Intelligent rule-based fallback in case the AI API is unreachable or times out.
 */
function classifyWithHeuristics(input: AIClassificationInput): AIClassification {
  const text = `${input.title} ${input.description}`.toLowerCase();

  let category: 'Academic' | 'Administrative' | 'Facility' | 'Complaints' = 'Academic';
  let subcategory = 'General Concern';
  let targetDepartment = 'Academic Affairs';
  let reasoning = 'Heuristic rule-based matching based on concern keywords.';

  // Facility detection
  if (
    /\b(aircon|ac|air condition|air conditioner|broken|repair|leak|chair|desk|table|door|window|projector|fan|light|bulb|restroom|toilet|cr|bathroom|water|dirty|clean|socket|electricity|outlet|ceiling|maintenance|building|room)\b/.test(
      text
    )
  ) {
    category = 'Facility';
    subcategory = /\b(aircon|ac|cold|heat|cooling)\b/.test(text)
      ? 'Air Conditioning Maintenance'
      : /\b(chair|desk|table|furniture)\b/.test(text)
      ? 'Furniture Repair'
      : /\b(light|electrical|outlet|power)\b/.test(text)
      ? 'Electrical Issue'
      : 'Facility Maintenance';
    targetDepartment = 'Maintenance';
    reasoning =
      'The concern pertains to physical campus infrastructure, facilities, or room equipment.';
  }
  // Administrative detection
  else if (
    /\b(id|id card|lost id|tuition|fee|payment|receipt|refund|enroll|enrollment|cor|certificate of registration|transcript|tor|diploma|clearance|scholarship|drop|dropping|registrar|records|graduation)\b/.test(
      text
    )
  ) {
    category = 'Administrative';
    if (/\b(tuition|fee|payment|receipt|refund|finance|cashier)\b/.test(text)) {
      subcategory = 'Tuition & Payment';
      targetDepartment = 'Finance';
      reasoning = 'The concern relates to student accounts, tuition, or financial matters.';
    } else if (/\b(id|id card|lost id|affidavit)\b/.test(text)) {
      subcategory = 'Student ID Services';
      targetDepartment = 'Student Affairs';
      reasoning = 'The concern involves student identification card processing.';
    } else {
      subcategory = 'Enrollment & Academic Records';
      targetDepartment = 'Registrar';
      reasoning = 'The concern relates to student registration, records, or official documents.';
    }
  }
  // Complaints detection
  else if (
    /\b(complaint|harass|harassment|bully|bullying|rude|unfair|noise|loud|threat|threaten|shout|disrespect|bias|discrimination|violation|misconduct|security|guard)\b/.test(
      text
    )
  ) {
    category = 'Complaints';
    subcategory = /\b(harass|bully|threat|discrimination)\b/.test(text)
      ? 'Student Grievance / Misconduct'
      : 'Service Feedback & Complaints';
    targetDepartment = 'Student Affairs';
    reasoning =
      'The concern describes a student grievance, interpersonal conduct issue, or service complaint.';
  }
  // Academic default
  else {
    category = 'Academic';
    subcategory = /\b(grade|score|grading|exam|quiz|midterm|final|dispute)\b/.test(text)
      ? 'Grade Dispute / Verification'
      : /\b(schedule|subject|course|conflict|section|curriculum|prerequisite)\b/.test(text)
      ? 'Course & Schedule Inquiry'
      : /\b(professor|instructor|teacher|faculty|adviser)\b/.test(text)
      ? 'Faculty & Instruction Concern'
      : 'Academic Inquiry';

    // Route CITE / BSIT specifics to CITE if available
    if (/\b(cite|bsit|programming|coding|lab|computer|software)\b/.test(text)) {
      targetDepartment = input.departments.includes('CITE') ? 'CITE' : 'Academic Affairs';
    } else {
      targetDepartment = 'Academic Affairs';
    }
    reasoning =
      'The concern involves course performance, grading, instructors, or academic matters.';
  }

  // Find best matching staff candidate
  const staffInDept = input.staffCandidates.filter(
    (s) => (s.department || '').toLowerCase() === targetDepartment.toLowerCase()
  );
  const chosenStaff =
    staffInDept.length > 0
      ? staffInDept[0]
      : input.staffCandidates.length > 0
      ? input.staffCandidates[0]
      : null;

  return {
    concernCategory: category,
    category,
    subcategory,
    department: targetDepartment,
    priority: 'medium',
    concernSummary: input.title.trim(),
    suggestedStaffId: chosenStaff ? chosenStaff.id : null,
    suggestedStaffName: chosenStaff ? chosenStaff.name : null,
    confidence: 0.88,
    reasoning
  };
}

/**
 * Classify a concern using Groq AI with fallback to keyword heuristics.
 */
export async function classifyConcernWithAI(
  input: AIClassificationInput
): Promise<AIClassification> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const model = process.env.GROQ_CHAT_MODEL?.trim() || 'openai/gpt-oss-20b';

  // Merge provided departments with defaults
  const allDepartments = Array.from(
    new Set([...(input.departments || []), ...DEFAULT_DEPARTMENTS])
  ).filter(Boolean);

  if (!apiKey) {
    return classifyWithHeuristics({ ...input, departments: allDepartments });
  }

  const staffListSummary = input.staffCandidates.map((s) => ({
    id: s.id,
    name: s.name,
    department: s.department || 'General'
  }));

  const systemPrompt = `You are an expert AI Classifier and Routing Specialist for CITEzen, a university concern and grievance handling system.
Your mission is to analyze a student's concern title and description, then accurately determine:
1. "category": Must be STRICTLY one of: "Academic", "Administrative", "Facility", "Complaints".
   - Academic: Grades, grading disputes, course subjects, instructors/professors, exams, schedules, academic requirements, thesis.
   - Administrative: Student IDs, certificates of registration, enrollment/dropping, transcripts, tuition fees, clearances, official documents.
   - Facility: Campus rooms, air conditioning, electrical, lighting, restrooms, broken chairs/tables, building cleanliness, maintenance.
   - Complaints: Interpersonal conflicts, harassment, bullying, staff/student misconduct, unfair treatment, noise, campus security.
2. "subcategory": A precise, descriptive subcategory title (e.g. "Grade Dispute Request", "Air Conditioning Repair", "ID Replacement Request", "Tuition Discrepancy", "Schedule Conflict Resolution").
3. "department": The university department that should handle this concern. Choose the best matching department from this available list: ${JSON.stringify(
    allDepartments
  )}.
4. "suggestedStaffId": The ID of the best suited staff member from this staff list: ${JSON.stringify(
    staffListSummary
  )}. If a staff member belongs to the selected department, prioritize them. If none matches closely or list is empty, return null.
5. "suggestedStaffName": The name of that staff member, or null if none.
6. "confidence": A decimal between 0.50 and 1.00 indicating classification confidence.
7. "reasoning": A clear 1-2 sentence explanation of why you selected this category, department, and staff member.

CRITICAL: Return ONLY valid, parseable JSON conforming exactly to this structure:
{
  "category": "Academic",
  "subcategory": "Grade Dispute Request",
  "department": "Academic Affairs",
  "suggestedStaffId": "id-or-null",
  "suggestedStaffName": "name-or-null",
  "confidence": 0.95,
  "reasoning": "Reason here"
}`;

  const userPrompt = `Student Concern:
Title: "${input.title}"
Description: "${input.description}"`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 400
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`Groq API returned HTTP ${response.status}. Using fallback heuristics.`);
      return classifyWithHeuristics({ ...input, departments: allDepartments });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      return classifyWithHeuristics({ ...input, departments: allDepartments });
    }

    const parsed = JSON.parse(rawContent);

    // Validate category
    const validCategories = ['Academic', 'Administrative', 'Facility', 'Complaints'];
    let category = validCategories.find(
      (c) => c.toLowerCase() === String(parsed.category || '').toLowerCase()
    ) as 'Academic' | 'Administrative' | 'Facility' | 'Complaints' | undefined;

    if (!category) {
      category = 'Academic';
    }

    // Match or resolve staff candidate
    let suggestedStaffId = parsed.suggestedStaffId || null;
    let suggestedStaffName = parsed.suggestedStaffName || null;

    if (suggestedStaffId) {
      const match = input.staffCandidates.find((s) => s.id === suggestedStaffId);
      if (match) {
        suggestedStaffName = match.name;
      } else {
        // Find by name if id didn't match
        const matchByName = input.staffCandidates.find(
          (s) => s.name.toLowerCase() === String(suggestedStaffName || '').toLowerCase()
        );
        if (matchByName) {
          suggestedStaffId = matchByName.id;
          suggestedStaffName = matchByName.name;
        }
      }
    } else if (suggestedStaffName) {
      const matchByName = input.staffCandidates.find(
        (s) => s.name.toLowerCase() === String(suggestedStaffName).toLowerCase()
      );
      if (matchByName) {
        suggestedStaffId = matchByName.id;
        suggestedStaffName = matchByName.name;
      }
    }

    // If still null, pick a staff in the department if one exists
    if (!suggestedStaffId && input.staffCandidates.length > 0) {
      const matchedDept = parsed.department || 'Academic Affairs';
      const staffInDept = input.staffCandidates.filter(
        (s) => (s.department || '').toLowerCase() === matchedDept.toLowerCase()
      );
      if (staffInDept.length > 0) {
        suggestedStaffId = staffInDept[0].id;
        suggestedStaffName = staffInDept[0].name;
      }
    }

    return {
      concernCategory: category,
      category,
      subcategory: String(parsed.subcategory || 'General Request').trim(),
      department: String(parsed.department || 'Academic Affairs').trim(),
      priority: 'medium',
      concernSummary: input.title.trim(),
      suggestedStaffId,
      suggestedStaffName,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
      reasoning: String(
        parsed.reasoning ||
          `AI analyzed the concern and classified it as ${category} routed to ${parsed.department}.`
      ).trim()
    };
  } catch (err) {
    console.error('Groq AI classification error, falling back to heuristics:', err);
    return classifyWithHeuristics({ ...input, departments: allDepartments });
  }
}
