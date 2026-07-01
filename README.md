# 28ptech-services

Site web personnel d'Antonio Da Fonseca (**28Ctech**) — DevOps Engineer freelance.

Site statique, sans framework et sans dépendances npm. Les pages marketing sont
écrites à la main en HTML ; le **blog est pré-généré** depuis des fichiers
Markdown par `build.js`, seule étape de build du projet.

## Structure

```
index.html       — page d'accueil (FR), CTA mailto, teaser « Écrits »
freelance.html   — missions freelance (FR), CTA mailto
vibers.html      — offre Vibe Coders (FR) + formulaire de contact Formspree
en/  pt/         — versions anglaise et portugaise des 3 pages marketing
build.js         — génère le blog + sitemap.xml depuis blog/posts/
sitemap.xml      — GÉNÉRÉ — ne pas éditer à la main
robots.txt
blog/
  index.html          — GÉNÉRÉ — liste des articles + filtre par tag
  <slug>/index.html   — GÉNÉRÉ — une page statique par article (URLs propres)
  posts/
    posts.json        — métadonnées des articles (SOURCE)
    <slug>.md         — corps de l'article en Markdown (SOURCE)
assets/
  css/    base.css (tokens) · freelance.css · index.css · vibers.css · blog.css
  js/     vibers.js · home-posts.js · blog-filter.js · vendor/marked.min.js
  favicon.svg · og-image.svg → og-image.png
```

Seuls `blog/posts/*.md` et `posts.json` sont écrits à la main. Tout ce qui se
trouve dans `blog/<slug>/`, `blog/index.html` et `sitemap.xml` est **généré** :
ne jamais l'éditer directement — modifier la source et relancer le build.

## Internationalisation

Les 3 pages marketing existent en FR (racine), EN (`/en/`) et PT (`/pt/`). Le
blog reste en FR uniquement. Les traductions sont des copies statiques
maintenues à la main (pas de framework i18n) : toute modification d'une page
marketing doit être répercutée dans `en/` et `pt/`. Les pages sont reliées par
`hreflang` (fr/en/pt + x-default→FR) et un sélecteur de langue dans la nav.

## Ajouter / éditer un article de blog

1. Créer `blog/posts/<slug>.md` (slug = minuscules, chiffres, tirets). Une
   section optionnelle `## Sources` après un `---` est rendue sous la signature.
2. Ajouter l'entrée correspondante dans `blog/posts/posts.json`.
3. Générer et committer la sortie (l'hébergeur ne build pas) :

```bash
node build.js   # ou : npm run build
```

## Lancer en local

Les URLs propres nécessitent un serveur (pas `file://`) :

```bash
npx serve .
# ou
python3 -m http.server
```

## Formulaires

Seule `vibers.html` a un formulaire (Formspree), piloté par `vibers.js`.
`index.html` et `freelance.html` utilisent un CTA `mailto:`.

## Déploiement

Déploiement automatique sur Vercel à chaque push sur `main`.
