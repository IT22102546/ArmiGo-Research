"use client";

import { useState, useRef } from "react";
import { GripVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

/**
 * Type-safe accessor for item properties
 */
function getItemValue<T>(item: T, key: string): string {
  const value = (item as Record<string, unknown>)[key];
  return value != null ? String(value) : "";
}

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onReorder: (items: T[]) => void;
  getItemId: (item: T) => string;
  emptyMessage?: string;
  enableDragDrop?: boolean;
}

export function SortableTable<T>({
  data,
  columns,
  onReorder,
  getItemId,
  emptyMessage = "No data found",
  enableDragDrop = true,
}: SortableTableProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!enableDragDrop) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "");
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    if (!enableDragDrop || draggedIndex === null) return;
    e.preventDefault();
    dragCounter.current++;
    if (index !== draggedIndex) {
      setHoveredIndex(index);
    }
  };

  const handleDragLeave = () => {
    if (!enableDragDrop) return;
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setHoveredIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!enableDragDrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (!enableDragDrop || draggedIndex === null) return;
    e.preventDefault();
    dragCounter.current = 0;

    if (draggedIndex !== dropIndex) {
      const newData = [...data];
      const draggedItem = newData[draggedIndex];
      newData.splice(draggedIndex, 1);
      newData.splice(dropIndex, 0, draggedItem);
      onReorder(newData);
    }

    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  const handleDragEnd = () => {
    if (!enableDragDrop) return;
    setDraggedIndex(null);
    setHoveredIndex(null);
    dragCounter.current = 0;
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {enableDragDrop && <TableHead className="w-12"></TableHead>}
          {columns.map((column) => (
            <TableHead key={String(column.key)}>{column.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow
            key={getItemId(item)}
            draggable={enableDragDrop}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              ${enableDragDrop ? "cursor-move" : ""}
              ${draggedIndex === index ? "opacity-50" : ""}
              ${hoveredIndex === index ? "border-t-2 border-t-primary" : ""}
            `}
          >
            {enableDragDrop && (
              <TableCell className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </TableCell>
            )}
            {columns.map((column) => (
              <TableCell key={String(column.key)}>
                {column.render
                  ? column.render(item)
                  : getItemValue(item, String(column.key))}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
