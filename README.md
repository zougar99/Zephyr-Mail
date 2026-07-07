# Zephyr Mail

[![License](https://img.shields.io/badge/license-MIT-4FC3F7?style=flat-square)](LICENSE)
[![Firefox](https://img.shields.io/badge/Firefox-≥_90-FF7139?style=flat-square&logo=firefox-browser&logoColor=white)](https://www.mozilla.org/firefox)
[![Version](https://img.shields.io/badge/version-1.0.0-4FC3F7?style=flat-square)](https://github.com/zougar99/Zephyr-Mail/releases)

Extension Firefox pour la génération d'emails jetables, création d'alias privés, blocage de traqueurs et protection anti-spam. Entièrement locale et respectueuse de votre vie privée.

---

## Aperçu

| Boîte de réception | Génération d'email | Alias & réglages |
|---|---|---|
| ![](https://via.placeholder.com/380x400/1a1a2e/4FC3F7?text=Inbox) | ![](https://via.placeholder.com/380x400/1a1a2e/4FC3F7?text=Generate) | ![](https://via.placeholder.com/380x400/1a1a2e/4FC3F7?text=Alias) |

## Fonctionnalités

- **Emails jetables** — génération d'adresses temporaires aléatoires ou personnalisées en un clic
- **Boîte de réception intégrée** — consultation et gestion des messages sans quitter le navigateur
- **Alias & email masking** — création d'alias uniques par service pour protéger votre identité
- **Injection automatique** — insertion d'une adresse jetable dans n'importe quel champ email (`<input>`, `<textarea>`)
- **Menu contextuel** — génération rapide via clic droit sur un champ éditable
- **Notifications** — alertes en temps réel à l'arrivée de nouveaux messages
- **Anti-spam & blocage de tracking** — filtrage des pixels espions et contenus indésirables
- **Poling automatique** — vérification périodique des nouvelles messages (intervalle configurable)
- **100 % local** — aucune donnée personnelle transmise, tout reste sur votre machine
- **Thème sombre** — interface sobre et lisible, respectueuse des yeux

## Installation

### Depuis les releases (recommandé)

1. Rendez-vous dans la [section Releases](https://github.com/zougar99/Zephyr-Mail/releases)
2. Téléchargez le fichier `.xpi` de la dernière version
3. Ouvrez Firefox, glissez-déposez le fichier `.xpi` dans la fenêtre du navigateur
4. Cliquez sur **Ajouter** dans la boîte de dialogue

### Mode développeur (temporaire)

1. Clonez le dépôt :

   ```bash
   git clone https://github.com/zougar99/Zephyr-Mail.git
   cd Zephyr-Mail
   ```

2. Ouvrez Firefox et naviguez vers `about:debugging`
3. Cliquez sur **Ce Firefox** → **Extension temporaire**
4. Sélectionnez le fichier `manifest.json` du projet

## Utilisation

### Générer une adresse

- **Aléatoire** : ouvrez le panneau Zephyr Mail → onglet **Générer** → cliquez sur **Aléatoire**
- **Personnalisée** : saisissez un préfixe dans le champ, choisissez un domaine, cliquez sur **Créer**
- **Depuis un champ email** : focus sur un champ → cliquez sur le bouton Zephyr qui apparaît à droite

### Consulter les messages

- L'onglet **Boîte** affiche la liste des messages reçus pour l'adresse sélectionnée
- Cliquez sur un message pour lire son contenu (texte ou HTML)

### Créer un alias

- Onglet **Alias** → saisissez un préfixe (ex: `twitter`, `amazon`) → **Créer l'alias**
- L'alias généré suit le format : `prefixe+zephyr@domaine`

### Réglages

- **Notifications** : activer/désactiver les alertes de nouveaux messages
- **Auto-générer** : afficher automatiquement le bouton d'injection sur les champs email
- **Intervalle** : fréquence de vérification de la boîte de réception (5-120 secondes)

## Architecture

```
zephyr-mail/
├── icons/              # Icônes SVG (16×16, 48×48, 128×128)
│   ├── icon16.svg
│   ├── icon48.svg
│   └── icon128.svg
├── background.js       # Script d'arrière-plan (API, polling, stockage)
├── content.js          # Script de contenu (injection dans les pages)
├── manifest.json       # Configuration de l'extension
├── popup.html          # Interface du popup
├── popup.js            # Logique du popup
├── popup.css           # Styles du popup
├── README.md
└── .gitignore
```

## API

Zephyr Mail utilise l'API publique gratuite de **[1secmail.com](https://www.1secmail.com/api/v1/)** :

| Action | Endpoint | Description |
|---|---|---|
| Messages | `?action=getMessages&login=...&domain=...` | Liste des messages |
| Lecture | `?action=readMessage&login=...&domain=...&id=...` | Contenu d'un message |
| Suppression | `?action=deleteMailbox&login=...&domain=...` | Suppression de la boîte |

Aucune inscription ni clé API requise.

## Développement

```bash
# Cloner
git clone https://github.com/zougar99/Zephyr-Mail.git
cd Zephyr-Mail

# Charger dans Firefox
# about:debugging → Ce Firefox → Extension temporaire → manifest.json
```

### Build de l'extension signée (AMO)

1. Compressez les fichiers :
   ```bash
   zip -r zephyr-mail.zip . -x ".git/*" ".gitignore" "*.md"
   ```
2. Soumettez le fichier `.zip` sur [addons.mozilla.org](https://addons.mozilla.org/fr/developers/addons)

## Compatibilité

| Navigateur | Statut |
|---|---|
| Firefox Desktop 90+ | Supporté |
| Firefox Android | Supporté (testé) |
| Chrome / Chromium | Non testé (MV2) |
| Thunderbird | Non supporté |

## Licence

Ce projet est distribué sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus d'informations.

---

Développé par [@werlist99](https://t.me/werlist99)
