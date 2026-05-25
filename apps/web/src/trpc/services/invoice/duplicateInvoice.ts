import { ForbiddenError, InternalServerError, NotFoundError } from "@/lib/effect/error/trpc";
import { insertInvoiceQuery } from "@/lib/db-queries/invoice/insertInvoice";
import { authorizedProcedure } from "@/trpc/procedures/authorizedProcedure";
import { getInvoiceQuery } from "@/lib/db-queries/invoice/getInvoice";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { parseCatchError } from "@/lib/neverthrow/parseCatchError";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { z } from "zod";

const duplicateInvoiceSchema = z.object({
  id: z.string(),
});

interface MutationResponse {
  success: boolean;
  message: string;
  invoiceId?: string;
}

export const duplicateInvoice = authorizedProcedure
  .input(duplicateInvoiceSchema)
  .mutation<MutationResponse>(async ({ ctx, input }) => {
    // Duplicate Invoice Effect
    const duplicateInvoiceEffect = Effect.gen(function* () {
      // Check if the user is allowed to save data
      if (!ctx.auth.user.allowedSavingData) {
        return yield* new ForbiddenError({ message: ERROR_MESSAGES.NOT_ALLOWED_TO_SAVE_DATA });
      }

      // 1. Fetch the existing invoice
      const invoice = yield* Effect.tryPromise({
        try: () => getInvoiceQuery(input.id, ctx.auth.user.id),
        catch: (error) => new InternalServerError({ message: parseCatchError(error) }),
      });

      // Check if the invoice exists
      if (!invoice) {
        return yield* new NotFoundError({ message: ERROR_MESSAGES.INVOICE_NOT_FOUND });
      }

      // 2. Prepare the data for the new invoice
      const invoiceData = {
        companyDetails: {
          ...invoice.invoiceFields.companyDetails,
          metadata: invoice.invoiceFields.companyDetails.metadata.map((m) => ({ label: m.label, value: m.value })),
        },
        clientDetails: {
          ...invoice.invoiceFields.clientDetails,
          metadata: invoice.invoiceFields.clientDetails.metadata.map((m) => ({ label: m.label, value: m.value })),
        },
        invoiceDetails: {
          ...invoice.invoiceFields.invoiceDetails,
          serialNumber: `${invoice.invoiceFields.invoiceDetails.serialNumber}-copy`,
          billingDetails: invoice.invoiceFields.invoiceDetails.billingDetails.map((b) => ({
            label: b.label,
            value: b.value.toNumber(),
            type: b.type,
          })),
          date: new Date(),
        },
        items: invoice.invoiceFields.items.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
        })),
        metadata: {
          ...invoice.invoiceFields.metadata,
          paymentInformation: invoice.invoiceFields.metadata.paymentInformation.map((p) => ({
            label: p.label,
            value: p.value,
          })),
        },
      };

      // 3. Insert the new invoice
      const newInvoiceId = yield* Effect.tryPromise({
        try: () => insertInvoiceQuery(invoiceData, ctx.auth.user.id),
        catch: (error) => new InternalServerError({ message: parseCatchError(error) }),
      });

      // Return the success message
      return {
        success: true,
        message: SUCCESS_MESSAGES.INVOICE_SAVED,
        invoiceId: newInvoiceId,
      };
    });

    // Run the effect
    return Effect.runPromise(
      duplicateInvoiceEffect.pipe(
        Effect.catchTags({
          NotFoundError: (error) => Effect.fail(new TRPCError({ code: "NOT_FOUND", message: error.message })),
          ForbiddenError: (error) => Effect.fail(new TRPCError({ code: "FORBIDDEN", message: error.message })),
          InternalServerError: (error) =>
            Effect.fail(new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })),
        }),
      ),
    );
  });
