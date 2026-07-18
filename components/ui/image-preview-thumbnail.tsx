"use client";

import {
  ArrowsCounterClockwiseIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import {
  TransformComponent,
  TransformWrapper,
  useControls,
  useTransformEffect,
} from "react-zoom-pan-pinch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ImagePreviewThumbnailProps {
  alt?: string;
  className?: string;
  src: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 8;

// A thumbnail <img> that opens a larger, zoomable/pannable preview in a
// dialog on click. Used wherever a post/feedback image thumbnail is shown —
// callers keep their own wrapper markup (e.g. a "remove image" button)
// around this.
export function ImagePreviewThumbnail({
  alt = "",
  className,
  src,
}: ImagePreviewThumbnailProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="View larger image"
        className="block w-full cursor-zoom-in rounded-ir-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
        onClick={() => setOpen(true)}
        type="button"
      >
        {/* biome-ignore lint/performance/noImgElement: dynamic S3/R2/local upload or blob preview URL, not known at build time for next/image */}
        <img alt={alt} className={className} src={src} />
      </button>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent
          className="flex h-[85vh] w-[calc(100vw-2rem)] max-w-5xl items-center justify-center overflow-hidden border-none bg-transparent p-0 shadow-none"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          {/* Unmounted while closed so scale/position reset for next open,
              and so the pan/zoom listeners aren't live in the background. */}
          {open && (
            <TransformWrapper
              centerOnInit
              centerZoomedOut
              doubleClick={{ mode: "toggle", step: MAX_SCALE / 2 }}
              initialScale={MIN_SCALE}
              maxScale={MAX_SCALE}
              minScale={MIN_SCALE}
              panning={{ velocityDisabled: true }}
              pinch={{ step: 5 }}
              wheel={{ step: 0.2 }}
            >
              {/* Left un-sized so it (and the library's own wrapper/content
                  divs inside TransformComponent) shrink-wrap the rendered
                  image — that's what keeps the close button and zoom
                  toolbar anchored to the image's own edges instead of the
                  dialog's, no matter the image's aspect ratio. */}
              <div className="relative">
                <TransformComponent>
                  {/* biome-ignore lint/performance/noImgElement: dynamic S3/R2/local upload or blob preview URL, not known at build time for next/image */}
                  <img
                    alt={alt}
                    className="max-h-[80vh] max-w-[calc(100vw-6rem)] rounded-ir-md object-contain"
                    draggable={false}
                    src={src}
                  />
                </TransformComponent>
                <button
                  aria-label="Close preview"
                  className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-ir-full border border-ir-border bg-ir-surface/90 text-ir-heading shadow-ir-sm backdrop-blur-sm transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  <XIcon className="size-4" />
                </button>
                <ZoomControls />
              </div>
            </TransformWrapper>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  const [scale, setScale] = useState(MIN_SCALE);

  useTransformEffect(({ state }) => {
    setScale(state.scale);
  });

  return (
    <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-ir-full border border-ir-border bg-ir-surface/90 p-1 shadow-ir-sm backdrop-blur-sm">
      <button
        aria-label="Zoom out"
        className="flex size-8 items-center justify-center rounded-ir-full text-ir-heading transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 disabled:pointer-events-none disabled:opacity-30"
        disabled={scale <= MIN_SCALE}
        onClick={() => zoomOut()}
        type="button"
      >
        <MagnifyingGlassMinusIcon className="size-4" />
      </button>
      <button
        aria-label="Reset zoom"
        className="flex size-8 items-center justify-center rounded-ir-full text-ir-heading transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 disabled:pointer-events-none disabled:opacity-30"
        disabled={scale <= MIN_SCALE}
        onClick={() => resetTransform()}
        type="button"
      >
        <ArrowsCounterClockwiseIcon className="size-4" />
      </button>
      <button
        aria-label="Zoom in"
        className="flex size-8 items-center justify-center rounded-ir-full text-ir-heading transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 disabled:pointer-events-none disabled:opacity-30"
        disabled={scale >= MAX_SCALE}
        onClick={() => zoomIn()}
        type="button"
      >
        <MagnifyingGlassPlusIcon className="size-4" />
      </button>
    </div>
  );
}
