"use client";

/**
 * Gestion des tables et des QR codes.
 *
 * ┌─ Ce que fait cet écran ──────────────────────────────────────────────────┐
 * │ • création de plusieurs tables d'un coup (numérotation automatique)      │
 * │ • affichage du QR code de chaque table, prêt à imprimer                  │
 * │ • téléchargement PNG haute résolution (1024 px)                          │
 * │ • planche PDF A4 (2 colonnes × 4 rangées) avec une carte par table        │
 * │ • QR « À emporter » pour la vitrine ou le comptoir                        │
 * │ • renommage et suppression, avec confirmation                            │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Le QR code affiché provient du serveur (SVG net et léger) ; les exports PNG
 * et PDF sont produits dans le navigateur avec la bibliothèque `qrcode` et
 * `jspdf` : aucune requête supplémentaire, l'export fonctionne même hors ligne.
 */
import {
  Copy,
  Download,
  ExternalLink,
  FileText,
  LayoutGrid,
  Pencil,
  Printer,
  QrCode,
  Smartphone,
  Sparkles,
  Table2,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Bouton } from "@/components/ui/bouton";
import { Carte, CarteContenu, CarteEntete } from "@/components/ui/carte";
import { Champ, Entree } from "@/components/ui/champ";
import { Alerte, EtatVide } from "@/components/ui/divers";
import { Modale } from "@/components/ui/modale";
import { useToasts } from "@/components/ui/toast";
import { etatInitial } from "@/lib/actions/etat";
import {
  creerTablesLot,
  renommerTable,
  supprimerTable,
  supprimerToutesLesTables,
  type ResultatAction,
} from "@/lib/actions/tables";

export type TableAffichee = {
  id: string;
  numero: string;
  url: string;
  /** QR code rendu par le serveur (balisage SVG). */
  qrSvg: string;
};

/* -------------------------------------------------------------------------- */
/*                        Fabrication des images QR                          */
/* -------------------------------------------------------------------------- */

/** PNG haute résolution (1024 px) du QR code, généré dans le navigateur. */
async function qrPng(texte: string, taille = 1024): Promise<string> {
  const { default: QRCode } = await import("qrcode");
  return QRCode.toDataURL(texte, {
    margin: 2,
    width: taille,
    errorCorrectionLevel: "M",
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}

function telecharger(nomFichier: string, contenu: string) {
  const lien = document.createElement("a");
  lien.href = contenu;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
}

/* -------------------------------------------------------------------------- */
/*                                  Écran                                     */
/* -------------------------------------------------------------------------- */

export function GestionTables({
  tables: tablesServeur,
  nomRestaurant,
  slug,
  urlEmporter,
  qrSvgEmporter,
  limiteTables,
  plan,
}: {
  tables: TableAffichee[];
  nomRestaurant: string;
  slug: string;
  urlEmporter: string;
  qrSvgEmporter: string;
  /** null = plan Pro (tables illimitées). */
  limiteTables: number | null;
  plan: string;
}) {
  const router = useRouter();
  const { notifier } = useToasts();
  const [enTransition, demarrer] = useTransition();

  const [tables, setTables] = useState(tablesServeur);
  const [modaleLot, setModaleLot] = useState(false);
  const [renommage, setRenommage] = useState<TableAffichee | null>(null);
  const [suppression, setSuppression] = useState<
    { type: "table"; table: TableAffichee } | { type: "toutes" } | null
  >(null);
  const [exportEnCours, setExportEnCours] = useState<"png" | "pdf" | null>(null);

  useEffect(() => setTables(tablesServeur), [tablesServeur]);

  const limiteAtteinte = limiteTables !== null && tables.length >= limiteTables;

  /* --------------------------- Actions génériques --------------------------- */

  function executer(
    action: () => Promise<ResultatAction>,
    options: { optimiste?: () => void; retour?: () => void } = {},
  ) {
    options.optimiste?.();
    demarrer(async () => {
      const resultat = await action();
      if (resultat.ok) {
        notifier({ titre: resultat.message ?? "C'est fait", ton: "succes" });
        router.refresh();
      } else {
        options.retour?.();
        notifier({
          titre: "Action impossible",
          description: resultat.message,
          ton: "erreur",
        });
      }
    });
  }

  async function copierLien(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      notifier({ titre: "Lien copié", description: url, ton: "succes" });
    } catch {
      notifier({
        titre: "Copie impossible",
        description: "Votre navigateur a bloqué le presse-papiers. Sélectionnez le lien à la main.",
        ton: "alerte",
      });
    }
  }

  /* ------------------------------- Export PNG ------------------------------- */

  async function telechargerPng(nom: string, url: string) {
    setExportEnCours("png");
    try {
      telecharger(nom, await qrPng(url));
      notifier({ titre: "PNG téléchargé", description: nom, ton: "succes" });
    } catch {
      notifier({
        titre: "Export impossible",
        description: "Réessayez dans un instant.",
        ton: "erreur",
      });
    } finally {
      setExportEnCours(null);
    }
  }

  /* ------------------------------- Export PDF ------------------------------- */

  /**
   * Planche A4 prête à photocopier : 8 cartes par page (2 colonnes × 4 rangées),
   * chaque carte portant le nom du restaurant, le numéro de table, le QR code
   * et l'adresse du menu. Le QR « À emporter » ferme la planche.
   */
  async function telechargerPdf() {
    setExportEnCours("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      // `compress: true` est indispensable : sans lui, jsPDF embarque les images
      // en RVB brut et une planche de 8 cartes pèse ~6 Mo, impossible à envoyer
      // sur WhatsApp depuis un restaurant en 3G.
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      });

      const LARGEUR = 210;
      const HAUTEUR = 297;
      const MARGE = 10;
      const COLONNES = 2;
      const RANGEES = 4;
      const ESPACE = 4;
      const largeurCarte = (LARGEUR - MARGE * 2 - ESPACE * (COLONNES - 1)) / COLONNES;
      const hauteurCarte = (HAUTEUR - MARGE * 2 - ESPACE * (RANGEES - 1)) / RANGEES;
      const parPage = COLONNES * RANGEES;

      const cartes = [
        ...tables.map((table) => ({ titre: `Table ${table.numero}`, url: table.url })),
        { titre: "À emporter", url: urlEmporter },
      ];

      const images = await Promise.all(cartes.map((carte) => qrPng(carte.url, 600)));

      cartes.forEach((carte, index) => {
        const position = index % parPage;
        if (index > 0 && position === 0) pdf.addPage();

        const colonne = position % COLONNES;
        const rangee = Math.floor(position / COLONNES);
        const x = MARGE + colonne * (largeurCarte + ESPACE);
        const y = MARGE + rangee * (hauteurCarte + ESPACE);

        // Cadre de découpe
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(x, y, largeurCarte, hauteurCarte, 3, 3);

        // Nom du restaurant
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(nomRestaurant, x + largeurCarte / 2, y + 7, { align: "center" });

        // Numéro de table
        pdf.setFontSize(carte.titre.length > 12 ? 15 : 19);
        pdf.setTextColor(15, 23, 42);
        pdf.text(carte.titre, x + largeurCarte / 2, y + 17, { align: "center" });

        // QR code centré
        const cote = Math.min(largeurCarte - 34, hauteurCarte - 34);
        pdf.addImage(
          images[index],
          "PNG",
          x + (largeurCarte - cote) / 2,
          y + 21,
          cote,
          cote,
        );

        // Consigne et lien court
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          "Scannez avec l'appareil photo pour commander",
          x + largeurCarte / 2,
          y + 21 + cote + 5,
          { align: "center" },
        );
        pdf.setFontSize(6.5);
        pdf.setTextColor(148, 163, 184);
        pdf.text(
          carte.url.replace(/^https?:\/\//, ""),
          x + largeurCarte / 2,
          y + 21 + cote + 9,
          { align: "center" },
        );
      });

      pdf.save(`qr-codes-${slug}.pdf`);
      notifier({
        titre: "Planche PDF téléchargée",
        description: `${cartes.length} carte(s), prête(s) à imprimer en A4.`,
        ton: "succes",
      });
    } catch {
      notifier({
        titre: "Export impossible",
        description: "Réessayez dans un instant.",
        ton: "erreur",
      });
    } finally {
      setExportEnCours(null);
    }
  }

  /* --------------------------------- Rendu --------------------------------- */

  return (
    <div className="space-y-5">
      {/* Bandeau de limite du plan */}
      {limiteAtteinte && limiteTables !== null ? (
        <Alerte
          ton="alerte"
          titre={`Limite du plan Gratuit atteinte (${tables.length}/${limiteTables} tables)`}
          icone={<TriangleAlert className="size-5" aria-hidden />}
        >
          Passez au plan Pro pour des tables illimitées.{" "}
          <Link className="font-bold underline" href="/dashboard/parametres#plan">
            Voir les options
          </Link>
        </Alerte>
      ) : null}

      {/* Barre d'outils */}
      <Carte className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge ton="neutre" icone={<LayoutGrid className="size-3.5" aria-hidden />}>
            {tables.length} table{tables.length > 1 ? "s" : ""}
            {limiteTables !== null ? ` / ${limiteTables}` : ""}
          </Badge>
          <Badge ton="succes" icone={<QrCode className="size-3.5" aria-hidden />}>
            {tables.length + 1} QR code{tables.length + 1 > 1 ? "s" : ""}
          </Badge>
          {enTransition || exportEnCours ? (
            <span className="text-xs font-semibold text-slate-400">
              {exportEnCours === "pdf" ? "Préparation du PDF…" : "Traitement…"}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Bouton
            variante="contour"
            icone={<Printer className="size-4" aria-hidden />}
            disabled={tables.length === 0}
            onClick={() => window.open("/dashboard/tables/impression", "_blank")}
          >
            Imprimer la planche
          </Bouton>
          <Bouton
            variante="contour"
            chargement={exportEnCours === "pdf"}
            icone={<FileText className="size-4" aria-hidden />}
            disabled={tables.length === 0}
            onClick={() => void telechargerPdf()}
          >
            PDF (A4)
          </Bouton>
          <Bouton
            icone={<Table2 className="size-4" aria-hidden />}
            disabled={limiteAtteinte}
            onClick={() => setModaleLot(true)}
          >
            Ajouter des tables
          </Bouton>
        </div>
      </Carte>

      {/* État vide */}
      {tables.length === 0 ? (
        <EtatVide
          icone={<Table2 className="size-6" aria-hidden />}
          titre="Aucune table pour l'instant"
          description="Indiquez combien de tables compte votre salle : AfriMenu crée les numéros et génère un QR code unique pour chacune. Vous pourrez ensuite imprimer la planche A4 et la poser sur les tables."
          action={
            <Bouton
              icone={<Sparkles className="size-4" aria-hidden />}
              onClick={() => setModaleLot(true)}
            >
              Créer mes tables
            </Bouton>
          }
        />
      ) : null}

      {/* Grille des tables */}
      {tables.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <Carte key={table.id} className="flex min-w-0 flex-col overflow-hidden p-4">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-titre text-lg font-extrabold text-slate-900 dark:text-white">
                    Table {table.numero}
                  </p>
                  <p
                    className="truncate font-mono text-[11px] text-slate-400"
                    title={table.url}
                  >
                    {table.url.replace(/^https?:\/\//, "")}
                  </p>
                </div>
                <Badge ton="marque" icone={<QrCode className="size-3.5" aria-hidden />}>
                  QR
                </Badge>
              </div>

              <div className="mt-3 flex items-center justify-center rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <span
                  role="img"
                  aria-label={`QR code de la table ${table.numero} du restaurant ${nomRestaurant}`}
                  className="block size-40 [&>svg]:size-full"
                  dangerouslySetInnerHTML={{ __html: table.qrSvg }}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Bouton
                  variante="contour"
                  taille="sm"
                  chargement={exportEnCours === "png"}
                  icone={<Download className="size-4" aria-hidden />}
                  onClick={() =>
                    void telechargerPng(`qr-table-${table.numero.replace(/\s+/g, "-")}.png`, table.url)
                  }
                >
                  PNG
                </Bouton>
                <Bouton
                  variante="contour"
                  taille="sm"
                  icone={<Copy className="size-4" aria-hidden />}
                  onClick={() => void copierLien(table.url)}
                >
                  Copier le lien
                </Bouton>
                <button
                  type="button"
                  aria-label={`Renommer la table ${table.numero}`}
                  onClick={() => setRenommage(table)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Supprimer la table ${table.numero}`}
                  onClick={() => setSuppression({ type: "table", table })}
                  className="rounded-lg border border-slate-200 p-2 text-rose-600 transition hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-500/10"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </Carte>
          ))}
        </div>
      ) : null}

      {/* QR « À emporter » */}
      <Carte>
        <CarteEntete
          titre="QR code « À emporter »"
          description="Un seul code pour la vitrine, le comptoir ou votre statut WhatsApp : le client commande avant d'arriver."
          icone={<Smartphone className="size-4" aria-hidden />}
        />
        <CarteContenu className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex shrink-0 justify-center rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
            <span
              role="img"
              aria-label={`QR code pour les commandes à emporter du restaurant ${nomRestaurant}`}
              className="block size-40 [&>svg]:size-full"
              dangerouslySetInnerHTML={{ __html: qrSvgEmporter }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              À coller sur la vitrine, à glisser dans vos emballages, ou à publier sur vos réseaux :
              le client accède à votre carte et choisit son heure de retrait.
            </p>
            <p className="mt-2 truncate font-mono text-xs text-slate-400">
              {urlEmporter.replace(/^https?:\/\//, "")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Bouton
                variante="contour"
                taille="sm"
                chargement={exportEnCours === "png"}
                icone={<Download className="size-4" aria-hidden />}
                onClick={() => void telechargerPng(`qr-a-emporter-${slug}.png`, urlEmporter)}
              >
                Télécharger le PNG
              </Bouton>
              <Bouton
                variante="contour"
                taille="sm"
                icone={<Copy className="size-4" aria-hidden />}
                onClick={() => void copierLien(urlEmporter)}
              >
                Copier le lien
              </Bouton>
              <Link href={`/m/${slug}`} target="_blank">
                <Bouton
                  variante="fantome"
                  taille="sm"
                  icone={<ExternalLink className="size-4" aria-hidden />}
                >
                  Voir le menu
                </Bouton>
              </Link>
            </div>
          </div>
        </CarteContenu>
      </Carte>

      {/* Nettoyage complet */}
      {tables.length > 0 ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setSuppression({ type: "toutes" })}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-rose-600"
          >
            <Trash2 className="size-4" aria-hidden />
            Supprimer toutes les tables ({tables.length})
          </button>
        </div>
      ) : null}

      {/* ------------------------------ Modales ------------------------------ */}

      {modaleLot ? (
        <FormulaireLot
          onFermer={() => {
            setModaleLot(false);
            router.refresh();
          }}
          tableSuivante={prochainNumero(tables.map((t) => t.numero))}
          plan={plan}
          limiteTables={limiteTables}
          nombreActuel={tables.length}
        />
      ) : null}

      {renommage ? (
        <FormulaireRenommage
          table={renommage}
          onFermer={() => {
            setRenommage(null);
            router.refresh();
          }}
        />
      ) : null}

      {suppression ? (
        <Modale
          ouverte
          onFermer={() => setSuppression(null)}
          titre={
            suppression.type === "toutes" ? "Supprimer toutes les tables" : "Supprimer la table"
          }
          description="Les commandes déjà passées sont conservées dans votre historique."
          piedPage={
            <>
              <Bouton variante="contour" onClick={() => setSuppression(null)}>
                Annuler
              </Bouton>
              <Bouton
                variante="danger"
                chargement={enTransition}
                libelleChargement="Suppression…"
                onClick={() => {
                  const cible = suppression;
                  setSuppression(null);
                  if (cible.type === "toutes") {
                    executer(() => supprimerToutesLesTables(), {
                      optimiste: () => setTables([]),
                      retour: () => setTables(tables),
                    });
                  } else {
                    executer(() => supprimerTable(cible.table.id), {
                      optimiste: () =>
                        setTables((liste) => liste.filter((t) => t.id !== cible.table.id)),
                      retour: () => setTables(tables),
                    });
                  }
                }}
              >
                Supprimer définitivement
              </Bouton>
            </>
          }
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {suppression.type === "toutes" ? (
              <>
                Vous allez supprimer <strong>{tables.length} table(s)</strong> et leurs QR codes.
                Les cartes déjà imprimées cesseront de fonctionner : pensez à les retirer de vos
                tables.
              </>
            ) : (
              <>
                Vous allez supprimer la{" "}
                <strong className="text-slate-900 dark:text-white">
                  table {suppression.table.numero}
                </strong>{" "}
                et son QR code. La carte imprimée cessera de fonctionner.
              </>
            )}
          </p>
        </Modale>
      ) : null}
    </div>
  );
}

/** Numéro suivant proposé : on reprend le plus grand numéro + 1. */
function prochainNumero(numeros: string[]): number {
  const valeurs = numeros
    .map((numero) => Number.parseInt(numero.replace(/\D/g, ""), 10))
    .filter((valeur) => Number.isFinite(valeur));
  return valeurs.length > 0 ? Math.max(...valeurs) + 1 : 1;
}

/* -------------------------------------------------------------------------- */
/*                       Modale de création en lot                            */
/* -------------------------------------------------------------------------- */

function FormulaireLot({
  onFermer,
  tableSuivante,
  plan,
  limiteTables,
  nombreActuel,
}: {
  onFermer: () => void;
  tableSuivante: number;
  plan: string;
  limiteTables: number | null;
  nombreActuel: number;
}) {
  const { notifier } = useToasts();
  const [etat, action, enCours] = useActionState(creerTablesLot, etatInitial);

  const [nombre, setNombre] = useState("5");
  const [debut, setDebut] = useState(String(tableSuivante));
  const [prefixe, setPrefixe] = useState("");
  const [signale, setSignale] = useState(false);

  useEffect(() => {
    if (!etat.ok || signale) return;
    setSignale(true);
    notifier({ titre: "Tables créées", description: etat.message, ton: "succes" });
    onFermer();
  }, [etat, notifier, onFermer, signale]);

  const placeRestante = limiteTables === null ? null : Math.max(0, limiteTables - nombreActuel);
  const apercu =
    Number(nombre) > 0
      ? Array.from({ length: Math.min(Number(nombre), 6) }, (_, index) => {
          const valeur = (Number(debut) || 0) + index;
          return prefixe.trim() ? `${prefixe.trim()} ${valeur}` : String(valeur);
        })
      : [];

  return (
    <Modale
      ouverte
      onFermer={onFermer}
      titre="Ajouter des tables"
      description="AfriMenu crée les numéros et génère un QR code unique pour chaque table."
      taille="sm"
      piedPage={
        <>
          <Bouton variante="contour" onClick={onFermer} type="button">
            Annuler
          </Bouton>
          <Bouton
            type="submit"
            form="formulaire-tables"
            chargement={enCours}
            libelleChargement="Création…"
            icone={<Sparkles className="size-4" aria-hidden />}
          >
            Créer les tables
          </Bouton>
        </>
      }
    >
      <form id="formulaire-tables" action={action} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Champ
            label="Nombre de tables"
            htmlFor="tables-nombre"
            obligatoire
            erreur={etat.erreurs?.nombre}
          >
            <Entree
              id="tables-nombre"
              name="nombre"
              type="number"
              inputMode="numeric"
              min={1}
              max={60}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              erreur={Boolean(etat.erreurs?.nombre)}
              autoFocus
            />
          </Champ>

          <Champ
            label="Premier numéro"
            htmlFor="tables-debut"
            obligatoire
            erreur={etat.erreurs?.debut}
            aide="Utile si vos tables 1 à 4 existent déjà."
          >
            <Entree
              id="tables-debut"
              name="debut"
              type="number"
              inputMode="numeric"
              min={0}
              value={debut}
              onChange={(e) => setDebut(e.target.value)}
              erreur={Boolean(etat.erreurs?.debut)}
            />
          </Champ>
        </div>

        <Champ
          label="Préfixe (facultatif)"
          htmlFor="tables-prefixe"
          aide="Ex. « Table », « Terrasse », « Étage 1 » — laissez vide pour de simples numéros."
          erreur={etat.erreurs?.prefixe}
        >
          <Entree
            id="tables-prefixe"
            name="prefixe"
            value={prefixe}
            onChange={(e) => setPrefixe(e.target.value)}
            placeholder="Table"
            maxLength={16}
          />
        </Champ>

        {apercu.length > 0 ? (
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
            <p className="text-xs font-bold tracking-wide text-slate-400 uppercase">
              Aperçu des numéros
            </p>
            <p className="mt-1.5 flex flex-wrap gap-1.5">
              {apercu.map((numero) => (
                <span
                  key={numero}
                  className="rounded-lg bg-white px-2 py-0.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                >
                  {numero}
                </span>
              ))}
              {Number(nombre) > 6 ? (
                <span className="px-1 text-xs font-semibold text-slate-400">
                  … et {Number(nombre) - 6} autre(s)
                </span>
              ) : null}
            </p>
          </div>
        ) : null}

        {plan === "gratuit" && placeRestante !== null ? (
          <Alerte ton={placeRestante === 0 ? "alerte" : "info"}>
            {placeRestante === 0
              ? "Vos 5 tables du plan Gratuit sont créées. Passez au plan Pro pour en ajouter."
              : `Plan Gratuit : il vous reste ${placeRestante} table(s) sur ${limiteTables}.`}
          </Alerte>
        ) : null}

        {etat.message && !etat.ok ? (
          <Alerte ton="erreur">{etat.message}</Alerte>
        ) : null}
      </form>
    </Modale>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Modale de renommage                               */
/* -------------------------------------------------------------------------- */

function FormulaireRenommage({
  table,
  onFermer,
}: {
  table: TableAffichee;
  onFermer: () => void;
}) {
  const { notifier } = useToasts();
  const [etat, action, enCours] = useActionState(renommerTable, etatInitial);
  const [numero, setNumero] = useState(table.numero);
  const [signale, setSignale] = useState(false);

  useEffect(() => {
    if (!etat.ok || signale) return;
    setSignale(true);
    notifier({ titre: "Table modifiée", description: etat.message, ton: "succes" });
    onFermer();
  }, [etat, notifier, onFermer, signale]);

  return (
    <Modale
      ouverte
      onFermer={onFermer}
      titre="Renommer la table"
      description="Le nom apparaît sur le menu du client et sur vos commandes."
      taille="sm"
      piedPage={
        <>
          <Bouton variante="contour" onClick={onFermer} type="button">
            Annuler
          </Bouton>
          <Bouton type="submit" form="formulaire-renommage" chargement={enCours}>
            Enregistrer
          </Bouton>
        </>
      }
    >
      <form id="formulaire-renommage" action={action} className="space-y-4">
        <input type="hidden" name="id" value={table.id} />
        <Champ
          label="Numéro ou nom de la table"
          htmlFor="table-numero"
          obligatoire
          erreur={etat.erreurs?.numero}
          aide="Ex. « 12 », « Terrasse A », « Comptoir 2 »."
        >
          <Entree
            id="table-numero"
            name="numero"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            maxLength={12}
            autoFocus
            erreur={Boolean(etat.erreurs?.numero)}
          />
        </Champ>

        <Alerte ton="alerte" titre="Après un renommage, réimprimez la carte">
          Le QR code contient le numéro de la table. En le modifiant, l&apos;ancienne carte imprimée
          ne pointe plus vers la bonne table : téléchargez ou imprimez la nouvelle depuis la liste.
        </Alerte>

        {etat.message && !etat.ok ? <Alerte ton="erreur">{etat.message}</Alerte> : null}
      </form>
    </Modale>
  );
}
