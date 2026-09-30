import { useEffect, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";

import { type Priority, type Ticket, type TicketComplexity } from "../types/board";
import { type TicketFormValues, ticketSchema } from "../schemas/ticket";

type PlanningDateField = "startDate" | "dueDate";
export type PlanningDateErrors = Partial<Record<PlanningDateField, string>>;

interface UseTicketFormOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTicket: Ticket | null;
  onSubmit: (values: TicketFormValues) => void;
}

export function useTicketForm({
  open,
  onOpenChange,
  editTicket,
  onSubmit: onSubmitTicket,
}: UseTicketFormOptions) {
  const [planningDateErrors, setPlanningDateErrors] = useState<PlanningDateErrors>({});
  const planningDateErrorsRef = useRef<PlanningDateErrors>({});

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      planningDateErrorsRef.current = {};
      setPlanningDateErrors((errors) => (Object.keys(errors).length === 0 ? errors : {}));
    }
    onOpenChange(nextOpen);
  }

  function setPlanningDateError(field: PlanningDateField, message: string | undefined) {
    const nextErrors = { ...planningDateErrorsRef.current };
    if (message) nextErrors[field] = message;
    else delete nextErrors[field];
    planningDateErrorsRef.current = nextErrors;

    setPlanningDateErrors((errors) => {
      if (errors[field] === message) return errors;
      const nextState = { ...errors };
      if (message) nextState[field] = message;
      else delete nextState[field];
      return nextState;
    });
  }

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      priority: "med" as Priority,
      responsibleName: "",
      branch: null as string | null,
      prUrl: null as string | null,
      startDate: null as string | null,
      dueDate: null as string | null,
      complexity: null as TicketComplexity | null,
    },
    validators: {
      onSubmit: ticketSchema,
    },
    onSubmit: async ({ value }) => {
      if (Object.keys(planningDateErrorsRef.current).length > 0) return;
      onSubmitTicket(value);
      handleOpenChange(false);
    },
  });

  useEffect(() => {
    if (open) {
      planningDateErrorsRef.current = {};
      form.reset(
        editTicket
          ? {
              title: editTicket.title,
              description: editTicket.description,
              priority: editTicket.priority,
              responsibleName: editTicket.responsibleName ?? "",
              branch: editTicket.branch ?? "",
              prUrl: editTicket.prUrl ?? "",
              startDate: editTicket.startDate,
              dueDate: editTicket.dueDate,
              complexity: editTicket.complexity,
            }
          : {
              title: "",
              description: "",
              priority: "med",
              responsibleName: "",
              branch: "",
              prUrl: "",
              startDate: null,
              dueDate: null,
              complexity: null,
            },
      );
    }
  }, [open, editTicket, form]);

  return { form, planningDateErrors, setPlanningDateError, handleOpenChange };
}
