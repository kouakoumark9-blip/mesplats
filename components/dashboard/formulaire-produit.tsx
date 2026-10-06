"use client";

/**
 * Formulaire d'un plat (création et modification) dans une modale.
 *
 * Points clés :
 *  - validation Zod côté client avant l'envoi (le serveur revalide) ;
 *  - éditeur d'options (suppléments) : ajout, retrait, montant en FCFA ;
 *  - photo : téléversement vers Vercel Blob si disponible, sinon collage d'une
 *    adresse d'image — l'interface s'adapte sans jamais bloquer l'utilisateur ;
 *  - « épuisé » se règle d'un interrupteur, également depuis la liste.
 */
import { ImagePlus, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { PhotoPlat } from "@/components/site/photo-plat";
import { Badge } from "@/components/ui/badge";
import { Bouton } from "@/components/ui/bouton";
import { Champ, Entree, Selecteur, ZoneTexte } from "@/components/ui/champ";
import { Interrupteur } from "@/components/ui/interrupteur";
import { Modale } from "@/components/ui/modale";
import { useToasts } from "@/components/ui/toast";
import { enregistrerProduit } from "@/lib/actions/catalogue";
import { etatInitial } from "@/lib/actions/etat";
import { NOMBRE_OPTIONS_MAX, produitSchema } from "@/lib/validations/catalogue";
import { formatFcfa } from "@/lib/utils";

export type PlatModifiable = {
  id: string;
  categoryId: string;
  nom: string;
  description: string | null;
  prix: number;
  photo: string | null;
  disponible: boolean;
  options: { id: string; nom: string; supplementPrix: number }[];
};

type OptionEditee = { cle: string; nom: string; supplementPrix: number };

function nouvelleOption(): OptionEditee {
  return { cle: Math.random().toString(36).slice(2), nom: "", supplementPrix: 0 };
}

export function FormulaireProduit({
  ouverte,
  onFermer,
  categories,
  devise,
  plat,
  categorieParDefaut,
}: {
  ouverte: boolean;
  onFermer: () => void;
  categories: { id: string; nom: string }[];
  devise: string;
  /** Présent = modification, absent = création. */
  plat?: PlatModifiable | null;
  categorieParDefaut?: string;
}) {
  const { notifier } = useToasts();
  const [etat, action, enCours] = useActionState(enregistrerProduit, etatInitial);

  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [categoryId, setCategoryId] = useState(categorieParDefaut ?? categories[0]?.id ?? "");
  const [photo, setPhoto] = useState("");
  const [disponible, setDisponible] = useState(true);
  const [options, setOptions] = useState<OptionEditee[]>([]);
  const [erreursLocales, setErreursLocales] = useState<Record<string, string>>({});
  const [televersement, setTeleversement] = useState(false);
  const champFichier = useRef<HTMLInputElement>(null);
  const dejaSignale = useRef<unknown>(null);

  // Réinitialisation à chaque ouverture (création) ou chargement du plat édité.
  useEffect(() => {
    if (!ouverte) return;
    setErreursLocales({});
    if (plat) {
      setNom(plat.nom);
      setDescription(plat.description ?? "");
      setPrix(String(plat.prix));
      setCategoryId(plat.categoryId);
      setPhoto(plat.photo ?? "");
      setDisponible(plat.disponible);
      setOptions(
        plat.options.map((option) => ({
          cle: option.id,
          nom: option.nom,
          supplementPrix: option.supplementPrix,
        })),
      );
    } else {
      setNom("");
      setDescription("");
      setPrix("");
      setCategoryId(categorieParDefaut ?? categories[0]?.id ?? "");
      setPhoto("");
      setDisponible(true);
      setOptions([]);
    }
  }, [ouverte, plat, categorieParDefaut, categories]);

  // Fermeture + notification lorsque le serveur a accepté l'enregistrement.
  useEffect(() => {
    if (!etat.ok || dejaSignale.current === etat) return;
    dejaSignale.current = etat;
    notifier({
      titre: plat ? "Plat modifié" : "Plat ajouté",
      description: etat.message,
      ton: "succes",
    });
    onFermer();
  }, [etat, notifier, onFermer, plat]);

  useEffect(() => {
    if (!etat.message || etat.ok) return;
    notifier({ titre: "Enregistrement impossible", description: etat.message, ton: "erreur" });
  }, [etat, notifier]);

  /** Téléverse la photo choisie puis renvoie son adresse publique. */
  async function televerser(fichier: File) {
    setTeleversement(true);
    try {
      const donnees = new FormData();
      donnees.append("fichier", fichier);
      const reponse = await fetch("/api/upload", { method: "POST", body: donnees });
      const resultat = (await reponse.json()) as { url?: string; erreur?: string };
      if (!reponse.ok || !resultat.url) {
        notifier({
          titre: "Photo non téléversée",
          description: resultat.erreur,
          ton: "alerte",
        });
        return;
      }
      setPhoto(resultat.url);
      notifier({ titre: "Photo prête", ton: "succes" });
    } catch {
      notifier({
        titre: "Photo non téléversée",
        description: "Vérifiez votre connexion puis réessayez.",
        ton: "erreur",
      });
    } finally {
      setTeleversement(false);
      if (champFichier.current) champFichier.current.value = "";
    }
  }

  const erreurs = { ...etat.erreurs, ...erreursLocales };

  return (
    <Modale
      ouverte={ouverte}
      onFermer={onFermer}
      titre={plat ? "Modifier le plat" : "Ajouter un plat"}
      description={
        plat
          ? "Les modifications sont visibles immédiatement par vos clients."
          : "Renseignez le nom, le prix et, si vous le souhaitez, une photo et des suppléments."
      }
      taille="lg"
      piedPage={
        <>
          <Bouton variante="contour" onClick={onFermer} type="button">
            Annuler
          </Bouton>
          <Bouton
            type="submit"
            form="formulaire-produit"
            chargement={enCours}
            libelleChargement="Enregistrement…"
            icone={<Plus className="size-4" aria-hidden />}
          >
            {plat ? "Enregistrer les modifications" : "Ajouter au menu"}
          </Bouton>
        </>
      }
    >
      <form
        id="formulaire-produit"
        action={action}
        className="space-y-5"
        onInvalid={() => setErreursLocales({})}
        onSubmit={(evenement) => {
          // 1) Contrôle client (même schéma que le serveur)
          const analyse = produitSchema.safeParse({
            id: plat?.id ?? "",
            categoryId,
            nom,
            description,
            prix: prix === "" ? Number.NaN : Number(prix.replace(/[^\d-]/g, "")),
            photo,
            disponible,
            options: options.map((option) => ({
              nom: option.nom,
              supplementPrix: option.supplementPrix,
            })),
          });

          if (!analyse.success) {
            evenement.preventDefault();
            const parChamp: Record<string, string> = {};
            for (const probleme of analyse.error.issues) {
              const champ = probleme.path.join(".") || "_form";
              if (!(champ in parChamp)) parChamp[champ] = probleme.message;
            }
            setErreursLocales(parChamp);
            notifier({
              titre: "Vérifiez le formulaire",
              description: problemeLisible(parChamp),
              ton: "alerte",
            });
            return;
          }

          setErreursLocales({});
        }}
      >
        <input type="hidden" name="id" value={plat?.id ?? ""} />
        <input type="hidden" name="photo" value={photo} />
        <input type="hidden" name="disponible" value={disponible ? "true" : "false"} />
        <input
          type="hidden"
          name="options"
          value={JSON.stringify(
            options
              .filter((option) => option.nom.trim().length > 0)
              .map((option) => ({
                nom: option.nom.trim(),
                supplementPrix: option.supplementPrix,
              })),
          )}
        />

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <Champ label="Nom du plat" htmlFor="plat-nom" obligatoire erreur={erreurs.nom}>
              <Entree
                id="plat-nom"
                name="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Attiéké poisson braisé"
                maxLength={80}
                erreur={Boolean(erreurs.nom)}
                autoFocus
              />
            </Champ>

            <Champ
              label="Description"
              htmlFor="plat-description"
              aide="Facultatif. Précisez l'accompagnement, la cuisson, la provenance."
              erreur={erreurs.description}
            >
              <ZoneTexte
                id="plat-description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Attiéké frais, poisson braisé entier, oignons et tomates"
                maxLength={280}
                rows={3}
                erreur={Boolean(erreurs.description)}
              />
            </Champ>
          </div>

          <div className="sm:w-40">
            <Champ label="Photo" htmlFor="plat-photo">
              <div className="space-y-2">
                <PhotoPlat
                  src={photo || null}
                  alt={nom || "Photo du plat"}
                  taille={160}
                  className="h-32 w-full rounded-2xl sm:w-40"
                />
                <input
                  ref={champFichier}
                  id="plat-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const fichier = e.target.files?.[0];
                    if (fichier) void televerser(fichier);
                  }}
                />
                <Bouton
                  type="button"
                  variante="contour"
                  taille="sm"
                  pleineLargeur
                  chargement={televersement}
                  libelleChargement="Envoi…"
                  icone={<Upload className="size-4" aria-hidden />}
                  onClick={() => champFichier.current?.click()}
                >
                  {photo ? "Changer" : "Téléverser"}
                </Bouton>
                {photo ? (
                  <button
                    type="button"
                    onClick={() => setPhoto("")}
                    className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 hover:underline"
                  >
                    <X className="size-3.5" aria-hidden />
                    Retirer la photo
                  </button>
                ) : null}
              </div>
            </Champ>
          </div>
        </div>

        <Champ
          label="Adresse d'une image (facultatif)"
          htmlFor="plat-photo-url"
          aide="Collez un lien https://… si vous n'utilisez pas le téléversement."
        >
          <Entree
            id="plat-photo-url"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            placeholder="https://exemple.com/photo-plat.jpg"
          />
        </Champ>

        <div className="grid gap-4 sm:grid-cols-2">
          <Champ
            label={`Prix en ${devise}`}
            htmlFor="plat-prix"
            obligatoire
            erreur={erreurs.prix}
            aide="Nombre entier, sans centimes (ex. 2500)."
          >
            <Entree
              id="plat-prix"
              name="prix"
              type="number"
              inputMode="numeric"
              min={0}
              step={25}
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              placeholder="2500"
              erreur={Boolean(erreurs.prix)}
            />
          </Champ>

          <Champ
            label="Catégorie"
            htmlFor="plat-categorie"
            obligatoire
            erreur={erreurs.categoryId}
          >
            <Selecteur
              id="plat-categorie"
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              erreur={Boolean(erreurs.categoryId)}
            >
              <option value="">Choisir une catégorie…</option>
              {categories.map((categorie) => (
                <option key={categorie.id} value={categorie.id}>
                  {categorie.nom}
                </option>
              ))}
            </Selecteur>
          </Champ>
        </div>

        {categories.length === 0 ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
            Créez d&apos;abord une catégorie (Plats, Boissons, Desserts…) pour y ranger ce plat.
          </p>
        ) : null}

        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-titre text-sm font-bold text-slate-800 dark:text-slate-100">
                Options et suppléments
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ex. « Portion supplémentaire d&apos;attiéké » +500 {devise}, « Piment fort » +100{" "}
                {devise}.
              </p>
            </div>
            <Bouton
              type="button"
              variante="contour"
              taille="sm"
              icone={<Plus className="size-4" aria-hidden />}
              disabled={options.length >= NOMBRE_OPTIONS_MAX}
              onClick={() => setOptions((liste) => [...liste, nouvelleOption()])}
            >
              Ajouter une option
            </Bouton>
          </div>

          {options.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <ImagePlus className="size-4" aria-hidden />
              Aucune option : le plat est commandé tel quel.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {options.map((option, index) => (
                <li key={option.cle} className="flex items-center gap-2">
                  <Entree
                    aria-label={`Nom de l'option ${index + 1}`}
                    value={option.nom}
                    maxLength={40}
                    placeholder="Nom de l'option"
                    onChange={(e) =>
                      setOptions((liste) =>
                        liste.map((o) =>
                          o.cle === option.cle ? { ...o, nom: e.target.value } : o,
                        ),
                      )
                    }
                  />
                  <div className="flex w-32 shrink-0 items-center gap-1">
                    <Entree
                      aria-label={`Supplément de l'option ${index + 1}`}
                      type="number"
                      min={0}
                      step={25}
                      value={option.supplementPrix}
                      onChange={(e) =>
                        setOptions((liste) =>
                          liste.map((o) =>
                            o.cle === option.cle
                              ? { ...o, supplementPrix: Number(e.target.value) || 0 }
                              : o,
                          ),
                        )
                      }
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`Supprimer l'option ${index + 1}`}
                    onClick={() => setOptions((liste) => liste.filter((o) => o.cle !== option.cle))}
                    className="rounded-xl border border-slate-200 p-2.5 text-rose-600 transition hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {options.some((option) => option.nom.trim().length === 0) ? (
            <p className="mt-2 text-xs font-semibold text-amber-700">
              Nommez chaque option, sinon elle sera ignorée à l&apos;enregistrement.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
          <Interrupteur
            actif={disponible}
            onChange={setDisponible}
            labelActif="Disponible à la commande"
            labelInactif="Épuisé aujourd'hui"
          />
          <div className="flex items-center gap-2">
            {prix && Number.isFinite(Number(prix)) ? (
              <Badge ton="marque">
                Prix affiché : {formatFcfa(Number(prix.replace(/[^\d]/g, "")) || 0, devise)}
              </Badge>
            ) : null}
            {enCours ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Enregistrement…
              </span>
            ) : null}
          </div>
        </div>
      </form>
    </Modale>
  );
}

/** Message court résumant les erreurs de validation. */
function problemeLisible(erreurs: Record<string, string>): string {
  const messages = Object.values(erreurs);
  return messages.slice(0, 2).join(" ");
}
