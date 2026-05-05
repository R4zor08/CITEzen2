import { Template } from '../types';

export const templates: Template[] = [
// Academic Concerns
{
  id: 'acad-grade',
  category: 'Academic',
  subcategory: 'Grade Dispute',
  title: 'Grade Dispute Request',
  description: 'Submit a request to review a specific grade.',
  routeTo: 'Academic Affairs',
  fields: [
  {
    name: 'courseCode',
    label: 'Course Code',
    type: 'text',
    required: true,
    placeholder: 'e.g. CS101'
  },
  {
    name: 'instructor',
    label: 'Instructor Name',
    type: 'text',
    required: true
  },
  {
    name: 'semester',
    label: 'Semester',
    type: 'select',
    required: true,
    options: ['1st Semester', '2nd Semester', 'Summer']
  },
  {
    name: 'reason',
    label: 'Reason for Dispute',
    type: 'textarea',
    required: true,
    placeholder: 'Please explain why you are disputing this grade...'
  },
  {
    name: 'evidence',
    label: 'Supporting Documents',
    type: 'file',
    required: false
  }]

},
{
  id: 'acad-schedule',
  category: 'Academic',
  subcategory: 'Schedule Conflict',
  title: 'Schedule Conflict Resolution',
  description: 'Report overlapping classes or schedule issues.',
  routeTo: 'Registrar',
  fields: [
  {
    name: 'conflictingCourses',
    label: 'Conflicting Courses',
    type: 'text',
    required: true,
    placeholder: 'e.g. CS101 and MATH201'
  },
  {
    name: 'preferredResolution',
    label: 'Preferred Resolution',
    type: 'textarea',
    required: true
  }]

},

// Administrative Concerns
{
  id: 'admin-id',
  category: 'Administrative',
  subcategory: 'ID Replacement',
  title: 'ID Replacement Request',
  description: 'Request a new student ID card due to loss or damage.',
  routeTo: 'Student Affairs',
  fields: [
  {
    name: 'reason',
    label: 'Reason for Replacement',
    type: 'select',
    required: true,
    options: ['Lost', 'Damaged', 'Stolen', 'Change of Information']
  },
  {
    name: 'details',
    label: 'Additional Details',
    type: 'textarea',
    required: false
  },
  {
    name: 'affidavit',
    label: 'Affidavit of Loss (if applicable)',
    type: 'file',
    required: false
  }]

},
{
  id: 'admin-cert',
  category: 'Administrative',
  subcategory: 'Document Request',
  title: 'Official Document Request',
  description:
  'Request transcripts, certificates, or other official documents.',
  routeTo: 'Registrar',
  fields: [
  {
    name: 'documentType',
    label: 'Document Type',
    type: 'select',
    required: true,
    options: [
    'Transcript of Records',
    'Certificate of Enrollment',
    'Good Moral Certificate',
    'Diploma']

  },
  {
    name: 'purpose',
    label: 'Purpose of Request',
    type: 'text',
    required: true
  },
  {
    name: 'copies',
    label: 'Number of Copies',
    type: 'select',
    required: true,
    options: ['1', '2', '3', '4', '5']
  }]

},

// Facility Issues
{
  id: 'fac-maintenance',
  category: 'Facility',
  subcategory: 'Room Maintenance',
  title: 'Room Maintenance Report',
  description:
  'Report issues with classrooms, labs, or other school facilities.',
  routeTo: 'Maintenance',
  fields: [
  {
    name: 'building',
    label: 'Building',
    type: 'select',
    required: true,
    options: ['Main Building', 'Science Annex', 'Library', 'Gymnasium']
  },
  {
    name: 'roomNumber',
    label: 'Room Number',
    type: 'text',
    required: true
  },
  {
    name: 'issueType',
    label: 'Type of Issue',
    type: 'select',
    required: true,
    options: [
    'Air Conditioning',
    'Lighting',
    'Furniture',
    'Plumbing',
    'Other']

  },
  {
    name: 'description',
    label: 'Detailed Description',
    type: 'textarea',
    required: true
  },
  { name: 'photo', label: 'Photo of Issue', type: 'file', required: false }]

},
{
  id: 'fac-equipment',
  category: 'Facility',
  subcategory: 'Equipment Issue',
  title: 'Equipment Malfunction Report',
  description: 'Report broken computers, projectors, or lab equipment.',
  routeTo: 'IT Support',
  fields: [
  {
    name: 'equipmentType',
    label: 'Equipment Type',
    type: 'select',
    required: true,
    options: ['Computer', 'Projector', 'Lab Equipment', 'Network/Wi-Fi']
  },
  {
    name: 'location',
    label: 'Location/Room',
    type: 'text',
    required: true
  },
  {
    name: 'assetTag',
    label: 'Asset Tag / Serial Number (if known)',
    type: 'text',
    required: false
  },
  {
    name: 'description',
    label: 'Problem Description',
    type: 'textarea',
    required: true
  }]

},

// Complaints & Suggestions
{
  id: 'comp-general',
  category: 'Complaints',
  subcategory: 'General Complaint',
  title: 'General Complaint Form',
  description:
  'Submit a formal complaint regarding school services or personnel.',
  routeTo: 'Administration',
  fields: [
  {
    name: 'subject',
    label: 'Subject of Complaint',
    type: 'text',
    required: true
  },
  {
    name: 'dateOfIncident',
    label: 'Date of Incident (if applicable)',
    type: 'date',
    required: false
  },
  {
    name: 'details',
    label: 'Full Details',
    type: 'textarea',
    required: true
  },
  {
    name: 'anonymous',
    label: 'Keep Anonymous?',
    type: 'select',
    required: true,
    options: [
    'No, use my name',
    'Yes, keep my identity hidden from department']

  }]

},
{
  id: 'sugg-improvement',
  category: 'Suggestions',
  subcategory: 'Improvement Idea',
  title: 'System/Process Suggestion',
  description: 'Share your ideas on how to improve the campus experience.',
  routeTo: 'Administration',
  fields: [
  {
    name: 'area',
    label: 'Area for Improvement',
    type: 'select',
    required: true,
    options: [
    'Academic Processes',
    'Campus Facilities',
    'Student Services',
    'Extracurriculars',
    'Other']

  },
  {
    name: 'suggestion',
    label: 'Your Suggestion',
    type: 'textarea',
    required: true,
    placeholder:
    'Describe your idea and how it would benefit the student body...'
  }]

}];


export const categories = [
{
  id: 'Academic',
  icon: 'BookOpen',
  description: 'Grades, schedules, courses'
},
{
  id: 'Administrative',
  icon: 'FileText',
  description: 'IDs, documents, tuition'
},
{
  id: 'Facility',
  icon: 'Wrench',
  description: 'Maintenance, equipment, rooms'
},
{
  id: 'Complaints',
  icon: 'MessageSquareWarning',
  description: 'Feedback, issues, ideas'
}];