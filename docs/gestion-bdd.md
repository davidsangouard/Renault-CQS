# Gestion de la base de données - CQS

Ce guide couvre toutes les opérations sur la base de données : sauvegarde régulière, export des données, restauration après incident et transfert vers un autre poste.

---

## Sommaire

- [Pourquoi sauvegarder ?](#pourquoi-sauvegarder-)
- [Sauvegarder la base de données (export complet)](#sauvegarder-la-base-de-données-export-complet)
- [Restaurer une sauvegarde sur le même poste](#restaurer-une-sauvegarde-sur-le-même-poste)
- [Transférer la base vers un autre PC](#transférer-la-base-vers-un-autre-pc)
- [Exporter uniquement les données (sans le schéma)](#exporter-uniquement-les-données-sans-le-schéma)
- [Exporter uniquement le schéma (sans les données)](#exporter-uniquement-le-schéma-sans-les-données)
- [Planifier des sauvegardes automatiques](#planifier-des-sauvegardes-automatiques)
- [Réinitialiser complètement la base](#réinitialiser-complètement-la-base)

---

## Pourquoi sauvegarder ?

Les vérifications CQS sont stockées **localement** sur le PC qui fait tourner XAMPP. Un problème matériel, une mauvaise manipulation ou une réinstallation Windows peuvent effacer toutes les données. Il est recommandé de :

- Faire une sauvegarde **avant chaque export PDF important**
- Faire une sauvegarde **avant de mettre à jour le projet**
- Faire une sauvegarde **hebdomadaire** si l'application est utilisée en production

---

## Sauvegarder la base de données (export complet)

L'export complet inclut à la fois le **schéma** (structure des tables) et les **données** (vérifications, configuration). C'est la sauvegarde à utiliser pour tout restaurer à l'identique.

### 1. Ouvrir phpMyAdmin

1. Vérifiez que XAMPP est démarré (Apache + MySQL en vert)
2. Ouvrez votre navigateur et tapez : **http://localhost/phpmyadmin**

### 2. Sélectionner la base CQS

Dans le menu de gauche, cliquez sur **cqs_db**.

### 3. Lancer l'export

1. Cliquez sur l'onglet **Exporter** (en haut de la page)
2. Laissez la méthode sur **Rapide**
3. Laissez le format sur **SQL**
4. Cliquez sur **Exporter**

Le navigateur télécharge automatiquement un fichier nommé `cqs_db.sql`.

### 4. Archiver la sauvegarde

Enregistrez ce fichier dans un endroit sûr et identifiable, par exemple :

```
Sauvegardes-CQS/
├── cqs_db_2025-06-25.sql
├── cqs_db_2025-06-18.sql
└── cqs_db_2025-06-11.sql
```

> **Bonne pratique** : ajoutez la date dans le nom du fichier (`cqs_db_AAAA-MM-JJ.sql`) et conservez au minimum les 3 dernières sauvegardes. Stockez-les sur un lecteur réseau ou une clé USB, pas uniquement sur le PC local.

---

## Restaurer une sauvegarde sur le même poste

Utilisez cette procédure pour revenir à un état antérieur après une fausse manipulation ou une corruption de données.

> **Attention** : la restauration **remplace toutes les données actuelles** par celles de la sauvegarde. Les vérifications créées après la date de la sauvegarde seront perdues.

### 1. Supprimer la base actuelle

1. Dans phpMyAdmin, cliquez sur **cqs_db** dans le menu de gauche
2. Cliquez sur l'onglet **Opérations**
3. Faites défiler jusqu'à la section **Supprimer la base de données**
4. Cliquez sur **Supprimer la base de données** et confirmez

### 2. Recréer la base vide

1. Dans le menu de gauche, cliquez sur **Nouvelle base de données** (ou **New**)
2. Tapez `cqs_db` dans le champ de nom
3. Sélectionnez **utf8mb4_unicode_ci** dans le menu déroulant
4. Cliquez sur **Créer**

### 3. Importer la sauvegarde

1. Cliquez sur **cqs_db** dans le menu de gauche pour la sélectionner
2. Cliquez sur l'onglet **Importer**
3. Cliquez sur **Choisir un fichier**
4. Sélectionnez votre fichier de sauvegarde (`cqs_db_AAAA-MM-JJ.sql`)
5. Cliquez sur **Importer**

Un message vert confirme la réussite. L'application retrouve immédiatement l'état de la sauvegarde.

---

## Transférer la base vers un autre PC

Utilisez cette procédure pour déployer CQS sur un nouveau poste, ou pour déplacer les données d'un PC à un autre.

### Sur le PC source (celui qui a les données)

Suivez les étapes de [Sauvegarde complète](#sauvegarder-la-base-de-données-export-complet) et copiez le fichier `.sql` sur une clé USB ou un partage réseau.

### Sur le PC cible (le nouveau poste)

1. Installez XAMPP et démarrez Apache + MySQL (voir [Guide d'installation](installation.md))
2. Ouvrez phpMyAdmin : **http://localhost/phpmyadmin**
3. Créez la base `cqs_db` (utf8mb4_unicode_ci)
4. Importez le fichier `.sql` de sauvegarde

> Inutile d'importer `setup.sql` séparément : le fichier de sauvegarde contient déjà le schéma complet.

### Copier les fichiers du projet

N'oubliez pas de copier aussi le dossier `cqs/` dans le `htdocs/` du nouveau PC (voir [Installer les fichiers du projet](installation.md#étapes-communes--installer-les-fichiers-du-projet)).

---

## Exporter uniquement les données (sans le schéma)

Utile pour archiver les vérifications sans réimporter la structure de tables (par exemple, pour charger les données dans une base déjà à jour).

### Procédure

1. Dans phpMyAdmin, sélectionnez **cqs_db**
2. Cliquez sur l'onglet **Exporter**
3. Choisissez la méthode **Personnalisée**
4. Dans la section **Options de structure**, décochez **Ajouter une instruction CREATE TABLE**
5. Dans la section **Options des données**, laissez **Insérer les données** coché
6. Cliquez sur **Exporter**

Le fichier obtenu ne contient que des instructions `INSERT INTO` (les données) sans les `CREATE TABLE`.

<details>
<summary>Quand utiliser cet export ?</summary>

- Après une mise à jour du projet qui a modifié le schéma (`setup.sql` reimporté) : vous pouvez recharger uniquement les données depuis une sauvegarde antérieure sans écraser la nouvelle structure.
- Pour fusionner des données de plusieurs postes dans une base centrale.

</details>

---

## Exporter uniquement le schéma (sans les données)

Utile pour documenter la structure de la base ou préparer une installation vierge personnalisée.

### Procédure

1. Dans phpMyAdmin, sélectionnez **cqs_db**
2. Cliquez sur l'onglet **Exporter**
3. Choisissez la méthode **Personnalisée**
4. Dans la section **Options des données**, décochez **Insérer les données**
5. Cliquez sur **Exporter**

Le fichier obtenu ne contient que la structure (`CREATE TABLE`, `ALTER TABLE`, index) sans aucune donnée.

> Pour un déploiement initial propre, utilisez directement le fichier `setup.sql` du projet - il est conçu pour cet usage et gère automatiquement les migrations.

---

## Planifier des sauvegardes automatiques

XAMPP ne propose pas de planificateur de sauvegardes intégré, mais vous pouvez en créer un facilement avec le Planificateur de tâches Windows et un script batch.

### Créer le script de sauvegarde

1. Ouvrez le Bloc-notes
2. Collez le contenu suivant en adaptant le chemin de sauvegarde :

```bat
@echo off
set DATE_STR=%date:~6,4%-%date:~3,2%-%date:~0,2%
set DEST=C:\Sauvegardes-CQS\cqs_db_%DATE_STR%.sql
C:\xampp\mysql\bin\mysqldump.exe -u root --databases cqs_db > "%DEST%"
echo Sauvegarde effectuee : %DEST%
```

3. Enregistrez le fichier sous `C:\Sauvegardes-CQS\backup-cqs.bat`
4. Créez le dossier `C:\Sauvegardes-CQS\` s'il n'existe pas

> Pour XAMPP Lite / Portable, remplacez `C:\xampp` par le chemin de votre dossier XAMPP.

### Planifier l'exécution automatique

1. Ouvrez le **Planificateur de tâches Windows** (cherchez "Planificateur" dans le menu Démarrer)
2. Cliquez sur **Créer une tâche simple…**
3. Donnez un nom : `Sauvegarde CQS`
4. Choisissez la fréquence : **Hebdomadaire** (ou quotidienne selon vos besoins)
5. Choisissez l'heure (ex : 18h00, en fin de journée)
6. Action : **Démarrer un programme** → sélectionnez `C:\Sauvegardes-CQS\backup-cqs.bat`
7. Terminez la configuration

La sauvegarde s'exécutera automatiquement selon la planification, à condition que XAMPP soit démarré.

<details>
<summary>La sauvegarde automatique ne crée pas de fichier</summary>

- Vérifiez que MySQL est démarré au moment de l'exécution
- Vérifiez que le dossier `C:\Sauvegardes-CQS\` existe
- Vérifiez le chemin vers `mysqldump.exe` (adapté à XAMPP Lite si nécessaire)
- Testez d'abord le script `.bat` manuellement en double-cliquant dessus

</details>

---

## Réinitialiser complètement la base

Utilisez cette procédure pour repartir d'une base vierge, par exemple en début de nouveau chantier ou pour nettoyer des données de test.

> **Attention : toutes les vérifications et la configuration seront supprimées définitivement.** Faites une sauvegarde avant si vous souhaitez conserver les données actuelles.

### Procédure

1. Dans phpMyAdmin, cliquez sur **cqs_db** dans le menu de gauche
2. Cliquez sur l'onglet **Opérations**
3. Dans la section **Supprimer la base de données**, cliquez sur **Supprimer la base de données** et confirmez
4. Recréez la base `cqs_db` (utf8mb4_unicode_ci)
5. Importez `setup.sql` depuis le dossier du projet CQS

L'application repart avec une base vide. Les projets, organes et OP devront être reconfigurés dans le Manager.
