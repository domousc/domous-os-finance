import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UseConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
}

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmOptions | null>(null);

  const confirm = (opts: UseConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    if (options?.onConfirm) {
      await options.onConfirm();
    }
    setIsOpen(false);
  };

  const ConfirmDialog = () => {
    if (!options) return null;

    return (
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsOpen(false)}>
              {options.cancelText || "Cancelar"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              {options.confirmText || "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return { confirm, ConfirmDialog };
};
