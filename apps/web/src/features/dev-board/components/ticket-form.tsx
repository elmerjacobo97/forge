import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";

import type { Ticket } from "../types/board";
import type { TicketFormValues } from "../schemas/ticket";
import { useTicketForm } from "../hooks/use-ticket-form";
import { TicketBasicFields, TicketOwnerFields, TicketPlanningFields } from "./ticket-form-fields";

interface TicketFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTicket: Ticket | null;
  onSubmit: (values: TicketFormValues) => void;
}

export function TicketForm({
  open,
  onOpenChange,
  editTicket,
  onSubmit: onSubmitTicket,
}: TicketFormProps) {
  const isEdit = editTicket !== null;
  const { form, planningDateErrors, setPlanningDateError, handleOpenChange } = useTicketForm({
    open,
    onOpenChange,
    editTicket,
    onSubmit: onSubmitTicket,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        onInteractOutside={(event) => event.preventDefault()}
        className="max-h-[90vh] max-w-md grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Ticket" : "New Ticket"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update ticket details, planning dates, complexity, or responsibility."
              : "Create a ticket and track its planning and time across your workflow."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="-m-1 min-h-0 overflow-y-auto p-1"
          id="ticket-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <TicketBasicFields form={form} />
            <TicketPlanningFields
              form={form}
              planningDateErrors={planningDateErrors}
              onPlanningDateError={setPlanningDateError}
            />
            <TicketOwnerFields
              form={form}
              isEdit={isEdit}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="ticket-form"
          >
            {isEdit ? "Save changes" : "Create ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
