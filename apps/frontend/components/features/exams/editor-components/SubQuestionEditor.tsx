// "use client";

// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import {
//   Plus,
//   Trash2,
//   GripVertical,
//   ChevronDown,
//   ChevronUp,
// } from "lucide-react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Question, QuestionType } from "../ExamBuilderWizard";
// import RichTextEditor from "@/components/shared/RichTextEditor";
// import { Input as NumberInput } from "@/components/ui/input";
// import { cn } from "@/lib/utils";

// interface SubQuestionEditorProps {
//   parentQuestion: Question;
//   subQuestions: Question[];
//   onUpdate: (subQuestions: Question[]) => void;
//   parentType: QuestionType;
// }

// const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
//   MULTIPLE_CHOICE: "Multiple Choice",
//   TRUE_FALSE: "True/False",
//   SHORT_ANSWER: "Short Answer",
//   ESSAY: "Essay",
//   FILL_BLANK: "Fill in the Blank",
//   MATCHING: "Matching",
// };

// export default function SubQuestionEditor({
//   parentQuestion,
//   subQuestions,
//   onUpdate,
//   parentType,
// }: SubQuestionEditorProps) {
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [expandedId, setExpandedId] = useState<string | null>(null);
//   const [showAddDialog, setShowAddDialog] = useState(false);

//   const [editForm, setEditForm] = useState<Partial<Question>>({});

//   // Add new sub-question
//   const addSubQuestion = () => {
//     const newSQ: Question = {
//       id: `sq_${Date.now()}`,
//       type: parentType,
//       question: "",
//       options:
//         parentType === "MULTIPLE_CHOICE" || parentType === "TRUE_FALSE"
//           ? ["", "", "", ""]
//           : [],
//       correctAnswer: "",
//       points: 1,
//       order: subQuestions.length + 1,
//       section: parentQuestion.section,
//       examPart: parentQuestion.examPart,
//     };

//     if (parentType === "TRUE_FALSE") {
//       newSQ.options = ["True", "False"];
//     }

//     onUpdate([...subQuestions, newSQ]);
//     setShowAddDialog(false);
//   };

//   // Update sub-question
//   const updateSubQuestion = (id: string, updates: Partial<Question>) => {
//     const updated = subQuestions.map((sq) =>
//       sq.id === id ? { ...sq, ...updates } : sq
//     );
//     onUpdate(updated);
//   };

//   // Delete sub-question
//   const deleteSubQuestion = (id: string) => {
//     const updated = subQuestions.filter((sq) => sq.id !== id);
//     onUpdate(updated);
//     setEditingId(null);
//   };

//   // Reorder sub-questions
//   const moveSubQuestion = (fromIdx: number, toIdx: number) => {
//     const items = [...subQuestions];
//     const [moved] = items.splice(fromIdx, 1);
//     items.splice(toIdx, 0, moved);

//     // Update order
//     const reordered = items.map((sq, idx) => ({ ...sq, order: idx + 1 }));
//     onUpdate(reordered);
//   };

//   // Calculate points
//   const mainPoints = parentQuestion.points || 0;
//   const subTotal =
//     subQuestions.reduce((sum, sq) => sum + (sq.points || 0), 0) || 0;
//   const totalPoints = mainPoints + subTotal;

//   return (
//     <div className="space-y-4 border rounded-lg p-4 bg-gray-50 dark:bg-slate-900">
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h4 className="font-semibold">Sub-Questions</h4>
//           <p className="text-sm text-gray-600 dark:text-gray-400">
//             Break down this question into smaller parts
//           </p>
//         </div>

//         {/* Points Summary */}
//         <Card className="p-3 bg-white dark:bg-slate-800 text-sm space-y-1">
//           <div className="flex justify-between gap-4">
//             <span className="text-gray-600">Main:</span>
//             <span className="font-semibold">{mainPoints} pts</span>
//           </div>
//           <div className="flex justify-between gap-4">
//             <span className="text-gray-600">Sub-total:</span>
//             <span className="font-semibold text-blue-600">{subTotal} pts</span>
//           </div>
//           <div className="border-t pt-1 flex justify-between gap-4">
//             <span className="font-semibold">Total:</span>
//             <span className="font-semibold text-lg text-green-600">
//               {totalPoints} pts
//             </span>
//           </div>
//         </Card>
//       </div>

//       {/* Sub-Questions List */}
//       {subQuestions.length === 0 ? (
//         <div className="text-center py-6 border-2 border-dashed rounded-lg">
//           <p className="text-sm text-gray-500 mb-3">
//             No sub-questions added yet
//           </p>
//           <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
//             <DialogTrigger asChild>
//               <Button size="sm" variant="outline">
//                 <Plus className="h-4 w-4 mr-1" />
//                 Add Sub-Question
//               </Button>
//             </DialogTrigger>
//             <DialogContent>
//               <DialogHeader>
//                 <DialogTitle>Add Sub-Question</DialogTitle>
//                 <DialogDescription>
//                   Create a new sub-question. It will inherit the parent type (
//                   {QUESTION_TYPE_LABELS[parentType]})
//                 </DialogDescription>
//               </DialogHeader>
//               <div className="space-y-4">
//                 <Button onClick={addSubQuestion} className="w-full">
//                   <Plus className="h-4 w-4 mr-2" />
//                   Create Sub-Question
//                 </Button>
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>
//       ) : (
//         <div className="space-y-2">
//           {subQuestions.map((sq, idx) => (
//             <Card key={sq.id} className="p-3">
//               {/* Sub-Question Header */}
//               <div
//                 className="flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded transition-colors"
//                 onClick={() => {
//                   setExpandedId(
//                     expandedId === (sq.id || "") ? null : sq.id || ""
//                   );
//                 }}
//               >
//                 <div className="flex items-center gap-2 flex-1">
//                   <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
//                   {expandedId === sq.id ? (
//                     <ChevronUp className="h-4 w-4" />
//                   ) : (
//                     <ChevronDown className="h-4 w-4" />
//                   )}
//                   <Badge variant="secondary" className="text-xs">
//                     {String.fromCharCode(96 + idx + 1)})
//                   </Badge>
//                   <span className="text-sm font-medium line-clamp-1">
//                     {sq.question || "New sub-question"}
//                   </span>
//                   <Badge variant="outline" className="text-xs ml-auto">
//                     {sq.points} pts
//                   </Badge>
//                 </div>

//                 <div className="flex gap-1 ml-2">
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setEditingId(
//                         editingId === (sq.id || "") ? null : sq.id || ""
//                       );
//                       setEditForm(sq);
//                     }}
//                   >
//                     Edit
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       deleteSubQuestion(sq.id || "");
//                     }}
//                     className="text-red-600 hover:text-red-700 hover:bg-red-50"
//                   >
//                     <Trash2 className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>

//               {/* Sub-Question Edit Form */}
//               {editingId === sq.id && (
//                 <div className="mt-3 pt-3 border-t space-y-3">
//                   <div>
//                     <label className="text-sm font-medium">
//                       Sub-Question Text
//                     </label>
//                     <div className="mt-1">
//                       <RichTextEditor
//                         value={editForm.question || ""}
//                         onChange={(value: string) => {
//                           setEditForm({
//                             ...editForm,
//                             question: value,
//                           });
//                         }}
//                       />
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-3 gap-3">
//                     <div>
//                       <label className="text-sm font-medium">Points</label>
//                       <NumberInput
//                         type="number"
//                         value={editForm.points || 1}
//                         onChange={(e) => {
//                           setEditForm({
//                             ...editForm,
//                             points: parseFloat(e.target.value) || 1,
//                           });
//                         }}
//                         min={0.5}
//                         step={0.5}
//                         className="mt-1"
//                       />
//                     </div>

//                     {(sq.type === "MULTIPLE_CHOICE" ||
//                       sq.type === "TRUE_FALSE") && (
//                       <div>
//                         <label className="text-sm font-medium">
//                           Correct Answer
//                         </label>
//                         <Select
//                           value={editForm.correctAnswer || ""}
//                           onValueChange={(val) => {
//                             setEditForm({
//                               ...editForm,
//                               correctAnswer: val,
//                             });
//                           }}
//                         >
//                           <SelectTrigger className="mt-1">
//                             <SelectValue placeholder="Select answer" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {editForm.options?.map((opt, i) => (
//                               <SelectItem key={i} value={opt || ""}>
//                                 {opt || `Option ${i + 1}`}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     )}
//                   </div>

//                   {/* Options Editor (for MCQ/True-False) */}
//                   {(sq.type === "MULTIPLE_CHOICE" ||
//                     sq.type === "TRUE_FALSE") && (
//                     <div>
//                       <label className="text-sm font-medium">Options</label>
//                       <div className="space-y-2 mt-2">
//                         {editForm.options?.map((opt, i) => (
//                           <div key={i} className="flex gap-2">
//                             <Badge variant="secondary">
//                               {String.fromCharCode(65 + i)})
//                             </Badge>
//                             <Input
//                               value={opt || ""}
//                               onChange={(e) => {
//                                 const newOpts = [...(editForm.options || [])];
//                                 newOpts[i] = e.target.value;
//                                 setEditForm({
//                                   ...editForm,
//                                   options: newOpts,
//                                 });
//                               }}
//                               placeholder={`Option ${i + 1}`}
//                             />
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   <div className="flex gap-2 justify-end">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => setEditingId(null)}
//                     >
//                       Cancel
//                     </Button>
//                     <Button
//                       size="sm"
//                       onClick={() => {
//                         updateSubQuestion(sq.id || "", editForm);
//                         setEditingId(null);
//                       }}
//                     >
//                       Save
//                     </Button>
//                   </div>
//                 </div>
//               )}
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Add Sub-Question Button */}
//       {subQuestions.length > 0 && (
//         <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
//           <DialogTrigger asChild>
//             <Button variant="outline" size="sm" className="w-full">
//               <Plus className="h-4 w-4 mr-2" />
//               Add Another Sub-Question
//             </Button>
//           </DialogTrigger>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Add Sub-Question</DialogTitle>
//               <DialogDescription>
//                 Create a new sub-question. It will inherit the parent type (
//                 {QUESTION_TYPE_LABELS[parentType]})
//               </DialogDescription>
//             </DialogHeader>
//             <div className="space-y-4">
//               <Button onClick={addSubQuestion} className="w-full">
//                 <Plus className="h-4 w-4 mr-2" />
//                 Create Sub-Question
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}
//     </div>
//   );
// }
