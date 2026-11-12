"use client";

import { useParams } from "next/navigation";
import { StoryEditor } from "@/components/story/editor/story-editor";

export default function StoryEditorPage() {
  const { id } = useParams() as { id: string };
  return (
    <div className="absolute inset-0">
      <StoryEditor storyId={id} />
    </div>
  );
}
