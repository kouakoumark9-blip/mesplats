"use client";

/**
 * Gestion de l'équipe : comptes serveur et cuisine du restaurant.
 * ---------------------------------------------------------------------------
 * Le propriétaire crée un compte (nom, email, mot de passe, rôle), suspend ou
 * réactive un accès, réinitialise un mot de passe oublié (le mot de passe
 * temporaire n'est affiché qu'une fois) et retire un membre.
 *
 * Toutes les actions sont re-vérifiées côté serveur : rôle `admin` obligatoire
 * et appartenance du compte au même `restaurant_id`.
 */
import {
  Check,
  Copy,
  KeyRound,
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Bouton } from "@/components/ui/bouton";
import { Carte, CarteContenu } from "@/components/ui/carte";
import { Champ, Entree, Selecteur } from "@/components/ui/champ";
import { Alerte, EtatVide } from "@/components/ui/divers";
import { Modale } from "@/components/ui/modale";
import { useToasts } from "@/components/ui/toast";
import {
  basculerEmploye,
  creerEmploye,
  reinitialiserMotDePasseEmploye,
  supprimerEmploye,
  type ResultatEquipe,
} from "@/lib/actions/equipe";
import { etatInitial } from "@/lib/actions/etat";
import { LIBELLES_ROLE, type Role } from "@/lib/constants";
import type { MembreEquipe } from "@/lib/db/equipe";
import { cn, formatDateHeure, initiales } from "@/lib/utils";

const ICONES_ROLE: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="size-4" aria-hidden />,
  serveur: <UserCog className="size-4" aria-hidden />,
  cuisine: <UtensilsCrossed className="size-4" aria-hidden />,
};

export function GestionEquipe({
  membres,
  limite,
  plan,
}: {
  membres: MembreEquipe[];
  limite: number | null;
  plan: string;
}) {
  const { notifier } = useToasts();
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [aSupprimer, setASupprimer] = useState<MembreEquipe | null>(null);
  const [temporaire, setTemporaire] = useState<{ nom: string; motDePasse: string } | null>(null);
  const [enCours, demarrer] = useTransition();

  const complet = limite !== null && membres.length >= limite;

  function executer(
    action: () => Promise<ResultatEquipe>,
    { rafraichir = true }: { rafraichir?: boolean } = {},
  ) {
    demarrer(async () => {
      const resultat = await action();
      if (resultat.ok && resultat.motDePasseTemporaire) {
        setTemporaire({ nom: "", motDePasse: resultat.motDePasseTemporaire });
      }
      notifier({
        titre: resultat.ok ? (resultat.message ?? "C'est fait") : "Action impossible",
        description: resultat.ok ? undefined : resultat.message,
        ton: resultat.ok ? "succes" : "erreur",
      });
      if (resultat.ok && rafraichir) location.reload();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {membres.length} compte{membres.length > 1 ? "s" : ""}
          {limite !== null ? ` sur ${limite} avec la formule ${plan === "pro" ? "Pro" : "à activer"}` : " (formule Pro : illimité)"}
          . Les serveurs et la cuisine utilisent l&apos;écran de service, jamais le back-office.
        </p>
        <Bouton
          icone={<Plus className="size-4" aria-hidden />}
          disabled={complet}
          onClick={() => setAjoutOuvert(true)}
        >
          Ajouter un membre
        </Bouton>
      </div>

      {complet ? (
        <Alerte ton="alerte" titre="Limite de comptes atteinte">
          Passez à la formule Pro (9 900 FCFA / mois) pour un nombre de comptes illimité.
        </Alerte>
      ) : null}

      {membres.length === 0 ? (
        <EtatVide
          icone={<UserRound className="size-6" aria-hidden />}
          titre="Aucun compte dans l'équipe"
          description="Ajoutez vos serveurs et votre cuisinier : ils recevront les commandes en direct sur l'écran de service."
          action={
            <Bouton icone={<Plus className="size-4" aria-hidden />} onClick={() => setAjoutOuvert(true)}>
              Ajouter un membre
            </Bouton>
          }
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {membres.map((membre) => (
            <li key={membre.id}>
              <Carte className={cn("h-full", !membre.actif && "opacity-70")}>
                <CarteContenu className="flex h-full flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-100 font-titre text-sm font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      {initiales(membre.nom)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                        {membre.nom}
                      </p>
                      <p className="flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        <Mail className="size-3.5 shrink-0" aria-hidden />
                        {membre.email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge ton={membre.role === "admin" ? "marque" : "info"} icone={ICONES_ROLE[membre.role]}>
                        {LIBELLES_ROLE[membre.role as Role]}
                      </Badge>
                      {membre.actif ? (
                        <Badge ton="succes">Accès actif</Badge>
                      ) : (
                        <Badge ton="danger">Suspendu</Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    {membre.dernierAccesAt
                      ? `Dernière connexion : ${formatDateHeure(membre.dernierAccesAt)}`
                      : "Ne s'est pas encore connecté"}
                  </p>

                  <div className="mt-auto flex flex-wrap gap-2">
                    <Bouton
                      taille="sm"
                      variante={membre.actif ? "contour" : "succes"}
                      disabled={enCours}
                      onClick={() => executer(() => basculerEmploye(membre.id, !membre.actif))}
                      icone={membre.actif ? <X className="size-3.5" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
                    >
                      {membre.actif ? "Suspendre l'accès" : "Réactiver"}
                    </Bouton>
                    <Bouton
                      taille="sm"
                      variante="contour"
                      disabled={enCours}
                      icone={<KeyRound className="size-3.5" aria-hidden />}
                      onClick={() =>
                        demarrer(async () => {
                          const resultat = await reinitialiserMotDePasseEmploye(membre.id);
                          if (resultat.ok && resultat.motDePasseTemporaire) {
                            setTemporaire({ nom: membre.nom, motDePasse: resultat.motDePasseTemporaire });
                          } else {
                            notifier({
                              titre: "Action impossible",
                              description: resultat.message,
                              ton: "erreur",
                            });
                          }
                        })
                      }
                    >
                      Réinitialiser le mot de passe
                    </Bouton>
                    <Bouton
                      taille="sm"
                      variante="fantome"
                      className="text-rose-600 hover:bg-rose-50 dark:text-rose-400"
                      disabled={enCours}
                      icone={<Trash2 className="size-3.5" aria-hidden />}
                      onClick={() => setASupprimer(membre)}
                    >
                      Retirer
                    </Bouton>
                  </div>
                </CarteContenu>
              </Carte>
            </li>
          ))}
        </ul>
      )}

      <FormulaireAjout ouvert={ajoutOuvert} onFermer={() => setAjoutOuvert(false)} />

      {/* --------------------- Mot de passe temporaire généré --------------------- */}
      {temporaire ? (
        <Modale
          ouverte
          onFermer={() => setTemporaire(null)}
          titre="Mot de passe temporaire"
          description="Il n'est affiché qu'une seule fois. Transmettez-le de vive voix ou par WhatsApp, puis demandez de le changer depuis « Mon compte »."
          taille="sm"
          piedPage={
            <Bouton onClick={() => setTemporaire(null)}>J&apos;ai noté le mot de passe</Bouton>
          }
        >
          <Champ label={temporaire.nom ? `Nouveau mot de passe de ${temporaire.nom}` : "Nouveau mot de passe"} htmlFor="mdp-temporaire">
            <div className="flex gap-2">
              <Entree id="mdp-temporaire" readOnly value={temporaire.motDePasse} className="chiffres font-bold" />
              <Bouton
                variante="contour"
                icone={<Copy className="size-4" aria-hidden />}
                onClick={() => void navigator.clipboard.writeText(temporaire.motDePasse)}
              >
                Copier
              </Bouton>
            </div>
          </Champ>
        </Modale>
      ) : null}

      {/* ------------------------------ Confirmation ------------------------------ */}
      {aSupprimer ? (
        <Modale
          ouverte
          onFermer={() => setASupprimer(null)}
          titre={`Retirer ${aSupprimer.nom} de l'équipe ?`}
          description="Le compte sera supprimé définitivement : la personne ne pourra plus accéder à l'écran de service. L'historique des commandes est conservé."
          taille="sm"
          piedPage={
            <>
              <Bouton variante="contour" onClick={() => setASupprimer(null)}>
                Annuler
              </Bouton>
              <Bouton
                variante="danger"
                icone={<Trash2 className="size-4" aria-hidden />}
                onClick={() => {
                  setASupprimer(null);
                  executer(() => supprimerEmploye(aSupprimer.id));
                }}
              >
                Retirer le membre
              </Bouton>
            </>
          }
        >
          <Alerte ton="alerte" titre="Cette action est immédiate">
            Si {aSupprimer.nom} est connecté sur une tablette de service, sa session sera refusée à
            la prochaine page.
          </Alerte>
        </Modale>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Formulaire d'ajout (modale)                       */
/* -------------------------------------------------------------------------- */

function FormulaireAjout({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  const { notifier } = useToasts();
  const [etat, action, enCours] = useActionState(creerEmploye, etatInitial);

  useEffect(() => {
    if (etat.ok) {
      notifier({ titre: etat.message ?? "Membre ajouté", ton: "succes" });
      onFermer();
      // Rechargement léger : la liste vient du serveur (source de vérité).
      window.setTimeout(() => location.reload(), 400);
    }
  }, [etat, notifier, onFermer]);

  return (
    <Modale
      ouverte={ouvert}
      onFermer={onFermer}
      titre="Ajouter un membre à l'équipe"
      description="Le compte donne accès à l'écran de service (commandes, statuts, paiements)."
    >
      <form action={action} className="space-y-4">
        {etat.message && !etat.ok ? <Alerte ton="erreur">{etat.message}</Alerte> : null}

        <Champ label="Nom complet" htmlFor="nom-employe" obligatoire erreur={etat.erreurs?.nom}>
          <Entree id="nom-employe" name="nom" required placeholder="Awa Traoré" autoComplete="off" />
        </Champ>

        <Champ
          label="Adresse email"
          htmlFor="email-employe"
          obligatoire
          erreur={etat.erreurs?.email}
          aide="Servira d'identifiant de connexion."
        >
          <Entree id="email-employe" name="email" type="email" required placeholder="awa@monresto.ci" autoComplete="off" />
        </Champ>

        <Champ label="Rôle" htmlFor="role-employe" obligatoire erreur={etat.erreurs?.role}>
          <Selecteur id="role-employe" name="role" defaultValue="serveur">
            <option value="serveur">Serveur — prend les commandes et valide les paiements</option>
            <option value="cuisine">Cuisine — suit la préparation des plats</option>
          </Selecteur>
        </Champ>

        <Champ
          label="Mot de passe provisoire"
          htmlFor="mdp-employe"
          obligatoire
          erreur={etat.erreurs?.motDePasse}
          aide="8 caractères minimum. La personne pourra le changer depuis « Mon compte »."
        >
          <Entree id="mdp-employe" name="motDePasse" type="text" required autoComplete="off" placeholder="Ex. Service2026" />
        </Champ>

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Bouton type="button" variante="contour" onClick={onFermer}>
            Annuler
          </Bouton>
          <Bouton type="submit" chargement={enCours} libelleChargement="Création…" icone={<Plus className="size-4" aria-hidden />}>
            Créer le compte
          </Bouton>
        </div>
      </form>
    </Modale>
  );
}
