"use client";

/**
 * Formulaire du profil public du restaurant (page Paramètres).
 *
 * - l'adresse du menu (`slug`) se déduit du nom tant que le propriétaire ne
 *   l'a pas modifiée à la main ;
 * - la disponibilité de l'adresse est vérifiée en direct (anti-collision) ;
 * - la couleur principale est choisie dans une palette ivoirienne ou au
 *   sélecteur libre, avec un aperçu immédiat du menu client.
 */
import { CheckCircle2, ExternalLink, Loader2, Palette, Save } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { ChoixTelephone } from "@/components/formulaires/choix-telephone";
import { Badge } from "@/components/ui/badge";
import { Bouton } from "@/components/ui/bouton";
import { Carte, CarteContenu, CarteEntete } from "@/components/ui/carte";
import { Champ, Entree, Selecteur, ZoneTexte } from "@/components/ui/champ";
import { Alerte } from "@/components/ui/divers";
import { useToasts } from "@/components/ui/toast";
import { enregistrerProfil, verifierSlugAction } from "@/lib/actions/catalogue";
import { etatInitial } from "@/lib/actions/etat";
import { DEVISES } from "@/lib/constants";
import { COULEURS_PROPOSEES, profilRestaurantSchema } from "@/lib/validations/catalogue";
import { cn, contrasteSur, formatTelephone, slugify } from "@/lib/utils";

export type ProfilAffiche = {
  nom: string;
  slug: string;
  adresse: string | null;
  adresseComplement: string | null;
  codePostal: string | null;
  ville: string | null;
  description: string | null;
  horaires: string | null;
  telephone: string | null;
  couleurPrincipale: string;
  devise: string;
};

export function FormulaireProfil({ restaurant }: { restaurant: ProfilAffiche }) {
  const { notifier } = useToasts();
  const [etat, action, enCours] = useActionState(enregistrerProfil, etatInitial);

  const [nom, setNom] = useState(restaurant.nom);
  const [slug, setSlug] = useState(restaurant.slug);
  const [adresse, setAdresse] = useState(restaurant.adresse ?? "");
  const [adresseComplement, setAdresseComplement] = useState(restaurant.adresseComplement ?? "");
  const [codePostal, setCodePostal] = useState(restaurant.codePostal ?? "");
  const [ville, setVille] = useState(restaurant.ville ?? "");
  const [description, setDescription] = useState(restaurant.description ?? "");
  const [horaires, setHoraires] = useState(restaurant.horaires ?? "");
  const [couleur, setCouleur] = useState(restaurant.couleurPrincipale);
  const [devise, setDevise] = useState(restaurant.devise);
  const [erreursLocales, setErreursLocales] = useState<Record<string, string>>({});

  // Le slug suit le nom jusqu'à ce que l'utilisateur le modifie lui-même.
  const [slugModifie, setSlugModifie] = useState(false);
  const [verification, setVerification] = useState<{
    etat: "repos" | "chargement" | "libre" | "occupe" | "invalide";
    message?: string;
  }>({ etat: "repos" });

  const dejaSignale = useRef<unknown>(null);

  useEffect(() => {
    if (!slugModifie) setSlug(slugify(nom));
  }, [nom, slugModifie]);

  // Vérification différée (400 ms) : on n'interroge pas le serveur à chaque frappe.
  useEffect(() => {
    if (!slug || slug === restaurant.slug) {
      setVerification({ etat: "repos" });
      return;
    }
    setVerification({ etat: "chargement" });
    const minuteur = setTimeout(async () => {
      const resultat = await verifierSlugAction(slug);
      setVerification(
        resultat.ok
          ? { etat: "libre", message: "Adresse disponible" }
          : { etat: resultat.message?.includes("réservé") ? "invalide" : "occupe", message: resultat.message },
      );
    }, 400);
    return () => clearTimeout(minuteur);
  }, [slug, restaurant.slug]);

  useEffect(() => {
    if (!etat.ok || dejaSignale.current === etat) return;
    dejaSignale.current = etat;
    notifier({ titre: "Profil enregistré", description: etat.message, ton: "succes" });
  }, [etat, notifier]);

  const erreurs = { ...etat.erreurs, ...erreursLocales };
  const texteSurCouleur = useMemo(() => contrasteSur(couleur), [couleur]);
  const couleurValide = /^#[0-9a-fA-F]{6}$/.test(couleur);

  return (
    <form
      action={action}
      className="space-y-5"
      onSubmit={(evenement) => {
        const analyse = profilRestaurantSchema.safeParse({
          nom,
          slug,
          adresse,
          horaires,
          telephone: restaurant.telephone ?? "",
          couleurPrincipale: couleur,
          devise,
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
            description: Object.values(parChamp).slice(0, 2).join(" "),
            ton: "alerte",
          });
          return;
        }
        setErreursLocales({});
      }}
    >
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* ------------------------------- Coordonnées ------------------------------ */}
        <Carte>
          <CarteEntete
            titre="Identité du restaurant"
            description="Ces informations apparaissent sur votre menu public."
            icone={<CheckCircle2 className="size-4" aria-hidden />}
          />
          <CarteContenu className="space-y-4">
            <Champ label="Nom du restaurant" htmlFor="profil-nom" obligatoire erreur={erreurs.nom}>
              <Entree
                id="profil-nom"
                name="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                maxLength={80}
                erreur={Boolean(erreurs.nom)}
              />
            </Champ>

            <Champ
              label="Adresse de votre menu"
              htmlFor="profil-slug"
              obligatoire
              erreur={erreurs.slug ?? (verification.etat === "occupe" || verification.etat === "invalide" ? verification.message : undefined)}
              aide={`Vos clients y accéderont à l'adresse : mesplats.app/m/${slug || "…"}`}
            >
              <div className="flex items-stretch gap-2">
                <Entree
                  id="profil-slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugModifie(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                  }}
                  maxLength={48}
                  erreur={Boolean(
                    erreurs.slug || verification.etat === "occupe" || verification.etat === "invalide",
                  )}
                />
                <a
                  href={`/m/${restaurant.slug}`}
                  target="_blank"
                  className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  <ExternalLink className="size-4" aria-hidden />
                  Voir
                </a>
              </div>

              <p className="mt-1.5 flex items-center gap-1.5 text-xs">
                {verification.etat === "chargement" ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-slate-400" aria-hidden />
                    <span className="text-slate-500">Vérification de l&apos;adresse…</span>
                  </>
                ) : null}
                {verification.etat === "libre" ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-feuille-600" aria-hidden />
                    <span className="font-semibold text-feuille-700">
                      Adresse disponible : /m/{slug}
                    </span>
                  </>
                ) : null}
                {verification.etat === "repos" ? (
                  <span className="text-slate-500">
                    Vos clients scannent un QR code : l&apos;adresse reste simple à retenir.
                  </span>
                ) : null}
              </p>
            </Champ>

            <Champ
              label="Présentation courte"
              htmlFor="profil-description"
              aide="Deux phrases affichées sous le nom de votre établissement, sur la carte publique."
              erreur={erreurs.description}
            >
              <ZoneTexte
                id="profil-description"
                name="description"
                rows={3}
                maxLength={280}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Maquis familial depuis 1998. Poisson braisé, attiéké et jus de bissap maison."
              />
            </Champ>

            <Champ label="Adresse" htmlFor="profil-adresse" erreur={erreurs.adresse}>
              <Entree
                id="profil-adresse"
                name="adresse"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Rue des Jardins, Cocody — Abidjan"
                maxLength={160}
              />
            </Champ>

            <div className="grid gap-4 sm:grid-cols-3">
              <Champ
                label="Complément"
                htmlFor="profil-complement"
                aide="Quartier, repère…"
                erreur={erreurs.adresseComplement}
              >
                <Entree
                  id="profil-complement"
                  name="adresseComplement"
                  value={adresseComplement}
                  onChange={(e) => setAdresseComplement(e.target.value)}
                  placeholder="Face à la pharmacie"
                  maxLength={120}
                />
              </Champ>

              <Champ label="Ville" htmlFor="profil-ville" erreur={erreurs.ville}>
                <Entree
                  id="profil-ville"
                  name="ville"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="Abidjan"
                  maxLength={60}
                />
              </Champ>

              <Champ label="Code postal" htmlFor="profil-codepostal" erreur={erreurs.codePostal}>
                <Entree
                  id="profil-codepostal"
                  name="codePostal"
                  inputMode="numeric"
                  value={codePostal}
                  onChange={(e) => setCodePostal(e.target.value)}
                  placeholder="00225"
                  maxLength={12}
                />
              </Champ>
            </div>

            <Champ
              label="Horaires d'ouverture"
              htmlFor="profil-horaires"
              aide="Affiché en haut du menu public, ex. « Tous les jours · 11 h – 23 h »."
              erreur={erreurs.horaires}
            >
              <Entree
                id="profil-horaires"
                name="horaires"
                value={horaires}
                onChange={(e) => setHoraires(e.target.value)}
                placeholder="Tous les jours · 11 h – 23 h"
                maxLength={160}
              />
            </Champ>

            <ChoixTelephone
              nomChamp="telephone"
              valeurInitiale={restaurant.telephone ? formatTelephone(restaurant.telephone).replace(/^\+\d+\s/, "") : ""}
              obligatoire={false}
              label="Téléphone du restaurant (facultatif)"
            />

            <Champ label="Devise affichée" htmlFor="profil-devise" erreur={erreurs.devise}>
              <Selecteur
                id="profil-devise"
                name="devise"
                value={devise}
                onChange={(e) => setDevise(e.target.value)}
              >
                {DEVISES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Selecteur>
            </Champ>
          </CarteContenu>
        </Carte>

        {/* --------------------------- Apparence + aperçu --------------------------- */}
        <div className="space-y-5">
          <Carte>
            <CarteEntete
              titre="Couleur de votre marque"
              description="Elle colore votre menu public, vos QR codes et votre back-office."
              icone={<Palette className="size-4" aria-hidden />}
            />
            <CarteContenu className="space-y-4">
              <input type="hidden" name="couleurPrincipale" value={couleur} />
              <div className="flex flex-wrap gap-2">
                {COULEURS_PROPOSEES.map((proposition) => {
                  const active = couleur.toUpperCase() === proposition.valeur;
                  return (
                    <button
                      key={proposition.valeur}
                      type="button"
                      title={proposition.nom}
                      aria-label={`Couleur ${proposition.nom}`}
                      aria-pressed={active}
                      onClick={() => setCouleur(proposition.valeur)}
                      className={cn(
                        "size-10 rounded-xl border-2 transition",
                        active ? "border-slate-900 dark:border-white" : "border-transparent",
                      )}
                      style={{ backgroundColor: proposition.valeur }}
                    />
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <label
                  htmlFor="couleur-libre"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Couleur personnalisée
                </label>
                <input
                  id="couleur-libre"
                  type="color"
                  value={couleurValide ? couleur : "#E4572E"}
                  onChange={(e) => setCouleur(e.target.value.toUpperCase())}
                  className="h-10 w-16 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-700"
                />
                <code className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {couleur}
                </code>
                {!couleurValide ? (
                  <span className="text-xs font-semibold text-rose-600">Format invalide</span>
                ) : null}
              </div>
              {erreurs.couleurPrincipale ? (
                <p role="alert" className="text-sm font-medium text-rose-600">
                  {erreurs.couleurPrincipale}
                </p>
              ) : null}
            </CarteContenu>
          </Carte>

          {/* Aperçu du menu client */}
          <Carte className="overflow-hidden">
            <CarteEntete titre="Aperçu de votre menu" description="Rendu réel côté client." />
            <div className="p-4">
              <div
                className="rounded-2xl px-4 py-3"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${couleur} 0%, color-mix(in srgb, ${couleur} 62%, #1f2937) 100%)`,
                  color: texteSurCouleur,
                }}
              >
                <p className="font-titre text-base font-extrabold">{nom || "Votre restaurant"}</p>
                <p className="text-xs opacity-90">{horaires || "Tous les jours · 11 h – 23 h"}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
                  <span className="rounded-full bg-white/20 px-2 py-0.5">Table 4</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5">
                    {adresse || "Abidjan, Côte d'Ivoire"}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {["Attiéké poisson braisé", "Kedjenou de poulet"].map((plat, index) => (
                  <div
                    key={plat}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                        {plat}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Prix affiché en {devise}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-extrabold" style={{ color: couleur }}>
                      {index === 0 ? `2 500 ${devise}` : `3 000 ${devise}`}
                    </span>
                  </div>
                ))}
                <div
                  className="rounded-xl px-3 py-2 text-center text-sm font-bold"
                  style={{ backgroundColor: couleur, color: texteSurCouleur }}
                >
                  Commander
                </div>
              </div>

              <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                Lien public :{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  /m/{slug || "…"}
                </span>
              </p>
            </div>
          </Carte>
        </div>
      </div>

      {etat.message && !etat.ok ? (
        <Alerte ton="erreur" titre="Enregistrement impossible">
          {etat.message}
        </Alerte>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Bouton
          type="submit"
          chargement={enCours}
          libelleChargement="Enregistrement…"
          icone={<Save className="size-4" aria-hidden />}
        >
          Enregistrer les modifications
        </Bouton>
        {etat.message && etat.ok ? <Badge ton="succes">{etat.message}</Badge> : null}
      </div>
    </form>
  );
}
