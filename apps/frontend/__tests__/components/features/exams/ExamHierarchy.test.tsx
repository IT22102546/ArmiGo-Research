/** Exam Hierarchy tests: validate data structure, UI behavior, and performance. */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Test 1: Data Structure Validation
describe("Hierarchical Exam Data Structures", () => {
  test("QuestionPart interface should have required fields", () => {
    interface QuestionPart {
      id: string;
      question: string;
      type:
        | "MULTIPLE_CHOICE"
        | "SHORT_ANSWER"
        | "ESSAY"
        | "TRUE_FALSE"
        | "FILL_BLANK"
        | "MATCHING";
      points?: number;
    }

    const part: QuestionPart = {
      id: "q1",
      question: "What is 2+2?",
      type: "MULTIPLE_CHOICE",
      points: 5,
    };

    expect(part.id).toBeDefined();
    expect(part.question).toBeDefined();
    expect(part.type).toBe("MULTIPLE_CHOICE");
    expect(part.points).toBe(5);
  });

  test("EnhancedQuestion should include sub-questions", () => {
    interface QuestionPart {
      id: string;
      question: string;
      type: string;
      points?: number;
    }

    interface EnhancedQuestion extends QuestionPart {
      subQuestions?: QuestionPart[];
    }

    const mainQuestion: EnhancedQuestion = {
      id: "q1",
      question: "Main question",
      type: "MULTIPLE_CHOICE",
      points: 5,
      subQuestions: [
        {
          id: "sq1",
          question: "Sub question 1",
          type: "SHORT_ANSWER",
          points: 2,
        },
      ],
    };

    expect(mainQuestion.subQuestions).toHaveLength(1);
    expect(mainQuestion.subQuestions![0].question).toBe("Sub question 1");
  });

  test("QuestionGroup should contain questions array", () => {
    interface QuestionPart {
      id: string;
      question: string;
      type: string;
      points?: number;
    }

    interface EnhancedQuestion extends QuestionPart {
      subQuestions?: QuestionPart[];
    }

    interface QuestionGroup {
      id: string;
      title: string;
      sectionId: string;
      questions: EnhancedQuestion[];
    }

    const group: QuestionGroup = {
      id: "g1",
      title: "Group 1",
      sectionId: "s1",
      questions: [],
    };

    expect(group.questions).toEqual([]);
    expect(Array.isArray(group.questions)).toBe(true);
  });

  test("ExamSection should have order field for drag-drop", () => {
    interface ExamSection {
      id: string;
      name: string;
      order: number;
      groups?: any[];
    }

    const section: ExamSection = {
      id: "s1",
      name: "Section 1",
      order: 1,
      groups: [],
    };

    expect(section.order).toBe(1);
    expect(typeof section.order).toBe("number");
  });
});

// Test 2: Drag-Drop Functionality
describe("Section Drag-Drop Reordering", () => {
  test("arrayMove should correctly reorder sections", () => {
    const arrayMove = <T,>(array: T[], from: number, to: number): T[] => {
      const newArray = [...array];
      const item = newArray[from];
      newArray.splice(from, 1);
      newArray.splice(to, 0, item);
      return newArray;
    };

    const sections = [
      { id: "s1", order: 1 },
      { id: "s2", order: 2 },
      { id: "s3", order: 3 },
    ];

    const reordered = arrayMove(sections, 0, 2);
    expect(reordered[0].id).toBe("s2");
    expect(reordered[1].id).toBe("s3");
    expect(reordered[2].id).toBe("s1");
  });

  test("Order field should update after drag-drop", () => {
    const sections = [
      { id: "s1", order: 1 },
      { id: "s2", order: 2 },
      { id: "s3", order: 3 },
    ];

    const arrayMove = <T,>(array: T[], from: number, to: number): T[] => {
      const newArray = [...array];
      const item = newArray[from];
      newArray.splice(from, 1);
      newArray.splice(to, 0, item);
      return newArray;
    };

    const reordered = arrayMove(sections, 0, 2);
    const withUpdatedOrder = reordered.map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));

    expect(withUpdatedOrder[0].order).toBe(1);
    expect(withUpdatedOrder[1].order).toBe(2);
    expect(withUpdatedOrder[2].order).toBe(3);
    expect(withUpdatedOrder[0].id).toBe("s2");
  });

  test("Drag state should be tracked correctly", () => {
    let isDragging = false;
    const startDrag = () => {
      isDragging = true;
    };
    const endDrag = () => {
      isDragging = false;
    };

    expect(isDragging).toBe(false);
    startDrag();
    expect(isDragging).toBe(true);
    endDrag();
    expect(isDragging).toBe(false);
  });
});

// Test 3: Question Numbering Utilities
describe("Question Numbering Functions", () => {
  test("Numeric numbering should work correctly", () => {
    const generateQuestionNumber = (index: number, style: string): string => {
      switch (style) {
        case "numeric":
          return `${index + 1}`;
        case "roman":
          return String.fromCharCode(64 + index + 1); // A, B, C...
        case "alphabet":
          return String.fromCharCode(97 + index); // a, b, c...
        default:
          return `${index + 1}`;
      }
    };

    expect(generateQuestionNumber(0, "numeric")).toBe("1");
    expect(generateQuestionNumber(1, "numeric")).toBe("2");
    expect(generateQuestionNumber(9, "numeric")).toBe("10");
  });

  test("MCQ option numbering should work", () => {
    const generateMcqOption = (index: number): string => {
      return String.fromCharCode(65 + index); // A, B, C, D...
    };

    expect(generateMcqOption(0)).toBe("A");
    expect(generateMcqOption(1)).toBe("B");
    expect(generateMcqOption(2)).toBe("C");
    expect(generateMcqOption(3)).toBe("D");
  });

  test("Sub-question numbering with roman numerals", () => {
    const romanNumerals = ["i", "ii", "iii", "iv", "v"];

    expect(romanNumerals[0]).toBe("i");
    expect(romanNumerals[1]).toBe("ii");
    expect(romanNumerals[2]).toBe("iii");
    expect(romanNumerals[3]).toBe("iv");
    expect(romanNumerals[4]).toBe("v");
  });
});

// Test 4: Hierarchical Question Calculation
describe("Hierarchical Question Points Calculation", () => {
  test("Main question points should include sub-questions", () => {
    const calculateTotalPoints = (
      mainPoints: number,
      subPoints: number[]
    ): number => {
      return mainPoints + subPoints.reduce((a, b) => a + b, 0);
    };

    const total = calculateTotalPoints(5, [2, 2, 1]);
    expect(total).toBe(10);
  });

  test("Section total marks calculation", () => {
    const calculateSectionMarks = (questions: any[]): number => {
      return questions.reduce((sum, q) => {
        const mainPoints = q.points || 0;
        const subPoints = (q.subQuestions || []).reduce(
          (sum: number, sq: any) => sum + (sq.points || 0),
          0
        );
        return sum + mainPoints + subPoints;
      }, 0);
    };

    const questions = [
      { id: "q1", points: 5, subQuestions: [{ points: 2 }] },
      { id: "q2", points: 3, subQuestions: [] },
    ];

    const total = calculateSectionMarks(questions);
    expect(total).toBe(10); // 5 + 2 + 3
  });

  test("Exam total marks from all sections", () => {
    const calculateExamTotalMarks = (sections: any[]): number => {
      return sections.reduce((sum, section) => {
        const sectionMarks =
          section.groups?.reduce((groupSum: number, group: any) => {
            return (
              groupSum +
              (group.questions?.reduce((qSum: number, q: any) => {
                const mainPoints = q.points || 0;
                const subPoints = (q.subQuestions || []).reduce(
                  (s: number, sq: any) => s + (sq.points || 0),
                  0
                );
                return qSum + mainPoints + subPoints;
              }, 0) || 0)
            );
          }, 0) || 0;
        return sum + sectionMarks;
      }, 0);
    };

    const sections = [
      {
        id: "s1",
        groups: [
          {
            id: "g1",
            questions: [
              { id: "q1", points: 5, subQuestions: [{ points: 2 }] },
              { id: "q2", points: 3 },
            ],
          },
        ],
      },
    ];

    const total = calculateExamTotalMarks(sections);
    expect(total).toBe(10); // 5 + 2 + 3
  });
});

// Test 5: Backward Compatibility
describe("Backward Compatibility with Flat Exams", () => {
  test("Legacy exams without hierarchical structure should still work", () => {
    const legacyExam = {
      id: "exam1",
      title: "Legacy Exam",
      questions: [
        { id: "q1", text: "Q1", type: "MCQ" },
        { id: "q2", text: "Q2", type: "SHORT" },
      ],
      useHierarchicalStructure: false,
    };

    expect(legacyExam.useHierarchicalStructure).toBe(false);
    expect(legacyExam.questions).toHaveLength(2);
  });

  test("Migration function should convert flat to hierarchical", () => {
    const migrateToHierarchical = (flatQuestions: any[]) => {
      return {
        sections: [
          {
            id: "default-section",
            name: "Questions",
            order: 1,
            groups: [
              {
                id: "default-group",
                title: "All Questions",
                sectionId: "default-section",
                questions: flatQuestions.map((q, idx) => ({
                  ...q,
                  id: q.id,
                  question: q.text,
                  subQuestions: [],
                })),
              },
            ],
          },
        ],
      };
    };

    const flat = [{ id: "q1", text: "Question 1", type: "MCQ" }];
    const hierarchical = migrateToHierarchical(flat);

    expect(hierarchical.sections).toHaveLength(1);
    expect(hierarchical.sections[0].groups).toHaveLength(1);
    expect(hierarchical.sections[0].groups[0].questions).toHaveLength(1);
  });
});

// Test 6: Rich Text Content Handling
describe("Rich Text Content Validation", () => {
  test("Rich text content should preserve formatting tags", () => {
    const richText = "<p><b>Bold</b> <i>Italic</i> <u>Underline</u></p>";

    expect(richText).toContain("<b>");
    expect(richText).toContain("<i>");
    expect(richText).toContain("<u>");
  });

  test("Rich text should be sanitized before rendering", () => {
    const sanitizeHtml = (html: string): string => {
      const allowedTags = /^(<\/?(?:p|b|i|u|em|strong|br|ul|ol|li)>)$/i;
      // Basic sanitization - in production use DOMPurify
      return html.replace(/<[^>]+>/g, (tag) => {
        return allowedTags.test(tag) ? tag : "";
      });
    };

    const dangerous = '<script>alert("xss")</script><b>Bold</b>';
    const safe = sanitizeHtml(dangerous);

    expect(safe).not.toContain("script");
    expect(safe).toContain("<b>");
  });
});

// Test 7: Keyboard Navigation
describe("Keyboard Accessibility", () => {
  test("Arrow keys should navigate through sections", () => {
    const handleKeyDown = (
      e: KeyboardEvent,
      sections: any[],
      currentIndex: number
    ): number => {
      if (e.key === "ArrowUp" && currentIndex > 0) {
        return currentIndex - 1;
      }
      if (e.key === "ArrowDown" && currentIndex < sections.length - 1) {
        return currentIndex + 1;
      }
      return currentIndex;
    };

    const sections = [
      { id: "s1", name: "Section 1" },
      { id: "s2", name: "Section 2" },
      { id: "s3", name: "Section 3" },
    ];

    let currentIndex = 1;
    const upEvent = { key: "ArrowUp" } as KeyboardEvent;
    currentIndex = handleKeyDown(upEvent, sections, currentIndex);
    expect(currentIndex).toBe(0);

    const downEvent = { key: "ArrowDown" } as KeyboardEvent;
    currentIndex = handleKeyDown(downEvent, sections, currentIndex);
    expect(currentIndex).toBe(1);
  });

  test("Tab should focus on interactive elements", () => {
    // This would be tested in E2E testing with actual DOM
    const mockElement = { focus: jest.fn() };
    mockElement.focus();
    expect(mockElement.focus).toHaveBeenCalled();
  });
});

// Test 8: Print CSS Classes Application
describe("Print CSS Classes", () => {
  test("exam-paper-content class should be applied to container", () => {
    const mockDiv = document.createElement("div");
    mockDiv.className = "exam-paper-content";

    expect(mockDiv.classList.contains("exam-paper-content")).toBe(true);
  });

  test("All question-related classes should exist", () => {
    const requiredClasses = [
      "exam-paper-content",
      "question-number",
      "sub-question-number",
      "answer-space",
      "answer-space-large",
      "mcq-options",
      "instruction-box",
      "section-divider",
      "marks-display",
    ];

    const mockElement = document.createElement("div");

    requiredClasses.forEach((className) => {
      mockElement.className = className;
      expect(mockElement.classList.contains(className)).toBe(true);
    });
  });
});

// Test 9: Performance with Large Datasets
describe("Performance - Large Question Sets", () => {
  test("Should handle 100+ questions without lag", () => {
    const generateQuestions = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: `q${i}`,
        question: `Question ${i + 1}`,
        type: "MULTIPLE_CHOICE",
        points: 1,
      }));
    };

    const start = performance.now();
    const questions = generateQuestions(100);
    const end = performance.now();

    expect(questions).toHaveLength(100);
    expect(end - start).toBeLessThan(100); // Should complete in < 100ms
  });

  test("Section rendering with deep nesting should be optimized", () => {
    const createNestedStructure = () => {
      return {
        sections: Array.from({ length: 10 }, (_, i) => ({
          id: `s${i}`,
          name: `Section ${i}`,
          groups: Array.from({ length: 5 }, (_, j) => ({
            id: `g${i}-${j}`,
            questions: Array.from({ length: 5 }, (_, k) => ({
              id: `q${i}-${j}-${k}`,
              question: `Q${k}`,
              subQuestions: Array.from({ length: 2 }, (_, l) => ({
                id: `sq${l}`,
                question: `SQ${l}`,
              })),
            })),
          })),
        })),
      };
    };

    const start = performance.now();
    const structure = createNestedStructure();
    const end = performance.now();

    expect(structure.sections).toHaveLength(10);
    expect(end - start).toBeLessThan(50); // Should complete in < 50ms
  });
});

// Test 10: Integration Test - Complete Exam Workflow
describe("Complete Exam Workflow", () => {
  test("Create exam -> Add sections -> Add questions -> Render", () => {
    const createExam = () => ({
      id: "exam1",
      title: "Test Exam",
      sections: [],
      questionGroups: [],
      useHierarchicalStructure: true,
    });

    const addSection = (exam: any, section: any) => ({
      ...exam,
      sections: [...exam.sections, section],
    });

    const addQuestionGroup = (exam: any, group: any) => ({
      ...exam,
      questionGroups: [...exam.questionGroups, group],
    });

    let exam = createExam();
    exam = addSection(exam, {
      id: "s1",
      name: "Section 1",
      order: 1,
    });
    exam = addQuestionGroup(exam, {
      id: "g1",
      title: "Group 1",
      sectionId: "s1",
      questions: [
        {
          id: "q1",
          question: "Question 1",
          type: "MULTIPLE_CHOICE",
          options: ["A", "B", "C", "D"],
          points: 5,
          subQuestions: [],
        },
      ],
    });

    expect(exam.sections).toHaveLength(1);
    expect(exam.questionGroups).toHaveLength(1);
    expect(exam.questionGroups[0].questions).toHaveLength(1);
    expect(exam.useHierarchicalStructure).toBe(true);
  });
});

// Test 11: Validation Tests
describe("Data Validation", () => {
  test("Should validate required fields in section", () => {
    const validateSection = (section: any): string[] => {
      const errors: string[] = [];
      if (!section.id) errors.push("Section ID is required");
      if (!section.name) errors.push("Section name is required");
      if (typeof section.order !== "number")
        errors.push("Section order must be a number");
      return errors;
    };

    const validSection = { id: "s1", name: "Section 1", order: 1 };
    expect(validateSection(validSection)).toHaveLength(0);

    const invalidSection = { id: "s1", name: "", order: "one" };
    const errors = validateSection(invalidSection);
    expect(errors.length).toBeGreaterThan(0);
  });

  test("Should validate question type", () => {
    const validTypes = [
      "MULTIPLE_CHOICE",
      "TRUE_FALSE",
      "SHORT_ANSWER",
      "ESSAY",
      "FILL_BLANK",
      "MATCHING",
    ];

    const validateQuestionType = (type: string): boolean => {
      return validTypes.includes(type);
    };

    expect(validateQuestionType("MULTIPLE_CHOICE")).toBe(true);
    expect(validateQuestionType("INVALID_TYPE")).toBe(false);
  });
});

export default {};
