"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updatePostCategoryAction } from "@/app/actions/categories";
import { CategoryChip } from "@/components/categories/category-chip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  color: string;
  id: string;
  name: string;
}

interface CategorySelectProps {
  canEdit: boolean;
  categories: Category[];
  currentCategoryId: string | null;
  postId: string;
  workspaceId: string;
}

export default function CategorySelect({
  postId,
  workspaceId,
  currentCategoryId,
  canEdit,
  categories,
}: CategorySelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const current = categories.find((c) => c.id === currentCategoryId) ?? null;

  function handleChange(value: string) {
    const categoryId = value === "none" ? null : value;
    if (categoryId === currentCategoryId) {
      return;
    }
    startTransition(async () => {
      await updatePostCategoryAction({ postId, workspaceId, categoryId });
      router.refresh();
    });
  }

  // Read-only view (non-admins): show the chip only when a category is set.
  if (!canEdit) {
    return current ? (
      <CategoryChip color={current.color} name={current.name} size="xs" />
    ) : null;
  }

  return (
    <Select
      disabled={isPending}
      onValueChange={handleChange}
      value={currentCategoryId ?? "none"}
    >
      <SelectTrigger
        className="h-auto gap-1.5 rounded-xs border-0 bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
        size="sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No category</SelectItem>
        {categories.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
