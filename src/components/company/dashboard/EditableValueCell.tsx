import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableValueCellProps {
  value: number;
  onSave: (newValue: number) => Promise<void>;
  formatValue?: (value: number) => string;
  className?: string;
}

export const EditableValueCell = ({
  value,
  onSave,
  formatValue = (v) => `R$ ${v.toFixed(2)}`,
  className,
}: EditableValueCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const numericValue = parseFloat(editValue.replace(",", "."));
    if (isNaN(numericValue) || numericValue < 0) {
      setEditValue(value.toString());
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(numericValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving value:", error);
      setEditValue(value.toString());
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 w-28 text-xs"
          autoFocus
          disabled={isSaving}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3 text-green-600" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        "group flex items-center gap-1.5 hover:bg-accent/50 px-2 py-1 rounded transition-colors",
        className
      )}
    >
      <span className="text-xs font-medium">{formatValue(value)}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
    </button>
  );
};
