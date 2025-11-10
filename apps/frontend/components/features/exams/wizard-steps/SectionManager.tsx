"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Edit2,
  GripVertical,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExamFormData, ExamSection, QuestionGroup } from "../ExamBuilderWizard";
import RichTextEditor from "@/components/shared/RichTextEditor";
import { cn } from "@/lib/utils";
import { generateSectionLabel } from "@/lib/utils/examHierarchyUtils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SectionManagerProps {
  formData: ExamFormData;
  updateFormData: (updates: Partial<ExamFormData>) => void;
}

interface DraggableSectionItemProps {
  section: ExamSection;
  idx: number;
  formData: ExamFormData;
  updateFormData: (updates: Partial<ExamFormData>) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  expandedSections: Set<string>;
  setExpandedSections: (sections: Set<string>) => void;
  editForm: Partial<ExamSection>;
  setEditForm: (form: Partial<ExamSection>) => void;
  deleteSection: (id: string) => void;
}

function DraggableSectionItem({
  section,
  idx,
  formData,
  updateFormData,
  editingId,
  setEditingId,
  expandedSections,
  setExpandedSections,
  editForm,
  setEditForm,
  deleteSection,
}: DraggableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden border-2 ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200"
      }`}
    >
      <div
        className="flex items-center justify-between p-4 bg-gray-50 cursor-move"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-3">
          <GripVertical className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-700">
            {generateSectionLabel(section, formData.sections || [])} -{" "}
            {section.title || "Untitled"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {formData.questionGroups?.filter((g) => g.sectionId === section.id)
              .length || 0}{" "}
            groups
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setExpandedSections(
                new Set(
                  expandedSections.has(section.id)
                    ? [...expandedSections].filter((id) => id !== section.id)
                    : [...expandedSections, section.id]
                )
              )
            }
          >
            {expandedSections.has(section.id) ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setEditingId(editingId === section.id ? null : section.id)
            }
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteSection(section.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expandedSections.has(section.id) && (
        <div className="p-4 space-y-4 border-t border-gray-200">
          <div className="space-y-2">
            <label className="text-sm font-medium">Section Title</label>
            <Input
              value={
                editingId === section.id
                  ? editForm.title || ""
                  : section.title || ""
              }
              onChange={(e) =>
                editingId === section.id &&
                setEditForm({ ...editForm, title: e.target.value })
              }
              placeholder="e.g., Reading Comprehension"
              disabled={editingId !== section.id}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Instruction</label>
            <Textarea
              value={
                editingId === section.id
                  ? editForm.instruction || ""
                  : section.instruction || ""
              }
              onChange={(e) =>
                editingId === section.id &&
                setEditForm({ ...editForm, instruction: e.target.value })
              }
              placeholder="Instructions for this section"
              disabled={editingId !== section.id}
            />
          </div>
          {editingId === section.id && (
            <Button
              onClick={() => {
                const updated = formData.sections?.map((s) =>
                  s.id === section.id ? { ...s, ...editForm } : s
                );
                updateFormData({ sections: updated });
                setEditingId(null);
                setEditForm({});
              }}
            >
              Save Changes
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export default function SectionManager({
  formData,
  updateFormData,
}: SectionManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSectionDialog, setNewSectionDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const [editForm, setEditForm] = useState<Partial<ExamSection>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Add new section
  const addSection = () => {
    const newId = `section_${Date.now()}`;
    const newSection: ExamSection = {
      id: newId,
      type: "QUESTIONS",
      title: "New Section",
      order: (formData.sections?.length || 0) + 1,
      examPart: 1,
      numberingStyle: "numeric",
    };

    updateFormData({
      sections: [...(formData.sections || []), newSection],
    });

    setNewSectionDialog(false);
  };

  // Delete section
  const deleteSection = (id: string) => {
    const updated = formData.sections?.filter((s) => s.id !== id);
    const groupsToDelete = formData.questionGroups?.filter(
      (g) => g.sectionId === id
    );

    // Remove questions from deleted groups
    let updatedQuestions = formData.questions;
    groupsToDelete?.forEach((g) => {
      updatedQuestions = updatedQuestions.filter((q) => q.groupId !== g.id);
    });

    // Remove groups
    const updatedGroups = formData.questionGroups?.filter(
      (g) => g.sectionId !== id
    );

    updateFormData({
      sections: updated,
      questionGroups: updatedGroups,
      questions: updatedQuestions,
    });
  };

  // Handle drag end - reorder sections
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && formData.sections) {
      const oldIndex = formData.sections.findIndex((s) => s.id === active.id);
      const newIndex = formData.sections.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(formData.sections, oldIndex, newIndex);
        // Update order field
        const withOrder = reordered.map((s, idx) => ({
          ...s,
          order: idx + 1,
        }));
        updateFormData({ sections: withOrder });
      }
    }
  };

  if (!formData.sections || formData.sections.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Plus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium text-gray-600">No sections created yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Create sections to organize your exam by topics or parts
          </p>
          <Button onClick={addSection}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Section
          </Button>
        </div>
      </div>
    );
  }

  const sectionIds = formData.sections.map((s) => s.id);

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sectionIds}
          strategy={verticalListSortingStrategy}
        >
          {/* Section List */}
          {formData.sections.map((section, idx) => (
            <Card key={section.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.instruction}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSection(section.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </SortableContext>
      </DndContext>

      {/* Add Section Button */}
      <Button onClick={addSection} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Section
      </Button>
    </div>
  );
}

// Section Item Component
function SectionItem({
  section,
  idx,
  formData,
  updateFormData,
  editingId,
  setEditingId,
  expandedSections,
  setExpandedSections,
  editForm,
  setEditForm,
  deleteSection,
}: {
  section: ExamSection;
  idx: number;
  formData: ExamFormData;
  updateFormData: (updates: Partial<ExamFormData>) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  expandedSections: Set<string>;
  setExpandedSections: (sections: Set<string>) => void;
  editForm: Partial<ExamSection>;
  setEditForm: (form: Partial<ExamSection>) => void;
  deleteSection: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isExpanded = expandedSections.has(section.id);
  const isEditing = editingId === section.id;

  const toggleExpanded = () => {
    const newExpanded = new Set(expandedSections);
    if (isExpanded) {
      newExpanded.delete(section.id);
    } else {
      newExpanded.add(section.id);
    }
    setExpandedSections(newExpanded);
  };

  const startEdit = () => {
    setEditingId(section.id);
    setEditForm(section);
  };

  const saveEdit = () => {
    const updated = formData.sections?.map((s) =>
      s.id === section.id ? { ...s, ...editForm } : s
    );
    updateFormData({ sections: updated });
    setEditingId(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const sectionLabel = generateSectionLabel(section, formData.sections || []);

  return (
    <Card ref={setNodeRef} style={style} className="p-4 mb-2">
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge>{sectionLabel}</Badge>
              <span className="font-medium">{section.title}</span>
              <Badge variant="outline">{section.type}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <Button variant="ghost" size="sm" onClick={startEdit}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={toggleExpanded}>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
          {isExpanded && !isEditing && section.description && (
            <p className="text-sm text-gray-600 mt-2">{section.description}</p>
          )}
          {isEditing && (
            <div className="mt-4 space-y-4">
              <Input
                value={editForm.title || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                placeholder="Section Title"
              />
              <Textarea
                value={editForm.description || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Section Description"
              />
              <div className="flex gap-2">
                <Button onClick={saveEdit} size="sm">
                  Save
                </Button>
                <Button onClick={cancelEdit} size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
