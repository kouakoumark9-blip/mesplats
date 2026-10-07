#!/usr/bin/env python3
"""
Génère les icônes PNG de la PWA à partir de l'identité dessinée dans
`public/icons/icone.svg` : carré arrondi en dégradé orange, couverts blancs et
deux pastilles (QR stylisé).

Le logo lui-même n'est pas redessiné : le SVG reste la source de vérité, ce
script ne fait que produire les déclinaisons bitmap exigées par le manifeste
(PWA installable sur Android et iOS) :

  • public/icons/icone-192.png            (icône « any », écran d'accueil)
  • public/icons/icone-512.png            (icône « any », stores et splash)
  • public/icons/icone-maskable-512.png   (icône « maskable » : contenu réduit
                                           dans la zone sûre de 80 %)

Usage : python3 scripts/generer-icones.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / "public" / "icons"

# Couleurs du dégradé, reprises telles quelles de icone.svg.
ORANGE_CLAIR = (240, 125, 84)
ORANGE_FONCE = (207, 69, 32)
BLANC = (255, 255, 255, 255)

# Suréchantillonnage : on dessine en grand puis on réduit, pour des bords nets.
SUR = 4
BASE = 512 * SUR
EPAISSEUR = 26 * SUR


def degrade(taille: int) -> Image.Image:
    """Dégradé diagonal clair → foncé, du coin haut-gauche au coin bas-droit."""
    image = Image.new("RGB", (taille, taille))
    pixels = image.load()
    for y in range(taille):
        for x in range(taille):
            # Position relative (0→1) le long de la diagonale.
            t = (x + y) / (2 * (taille - 1))
            pixels[x, y] = tuple(
                round(ORANGE_CLAIR[i] + (ORANGE_FONCE[i] - ORANGE_CLAIR[i]) * t) for i in range(3)
            )
    return image


def dessiner_couverts(dessin: ImageDraw.ImageDraw, echelle: float, decalage: tuple[float, float]) -> None:
    """Trace les couverts blancs du logo, mis à l'échelle et décalés."""
    def x(valeur: float) -> float:
        return (valeur * SUR) * echelle + decalage[0]

    def y(valeur: float) -> float:
        return (valeur * SUR) * echelle + decalage[1]

    epaisseur = max(2, round(EPAISSEUR * echelle))

    # Fourchette : deux dents reliées par un arrondi, puis le manche.
    dessin.line([(x(176), y(132)), (x(176), y(230))], fill=BLANC, width=epaisseur)
    dessin.line([(x(248), y(132)), (x(248), y(230))], fill=BLANC, width=epaisseur)
    dessin.arc(
        [(x(176), y(194)), (x(248), y(266))],
        start=0,
        end=180,
        fill=BLANC,
        width=epaisseur,
    )
    dessin.line([(x(212), y(262)), (x(212), y(380))], fill=BLANC, width=epaisseur)

    # Cuillère : le cuilleron ovale puis le manche.
    dessin.ellipse(
        [(x(296), y(132)), (x(376), y(236))],
        outline=BLANC,
        width=epaisseur,
    )
    dessin.line([(x(336), y(236)), (x(336), y(380))], fill=BLANC, width=epaisseur)

    # Deux pastilles : rappel des modules d'un QR code.
    for coin_x in (96, 374):
        dessin.rounded_rectangle(
            [(x(coin_x), y(404)), (x(coin_x + 42), y(446))],
            radius=round(12 * SUR * echelle),
            fill=BLANC,
        )


def icone(taille: int, maskable: bool = False) -> Image.Image:
    """Produit une icône carrée de `taille` pixels."""
    fond = degrade(BASE).convert("RGBA")

    # Masque : carré arrondi (rayon 112/512) pour les icônes classiques.
    masque = Image.new("L", (BASE, BASE), 0)
    if maskable:
        ImageDraw.Draw(masque).rectangle([0, 0, BASE, BASE], fill=255)
    else:
        ImageDraw.Draw(masque).rounded_rectangle(
            [0, 0, BASE - 1, BASE - 1], radius=112 * SUR, fill=255
        )
    fond.putalpha(masque)

    calque = Image.new("RGBA", (BASE, BASE), (0, 0, 0, 0))
    echelle, decalage = (0.62, (BASE * 0.19, BASE * 0.19)) if maskable else (1.0, (0.0, 0.0))
    dessiner_couverts(ImageDraw.Draw(calque), echelle, decalage)

    resultat = Image.alpha_composite(fond, calque)
    return resultat.resize((taille, taille), Image.LANCZOS)


def main() -> None:
    SORTIE.mkdir(parents=True, exist_ok=True)
    for nom, taille, maskable in (
        ("icone-192.png", 192, False),
        ("icone-512.png", 512, False),
        ("icone-maskable-512.png", 512, True),
    ):
        chemin = SORTIE / nom
        icone(taille, maskable).save(chemin, optimize=True)
        print(f"✓ {chemin.relative_to(RACINE)} ({taille}×{taille})")


if __name__ == "__main__":
    main()
