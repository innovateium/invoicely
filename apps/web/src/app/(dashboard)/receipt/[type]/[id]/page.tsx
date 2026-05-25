import { EditInvoicePageSchema } from "@/zod-schemas/invoice/edit-invoice-page";
import EditInvoice from "../../../edit/[type]/[id]/editInvoice";
import { ERROR_MESSAGES } from "@/constants/issues";

interface PageProps {
  params: Promise<{ type?: string; id?: string }>;
}

const Page = async ({ params }: PageProps) => {
  const awaitedParams = await params;

  //   safe parsing
  const parsedParams = EditInvoicePageSchema.safeParse({
    type: awaitedParams.type,
    id: awaitedParams.id,
  });

  if (!parsedParams.success) {
    throw new Error(ERROR_MESSAGES.INVALID_SEARCH_PARAMS);
  }

  const { type, id } = parsedParams.data;

  return <EditInvoice type={type} id={id} mode="receipt" />;
};

export default Page;
