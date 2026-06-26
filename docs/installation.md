# Installation - CQS

Ce guide couvre la mise en place complète du projet CQS sur un poste Windows, que vous utilisiez **XAMPP standard** (avec installeur) ou **XAMPP Lite / Portable** (sans installation, sans droits admin).

---

## Sommaire

- [Prérequis](#prérequis)
- [Option A - XAMPP standard (installeur)](#option-a--xampp-standard-installeur)
- [Option B - XAMPP Lite / Portable (sans droits admin)](#option-b--xampp-lite--portable-sans-droits-admin)
- [Étapes communes : importer la base de données](#étapes-communes--importer-la-base-de-données)
- [Étapes communes : installer les fichiers du projet](#étapes-communes--installer-les-fichiers-du-projet)
- [Vérifier que tout fonctionne](#vérifier-que-tout-fonctionne)
- [Mettre à jour le projet](#mettre-à-jour-le-projet)

---

## Prérequis

- Windows 10 ou 11
- Connexion internet (uniquement pour télécharger XAMPP et le projet)
- Navigateur web (Chrome, Edge, Firefox)

Aucune compétence technique particulière n'est requise. Suivez les étapes dans l'ordre.

---

## Option A - XAMPP standard (installeur)

> Nécessite des droits administrateur sur le poste pour l'installation initiale.

### 1. Télécharger XAMPP

1. Ouvrez votre navigateur et allez sur **https://www.apachefriends.org/fr/index.html**
2. Cliquez sur **Télécharger XAMPP pour Windows**
3. Enregistrez le fichier `.exe` (environ 160 Mo) dans votre dossier Téléchargements

### 2. Installer XAMPP

1. Double-cliquez sur le fichier téléchargé (`xampp-windows-x64-x.x.x-installer.exe`)
2. Si Windows demande une confirmation, cliquez **Oui**
3. Cliquez **Next** sur chaque écran en laissant les options par défaut
4. Le dossier d'installation par défaut est `C:\xampp` - **ne pas changer ce chemin**
5. Cliquez **Install** et attendez la fin de l'installation (~2 minutes)
6. À la fin, cochez **Do you want to start the Control Panel now?** puis cliquez **Finish**

### 3. Démarrer Apache et MySQL

Le **XAMPP Control Panel** s'ouvre automatiquement. Si ce n'est pas le cas, cherchez **XAMPP Control Panel** dans le menu Démarrer.

1. En face de **Apache**, cliquez sur le bouton **Start** → la ligne devient verte
2. En face de **MySQL**, cliquez sur le bouton **Start** → la ligne devient verte

> Si les boutons restent rouges ou si un message d'erreur s'affiche, consultez la section [FAQ & Dépannage](faq.md).

Les deux services doivent être **verts** avant de continuer.

---

## Option B - XAMPP Lite / Portable (sans droits admin)

> Ne nécessite pas de droits administrateur. Fonctionne depuis n'importe quel dossier (Bureau, clé USB, etc.).

### 1. Télécharger XAMPP Portable

1. Allez sur **https://www.apachefriends.org/fr/index.html**
2. Téléchargez la version **Windows** (fichier `.exe`)
3. Si vous ne pouvez pas lancer un `.exe`, cherchez la version **ZIP / Portable** sur la même page ou sur **https://sourceforge.net/projects/xampp/files/XAMPP%20Windows/**

<details>
<summary>Je n'arrive pas à lancer l'installeur (droits insuffisants)</summary>

Si l'installeur est bloqué par les droits, une alternative est d'utiliser un PC avec droits admin pour faire l'installation une première fois dans `C:\xampp`, puis de copier intégralement le dossier `C:\xampp` sur une clé USB ou dans un dossier partagé. Il fonctionne de manière portable une fois copié.

</details>

### 2. Extraire XAMPP

1. Faites un clic droit sur le fichier téléchargé → **Extraire tout** (ou utilisez 7-Zip si disponible)
2. Choisissez un emplacement : par exemple `C:\Users\VotreNom\xampp` ou `D:\xampp` ou directement sur le Bureau
3. Attendez l'extraction complète (~3 minutes)

### 3. Démarrer le Control Panel

1. Ouvrez le dossier `xampp` extrait
2. Double-cliquez sur **xampp-control.exe**
3. Cliquez **Start** en face de **Apache** → ligne verte
4. Cliquez **Start** en face de **MySQL** → ligne verte

---

## Étapes communes : importer la base de données

Ces étapes sont **identiques** pour XAMPP standard et XAMPP Lite.

### 1. Télécharger les fichiers du projet

1. Allez sur **https://github.com/davidsangouard/Renault-CQS**
2. Cliquez sur le bouton vert **Code** (en haut à droite)
3. Cliquez sur **Download ZIP**
4. Enregistrez et extrayez le ZIP - vous obtenez un dossier `Renault-CQS-main`

### 2. Ouvrir phpMyAdmin

phpMyAdmin est l'interface web pour gérer la base de données.

1. Ouvrez votre navigateur
2. Tapez dans la barre d'adresse : **http://localhost/phpmyadmin**
3. Appuyez sur Entrée

La page phpMyAdmin s'affiche. Si elle ne s'affiche pas, vérifiez que Apache et MySQL sont bien démarrés (étapes précédentes).

### 3. Créer la base de données

1. Dans le menu de gauche, cliquez sur **Nouvelle base de données** (ou **New** selon la version)
2. Dans le champ **Nom de la base de données**, tapez exactement : `cqs_db`
3. Dans le menu déroulant à droite, sélectionnez **utf8mb4_unicode_ci**
4. Cliquez sur **Créer**

La base `cqs_db` apparaît maintenant dans le menu de gauche.

### 4. Importer le schéma SQL

1. Cliquez sur **cqs_db** dans le menu de gauche pour la sélectionner
2. Cliquez sur l'onglet **Importer** (en haut de la page)
3. Cliquez sur **Choisir un fichier**
4. Naviguez jusqu'au dossier extrait `Renault-CQS-main`
5. Sélectionnez le fichier **`setup.sql`**
6. Laissez toutes les options par défaut
7. Cliquez sur **Importer** (bouton en bas de page)

Un message vert s'affiche : **L'importation a réussi**. Les tables de la base sont maintenant créées.

<details>
<summary>Je vois une erreur lors de l'import</summary>

**Erreur "Table already exists"** : La base a déjà été importée. Cliquez sur chaque table dans le menu de gauche et supprimez-la avant de recommencer, ou utilisez l'option **Supprimer** dans phpMyAdmin sur la base entière et recommencez depuis l'étape 3.

**Erreur "Access denied"** : Vérifiez que vous avez bien sélectionné `cqs_db` avant de cliquer sur Importer.

**Le fichier est trop grand** : Allez dans `C:\xampp\php\php.ini`, cherchez `upload_max_filesize` et augmentez la valeur à `32M`. Redémarrez Apache.

</details>

---

## Étapes communes : installer les fichiers du projet

### 1. Copier les fichiers

Vous avez besoin de trouver le dossier **htdocs** de XAMPP :
- XAMPP standard : `C:\xampp\htdocs\`
- XAMPP Lite / Portable : `[dossier d'extraction]\xampp\htdocs\`

**Procédure :**

1. Ouvrez l'explorateur Windows
2. Naviguez jusqu'au dossier `Renault-CQS-main` extrait précédemment
3. Copiez le contenu **entier** du dossier (Ctrl+A puis Ctrl+C)
4. Naviguez jusqu'au dossier `htdocs`
5. Créez un nouveau dossier nommé **`cqs`** à l'intérieur de `htdocs`
6. Ouvrez ce dossier `cqs` et collez (Ctrl+V)

La structure finale doit ressembler à :

```
htdocs/
└── cqs/
    ├── api/
    ├── js/
    ├── index.html
    ├── setup.sql
    └── ...
```

<details>
<summary>Quels fichiers dois-je copier exactement ?</summary>

Copiez **tout** le contenu du dossier `Renault-CQS-main`. Les dossiers importants sont :
- `api/` - le code serveur PHP
- `js/` - l'interface React
- `index.html` - la page principale
- `setup.sql` - le schéma de base de données (déjà importé, pas utilisé au runtime)
- `migrate.sql` - migrations (non nécessaire pour un premier déploiement)

Les fichiers `README.md` et le dossier `docs/` sont de la documentation, vous pouvez les inclure ou non.

</details>

### 2. Vérifier les permissions

Sur XAMPP, les fichiers dans `htdocs` sont accessibles directement. Aucune configuration supplémentaire n'est nécessaire.

---

## Vérifier que tout fonctionne

1. Ouvrez votre navigateur
2. Tapez : **http://localhost/cqs/**
3. Appuyez sur Entrée

L'écran de connexion CQS doit s'afficher avec le logo **CQS** et un champ **IPN**.

<details>
<summary>La page ne s'affiche pas ou affiche une erreur</summary>

**Page blanche ou "Not Found"** : Vérifiez que les fichiers sont bien dans `htdocs/cqs/` et que `index.html` existe dans ce dossier.

**Erreur PHP** : Vérifiez qu'Apache est démarré (ligne verte dans XAMPP Control Panel).

**Erreur de base de données** : Vérifiez que MySQL est démarré et que vous avez bien créé la base `cqs_db` et importé `setup.sql`.

**Écran de chargement infini** : Ouvrez la console du navigateur (F12 → Onglet Console) et regardez le message d'erreur. Consultez la [FAQ](faq.md) avec ce message.

Pour toute autre erreur, consultez [FAQ & Dépannage](faq.md).

</details>

---

## Mettre à jour le projet

Quand une nouvelle version du projet est disponible sur GitHub :

1. Téléchargez le nouveau ZIP depuis GitHub (bouton Code → Download ZIP)
2. Extrayez-le
3. Copiez les dossiers **`api/`** et **`js/`** ainsi que **`index.html`** vers `htdocs/cqs/` en remplaçant les fichiers existants
4. Si `setup.sql` a été modifié (indiqué dans les notes de version) : ouvrez phpMyAdmin, sélectionnez `cqs_db`, puis importez le nouveau `setup.sql` (il est conçu pour être rejoué sans perte de données)

> Les données de vérification ne sont **jamais perdues** lors d'une mise à jour, sauf si vous supprimez manuellement la base de données.
