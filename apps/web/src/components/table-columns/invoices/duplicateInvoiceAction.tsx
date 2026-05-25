"use client";

import { duplicateInvoice as duplicateIDBInvoice } from "@/lib/indexdb-queries/invoice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { VersionsIcon } from "@/assets/icons";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

interface DuplicateInvoiceActionProps {
  invoiceId: string;
  type: "local" | "server";
}

const DuplicateInvoiceAction = ({ invoiceId, type }: DuplicateInvoiceActionProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Server Mutation
  const duplicateServerInvoiceMutation = useMutation(
    trpc.invoice.duplicate.mutationOptions({
      onSuccess: () => {
        toast.success("Invoice duplicated successfully!", {
          description: "The invoice has been duplicated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: trpc.invoice.list.queryKey() });
      },
      onError: (error) => {
        toast.error("Failed to duplicate invoice!", {
          description: parseCatchError(error),
        });
      },
    }),
  );

  // IDB Mutation
  const duplicateIDBInvoiceMutation = useMutation({
    mutationFn: async () => {
      await duplicateIDBInvoice(invoiceId);
    },
    onSuccess: () => {
      toast.success("Invoice duplicated successfully!", {
        description: "The invoice has been duplicated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["idb-invoices"] });
    },
    onError: (error) => {
      toast.error("Failed to duplicate invoice!", {
        description: parseCatchError(error),
      });
    },
  });

  const handleDuplicate = async () => {
    if (type === "server") {
      await duplicateServerInvoiceMutation.mutateAsync({ id: invoiceId });
    } else {
      await duplicateIDBInvoiceMutation.mutateAsync();
    }
  };

  return (
    <DropdownMenuItem
      onClick={handleDuplicate}
      disabled={duplicateServerInvoiceMutation.isPending || duplicateIDBInvoiceMutation.isPending}
    >
      <VersionsIcon />
      <span>
        {duplicateServerInvoiceMutation.isPending || duplicateIDBInvoiceMutation.isPending
          ? "Duplicating..."
          : "Duplicate"}
      </span>
    </DropdownMenuItem>
  );
};

export default DuplicateInvoiceAction;
