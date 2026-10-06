"use client";

/**
 * Vitrine du restaurant : logo, bannière, description et coordonnées.
 * ---------------------------------------------------------------------------
 * Les images partent vers Vercel Blob (`/api/upload?dossier=logo|banniere`) ;
 * si le stockage n'est pas configuré, on propose de coller une adresse
 * d'image — l'application reste utilisable sans Blob.
 */
import { Image as ImageIcon, Link2, Save, Trash2, Upload } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { Bouton } from "@/components/ui/bouton";
import { Champ, Entree, ZoneTexte } from "@/components/ui/champ";
import { Alerte } from "@/components/ui/divers";
import { useToasts } from "@/components/ui/toast";
import { enregistrerVitrine } from "@/lib/actions/catalogue";
import { etatInitial } from "@/lib/actions/etat";

export type VitrineAffichee = {
  logo: string | null;
  banniere: string | null;
  description: string | null;
  adresse: string | null;
  adresseComplement: string | null;
  codePostal: string | null;
  ville: string | null;
  telephone: string | null;
};

export function FormulaireVitrine({
  vitrine,
  stockageImages,
}: {
  vitrine: VitrineAffichee;
  /** true si Vercel Blob est configuré (sinon, on privilégie l'adresse d'image). */
  stockageImages: boolean;
}) {
  const { notifier } = useToasts();
  const [etat, action, enCours] = useActionState(enregistrerVitrine, etatInitial);

  const [logo, setLogo] = useState(vitrine.logo ?? "");
  const [banniere, setBanniere] = useState(vitrine.banniere ?? "");
  const [televersement, setTeleversement] = useState<"logo" | "banniere" | null>(null);
  const champLogo = useRef<HTMLInputElement>(null);
  const champBanniere = useRef<HTMLInputElement>(null);
  const dejaSignale = useRef<typeof etat | null>(null);

  useEffect(() => {
    if (!etat.message || dejaSignale.current === etat) return;
    dejaSignale.current = etat;
    notifier({
      titre: etat.ok ? "Vitrine enregistrée" : "Enregistrement impossible",
      description: etat.message,
      ton: etat.ok ? "succes" : "erreur",
    });
  }, [etat, notifier]);

  async function televerser(cible: "logo" | "banniere", fichier: File) {
    setTeleversement(cible);
    try {
      const donnees = new FormData();
      donnees.append("fichier", fichier);
      donnees.append("dossier", cible);
      const reponse = await fetch("/api/upload", { method: "POST", body: donnees });
      const resultat = (await reponse.json()) as { url?: string; erreur?: string };
      if (!reponse.ok || !resultat.url) {
        notifier({
          titre: "Image non téléversée",
          description: resultat.erreur,
          ton: "alerte",
        });
        return;
      }
      if (cible === "logo") setLogo(resultat.url);
      else setBanniere(resultat.url);
      notifier({
        titre: cible === "logo" ? "Logo prêt" : "Bannière prête",
        description: "Pensez à enregistrer pour publier.",
        ton: "succes",
      });
    } catch {
      notifier({
        titre: "Image non téléversée",
        description: "Vérifiez votre connexion puis réessayez.",
        ton: "erreur",
      });
    } finally {
      setTeleversement(null);
      if (champLogo.current) champLogo.current.value = "";
      if (champBanniere.current) champBanniere.current.value = "";
    }
  }

  const erreurs = etat.erreurs ?? {};

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="logo" value={logo} />
      <input type="hidden" name="banniere" value={banniere} />

      {etat.message ? (
        <Alerte ton={etat.ok ? "succes" : "erreur"} titre={etat.ok ? "Enregistré" : "À corriger"}>
          {etat.message}
        </Alerte>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        {/* ------------------------------- Logo ------------------------------- */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Logo</p>
          <div className="flex items-center gap-3">
            <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Logo du restaurant" className="size-full object-contain p-1.5" />
              ) : (
                <ImageIcon className="size-6 text-slate-400" aria-hidden />
              )}
            </span>
            <div className="space-y-2">
              <input
                ref={champLogo}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  const fichier = e.target.files?.[0];
                  if (fichier) void televerser("logo", fichier);
                }}
              />
              <Bouton
                type="button"
                variante="contour"
                taille="sm"
                icone={<Upload className="size-4" aria-hidden />}
                chargement={televersement === "logo"}
                onClick={() => champLogo.current?.click()}
              >
                Téléverser
              </Bouton>
              {logo ? (
                <Bouton
                  type="button"
                  variante="fantome"
                  taille="sm"
                  icone={<Trash2 className="size-4" aria-hidden />}
                  onClick={() => setLogo("")}
                >
                  Retirer
                </Bouton>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Affiché en haut de votre carte, sur la page de suivi des commandes et au centre de vos
            QR codes.{" "}
            {stockageImages
              ? ""
              : "Stockage d'images non configuré sur ce serveur : utilisez une adresse d'image."}
          </p>
          <details className="text-xs">
            <summary className="flex cursor-pointer items-center gap-1 font-semibold text-slate-500 hover:text-marque-600 dark:text-slate-400">
              <Link2 className="size-3.5" aria-hidden />
              Utiliser une adresse d&apos;image
            </summary>
            <Entree
              className="mt-2"
              placeholder="https://exemple.com/logo.png"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              erreur={Boolean(erreurs.logo)}
            />
          </details>
        </div>

        {/* ----------------------------- Bannière ----------------------------- */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bannière</p>
          <div className="overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            {banniere ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banniere} alt="Bannière du restaurant" className="h-20 w-full object-cover" />
            ) : (
              <span className="flex h-20 items-center justify-center text-xs text-slate-400">
                Photo d&apos;ambiance (salle, plat signature…) — 1600 × 600 px conseillé
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              ref={champBanniere}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                const fichier = e.target.files?.[0];
                if (fichier) void televerser("banniere", fichier);
              }}
            />
            <Bouton
              type="button"
              variante="contour"
              taille="sm"
              icone={<Upload className="size-4" aria-hidden />}
              chargement={televersement === "banniere"}
              onClick={() => champBanniere.current?.click()}
            >
              Téléverser
            </Bouton>
            {banniere ? (
              <Bouton
                type="button"
                variante="fantome"
                taille="sm"
                icone={<Trash2 className="size-4" aria-hidden />}
                onClick={() => setBanniere("")}
              >
                Retirer
              </Bouton>
            ) : null}
          </div>
          <details className="text-xs">
            <summary className="flex cursor-pointer items-center gap-1 font-semibold text-slate-500 hover:text-marque-600 dark:text-slate-400">
              <Link2 className="size-3.5" aria-hidden />
              Utiliser une adresse d&apos;image
            </summary>
            <Entree
              className="mt-2"
              placeholder="https://exemple.com/salle.jpg"
              value={banniere}
              onChange={(e) => setBanniere(e.target.value)}
              erreur={Boolean(erreurs.banniere)}
            />
          </details>
        </div>
      </div>

      <Champ
        label="Présentation courte"
        htmlFor="vitrine-description"
        aide="Deux phrases affichées sous le nom de votre établissement sur la carte publique."
        erreur={erreurs.description}
      >
        <ZoneTexte
          id="vitrine-description"
          name="description"
          rows={3}
          maxLength={280}
          defaultValue={vitrine.description ?? ""}
          placeholder="Maquis familial depuis 1998. Poisson braisé, attiéké et jus de bissap maison."
        />
      </Champ>

      <div className="grid gap-4 sm:grid-cols-2">
        <Champ label="Adresse" htmlFor="vitrine-adresse" erreur={erreurs.adresse}>
          <Entree
            id="vitrine-adresse"
            name="adresse"
            defaultValue={vitrine.adresse ?? ""}
            placeholder="Rue du Commerce"
          />
        </Champ>

        <Champ
          label="Complément d'adresse"
          htmlFor="vitrine-complement"
          aide="Quartier, repère, étage…"
          erreur={erreurs.adresseComplement}
        >
          <Entree
            id="vitrine-complement"
            name="adresseComplement"
            defaultValue={vitrine.adresseComplement ?? ""}
            placeholder="Face à la pharmacie du Plateau"
          />
        </Champ>

        <Champ label="Ville" htmlFor="vitrine-ville" erreur={erreurs.ville}>
          <Entree id="vitrine-ville" name="ville" defaultValue={vitrine.ville ?? ""} placeholder="Abidjan" />
        </Champ>

        <Champ label="Code postal" htmlFor="vitrine-codepostal" erreur={erreurs.codePostal}>
          <Entree
            id="vitrine-codepostal"
            name="codePostal"
            inputMode="numeric"
            defaultValue={vitrine.codePostal ?? ""}
            placeholder="00225"
          />
        </Champ>

        <Champ
          label="Téléphone affiché sur la carte"
          htmlFor="vitrine-telephone"
          aide="Sert aussi au bouton « Appeler le serveur »."
          erreur={erreurs.telephone}
          className="sm:col-span-2"
        >
          <Entree
            id="vitrine-telephone"
            name="telephone"
            type="tel"
            inputMode="tel"
            defaultValue={vitrine.telephone ?? ""}
            placeholder="+225 07 00 00 00 00"
          />
        </Champ>
      </div>

      <Bouton type="submit" chargement={enCours} icone={<Save className="size-4" aria-hidden />}>
        Enregistrer la vitrine
      </Bouton>
    </form>
  );
}
