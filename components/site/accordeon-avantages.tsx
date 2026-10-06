"use client";

/**
 * Liste d'arguments dépliables (type accordéon) accompagnée d'une image.
 * Un seul élément est ouvert à la fois ; le premier l'est par défaut.
 */
import { ChevronDown } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type ElementAccordeon = {
  titre: string;
  texte: string;
};

export function AccordeonAvantages({
  elements,
  image,
  altImage,
  cartouche,
}: {
  elements: ElementAccordeon[];
  image: StaticImageData;
  altImage: string;
  /** Petite carte superposée à l'image. */
  cartouche?: { titre: string; texte: string };
}) {
  const [ouvert, setOuvert] = useState(0);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
      {/* Liste */}
      <div>
        {elements.map((element, index) => {
          const estOuvert = ouvert === index;

          return (
            <div key={element.titre} className="border-b border-slate-200 last:border-0">
              <h3>
                <button
                  type="button"
                  aria-expanded={estOuvert}
                  onClick={() => setOuvert(index)}
                  className="group flex w-full items-center gap-4 py-5 text-left"
                >
                  <span
                    className={cn(
                      "h-8 w-1 shrink-0 rounded-full transition-colors",
                      estOuvert ? "bg-marque-500" : "bg-slate-200 group-hover:bg-slate-300",
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "flex-1 font-titre text-lg font-bold transition-colors",
                      estOuvert ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900",
                    )}
                  >
                    {element.titre}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-5 shrink-0 text-slate-400 transition-transform",
                      estOuvert && "rotate-180 text-marque-500",
                    )}
                    aria-hidden
                  />
                </button>
              </h3>

              <div
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  estOuvert ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <p className="overflow-hidden pl-5 text-slate-600">
                  <span className="block pb-5 leading-relaxed">{element.texte}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image */}
      <div className="relative">
        <div className="overflow-hidden rounded-3xl shadow-xl shadow-slate-900/10">
          <Image
            src={image}
            alt={altImage}
            sizes="(max-width: 1024px) 100vw, 560px"
            className="h-full w-full object-cover"
            placeholder="blur"
          />
        </div>

        {cartouche ? (
          <div className="absolute -bottom-5 left-5 max-w-[15rem] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl sm:left-8">
            <p className="text-xs font-extrabold text-slate-900">{cartouche.titre}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{cartouche.texte}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
