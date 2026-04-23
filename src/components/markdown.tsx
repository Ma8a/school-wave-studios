"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Renders Markdown using react-markdown + remark-gfm (tables, strikethrough,
 * task lists). All visual rules live in the `.markdown` class in globals.css
 * so the warm-dark theme tokens apply throughout.
 *
 * Note: react-markdown sanitizes by default — raw HTML in the source is not
 * rendered, which is fine for our use case (one user, their own machine).
 */
export function Markdown({ content, className }: MarkdownProps) {
  if (!content.trim()) {
    return (
      <p className={cn("text-sm italic text-muted-foreground", className)}>
        Nothing here yet.
      </p>
    );
  }
  return (
    <div className={cn("markdown", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
