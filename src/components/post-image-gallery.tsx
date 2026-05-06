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
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-white text-left ring-1 ring-[#ded6ca]"
        >
          <Image src={activeImage} alt={title} fill priority className="object-cover transition duration-300 group-hover:scale-[1.02]" sizes="(max-width: 1024px) 100vw, 58vw" />
          <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg bg-black/75 px-3 py-2 text-sm font-bold text-white">
            <Maximize2 size={16} />
            拡大
          </span>
        </button>

        {images.length > 1 ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative aspect-[4/3] overflow-hidden rounded-lg bg-white ring-1 ${
                  activeIndex === index ? "ring-2 ring-[#e4572e]" : "ring-[#ded6ca]"
                }`}
                aria-label={`${index + 1}枚目の写真を表示`}
              >
                <Image src={image} alt={`${title} ${index + 1}枚目`} fill className="object-cover" sizes="160px" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-lg bg-black/50 text-white hover:bg-black/70"
            aria-label="閉じる"
          >
            <X size={22} />
          </button>
          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => move(-1)}
                className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg bg-black/50 text-white hover:bg-black/70"
                aria-label="前の写真"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg bg-black/50 text-white hover:bg-black/70"
                aria-label="次の写真"
              >
                <ChevronRight size={24} />
              </button>
            </>
          ) : null}
          <div className="relative h-[82vh] w-full max-w-6xl">
            <Image src={activeImage} alt={title} fill className="object-contain" sizes="100vw" />
          </div>
          <p className="mt-4 text-sm font-bold text-white/70">
            {activeIndex + 1} / {images.length}
          </p>
        </div>
      ) : null}
    </>
  );
}
