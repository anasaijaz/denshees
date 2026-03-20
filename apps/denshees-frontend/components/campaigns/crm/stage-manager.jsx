"use client";

import { useState, useEffect } from "react";
import {
  Trash2Icon,
  DotsSquareIcon,
  TrophyIcon,
  MultiplyCircleIcon,
  PenIcon,
  CancelIcon,
} from "mage-icons-react/bulk";
import { PlusIcon, CheckIcon } from "mage-icons-react/stroke";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableStageItem({
  stage,
  editingId,
  editName,
  setEditName,
  editColor,
  setEditColor,
  saveEdit,
  startEditing,
  setEditingId,
  toggleWon,
  toggleLost,
  onDelete,
  PRESET_COLORS,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border border-black bg-white"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <DotsSquareIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      </button>

      <span
        className="w-4 h-4 rounded-full border border-black shrink-0"
        style={{ backgroundColor: stage.color || "#6B7280" }}
      />

      {editingId === stage.id ? (
        <>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-7 text-sm flex-1 border-black"
            autoFocus
          />
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={`w-4 h-4 rounded-full border ${
                  editColor === c ? "border-black scale-125" : "border-gray-300"
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setEditColor(c)}
              />
            ))}
          </div>
          <button
            onClick={() => saveEdit(stage)}
            className="p-1 hover:bg-green-50"
          >
            <CheckIcon className="w-3.5 h-3.5 text-green-600" />
          </button>
          <button
            onClick={() => setEditingId(null)}
            className="p-1 hover:bg-red-50"
          >
            <CancelIcon className="w-3.5 h-3.5 text-red-600" />
          </button>
        </>
      ) : (
        <>
          <span className="text-sm font-medium flex-1 truncate">
            {stage.name}
          </span>

          {stage.is_won && (
            <span className="text-[10px] bg-green-100 text-green-700 border border-green-300 px-1.5 py-0.5">
              WON
            </span>
          )}
          {stage.is_lost && (
            <span className="text-[10px] bg-red-100 text-red-700 border border-red-300 px-1.5 py-0.5">
              LOST
            </span>
          )}

          <button
            onClick={() => toggleWon(stage)}
            className={`p-1 hover:bg-green-50 ${
              stage.is_won ? "text-green-600" : "text-gray-300"
            }`}
            title="Mark as Won stage"
          >
            <TrophyIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => toggleLost(stage)}
            className={`p-1 hover:bg-red-50 ${
              stage.is_lost ? "text-red-600" : "text-gray-300"
            }`}
            title="Mark as Lost stage"
          >
            <MultiplyCircleIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => startEditing(stage)}
            className="p-1 hover:bg-gray-100 text-gray-400"
          >
            <PenIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(stage.id)}
            className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600"
          >
            <Trash2Icon className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

export default function StageManager({
  open,
  setOpen,
  stages,
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [localStages, setLocalStages] = useState(stages);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#6B7280");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  useEffect(() => {
    setLocalStages(stages);
  }, [stages]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const PRESET_COLORS = [
    "#6B7280",
    "#3B82F6",
    "#8B5CF6",
    "#F59E0B",
    "#10B981",
    "#EF4444",
    "#EC4899",
    "#14B8A6",
  ];

  const handleAdd = () => {
    if (!newStageName.trim()) return;
    onAdd({
      name: newStageName.trim(),
      color: newStageColor,
      order: stages.length,
      is_won: false,
      is_lost: false,
    });
    setNewStageName("");
    setNewStageColor("#6B7280");
  };

  const startEditing = (stage) => {
    setEditingId(stage.id);
    setEditName(stage.name);
    setEditColor(stage.color || "#6B7280");
  };

  const saveEdit = (stage) => {
    const updates = { name: editName.trim(), color: editColor };
    setLocalStages((prev) =>
      prev.map((s) => (s.id === stage.id ? { ...s, ...updates } : s)),
    );
    onUpdate(stage.id, updates);
    setEditingId(null);
  };

  const toggleWon = (stage) => {
    const updates = { is_won: !stage.is_won, is_lost: false };
    setLocalStages((prev) =>
      prev.map((s) => (s.id === stage.id ? { ...s, ...updates } : s)),
    );
    onUpdate(stage.id, updates);
  };

  const toggleLost = (stage) => {
    const updates = { is_lost: !stage.is_lost, is_won: false };
    setLocalStages((prev) =>
      prev.map((s) => (s.id === stage.id ? { ...s, ...updates } : s)),
    );
    onUpdate(stage.id, updates);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localStages.findIndex((s) => s.id === active.id);
    const newIndex = localStages.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(localStages, oldIndex, newIndex).map(
      (stage, index) => ({ ...stage, order: index }),
    );

    setLocalStages(reordered);

    reordered.forEach((stage, index) => {
      if (stages.find((s) => s.id === stage.id)?.order !== index) {
        onUpdate(stage.id, { order: index });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader>
          <DialogTitle>Manage Pipeline Stages</DialogTitle>
          <DialogDescription>
            Add, edit, or remove CRM stages. Mark stages as won/lost for
            reporting.
          </DialogDescription>
        </DialogHeader>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localStages.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {localStages.map((stage) => (
                <SortableStageItem
                  key={stage.id}
                  stage={stage}
                  editingId={editingId}
                  editName={editName}
                  setEditName={setEditName}
                  editColor={editColor}
                  setEditColor={setEditColor}
                  saveEdit={saveEdit}
                  startEditing={startEditing}
                  setEditingId={setEditingId}
                  toggleWon={toggleWon}
                  toggleLost={toggleLost}
                  onDelete={onDelete}
                  PRESET_COLORS={PRESET_COLORS}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add new stage */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={`w-4 h-4 rounded-full border ${
                  newStageColor === c
                    ? "border-black scale-125"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setNewStageColor(c)}
              />
            ))}
          </div>
          <Input
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder="New stage name..."
            className="h-8 text-sm flex-1 border-black"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button size="sm" onClick={handleAdd} className="h-8">
            <PlusIcon className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
