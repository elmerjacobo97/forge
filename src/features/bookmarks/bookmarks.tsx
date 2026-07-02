import { useMemo, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import * as z from "zod"
import {
  ExternalLink,
  Globe,
  Plus,
  Search,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { cn } from "@/lib/utils"

interface DevLink {
  id: string
  title: string
  url: string
  category: "docs" | "git" | "tool" | "article" | "other"
  description: string
  tags: string[]
  createdAt: string
}

const STORAGE_KEY = "forge_bookmarks:v1"

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

const SEED_LINKS: DevLink[] = [
  {
    id: "seed-link-1",
    title: "Tailwind CSS v4 Docs",
    url: "https://tailwindcss.com/docs",
    category: "docs",
    description:
      "Official documentation for Tailwind CSS v4 featuring the new CSS-first configuration and high-performance compiler.",
    tags: ["styling", "css", "tailwind", "v4"],
    createdAt: "2025-06-18T12:00:00.000Z",
  },
  {
    id: "seed-link-2",
    title: "TanStack Router Guides",
    url: "https://tanstack.com/router/v1",
    category: "docs",
    description:
      "Fully type-safe file-based router for React with built-in search param validation and code splitting.",
    tags: ["routing", "react", "tanstack", "type-safe"],
    createdAt: "2025-06-16T12:00:00.000Z",
  },
  {
    id: "seed-link-3",
    title: "shadcn/ui Components",
    url: "https://ui.shadcn.com",
    category: "tool",
    description:
      "Beautifully designed accessible components built with Radix UI and Tailwind CSS that you can copy and paste.",
    tags: ["ui", "components", "radix", "shadcn"],
    createdAt: "2025-06-19T12:00:00.000Z",
  },
]

function getLinks(): DevLink[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_LINKS))
    return SEED_LINKS
  }
  try {
    return JSON.parse(data) as DevLink[]
  } catch {
    return SEED_LINKS
  }
}

function saveLinks(links: DevLink[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
}

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  url: z.string().url("Must be a valid URL."),
  category: z.enum(["docs", "git", "tool", "article", "other"]),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters.")
    .max(200, "Description must be at most 200 characters."),
  tagsString: z.string(),
})

type FormValues = z.infer<typeof formSchema>

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "docs", label: "Docs" },
  { value: "git", label: "Git" },
  { value: "tool", label: "Tools" },
  { value: "article", label: "Articles" },
  { value: "other", label: "Other" },
] as const

const formatErrors = (errors: any[]) => {
  return errors.map((err) => {
    if (typeof err === "string") return { message: err };
    if (err && typeof err === "object" && "message" in err) {
      return { message: String(err.message) };
    }
    return { message: err?.toString() || "Invalid value" };
  });
};

export function Bookmarks() {
  const [links, setLinks] = useState<DevLink[]>(getLinks)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 200)

  const form = useForm({
    defaultValues: {
      title: "",
      url: "",
      category: "docs" as "docs" | "git" | "tool" | "article" | "other",
      description: "",
      tagsString: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      addBookmark(value);
    },
  })

  function addBookmark(data: FormValues) {
    const tags = data.tagsString
      ? data.tagsString.split(",").flatMap((t) => {
          const trimmed = t.trim().toLowerCase()
          return trimmed ? [trimmed] : []
        })
      : []
    const link: DevLink = {
      id: generateId("link"),
      title: data.title,
      url: data.url,
      category: data.category,
      description: data.description,
      tags,
      createdAt: new Date().toISOString(),
    }
    const updated = [link, ...links]
    setLinks(updated)
    saveLinks(updated)
    toast.success("Bookmark added")
    setIsDialogOpen(false)
    form.reset()
  }

  function deleteBookmark(id: string) {
    const updated = links.filter((l) => l.id !== id)
    setLinks(updated)
    saveLinks(updated)
    toast.success("Bookmark deleted")
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return links.filter((link) => {
      const matchesCategory =
        selectedCategory === "all" || link.category === selectedCategory
      const matchesSearch =
        !q ||
        link.title.toLowerCase().includes(q) ||
        link.description.toLowerCase().includes(q) ||
        link.tags.some((t) => t.toLowerCase().includes(q))
      return matchesCategory && matchesSearch
    })
  }, [links, debouncedSearch, selectedCategory])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks…"
            className="h-8 pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                selectedCategory === cat.value
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          className="ml-auto"
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Globe className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No bookmarks found</p>
            <p className="text-xs text-muted-foreground">
              Refine your search or add a new bookmark.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((link) => (
              <div
                key={link.id}
                className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {link.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-heading text-base font-medium leading-snug">
                      {link.title}
                    </h3>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => deleteBookmark(link.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="mt-3 flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {link.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {link.tags.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="text-xs font-mono"
                      >
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(link.url, "_blank")}
                  >
                    Open
                    <ExternalLink className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bookmark</DialogTitle>
            <DialogDescription>
              Save a reference to documentation, repositories, or articles.
            </DialogDescription>
          </DialogHeader>

          <form
            id="form-add-bookmark"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="title"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Tailwind v4 Release Notes"
                        autoComplete="off"
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && (
                        <FieldError errors={formatErrors(field.state.meta.errors)} />
                      )}
                    </Field>
                  );
                }}
              />

              <form.Field
                name="url"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="https://…"
                        type="url"
                        autoComplete="off"
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && (
                        <FieldError errors={formatErrors(field.state.meta.errors)} />
                      )}
                    </Field>
                  );
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="category"
                  children={(field) => (
                    <Field>
                      <FieldLabel>Category</FieldLabel>
                      <Select
                        onValueChange={(val) => field.handleChange(val as FormValues["category"])}
                        value={field.state.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="docs">Docs</SelectItem>
                          <SelectItem value="git">Git Repo</SelectItem>
                          <SelectItem value="tool">Tool</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                <form.Field
                  name="tagsString"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Tags</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="css, react, web"
                      />
                    </Field>
                  )}
                />
              </div>

              <form.Field
                name="description"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                      <InputGroup>
                        <InputGroupTextarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="What is this link about?"
                          rows={2}
                          className="resize-none"
                          aria-invalid={isInvalid}
                        />
                        <InputGroupAddon align="block-end">
                          <InputGroupText className="tabular-nums text-xs">
                            {field.state.value.length}/200
                          </InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                        {isInvalid && (
                          <FieldError errors={formatErrors(field.state.meta.errors)} />
                        )}
                    </Field>
                  );
                }}
              />
            </FieldGroup>
          </form>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                form.reset()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="form-add-bookmark">
              Save Bookmark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
