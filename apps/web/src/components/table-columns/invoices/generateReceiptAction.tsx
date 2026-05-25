"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ReceiptIcon } from "@/assets/icons";
import { useRouter } from "next/navigation";

interface GenerateReceiptActionProps {
  invoiceId: string;
  type: "local" | "server";
}

const GenerateReceiptAction = ({ invoiceId, type }: GenerateReceiptActionProps) => {
  const router = useRouter();

  const handleGenerateReceipt = () => {
    router.push(`/receipt/${type}/${invoiceId}`);
  };

  return (
    <DropdownMenuItem onClick={handleGenerateReceipt}>
      <ReceiptIcon />
      <span>Generate Receipt</span>
    </DropdownMenuItem>
  );
};

export default GenerateReceiptAction;
