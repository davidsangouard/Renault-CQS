# Guide Soudeur - CQS

Ce guide explique comment utiliser l'application CQS au quotidien pour renseigner et valider vos opérations de soudure.

---

## Sommaire

- [Accéder à l'application](#accéder-à-lapplication)
- [Connexion avec votre IPN](#connexion-avec-votre-ipn)
- [Choisir votre poste de travail](#choisir-votre-poste-de-travail)
- [Créer une nouvelle vérification](#créer-une-nouvelle-vérification)
- [Remplir la fiche de vérification](#remplir-la-fiche-de-vérification)
- [Valider et enregistrer](#valider-et-enregistrer)
- [Retrouver une vérification existante](#retrouver-une-vérification-existante)
- [Prendre des photos de vérification](#prendre-des-photos-de-vérification)
- [Exporter le PDF de l'opération](#exporter-le-pdf-de-lopération)
- [Supprimer une vérification](#supprimer-une-vérification)

---

## Accéder à l'application

Sur le navigateur du poste de soudure, tapez dans la barre d'adresse :

```
http://localhost/cqs/
```

Appuyez sur **Entrée**. L'écran de connexion s'affiche.

> Si la page ne s'affiche pas, vérifiez que XAMPP est bien démarré sur le poste (Apache + MySQL en vert). Contactez votre responsable si le problème persiste.

---

## Connexion avec votre IPN

1. Sur l'écran de connexion, tapez votre **IPN** dans le champ prévu (exemple : `DUPJ01`)
2. Appuyez sur **Entrée** ou cliquez sur **Commencer**

L'application mémorise votre IPN pour cette session. Vous serez redirigé automatiquement vers l'écran de sélection du poste.

> L'IPN n'est **pas un mot de passe** - il identifie l'opérateur sur les fiches de vérification et dans les exports PDF. Entrez votre IPN Renault habituel.

---

## Choisir votre poste de travail

L'écran d'accueil vous demande de sélectionner votre poste en trois étapes :

### 1. Sélectionner le Projet

Cliquez sur le bouton correspondant à votre projet (exemple : **B40**, **C3X**, etc.).

### 2. Sélectionner l'Organe

Une fois le projet sélectionné, les organes disponibles apparaissent. Cliquez sur le vôtre (exemple : **CEV**, **BAR**, etc.).

### 3. Sélectionner le Poste (OP)

La liste des opérations disponibles pour votre organe s'affiche à gauche. Chaque carte indique :
- Le nom de l'OP (exemple : **OP-010**)
- Le nombre de cordons à vérifier
- Le nombre de vérifications déjà enregistrées

Cliquez sur votre OP pour la sélectionner. La colonne de droite affiche les vérifications existantes pour ce poste.

---

## Créer une nouvelle vérification

Une fois votre poste sélectionné, cliquez sur le bouton bleu **Créer** en haut de la colonne de droite.

La fiche de vérification de votre OP s'ouvre immédiatement.

---

## Remplir la fiche de vérification

La fiche est divisée en plusieurs zones. Remplissez-les dans l'ordre.

### En-tête (barre du haut)

| Champ | Description |
|---|---|
| **n° Pièce** | Numéro de la pièce fabriquée (ex : `087-D-001`) |
| **OF** | Numéro de l'ordre de fabrication (ex : `2024-089`) |
| **IPN** | Votre identifiant - pré-rempli automatiquement |

Au moins un des champs **n° Pièce** ou **OF** doit être renseigné pour pouvoir valider.

### Tableau "Sous-ensembles utilisés"

Ce tableau correspond aux composants soudés :

| Colonne | Description |
|---|---|
| **OP n°** | Numéro de l'opération du sous-ensemble (obligatoire si une pièce est renseignée) |
| **N° Pièce D** | Numéro de la pièce côté Droit |
| **Retouché O/N** | Case à cocher si la pièce D a été retouchée |
| **N° Pièce G** | Numéro de la pièce côté Gauche |
| **Retouché O/N** | Case à cocher si la pièce G a été retouchée |

> Remplissez uniquement les lignes correspondant aux sous-ensembles réellement utilisés. Les lignes vides sont ignorées. Si vous renseignez une pièce D ou G, le champ **OP n°** devient obligatoire (il s'affiche en orange si oublié).

### Zone "Infos et Commentaires"

Utilisez cette zone pour noter toute observation : défaut constaté, condition particulière, remarque pour le responsable qualité. Ce texte apparaîtra dans le rapport PDF.

### Schéma de référence (carousel)

Si un schéma a été chargé par le Manager pour votre OP, il s'affiche dans la zone centrale. Utilisez les flèches gauche/droite pour naviguer entre plusieurs schémas. Ce schéma est en **lecture seule** - c'est une référence visuelle pour vous aider.

### Tableau des Cordons (Conformité Soudure)

C'est la zone principale de vérification. Pour **chaque cordon** listé :

| Bouton | Signification | Couleur |
|---|---|---|
| **OK** | Soudure conforme | Vert |
| **Ret.** | Soudure retouchée | Orange |
| **N.C.** | Non conforme | Rouge |

Cliquez sur le bouton correspondant à l'état réel de chaque cordon après inspection.

> Le statut de conformité global (en haut de la fiche) se calcule automatiquement : **Conforme** si tous les cordons sont OK, **Retouché** si au moins un cordon est retouché, **Non Conforme** si au moins un cordon est NC.

---

## Valider et enregistrer

Une fois tous les champs renseignés, cliquez sur le bouton **Valider la pièce** en bas de l'écran.

Vous êtes redirigé vers l'écran d'accueil. La pièce apparaît dans la liste avec le badge de statut coloré correspondant.

<details>
<summary>Le bouton "Valider la pièce" est grisé - pourquoi ?</summary>

Le bouton est actif seulement si :
- Au moins un des champs **n° Pièce** ou **OF** est renseigné
- Toutes les lignes de sous-ensembles avec une pièce renseignée ont aussi un **OP n°**

Vérifiez ces deux points et réessayez.

</details>

---

## Retrouver une vérification existante

Sur l'écran d'accueil, après avoir sélectionné votre OP, la colonne de droite liste toutes les vérifications enregistrées pour ce poste.

Chaque carte affiche :
- Le badge de statut (vert = Conforme, orange = Retouché, rouge = NC)
- Le numéro de pièce et/ou d'OF
- Votre IPN
- La date

Cliquez sur une carte pour **rouvrir** la fiche et la modifier ou la compléter.

---

## Prendre des photos de vérification

Les photos permettent de documenter visuellement les cordons retouchés ou non conformes. Elles sont incluses dans le rapport PDF.

### Ouvrir le gestionnaire de photos

En haut à droite de la fiche de vérification, cliquez sur le bouton **Photo**.

### Ajouter une photo

1. Dans le gestionnaire, cliquez sur **Prendre / Ajouter une photo**
2. L'appareil photo du poste s'active (ou la galerie sur mobile)
3. Prenez la photo ou sélectionnez-en une
4. L'application vous demande à quel cordon associer cette photo :
   - Sélectionnez le cordon concerné parmi les cordons **retouchés** ou **non conformes**
   - Ou choisissez **Sans association** si la photo concerne l'ensemble
5. La photo est ajoutée à la liste

### Voir / Supprimer une photo

- **Voir en grand** : cliquez sur la miniature de la photo dans la liste
- **Supprimer** : cliquez sur l'icône poubelle à droite de la photo

> Les photos sont **locales à la vérification**. Elles sont enregistrées avec la fiche et apparaîtront dans le PDF.

---

## Exporter le PDF de l'opération

Pour générer le PDF de **l'opération en cours** uniquement :

1. Cliquez sur le bouton **PDF** (à gauche du bouton Photo, en haut à droite de la fiche)
2. Le PDF se télécharge automatiquement

Le PDF contient :
- L'en-tête CQS avec projet, organe, OP et OF
- Le statut de conformité coloré
- Le commentaire éventuel
- Le tableau des cordons avec leurs statuts
- Le tableau des sous-ensembles
- Les schémas de référence
- Les photos de vérification avec leur cordon associé

> Pour exporter **toutes les OP** d'un organe en un seul PDF, utilisez le bouton **Exporter PDF** sur l'écran d'accueil (voir [Guide Manager](guide-manager.md)).

---

## Supprimer une vérification

### Supprimer une seule vérification

Sur l'écran d'accueil, chaque carte de vérification a une **icône poubelle rouge** à droite. Cliquez dessus et confirmez la suppression.

### Supprimer plusieurs vérifications à la fois

Cliquez sur le bouton **Supprimer tout** (en bas de l'écran d'accueil). Une fenêtre s'ouvre avec la liste de toutes les vérifications, toutes cochées par défaut.

- **Décochez** celles que vous souhaitez **conserver**
- Utilisez **Tout désélectionner** pour ne rien supprimer puis cochez seulement ce que vous voulez supprimer
- Cliquez sur **Supprimer (N)** pour confirmer

> La suppression est **irréversible**. Assurez-vous d'avoir exporté le PDF avant de supprimer si vous avez besoin de garder une trace.
