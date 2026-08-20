"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useState } from "react";

export function PostImageGallery({ images, title }: { images: string[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const activeImage = images[activeIndex] ?? images[0];

  function move(delta: number) {
    setActiveIndex((current) => (current + delta + images.length) % images.length);
  }

  return (
    <>
      <div className="min-w-0 grid gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-white text-left ring-1 ring-[#cfd8cf]"
        >
          <Image src={activeImage} alt={title} fill priority className="object-cover transition duration-300 group-hover:scale-[1.02]" sizes="(max-width: 1024px) 100vw, 58vw" />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-black/75 px-2.5 py-1.5 text-xs font-bold text-white sm:bottom-4 sm:right-4 sm:gap-2 sm:px-3 sm:py-2 sm:text-sm">
            <Maximize2 size={16} />
            拡大
          </span>
        </button>

        {images.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto p-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition sm:h-auto sm:w-auto sm:aspect-[4/3] ${
                  activeIndex === index
                    ? "border-[#e4572e] ring-2 ring-[#e4572e]/35"
                    : "border-[#cfd8cf] opacity-65 hover:opacity-100"
                }`}
                aria-label={`${index + 1}枚目の写真を表示`}
                aria-current={activeIndex === index ? "true" : undefined}
              >
                <Image src={image} alt={`${title} ${index + 1}枚目`} fill className="object-cover" sizes="160px" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-2 sm:p-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-lg bg-black/60 text-white hover:bg-black/80 sm:right-4 sm:top-4 sm:h-11 sm:w-11"
            aria-label="閉じる"
          >
            <X size={22} />
          </button>
          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => move(-1)}
                className="absolute left-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg bg-black/60 text-white hover:bg-black/80 sm:left-4 sm:h-12 sm:w-12"
                aria-label="前の写真"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                className="absolute right-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg bg-black/60 text-white hover:bg-black/80 sm:right-4 sm:h-12 sm:w-12"
                aria-label="次の写真"
              >
                <ChevronRight size={28} />
              </button>
            </>
          ) : null}
          <div className="pointer-events-none relative z-0 h-[70vh] w-full max-w-6xl sm:h-[78vh]">
            <Image src={activeImage} alt={title} fill className="object-contain" sizes="100vw" />
          </div>
          <div className="relative z-20 mt-3 grid gap-3">
            <p className="text-center text-sm font-bold text-white/70">
              {activeIndex + 1} / {images.length}
            </p>
            {images.length > 1 ? (
              <div className="flex max-w-[92vw] gap-2 overflow-x-auto p-1">
                {images.map((image, index) => (
                  <button
                    key={`modal-${image}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-14 w-[74px] shrink-0 overflow-hidden rounded-lg border-2 bg-white transition ${
                      activeIndex === index
                        ? "border-[#e4572e] ring-2 ring-[#e4572e]/50"
                        : "border-white/35 opacity-55 hover:opacity-100"
                    }`}
                    aria-label={`${index + 1}枚目の写真を表示`}
                    aria-current={activeIndex === index ? "true" : undefined}
                  >
                    <Image src={image} alt={`${title} ${index + 1}枚目`} fill className="object-cover" sizes="96px" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
