import { SchoolStatus, ParsedSMSResult, School } from '../types';

/**
 * Intelligent SMS / WhatsApp check-in parser for flood disaster reporting.
 * Handles:
 * 1. Key-Value structured: "SCH102 CLOSED DAYS=3 ENGAGED=15 MATERIALS=NO"
 * 2. Positional tokens: "SCH102 CLOSED 3 15 NO" or "SCH101 OPEN 0 85 YES"
 * 3. Semi-structured / Conversational: "Reporting SCH103 closed for 4 days, 20 students in camp, no materials"
 */
export function parseIncomingReportMessage(
  rawText: string,
  availableSchools: School[]
): ParsedSMSResult {
  const cleaned = rawText.trim();
  if (!cleaned) {
    return {
      success: false,
      schoolCode: '',
      status: 'CLOSED',
      daysClosed: 0,
      studentsEngaged: 0,
      materialsDelivered: false,
      confidence: 0,
      replyMessage: 'Error: Empty message received. Please send your report format, e.g.: SCH101 CLOSED 2 25 NO',
      errorMessage: 'Empty message',
    };
  }

  // 1. Extract School Code (e.g. SCH101, SCH-101, sch102)
  const schoolCodeMatch = cleaned.match(/\b(SCH[-_]?[0-9]{3,4})\b/i);
  let detectedCode = '';
  if (schoolCodeMatch) {
    detectedCode = schoolCodeMatch[1].toUpperCase().replace(/[-_]/, '');
  }

  // Find school in database
  const targetSchool = availableSchools.find(
    (s) => s.code.toUpperCase() === detectedCode || s.id.toUpperCase() === detectedCode
  );

  if (!targetSchool) {
    return {
      success: false,
      schoolCode: detectedCode || 'UNKNOWN',
      status: 'CLOSED',
      daysClosed: 0,
      studentsEngaged: 0,
      materialsDelivered: false,
      confidence: 0.1,
      replyMessage: `School code "${detectedCode || 'unknown'}" not recognized. Please check your school code and resend. Example: SCH101 CLOSED 2 25 NO`,
      errorMessage: 'Invalid school code',
    };
  }

  // 2. Extract Status: OPEN / CLOSED / PARTIALLY_OPEN
  let status: SchoolStatus = 'CLOSED';
  let statusFound = false;

  const upper = cleaned.toUpperCase();

  if (/\b(PARTIAL|PARTIALLY|HALF|AADH[A-Z]*|SHIFTS)\b/i.test(upper)) {
    status = 'PARTIALLY_OPEN';
    statusFound = true;
  } else if (/\b(OPEN|CHALU|KHULA|FUNCTIONING|ACTIVE)\b/i.test(upper) && !/\b(NOT OPEN|BANDH)\b/i.test(upper)) {
    status = 'OPEN';
    statusFound = true;
  } else if (/\b(CLOSED|BANDH|SHUT|SUBMERGED|ERODED)\b/i.test(upper)) {
    status = 'CLOSED';
    statusFound = true;
  }

  // 3. Extract Days Closed
  let daysClosed = 0;
  // Key-value regex: DAYS=3 or DAY=3 or CLOSED=3DAYS
  const daysKvMatch = upper.match(/(?:DAYS?|CLOSED_DAYS?|BANDH_DIN)\s*[:=]\s*(\d+)/i) ||
                      upper.match(/(\d+)\s*(?:DAYS?|DIN)\s*(?:CLOSED|BANDH)/i);

  if (daysKvMatch) {
    daysClosed = parseInt(daysKvMatch[1], 10);
  }

  // 4. Extract Students Engaged
  let studentsEngaged = 0;
  let engagedFound = false;
  const engagedKvMatch = upper.match(/(?:ENGAGED|STUDENTS?|KIDS?|CHILDREN|ATTENDING|PACHE)\s*[:=]\s*(\d+)/i) ||
                         upper.match(/(\d+)\s*(?:STUDENTS?|KIDS?|CHILDREN|BACHE)\s*(?:ENGAGED|STUDYING|ATTENDING)/i);

  if (engagedKvMatch) {
    studentsEngaged = parseInt(engagedKvMatch[1], 10);
    engagedFound = true;
  }

  // 5. Extract Materials Delivered
  let materialsDelivered = false;
  let materialsFound = false;
  const matKvMatch = upper.match(/(?:MATERIALS?|KITS?|BOOKS?|WORKSHEETS?|CONTENT)\s*[:=]\s*(YES|NO|TRUE|FALSE|HAAN|NAHI)/i);

  if (matKvMatch) {
    const val = matKvMatch[1];
    materialsDelivered = /YES|TRUE|HAAN/i.test(val);
    materialsFound = true;
  } else if (/\b(MATERIALS_SENT=YES|MATERIALS_RECEIVED|BOOKS_GIVEN|GOT_KITS)\b/i.test(upper)) {
    materialsDelivered = true;
    materialsFound = true;
  } else if (/\b(MATERIALS_SENT=NO|NO_BOOKS|NO_MATERIALS|KITS_PENDING)\b/i.test(upper)) {
    materialsDelivered = false;
    materialsFound = true;
  }

  // 6. Positional Token Parser Fallback: e.g. "SCH102 CLOSED 3 15 NO" or "SCH102 OPEN 0 85 YES"
  const tokens = cleaned.replace(/[,;]/g, ' ').split(/\s+/).filter(Boolean);
  
  if ((!daysKvMatch || !engagedFound || !materialsFound) && tokens.length >= 3) {
    // If token 0 is school code (e.g. SCH102)
    // token 1 might be status (e.g. CLOSED)
    // token 2 might be days (e.g. 3)
    // token 3 might be engaged (e.g. 15)
    // token 4 might be materials (e.g. NO)
    const posTokens = tokens.slice(1);
    for (let i = 0; i < posTokens.length; i++) {
      const tok = posTokens[i].toUpperCase();

      if (!statusFound && (tok === 'OPEN' || tok === 'CLOSED' || tok === 'PARTIAL' || tok === 'PARTIALLY_OPEN')) {
        status = tok === 'PARTIAL' ? 'PARTIALLY_OPEN' : (tok as SchoolStatus);
        statusFound = true;
        continue;
      }

      // Check numbers
      if (/^\d+$/.test(tok)) {
        const num = parseInt(tok, 10);
        if (!daysKvMatch && daysClosed === 0 && i <= 2) {
          daysClosed = num;
        } else if (!engagedFound && studentsEngaged === 0) {
          studentsEngaged = num;
          engagedFound = true;
        }
        continue;
      }

      // Check boolean yes/no
      if (!materialsFound && (tok === 'YES' || tok === 'NO' || tok === 'Y' || tok === 'N' || tok === 'HAAN' || tok === 'NAHI')) {
        materialsDelivered = tok === 'YES' || tok === 'Y' || tok === 'HAAN';
        materialsFound = true;
      }
    }
  }

  // Default sanity checks
  if (status === 'OPEN' && daysClosed > 0) {
    // If they say open today, days closed is 0
    daysClosed = 0;
  }
  if (status === 'CLOSED' && daysClosed === 0) {
    daysClosed = 1; // default at least 1 day closed
  }
  if (!engagedFound && status === 'OPEN') {
    studentsEngaged = Math.round(targetSchool.totalStudents * 0.85);
  }

  // Cap engaged to total students
  if (studentsEngaged > targetSchool.totalStudents) {
    studentsEngaged = targetSchool.totalStudents;
  }

  const confidence = (statusFound ? 0.4 : 0.1) +
                     (daysClosed >= 0 ? 0.25 : 0) +
                     (engagedFound ? 0.25 : 0) +
                     (materialsFound ? 0.1 : 0);

  // Generate actionable system feedback reply
  const replyMessage = `Report saved for ${targetSchool.code} (${targetSchool.name}). Status: ${status} (${daysClosed}d closed), ${studentsEngaged}/${targetSchool.totalStudents} students engaged (${Math.round((studentsEngaged / targetSchool.totalStudents) * 100)}%), Materials: ${materialsDelivered ? 'YES' : 'NO'}. Action officer ${targetSchool.assignedOfficialName} notified.`;

  return {
    success: true,
    schoolCode: targetSchool.code,
    status,
    daysClosed,
    studentsEngaged,
    materialsDelivered,
    confidence: Math.min(1.0, confidence),
    replyMessage,
  };
}
