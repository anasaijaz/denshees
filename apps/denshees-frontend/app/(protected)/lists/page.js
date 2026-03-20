"use client";

import { useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import {
  Trash2Icon,
  ChecklistNoteIcon,
  GlobeIcon,
  BuildingBIcon,
} from "mage-icons-react/bulk";
import { PlusIcon, ReloadIcon } from "mage-icons-react/stroke";
import useSWR, { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import Fuse from "fuse.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import fetcher from "@/lib/fetcher";
import { post, remove } from "@/lib/apis";
import { toast } from "sonner";

export default function ListsPage() {
  const { data, error, isLoading } = useSWR("/api/lead-lists", fetcher);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    domain: "",
    company: "",
  });

  const { trigger: triggerCreate, isMutating: isCreating } = useSWRMutation(
    "/api/lead-lists",
    post,
    {
      onSuccess: () => {
        mutate("/api/lead-lists");
        setCreateOpen(false);
        setFormData({ name: "", description: "", domain: "", company: "" });
        toast.success("List created");
      },
      onError: () => toast.error("Failed to create list"),
    },
  );

  const fuseOptions = {
    keys: ["name", "description", "domain", "company"],
    threshold: 0.4,
  };

  const lists = data?.items || [];
  const fuse = new Fuse(lists, fuseOptions);

  const filteredLists =
    searchQuery.trim() === ""
      ? lists
      : fuse.search(searchQuery).map((r) => r.item);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    triggerCreate(formData);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Lists</h1>
          <p className="text-gray-600 mt-1">Manage your lead lists</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Lead List</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. SaaS Companies Q1"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? (
                  <>
                    <ReloadIcon className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create List"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="p-4 border-b border-gray-200">
          <Input
            placeholder="Search lists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block border border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-lg font-medium">Loading lists...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="inline-block border border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-red-50">
              <p className="text-lg font-medium text-red-600">
                Error loading lists
              </p>
            </div>
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-lg">No lists found</p>
            <p className="text-gray-500 mt-1">
              {searchQuery.trim() !== ""
                ? "Try a different search term"
                : "Create your first list to get started"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLists.map((list) => (
              <ListRow key={list.id} list={list} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListRow({ list }) {
  const { trigger: triggerDelete, isMutating: isDeleting } = useSWRMutation(
    `/api/lead-lists/${list.id}`,
    (url) => remove(url, { arg: {} }),
    {
      onSuccess: () => {
        mutate("/api/lead-lists");
        toast.success("List deleted");
      },
      onError: () => toast.error("Failed to delete list"),
    },
  );

  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
      <Link href={`/lists/${list.id}`} className="flex-1 min-w-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <ChecklistNoteIcon className="w-[18px] h-[18px] shrink-0 text-gray-500" />
            <h3 className="font-medium text-sm hover:underline truncate">
              {list.name}
            </h3>
          </div>
          <div className="flex items-center gap-4 ml-[30px]">
            {list.description && (
              <p className="text-xs text-gray-500 truncate max-w-[300px]">
                {list.description}
              </p>
            )}
            {list.domain && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <GlobeIcon className="w-3 h-3" />
                {list.domain}
              </span>
            )}
            {list.company && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <BuildingBIcon className="w-3 h-3" />
                {list.company}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500">
          {DateTime.fromISO(list.updated).toRelative()}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm("Delete this list and all its items?")) {
              triggerDelete();
            }
          }}
          disabled={isDeleting}
          className="text-gray-400 hover:text-red-600"
        >
          {isDeleting ? (
            <ReloadIcon className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2Icon className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
