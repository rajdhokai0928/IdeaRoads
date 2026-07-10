"use client";

import "quill/dist/quill.snow.css";
import { useEffect, useRef, useState } from "react";

type QuillInstance = InstanceType<typeof import("quill").default>;

interface QuillEditorProps {
  disabled?: boolean;
  minHeight?: number;
  onChange: (html: string, text: string) => void;
  // Opt-in: when provided, pressing Enter (without Shift) calls this instead of
  // inserting a newline. Shift+Enter still inserts a newline. Used by comments.
  onSubmit?: () => void;
  // Opt-in: enables the image toolbar button + drag&drop + paste. Receives a
  // file and returns the hosted URL (or null on failure). Reuses the caller's
  // upload/storage logic — the editor only inserts the returned URL.
  onUploadingChange?: (uploading: boolean) => void;
  placeholder?: string;
  uploadImage?: (file: File) => Promise<string | null>;
  value: string;
}

export default function QuillEditor({
  value,
  onChange,
  onSubmit,
  uploadImage,
  onUploadingChange,
  placeholder = "Write something…",
  disabled = false,
  minHeight = 80,
}: QuillEditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillInstance | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  const uploadImageRef = useRef(uploadImage);
  uploadImageRef.current = uploadImage;
  const onUploadingChangeRef = useRef(onUploadingChange);
  onUploadingChangeRef.current = onUploadingChange;

  const [uploadingCount, setUploadingCount] = useState(0);

  // Upload a file through the caller's uploader and insert it at the cursor.
  async function uploadAndInsert(quill: QuillInstance, file: File) {
    const upload = uploadImageRef.current;
    if (!upload) {
      return;
    }
    setUploadingCount((c) => {
      if (c === 0) {
        onUploadingChangeRef.current?.(true);
      }
      return c + 1;
    });
    try {
      const url = await upload(file);
      if (url) {
        const range = quill.getSelection(true) ?? { index: quill.getLength() };
        quill.insertEmbed(range.index, "image", url, "user");
        quill.setSelection(range.index + 1, 0, "user");
      }
    } finally {
      setUploadingCount((c) => {
        const next = Math.max(0, c - 1);
        if (next === 0) {
          onUploadingChangeRef.current?.(false);
        }
        return next;
      });
    }
  }

  function pickAndUpload(quill: QuillInstance) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.multiple = true;
    input.onchange = () => {
      for (const file of Array.from(input.files ?? [])) {
        uploadAndInsert(quill, file);
      }
    };
    input.click();
  }

  // Quill is initialized exactly once on mount; latest props/callbacks are read via refs.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only init
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    // Fresh inner div each mount so Strict Mode's double-mount can't reuse a div
    // that already has Quill's DOM on it.
    const editorDiv = document.createElement("div");
    wrapper.appendChild(editorDiv);
    const cleanups: (() => void)[] = [];

    import("quill").then(({ default: Quill }) => {
      if (!document.contains(editorDiv) || quillRef.current) {
        return;
      }

      const withImages = !!uploadImageRef.current;
      const toolbarContainer = [
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["link"],
        ...(withImages ? [["image"]] : []),
        ["clean"],
      ];

      const quill = new Quill(editorDiv, {
        theme: "snow",
        placeholder,
        modules: {
          toolbar: {
            container: toolbarContainer,
            handlers: withImages ? { image: () => pickAndUpload(quill) } : {},
          },
        },
      });

      quillRef.current = quill;

      if (value && value !== "<p><br></p>") {
        quill.root.innerHTML = value;
      }

      quill.on("text-change", () => {
        const html = quill.root.innerHTML;
        const text = quill.getText().trim();
        onChangeRef.current(html === "<p><br></p>" ? "" : html, text);
      });

      if (disabled) {
        quill.disable();
      }

      // Enter-to-submit: capture phase so we beat Quill's own newline handler.
      // Shift+Enter (and IME composition) fall through to the default newline.
      if (onSubmitRef.current) {
        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            e.stopPropagation();
            onSubmitRef.current?.();
          }
        };
        quill.root.addEventListener("keydown", onKeyDown, true);
        cleanups.push(() =>
          quill.root.removeEventListener("keydown", onKeyDown, true)
        );
      }

      // Drag & drop + paste of images.
      if (withImages) {
        const imageFiles = (list?: FileList | null) =>
          Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));

        const onDrop = (e: DragEvent) => {
          const files = imageFiles(e.dataTransfer?.files);
          if (files.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            for (const file of files) {
              uploadAndInsert(quill, file);
            }
          }
        };
        const onPaste = (e: ClipboardEvent) => {
          const files = imageFiles(e.clipboardData?.files);
          if (files.length > 0) {
            e.preventDefault();
            for (const file of files) {
              uploadAndInsert(quill, file);
            }
          }
        };
        quill.root.addEventListener("drop", onDrop, true);
        quill.root.addEventListener("paste", onPaste, true);
        cleanups.push(() => {
          quill.root.removeEventListener("drop", onDrop, true);
          quill.root.removeEventListener("paste", onPaste, true);
        });
      }
    });

    return () => {
      quillRef.current = null;
      for (const fn of cleanups) {
        fn();
      }
      wrapper.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync disabled state after init.
  useEffect(() => {
    if (!quillRef.current) {
      return;
    }
    if (disabled) {
      quillRef.current.disable();
    } else {
      quillRef.current.enable();
    }
  }, [disabled]);

  return (
    <div
      className="relative rounded-ir-input border border-ir-border bg-ir-surface focus-within:ring-2 focus-within:ring-ir-primary/40"
      style={{ ["--ql-min-height" as string]: `${minHeight}px` }}
    >
      <div
        className={disabled ? "pointer-events-none opacity-50" : ""}
        ref={wrapperRef}
      />
      {uploadingCount > 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-ir-input bg-ir-surface/60 text-xs font-medium text-ir-muted">
          Uploading image…
        </div>
      )}
    </div>
  );
}
