"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";
import {
  ExamFormData,
  EnhancedQuestion,
  ExamSection,
  QuestionGroup,
} from "../ExamBuilderWizard";
import { cn, prepareRichText } from "@/lib/utils";
import {
  generateSectionLabel,
  generateQuestionNumber,
  generateSubQuestionNumber,
  generateMcqOption,
} from "@/lib/utils/examHierarchyUtils";

interface ExamPaperViewProps {
  formData: ExamFormData;
}

const QUESTION_TYPE_LABELS = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE: "True/False",
  SHORT_ANSWER: "Short Answer",
  ESSAY: "Essay",
  FILL_BLANK: "Fill in the Blank",
  MATCHING: "Matching",
};

export default function ExamPaperView({ formData }: ExamPaperViewProps) {
  if (!formData.sections || formData.sections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No exam structure defined</p>
      </div>
    );
  }

  const renderMCQOptions = (question: any) => {
    if (!question.options || question.options.length === 0) {
      return null;
    }

    return (
      <div className="space-y-1 ml-4">
        {question.options.map((option: string, idx: number) => (
          <div key={idx} className="flex gap-2">
            <span className="font-medium">{generateMcqOption(idx)}</span>
            <span>{option}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderQuestion = (
    question: EnhancedQuestion,
    questionIdx: number,
    section: ExamSection,
    group: QuestionGroup
  ) => {
    const questionNum = generateQuestionNumber(
      questionIdx,
      section.numberingStyle || "numeric"
    );

    return (
      <div key={question.id} className="question-block mb-4">
        {/* Main Question */}
        <div className="flex gap-3">
          <span className="question-number">{questionNum}</span>
          <div className="flex-1">
            {/* Question Text */}
            {question.question && (
              <div
                className="rich-text-content"
                dangerouslySetInnerHTML={{
                  __html: prepareRichText(question.question),
                }}
              />
            )}

            {/* Question Image */}
            {question.imageUrl && (
              <div className="my-3">
                <img
                  src={question.imageUrl}
                  alt="Question"
                  className="max-h-40"
                />
              </div>
            )}

            {/* MCQ Options */}
            {question.type === "MULTIPLE_CHOICE" && (
              <div className="mcq-options">
                {question.options?.map((option: string, idx: number) => (
                  <div key={idx} className="mcq-option">
                    <span className="font-medium">
                      {generateMcqOption(idx)}
                    </span>{" "}
                    {option}
                  </div>
                ))}
              </div>
            )}

            {/* True/False Options */}
            {question.type === "TRUE_FALSE" && (
              <div className="mcq-options">
                <div className="mcq-option">
                  <span className="font-medium">A)</span> True
                </div>
                <div className="mcq-option">
                  <span className="font-medium">B)</span> False
                </div>
              </div>
            )}

            {/* Answer Space for Subjective */}
            {question.type === "SHORT_ANSWER" && (
              <div className="answer-space mt-2" />
            )}

            {question.type === "ESSAY" && (
              <div className="answer-space-large mt-2" />
            )}

            {/* Sub-Questions */}
            {question.subQuestions && question.subQuestions.length > 0 && (
              <div className="mt-4 ml-8 border-l-2 border-gray-400 pl-3">
                {question.subQuestions.map((sq, sqIdx) => {
                  const subNum = generateSubQuestionNumber(sqIdx);
                  return (
                    <div key={sq.id || sqIdx} className="sub-question">
                      <div className="flex gap-2">
                        <span className="sub-question-number">{subNum}</span>
                        <div className="flex-1">
                          {sq.question && (
                            <div
                              className="rich-text-content"
                              dangerouslySetInnerHTML={{
                                __html: prepareRichText(sq.question),
                              }}
                            />
                          )}

                          {/* Sub-question MCQ Options */}
                          {sq.type === "MULTIPLE_CHOICE" && sq.options && (
                            <div className="mcq-options">
                              {sq.options.map((opt: string, idx: number) => (
                                <div key={idx} className="mcq-option">
                                  <span className="font-medium">
                                    {generateMcqOption(idx)}
                                  </span>{" "}
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Sub-question Answer Space */}
                          {(sq.type === "SHORT_ANSWER" ||
                            sq.type === "ESSAY") && (
                            <div
                              className={
                                sq.type === "ESSAY"
                                  ? "answer-space-large"
                                  : "answer-space"
                              }
                              style={{ marginTop: "0.5rem" }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Points Display */}
            {question.points && (
              <div className="marks-display">
                [{question.points} mark{question.points !== 1 ? "s" : ""}]
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (section: ExamSection, sectionIdx: number) => {
    const groupsInSection =
      formData.questionGroups?.filter((g) => g.sectionId === section.id) || [];

    const sectionLabel = generateSectionLabel(section, formData.sections || []);

    return (
      <div key={section.id} className="exam-section">
        {/* Section Header */}
        {section.type === "INSTRUCTION" ? (
          <div className="instruction-box mb-6">
            {section.instruction && (
              <div
                className="rich-text-content"
                dangerouslySetInnerHTML={{
                  __html: prepareRichText(section.instruction),
                }}
              />
            )}
          </div>
        ) : section.type === "DIVIDER" ? (
          <div className="section-divider my-8" />
        ) : (
          <>
            <h2 className="section-title mb-3">{sectionLabel}</h2>
            {section.instruction && (
              <div className="instruction-box mb-4">
                <strong>Instructions:</strong>{" "}
                <span
                  dangerouslySetInnerHTML={{
                    __html: prepareRichText(section.instruction),
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Question Groups */}
        {groupsInSection.map((group, groupIdx) => (
          <div key={group.id} className="question-group mb-6">
            {/* Group Header (only if named) */}
            {group.title && groupsInSection.length > 1 && (
              <p className="group-title mb-3">{group.title}</p>
            )}

            {/* Questions in Group */}
            {group.questions?.map((q, qIdx) => {
              const enhancedQ = q as EnhancedQuestion;
              return renderQuestion(enhancedQ, qIdx, section, group);
            })}
          </div>
        ))}

        {/* Section Divider for Print */}
        {section.type !== "DIVIDER" && section.type !== "INSTRUCTION" && (
          <div className="section-divider" />
        )}
      </div>
    );
  };

  const sortedSections = [...(formData.sections || [])].sort(
    (a, b) => a.order - b.order
  );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="sticky top-0 bg-white dark:bg-slate-950 border-b p-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-xl font-bold">{formData.title}</h2>
          <p className="text-sm text-gray-500">
            Exam Paper Preview (Print-Ready)
          </p>
        </div>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          Print / PDF
        </Button>
      </div>

      {/* Exam Paper */}
      <div
        className="exam-paper-content mx-auto bg-white dark:bg-white rounded-lg shadow-lg overflow-hidden"
        id="exam-paper-print"
      >
        {/* Header */}
        <div className="p-8 text-center border-b-2 border-gray-400 mb-6">
          <h1>{formData.title}</h1>
          {formData.duration && (
            <p className="exam-meta">Duration: {formData.duration} minutes</p>
          )}
          {formData.totalMarks && (
            <p className="exam-meta">Total Marks: {formData.totalMarks}</p>
          )}
        </div>

        {/* Sections */}
        <div className="exam-sections p-8">
          {sortedSections.map((section, idx) => renderSection(section, idx))}
        </div>

        {/* Footer */}
        <div className="p-6 text-center border-t-2 border-gray-400 text-xs text-gray-500 mt-12">
          <p>---End of Exam---</p>
        </div>
      </div>

      {/* Print Styles - Removed as they are now in globals.css */}
      <style>{`
        /* Fallback styles for browsers that don't load globals.css properly */
        @media print {
          body {
            margin: 0;
            padding: 0;
          }

          #exam-paper-print {
            box-shadow: none;
            border: none;
            margin: 0;
            padding: 0;
            page-break-inside: avoid;
          }

          .exam-paper-content {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000 !important;
          }

          button, [role="button"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
