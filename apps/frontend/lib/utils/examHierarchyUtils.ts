/** Exam hierarchy utilities: migration, numbering, and structure helpers. */

import { v4 as uuidv4 } from "uuid";
import {
  ExamSection,
  QuestionGroup,
  EnhancedQuestion,
  Question,
} from "@/components/features/exams/ExamBuilderWizard";

/**
 * Migrate flat question list to hierarchical structure
 * Creates default section and groups for backward compatibility
 */
export function migrateFlatToHierarchical(questions: Question[]): {
  sections: ExamSection[];
  questionGroups: QuestionGroup[];
  enhancedQuestions: EnhancedQuestion[];
} {
  const sectionId = uuidv4();
  const groupId = uuidv4();

  // Create default section
  const section: ExamSection = {
    id: sectionId,
    type: "QUESTIONS",
    title: "SECTION A",
    order: 1,
    examPart: 1,
    numberingStyle: "numeric",
  };

  // Create default group
  const group: QuestionGroup = {
    id: groupId,
    sectionId,
    title: "Answer all questions",
    order: 1,
    questions: [],
  };

  // Enhance existing questions with hierarchy data
  const enhancedQuestions: EnhancedQuestion[] = questions.map((q, idx) => ({
    ...q,
    sectionId,
    groupId,
    order: idx + 1,
    numbering: `${idx + 1}.`,
    showNumber: true,
    subQuestions: [],
    parts: [],
  }));

  group.questions = enhancedQuestions;

  return {
    sections: [section],
    questionGroups: [group],
    enhancedQuestions,
  };
}

/**
 * Generate question number based on numbering style
 */
export function generateQuestionNumber(
  index: number,
  style: "numeric" | "roman" | "alphabet" = "numeric"
): string {
  switch (style) {
    case "roman":
      return toRomanNumeral(index + 1) + ".";
    case "alphabet":
      return String.fromCharCode(65 + index) + ".";
    case "numeric":
    default:
      return `${index + 1}.`;
  }
}

/**
 * Generate sub-question number (typically roman numerals)
 */
export function generateSubQuestionNumber(index: number): string {
  return toRomanNumeral(index + 1) + ".";
}

/**
 * Generate MCQ option letter
 */
export function generateMcqOption(index: number): string {
  return String.fromCharCode(65 + index) + ")";
}

/**
 * Convert number to roman numeral
 */
function toRomanNumeral(num: number): string {
  const romanMap: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let roman = "";
  let remaining = num;

  for (const [value, numeral] of romanMap) {
    while (remaining >= value) {
      roman += numeral;
      remaining -= value;
    }
  }

  return roman;
}

/**
 * Calculate total marks for a section
 */
export function calculateSectionTotal(
  group: QuestionGroup,
  allQuestions: EnhancedQuestion[]
): number {
  return group.questions.reduce((total, q) => {
    const mainPoints = q.points || 0;
    const subPoints =
      q.subQuestions?.reduce((sum, sq) => sum + (sq.points || 0), 0) || 0;
    return total + mainPoints + subPoints;
  }, 0);
}

/**
 * Calculate total marks across all sections
 */
export function calculateExamTotal(
  questionGroups: QuestionGroup[],
  allQuestions: EnhancedQuestion[]
): number {
  return questionGroups.reduce((total, group) => {
    return total + calculateSectionTotal(group, allQuestions);
  }, 0);
}

/**
 * Generate section label based on part and order
 */
export function generateSectionLabel(
  section: ExamSection,
  allSections: ExamSection[]
): string {
  const partSections = allSections.filter(
    (s) => s.examPart === section.examPart
  );
  const index = partSections.findIndex((s) => s.id === section.id);

  if (section.title) {
    return section.title;
  }

  // Default naming
  const sectionLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const letter = sectionLetters[index] || `${index + 1}`;

  return section.examPart === 2
    ? `PART II - SECTION ${letter}`
    : `SECTION ${letter}`;
}

/**
 * Update question numbering across entire exam
 */
export function updateAllNumbering(
  sections: ExamSection[],
  questionGroups: QuestionGroup[],
  questions: EnhancedQuestion[]
): EnhancedQuestion[] {
  return questions.map((q) => {
    const group = questionGroups.find((g) => g.id === q.groupId);
    const section = sections.find((s) => s.id === q.sectionId);

    if (!group || !section) return q;

    const groupQuestions = group.questions;
    const qIndex = groupQuestions.findIndex((gq) => gq.id === q.id);

    const numberingStyle = section.numberingStyle || "numeric";
    const numbering = generateQuestionNumber(qIndex, numberingStyle);

    // Update sub-question numbers
    const subQuestions = q.subQuestions?.map((sq, sqIdx) => ({
      ...sq,
      numbering: generateSubQuestionNumber(sqIdx),
    }));

    return {
      ...q,
      numbering,
      order: qIndex + 1,
      subQuestions,
    };
  });
}

/**
 * Move question between groups
 */
export function moveQuestionToGroup(
  questionId: string,
  sourceGroupId: string,
  targetGroupId: string,
  groups: QuestionGroup[],
  questions: EnhancedQuestion[]
): { groups: QuestionGroup[]; questions: EnhancedQuestion[] } {
  const updatedGroups = groups.map((g) => {
    if (g.id === sourceGroupId) {
      return {
        ...g,
        questions: g.questions.filter((q) => q.id !== questionId),
      };
    }
    if (g.id === targetGroupId) {
      const question = questions.find((q) => q.id === questionId);
      if (question) {
        return {
          ...g,
          questions: [...g.questions, { ...question, groupId: targetGroupId }],
        };
      }
    }
    return g;
  });

  const updatedQuestions = questions.map((q) => {
    if (q.id === questionId) {
      return { ...q, groupId: targetGroupId };
    }
    return q;
  });

  return { groups: updatedGroups, questions: updatedQuestions };
}

/**
 * Reorder questions within a group
 */
export function reorderQuestionsInGroup(
  groupId: string,
  from: number,
  to: number,
  groups: QuestionGroup[],
  questions: EnhancedQuestion[]
): { groups: QuestionGroup[]; questions: EnhancedQuestion[] } {
  const updatedGroups = groups.map((g) => {
    if (g.id === groupId) {
      const newQuestions = [...g.questions];
      const [moved] = newQuestions.splice(from, 1);
      newQuestions.splice(to, 0, moved);
      return { ...g, questions: newQuestions };
    }
    return g;
  });

  return { groups: updatedGroups, questions };
}

/**
 * Get flat question list from hierarchical structure
 */
export function getFlatQuestionList(
  groups: QuestionGroup[],
  sections: ExamSection[]
): EnhancedQuestion[] {
  return groups.flatMap((g) => g.questions);
}
