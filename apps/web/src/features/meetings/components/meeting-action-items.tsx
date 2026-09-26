"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  PencilEdit01Icon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createMeetingActionItemAction,
  createTicketFromMeetingActionItemAction,
  deleteMeetingActionItemAction,
  setMeetingActionItemCompletedAction,
  updateMeetingActionItemAction,
} from "../actions";
import type { MeetingActionItemInput } from "../schemas/meeting";
import type { MeetingActionItemWithTicket } from "../types";
import type { Project } from "@/features/dev-board/types/project";

type ActionItemFormValues = Omit<MeetingActionItemInput, "responsibleName"> & {
  responsibleName: string;
};

const EMPTY_FORM: ActionItemFormValues = {
  title: "",
  details: "",
  responsibleName: "",
  dueDate: null,
};

function itemToForm(item: MeetingActionItemWithTicket): ActionItemFormValues {
  return {
    title: item.title,
    details: item.details,
    responsibleName: item.responsibleName ?? "",
    dueDate: item.dueDate,
  };
}

function formatDueDate(value: string): string {
  return format(parseISO(value), "MMM d, yyyy");
}

function ActionItemForm({
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: ActionItemFormValues;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: ActionItemFormValues) => void;
}) {
  const [values, setValues] = useState<ActionItemFormValues>(initial ?? EMPTY_FORM);

  function update<Key extends keyof ActionItemFormValues>(
    key: Key,
    value: ActionItemFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      ...values,
      responsibleName: values.responsibleName.trim(),
      dueDate: values.dueDate || null,
    });
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-none border border-border/70 bg-muted/20 p-4 sm:grid-cols-2"
    >
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="action-title">Next step</Label>
        <Input
          id="action-title"
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="What needs to happen?"
          maxLength={120}
          required
          autoComplete="off"
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="action-details">
          Details <span className="font-normal text-muted-foreground">· optional</span>
        </Label>
        <Textarea
          id="action-details"
          value={values.details}
          onChange={(event) => update("details", event.target.value)}
          placeholder="A little context for whoever picks this up"
          maxLength={2000}
          rows={3}
          className="resize-y"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="action-responsible">
          Responsible <span className="font-normal text-muted-foreground">· optional</span>
        </Label>
        <Input
          id="action-responsible"
          value={values.responsibleName}
          onChange={(event) => update("responsibleName", event.target.value)}
          placeholder="Name"
          maxLength={120}
          autoComplete="off"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="action-due-date">
          Due date <span className="font-normal text-muted-foreground">· optional</span>
        </Label>
        <Input
          id="action-due-date"
          type="date"
          value={values.dueDate ?? ""}
          onChange={(event) => update("dueDate", event.target.value || null)}
        />
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={pending}
        >
          {pending ? "Saving…" : initial ? "Save step" : "Add next step"}
        </Button>
      </div>
    </form>
  );
}

export function MeetingActionItems({
  meetingId,
  projectId,
  projects,
  initialItems,
}: {
  meetingId: string;
  projectId: string | null;
  projects: Project[];
  initialItems: MeetingActionItemWithTicket[];
}) {
  const [items, setItems] = useState(initialItems);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MeetingActionItemWithTicket | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MeetingActionItemWithTicket | null>(null);
  const [conversionTarget, setConversionTarget] = useState<MeetingActionItemWithTicket | null>(
    null,
  );
  const [conversionProjectId, setConversionProjectId] = useState("none");
  const [isPending, startTransition] = useTransition();
  const [isConverting, startConversion] = useTransition();

  function createItem(values: ActionItemFormValues) {
    startTransition(async () => {
      const result = await createMeetingActionItemAction(meetingId, values);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setItems((current) => [...current, { ...result.data, linkedTicket: null }]);
      setShowCreateForm(false);
      toast.success("Next step added.");
    });
  }

  function updateItem(values: ActionItemFormValues) {
    if (!editingItem) return;
    const target = editingItem;
    startTransition(async () => {
      const result = await updateMeetingActionItemAction(target.id, values);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setItems((current) =>
        current.map((item) =>
          item.id === target.id ? { ...result.data, linkedTicket: item.linkedTicket } : item,
        ),
      );
      setEditingItem(null);
      toast.success("Next step updated.");
    });
  }

  function toggleCompleted(item: MeetingActionItemWithTicket, isCompleted: boolean) {
    startTransition(async () => {
      const result = await setMeetingActionItemCompletedAction(item.id, isCompleted);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? { ...candidate, isCompleted: result.data.isCompleted }
            : candidate,
        ),
      );
    });
  }

  function deleteItem() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteMeetingActionItemAction(target.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setItems((current) => current.filter((item) => item.id !== target.id));
      setDeleteTarget(null);
      toast.success(
        target.ticketId
          ? "Next step removed; its ticket remains on Dev Board."
          : "Next step removed.",
      );
    });
  }

  function beginConversion(item: MeetingActionItemWithTicket) {
    if (projectId) {
      convertItem(item, projectId);
      return;
    }
    setConversionProjectId("none");
    setConversionTarget(item);
  }

  function convertItem(item: MeetingActionItemWithTicket, targetProjectId: string) {
    startConversion(async () => {
      const result = await createTicketFromMeetingActionItemAction(item.id, targetProjectId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                ticketId: result.data.id,
                linkedTicket: {
                  id: result.data.id,
                  projectId: result.data.projectId,
                  title: result.data.title,
                  column: result.data.column,
                },
              }
            : candidate,
        ),
      );
      setConversionTarget(null);
      toast.success("Ticket created in Backlog.");
    });
  }

  return (
    <div className="space-y-4">
      {items.length === 0 && !showCreateForm ? (
        <p className="border-l-2 border-border py-2 pl-4 text-sm text-muted-foreground">
          No next steps recorded. Add one when the conversation creates work.
        </p>
      ) : null}
      <ol className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="grid grid-cols-[24px_minmax(0,1fr)] gap-3"
          >
            <div className="relative flex justify-center pt-2 after:absolute after:bottom-0 after:top-6 after:w-px after:bg-border/70 last:after:hidden">
              {item.ticketId ? (
                <span
                  className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary"
                  aria-label="Converted to ticket"
                >
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    strokeWidth={2}
                    className="size-3"
                  />
                </span>
              ) : (
                <Checkbox
                  checked={item.isCompleted}
                  onCheckedChange={(checked) => {
                    if (typeof checked === "boolean") toggleCompleted(item, checked);
                  }}
                  aria-label={`${item.isCompleted ? "Reopen" : "Complete"} ${item.title}`}
                />
              )}
            </div>
            <div className="min-w-0 pb-3">
              {editingItem?.id === item.id ? (
                <ActionItemForm
                  key={item.id}
                  initial={itemToForm(item)}
                  pending={isPending}
                  onCancel={() => setEditingItem(null)}
                  onSubmit={updateItem}
                />
              ) : (
                <div className="group border-b border-border/50 pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`font-medium leading-snug ${item.isCompleted ? "text-muted-foreground line-through" : ""}`}
                      >
                        {item.title}
                      </h3>
                      {item.details ? (
                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                          {item.details}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {item.responsibleName ? (
                          <span>Responsible: {item.responsibleName}</span>
                        ) : null}
                        {item.dueDate ? (
                          <time dateTime={item.dueDate}>Due {formatDueDate(item.dueDate)}</time>
                        ) : null}
                        {item.linkedTicket ? (
                          <Link
                            href={`/dev-board/${item.linkedTicket.projectId}?ticket=${item.linkedTicket.id}`}
                            className="font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {item.linkedTicket.title} ·{" "}
                            {item.linkedTicket.column.replace(/_/g, " ")}
                          </Link>
                        ) : item.ticketId ? (
                          <Badge variant="outline">Ticket linked</Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!item.ticketId ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => beginConversion(item)}
                          disabled={isConverting || item.isCompleted}
                        >
                          Create ticket
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setShowCreateForm(false);
                          setEditingItem(item);
                        }}
                        aria-label={`Edit ${item.title}`}
                      >
                        <HugeiconsIcon
                          icon={PencilEdit01Icon}
                          strokeWidth={2}
                          className="size-3.5"
                        />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(item)}
                        aria-label={`Delete ${item.title}`}
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          strokeWidth={2}
                          className="size-3.5"
                        />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {showCreateForm ? (
        <ActionItemForm
          pending={isPending}
          onCancel={() => setShowCreateForm(false)}
          onSubmit={createItem}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingItem(null);
            setShowCreateForm(true);
          }}
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            className="size-3.5"
          />
          Add next step
        </Button>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent
          onInteractOutside={(event) => event.preventDefault()}
          className="max-w-md sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Remove this next step?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.ticketId
                ? "The meeting entry will be removed, but the linked ticket will remain on Dev Board."
                : "This next step will be removed from the meeting."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={deleteItem}
              disabled={isPending}
            >
              Remove step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={conversionTarget !== null}
        onOpenChange={(open) => !open && setConversionTarget(null)}
      >
        <DialogContent
          onInteractOutside={(event) => event.preventDefault()}
          className="max-w-md sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Choose a project</DialogTitle>
            <DialogDescription>
              This meeting has no project. Choose where the new ticket should live.
            </DialogDescription>
          </DialogHeader>
          {projects.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="conversion-project">Project</Label>
              <Select
                value={conversionProjectId}
                onValueChange={setConversionProjectId}
              >
                <SelectTrigger id="conversion-project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Choose a project…</SelectItem>
                  {projects.map((project) => (
                    <SelectItem
                      key={project.id}
                      value={project.id}
                    >
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Create a project on Dev Board before converting this next step.
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConversionTarget(null)}
            >
              Cancel
            </Button>
            {projects.length === 0 ? (
              <Button asChild>
                <Link href="/dev-board">Open Dev Board</Link>
              </Button>
            ) : (
              <Button
                type="button"
                disabled={conversionProjectId === "none" || isConverting}
                onClick={() =>
                  conversionTarget && convertItem(conversionTarget, conversionProjectId)
                }
              >
                {isConverting ? "Creating…" : "Create ticket"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
