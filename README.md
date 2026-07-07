# Zephyr Mail

Extension Firefox pour emails jetables, alias privés, anti-spam et protection de la vie privée.

## Fonctionnalités

- **Emails jetables** : générez des adresses temporaires aléatoires ou personnalisées
- **Boîte de réception intégrée** : lisez et gérez vos messages sans quitter le navigateur
- **Alias & masking** : créez des alias uniques pour chaque site
- **Remplissage automatique** : injectez une adresse jetable dans n'importe quel champ email
- **Anti-spam** : protégez votre adresse réelle
- **Notifications** : soyez alerté des nouveaux messages
- **Totalement privé** : toutes les données restent locales

## Installation

1. Téléchargez la dernière version depuis [Releases](https://github.com/werlist99/zephyr-mail/releases)
2. Ouvrez `about:debugging` dans Firefox
3. Cliquez sur "Ce Firefox" → "Extension temporaire"
4. Sélectionnez le fichier `manifest.json`

Ou installez depuis les [sorties](https://github.com/werlist99/zephyr-mail/releases) (fichier `.xpi`).

## Développement

```bash
git clone https://github.com/werlist99/zephyr-mail.git
cd zephyr-mail
```

Chargez l'extension temporairement via `about:debugging` pour tester.

## API

Utilise l'API publique [1secmail.com](https://www.1secmail.com/api/) — aucune inscription requise.

## Licence

MIT
