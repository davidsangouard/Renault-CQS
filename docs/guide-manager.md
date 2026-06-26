# Guide Manager - CQS

Ce guide s'adresse aux responsables qualité et aux administrateurs de l'application. Il couvre la configuration des projets et des opérations, la gestion des fiches de référence et l'export des rapports PDF.

---

## Sommaire

- [Accéder à l'interface Manager](#accéder-à-linterface-manager)
- [Vue d'ensemble de l'interface Manager](#vue-densemble-de-linterface-manager)
- [Gestion des Projets](#gestion-des-projets)
- [Gestion des Organes](#gestion-des-organes)
- [Gestion des Opérations (OP)](#gestion-des-opérations-op)
- [Gestion des Cordons](#gestion-des-cordons)
- [Gestion des Pièces](#gestion-des-pièces)
- [Fiches schémas (images de référence)](#fiches-schémas-images-de-référence)
- [Exporter un rapport PDF global](#exporter-un-rapport-pdf-global)
- [Gérer les vérifications](#gérer-les-vérifications)
- [Personnalisation de l'interface](#personnalisation-de-linterface)

---

## Accéder à l'interface Manager

1. Connectez-vous à l'application avec votre IPN
2. Sur l'écran d'accueil, cliquez sur l'icône **⚙️ (engrenage)** en haut à droite de l'en-tête bleu
3. Une fenêtre demande le **code Manager** - entrez-le et validez

> Le code Manager par défaut est défini lors de la configuration initiale. Contactez votre administrateur si vous ne le connaissez pas.

---

## Vue d'ensemble de l'interface Manager

L'interface Manager est divisée en deux sections principales accessibles via des onglets :

| Onglet | Contenu |
|---|---|
| **Configuration** | Gestion des projets, organes, OP, cordons et pièces |
| **Fiches** | Upload et gestion des schémas de référence par OP |

---

## Gestion des Projets

### Créer un projet

1. Dans l'onglet **Configuration**, cliquez sur **+ Ajouter un projet**
2. Renseignez le **nom du projet** (exemple : `B40`, `C3X`)
3. Cliquez sur **Créer**

### Modifier un projet

Cliquez sur le nom du projet dans la liste. Vous pouvez modifier son nom.

### Supprimer un projet

Cliquez sur l'icône **🗑 poubelle** à côté du projet. Cette action supprime aussi tous les organes et OP associés.

> **Attention** : la suppression d'un projet supprime toutes les données de configuration associées. Les vérifications déjà enregistrées en base de données ne sont pas supprimées immédiatement mais deviennent orphelines.

---

## Gestion des Organes

Les organes sont rattachés à un projet. Sélectionnez d'abord un projet dans la liste.

### Créer un organe

1. Sélectionnez le projet parent
2. Cliquez sur **+ Ajouter un organe**
3. Renseignez le **code organe** (exemple : `CEV`, `BAR`)
4. Cliquez sur **Créer**

### Supprimer un organe

Cliquez sur l'icône poubelle à côté de l'organe. Toutes les OP associées sont supprimées.

---

## Gestion des Opérations (OP)

Les opérations sont les postes de travail de soudure. Elles sont rattachées à un organe.

### Créer une OP

1. Sélectionnez l'organe parent
2. Cliquez sur **+ Ajouter une OP**
3. Renseignez la **clé de l'OP** (exemple : `OP-010`, `OP-020`) - cette clé apparaît sur toutes les fiches et dans les exports PDF
4. Cliquez sur **Créer**

### Modifier une OP

Cliquez sur l'OP dans la liste pour l'éditer. Vous pouvez modifier sa clé.

### Supprimer une OP

Cliquez sur l'icône poubelle à côté de l'OP. Les cordons et pièces associés sont supprimés. Les données de vérification existantes en base ne sont pas supprimées.

---

## Gestion des Cordons

Les cordons sont définis par OP. Ils correspondent aux points de soudure à vérifier.

### Ajouter un cordon

1. Dans la configuration de l'OP, trouvez la section **Cordons**
2. Renseignez le numéro du cordon (nombre entier, exemple : `1`, `2`, `12`)
3. Cliquez sur **+ Ajouter**

Les cordons sont triés numériquement dans la fiche de vérification.

### Supprimer un cordon

Cliquez sur **✕** à côté du numéro de cordon.

> Si des vérifications existent déjà pour cette OP avec ce cordon, les données de ce cordon restent en base mais n'apparaîtront plus dans les nouvelles vérifications.

---

## Gestion des Pièces

Les pièces permettent de pré-renseigner des numéros de pièce courants pour une OP. Elles s'affichent comme suggestions lors de la création d'une vérification.

### Ajouter une pièce

1. Dans la configuration de l'OP, trouvez la section **Pièces**
2. Renseignez le numéro de pièce (exemple : `087-D-001`)
3. Cliquez sur **+ Ajouter**

### Supprimer une pièce

Cliquez sur **✕** à côté du numéro de pièce.

---

## Fiches schémas (images de référence)

Les fiches schémas sont des images (photos de documents, schémas techniques) qui s'affichent en carousel sur la fiche de vérification pour aider les soudeurs. Ce ne sont **pas** des photos de vérification - elles sont chargées une fois par le Manager et partagées par tous.

### Accéder aux fiches schémas

1. Dans l'interface Manager, cliquez sur l'onglet **Fiches**
2. Sélectionnez le projet, l'organe puis l'OP pour laquelle vous souhaitez gérer les schémas

### Ajouter un schéma

1. Cliquez sur **+ Ajouter une image** ou sur la zone d'upload
2. Sélectionnez un fichier image (JPG, PNG, WebP)
3. L'image est **automatiquement compressée** (largeur max 1200px, qualité JPEG 75%) avant d'être envoyée - pas besoin de réduire la taille manuellement
4. L'image apparaît dans la liste

Vous pouvez uploader jusqu'à **10 schémas par OP**.

### Supprimer un schéma

Cliquez sur l'icône **🗑 poubelle** sous l'image à supprimer. La suppression est immédiate.

### Ordre des schémas

Les schémas s'affichent dans l'ordre d'upload (du plus ancien au plus récent). Pour changer l'ordre, supprimez et re-uploadez dans l'ordre souhaité.

<details>
<summary>L'image ne s'uploade pas - que faire ?</summary>

**"Maximum 10 images atteint"** : Supprimez des schémas existants avant d'en ajouter de nouveaux.

**L'image est trop grande après compression** : Les images compressées dépassent rarement 500 Ko. Si l'upload échoue quand même, vérifiez la connexion au serveur local et que XAMPP est bien démarré.

**Format non supporté** : Utilisez JPG, PNG ou WebP. Les fichiers PDF ou TIFF ne sont pas supportés.

</details>

---

## Exporter un rapport PDF global

Le rapport PDF global compile **toutes les vérifications validées** d'un organe en un seul document. Il inclut toutes les OP et toutes les pièces vérifiées.

### Lancer l'export

1. Sur l'écran d'accueil, sélectionnez le projet et l'organe souhaités
2. Cliquez sur le bouton **Exporter PDF** (en bas de la page)
3. Si des opérations sont encore "en cours", un avertissement s'affiche - vous pouvez les finaliser ou exporter quand même (les OP en cours seront exclues du PDF)
4. Renseignez le **numéro d'OF** qui apparaîtra sur le document
5. Cliquez sur **Générer le PDF**

Le fichier PDF se télécharge automatiquement dans le dossier Téléchargements.

### Contenu du rapport PDF global

Chaque page de rapport contient :
- En-tête CQS (projet, organe, OF, date)
- Pour chaque OP et chaque pièce validée :
  - Statut de conformité coloré
  - Métadonnées (IPN, n° pièce, OF, date)
  - Commentaire
  - Tableau des cordons avec statuts
  - Tableau des sous-ensembles
  - Schémas de référence
  - Photos de vérification avec cordon associé
- Pied de page paginé

<details>
<summary>L'export PDF est bloqué - "opérations en cours"</summary>

Ce message apparaît quand une OP a été ouverte (statut "En cours") mais pas encore validée. Deux options :

1. **Finaliser l'OP** : cliquez sur le nom de l'OP dans le message pour ouvrir la fiche et la valider
2. **Exporter quand même** : cliquez sur "Exporter quand même" - les OP en cours seront absentes du PDF

</details>

<details>
<summary>L'export PDF est bloqué - "aucune vérification"</summary>

Ce message apparaît si aucune pièce n'a encore été validée pour l'organe sélectionné. Créez et validez au moins une vérification avant d'exporter.

</details>

---

## Gérer les vérifications

### Consulter les vérifications existantes

Sur l'écran d'accueil, sélectionnez un projet + organe + OP pour voir la liste des vérifications dans la colonne de droite.

Chaque carte affiche le statut (badge coloré), le numéro de pièce/OF, l'IPN et la date.

### Modifier une vérification

Cliquez sur la carte de la vérification pour rouvrir la fiche et la modifier. Les modifications sont enregistrées lors de la revalidation.

### Supprimer une vérification individuelle

Cliquez sur l'icône **🗑 poubelle** à droite de la carte. Confirmez dans la fenêtre qui s'affiche.

### Supprimer plusieurs vérifications

Cliquez sur **Supprimer tout** (en bas de l'écran d'accueil). La fenêtre de sélection permet de choisir précisément lesquelles supprimer tout en conservant les autres.

> Exportez toujours le PDF avant de supprimer des vérifications si vous avez besoin de conserver une trace.

---

## Personnalisation de l'interface

L'interface propose quelques options de personnalisation accessibles via le panneau **Tweaks** (disponible en mode édition) :

| Option | Description |
|---|---|
| **Thème couleur** | Bleu marine (défaut), Vert foncé, Ardoise |
| **Boutons cordons** | Taille normale ou grands boutons (pour utilisation avec gants) |

Ces options sont persistantes par navigateur et n'affectent pas les autres postes.
