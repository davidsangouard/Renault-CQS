# CQS - Checklist Qualité Soudure

Application web locale de suivi qualité pour les postes de soudure. Développée pour les lignes de production Renault, elle permet aux opérateurs de valider leurs opérations de soudure en temps réel et aux responsables qualité de piloter la conformité et d'exporter les rapports PDF.

---

## Navigation

| Document | Contenu |
|---|---|
| [Installation XAMPP & XAMPP Lite](docs/installation.md) | Mise en place complète du projet, importation BDD, configuration |
| [Guide Soudeur](docs/guide-soudeur.md) | Prise en main de l'application pour les opérateurs |
| [Guide Manager](docs/guide-manager.md) | Configuration des fiches, gestion des vérifications, export PDF |
| [Gestion de la base de données](docs/gestion-bdd.md) | Sauvegarde, restauration, transfert, sauvegardes automatiques |
| [FAQ & Dépannage](docs/faq.md) | Problèmes courants et solutions |

---

## Fonctionnalités

<details>
<summary><strong>Page de vérification (soudeurs)</strong></summary>

- Saisie du numéro de pièce, OF et IPN opérateur
- Validation cordon par cordon : **Conforme / Retouché / Non Conforme**
- Table des sous-ensembles utilisés (numéros D/G, retouches)
- Carousel des schémas de référence chargés par le Manager
- Gestion CRUD des photos de vérification, associées aux cordons NC/retouchés
- Export PDF individuel de l'opération en cours
- Conformité calculée automatiquement selon l'état des cordons

</details>

<details>
<summary><strong>Écran d'accueil (sélection poste)</strong></summary>

- Sélection projet → organe → poste (OP)
- Liste des vérifications par poste avec badge de statut coloré
- Création d'une nouvelle vérification en un clic
- Suppression individuelle ou sélective des pièces/OF
- Export PDF global (toutes OP de l'organe) avec numéro OF

</details>

<details>
<summary><strong>Interface Manager (responsable qualité)</strong></summary>

- Gestion des projets, organes et opérations (OP)
- Configuration des cordons par OP et des pièces associées
- Upload des schémas de référence (jusqu'à 10 images par OP, compressées côté client)
- Accès protégé par code manager

</details>

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18.3 + Babel Standalone (CDN, aucune compilation) |
| Backend | PHP 8.x |
| Base de données | MySQL / MariaDB (via XAMPP) |
| PDF | jsPDF 2.5 + jspdf-autotable |
