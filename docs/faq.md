# FAQ & Dépannage - CQS

---

## Sommaire

- [Problèmes de démarrage (XAMPP)](#problèmes-de-démarrage-xampp)
- [Problèmes d'accès à l'application](#problèmes-daccès-à-lapplication)
- [Problèmes de base de données](#problèmes-de-base-de-données)
- [Problèmes d'upload d'images](#problèmes-dupload-dimages)
- [Problèmes d'export PDF](#problèmes-dexport-pdf)
- [Questions générales](#questions-générales)

---

## Problèmes de démarrage (XAMPP)

<details>
<summary>Apache ne démarre pas (bouton rouge dans le Control Panel)</summary>

**Cause la plus fréquente** : un autre programme utilise déjà le port 80 (Skype, IIS, autre instance d'Apache).

**Solution A - Identifier et fermer le programme qui bloque :**
1. Ouvrez le gestionnaire des tâches (Ctrl+Shift+Échap)
2. Cherchez un processus nommé `httpd.exe`, `iisexpress.exe` ou `skype.exe`
3. Terminez le processus conflictuel
4. Relancez Apache dans XAMPP

**Solution B - Changer le port d'Apache :**
1. Dans XAMPP Control Panel, cliquez sur **Config** à droite d'Apache → **httpd.conf**
2. Trouvez la ligne `Listen 80` et remplacez par `Listen 8080`
3. Sauvegardez et redémarrez Apache
4. L'application sera accessible sur **http://localhost:8080/cqs/**

</details>

<details>
<summary>MySQL ne démarre pas (bouton rouge)</summary>

**Cause la plus fréquente** : le port 3306 est déjà utilisé, ou les données MySQL sont corrompues.

**Solution A - Port déjà utilisé :**
1. Ouvrez l'invite de commande (Windows + R → tapez `cmd` → Entrée)
2. Tapez : `netstat -ano | findstr :3306`
3. Notez le PID affiché
4. Dans le gestionnaire des tâches, terminez le processus avec ce PID
5. Relancez MySQL

**Solution B - Données corrompues (dernier recours) :**
> Attention : cette opération supprime toutes les données. Exportez d'abord via phpMyAdmin si possible.
1. Arrêtez MySQL dans XAMPP
2. Renommez le dossier `C:\xampp\mysql\data` en `C:\xampp\mysql\data_old`
3. Copiez `C:\xampp\mysql\backup` vers `C:\xampp\mysql\data`
4. Redémarrez MySQL
5. Réimportez `setup.sql` dans phpMyAdmin

</details>

<details>
<summary>XAMPP affiche "Busy" ou ne répond pas</summary>

Fermez complètement le XAMPP Control Panel via Clic droit sur l'icône dans la barre des tâches → Quitter. Relancez-le en tant qu'administrateur (clic droit → Exécuter en tant qu'administrateur).

</details>

---

## Problèmes d'accès à l'application

<details>
<summary>La page http://localhost/cqs/ affiche "Not Found" (404)</summary>

Les fichiers ne sont pas au bon endroit.

**Vérification :**
1. Ouvrez l'explorateur Windows
2. Naviguez jusqu'à `C:\xampp\htdocs\cqs\` (pour XAMPP standard)
3. Vérifiez que `index.html` existe dans ce dossier

Si le dossier `cqs` n'existe pas ou si `index.html` est absent, recommencez l'étape [Installer les fichiers du projet](installation.md#étapes-communes--installer-les-fichiers-du-projet).

</details>

<details>
<summary>La page s'affiche mais reste bloquée sur "Chargement…"</summary>

C'est généralement un problème de connexion à la base de données.

**Diagnostic :**
1. Appuyez sur **F12** dans votre navigateur pour ouvrir les outils de développement
2. Cliquez sur l'onglet **Console**
3. Recherchez une ligne rouge contenant `Failed to fetch` ou `auth.php`

**Si vous voyez une erreur de type "Failed to fetch auth.php" :**
- Vérifiez que MySQL est bien démarré (ligne verte dans XAMPP)
- Vérifiez que la base `cqs_db` existe dans phpMyAdmin
- Vérifiez que `setup.sql` a bien été importé

**Si vous voyez "SQLSTATE" ou "Access denied" :**
- La base de données a un problème de permission. Ouvrez phpMyAdmin, vérifiez que l'utilisateur `root` peut accéder à `cqs_db`.

</details>

<details>
<summary>La page affiche une erreur PHP (fond blanc avec du texte d'erreur)</summary>

**"Call to undefined function"** : Une extension PHP est désactivée. Ouvrez `C:\xampp\php\php.ini`, cherchez `extension=pdo_mysql` et retirez le `;` au début de la ligne si présent. Redémarrez Apache.

**"No such file or directory"** : Un fichier PHP du projet est manquant. Vérifiez que le dossier `api/` est bien présent dans `htdocs/cqs/` et contient tous les fichiers PHP.

**"Class 'PDO' not found"** : Même solution que ci-dessus pour `extension=pdo_mysql`.

</details>

<details>
<summary>J'accède à l'application depuis un autre PC du réseau</summary>

Par défaut, XAMPP n'accepte les connexions que depuis `localhost` (le PC où il tourne). Pour permettre l'accès depuis d'autres postes du réseau local :

1. Dans XAMPP, ouvrez la configuration Apache (Config → httpd.conf)
2. Trouvez les blocs `<Directory "...">` et changez `Require local` en `Require all granted`
3. Redémarrez Apache
4. Accédez via l'adresse IP du PC serveur : `http://192.168.x.x/cqs/`

> Notez que cela ouvre l'accès à **tout le réseau local**. À faire uniquement sur un réseau interne sécurisé.

</details>

---

## Problèmes de base de données

<details>
<summary>phpMyAdmin affiche "Aucune base de données sélectionnée"</summary>

La base `cqs_db` n'a pas encore été créée. Suivez les étapes [Importer la base de données](installation.md#étapes-communes--importer-la-base-de-données) depuis le début.

</details>

<details>
<summary>L'import de setup.sql échoue avec une erreur</summary>

**"Table 'xxx' already exists"** : La base a déjà été partiellement importée. Dans phpMyAdmin, sélectionnez `cqs_db`, allez dans l'onglet **Opérations** → **Supprimer la base de données**. Recréez-la et réimportez.

**"MySQL server has gone away"** : Le fichier SQL est trop grand pour la limite par défaut. Dans `C:\xampp\php\php.ini`, augmentez `max_execution_time` à `300` et `post_max_size` à `64M`. Redémarrez Apache et réessayez.

**"You have an error in your SQL syntax"** : Assurez-vous que le fichier importé est bien `setup.sql` depuis le dossier du projet CQS, et non un autre fichier SQL.

</details>

<details>
<summary>Les données disparaissent à chaque redémarrage</summary>

Cela n'arrive normalement pas avec XAMPP. Si c'est le cas, vérifiez que MySQL pointe bien vers un dossier `data` persistant. Dans le XAMPP Control Panel → Config → my.ini, vérifiez que `datadir` pointe vers `C:/xampp/mysql/data`.

</details>

<details>
<summary>Comment sauvegarder, restaurer ou transférer les données ?</summary>

Consultez le guide dédié : **[Gestion de la base de données](gestion-bdd.md)**

Il couvre : sauvegarde complète, restauration, transfert vers un autre PC, export données seules, sauvegardes automatiques et réinitialisation.

</details>

---

## Problèmes d'upload d'images

<details>
<summary>Les schémas uploadés via le Manager ne s'affichent pas sur la fiche de vérification</summary>

Attendez quelques secondes et actualisez la page de vérification (F5). Si le problème persiste :
1. Vérifiez dans phpMyAdmin que la table `op_schema_images` contient bien des entrées
2. Vérifiez que l'organe et l'OP correspondent exactement entre l'upload et la page de vérification

</details>

<details>
<summary>L'upload d'image échoue avec une erreur "imageData requis"</summary>

Ce message indique que le fichier image était trop grand avant compression, ou que la connexion au serveur local a été interrompue. Solutions :

1. Essayez avec une image plus petite (< 5 Mo)
2. Vérifiez que la résolution de l'image n'est pas extrêmement élevée (> 20 mégapixels)
3. Dans `C:\xampp\php\php.ini`, augmentez `post_max_size` à `64M` et redémarrez Apache

</details>

<details>
<summary>Message "Maximum 10 images par opération atteint"</summary>

Chaque OP accepte au maximum 10 schémas de référence. Supprimez les images obsolètes dans l'onglet Fiches du Manager avant d'en ajouter de nouvelles.

</details>

---

## Problèmes d'export PDF

<details>
<summary>Le PDF généré est vide ou incomplet</summary>

Vérifiez que les vérifications ont bien le statut **"done"** (Conforme ou Retouché). Les vérifications avec le statut "En cours" ou "À faire" ne sont pas incluses dans le rapport global.

</details>

<details>
<summary>Les images n'apparaissent pas dans le PDF</summary>

Les images schémas et les photos sont incluses dans le PDF seulement si elles ont été chargées correctement. Si elles sont absentes :
- Pour les schémas : vérifiez qu'ils sont bien uploadés dans l'onglet Fiches du Manager
- Pour les photos : vérifiez qu'elles ont bien été prises et enregistrées dans le gestionnaire de photos de la fiche

</details>

<details>
<summary>Le bouton "Exporter PDF" ne fait rien</summary>

La bibliothèque jsPDF se charge depuis internet (CDN). Si le poste n'a pas accès à internet, le PDF ne peut pas être généré. Dans ce cas, une connexion internet momentanée est nécessaire pour le premier chargement, puis la bibliothèque reste en cache navigateur pour les usages ultérieurs.

</details>

---

## Questions générales

<details>
<summary>L'application fonctionne-t-elle hors ligne ?</summary>

**Partiellement.** La partie PHP et MySQL est locale et fonctionne sans internet. En revanche, les bibliothèques React, jsPDF et la police DM Sans se chargent depuis des CDN (internet requis au premier chargement). Une fois en cache dans le navigateur, l'application fonctionne hors ligne pour la saisie des vérifications. L'export PDF peut échouer hors ligne si le cache est vide.

Pour un usage 100% hors ligne, il faudrait télécharger les bibliothèques localement et modifier `index.html` pour pointer vers les fichiers locaux.

</details>

<details>
<summary>Peut-on utiliser l'application sur plusieurs postes en même temps ?</summary>

Oui, si XAMPP tourne sur un PC "serveur" accessible en réseau. Consultez la question ["J'accède à l'application depuis un autre PC"](#jaccède-à-lapplication-depuis-un-autre-pc-du-réseau) pour la configuration.

Chaque poste ouvre l'application dans son navigateur en pointant vers l'adresse IP du serveur. Les données sont partagées en temps réel via la base MySQL commune.

</details>

<details>
<summary>Comment changer le code Manager ?</summary>

Le code Manager est stocké dans la configuration de l'application en base de données. Pour le modifier :
1. Connectez-vous avec le code Manager actuel
2. Accédez à l'onglet **Configuration** du Manager
3. Trouvez le champ **Code Manager** et modifiez-le
4. Sauvegardez

Si vous avez perdu le code Manager, ouvrez phpMyAdmin → table `config` → modifiez le champ `manager_code` directement.

</details>

<details>
<summary>L'application est-elle compatible avec les tablettes / smartphones ?</summary>

Oui. L'interface est responsive et pensée pour un usage tactile (boutons de cordons larges, modal photo adapté). Elle fonctionne dans Chrome, Safari et Edge sur tablette ou smartphone, à condition que l'appareil soit sur le même réseau Wi-Fi que le poste XAMPP.

</details>

<details>
<summary>Comment mettre à jour l'application ?</summary>

Voir la section [Mettre à jour le projet](installation.md#mettre-à-jour-le-projet) dans le guide d'installation.

</details>
