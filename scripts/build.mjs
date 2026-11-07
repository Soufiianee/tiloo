// Produit app/index.html (page autonome) à partir du fragment app/devis.html.
// devis.html est la source publiée telle quelle comme Artifact ; index.html sert à
// l'ouvrir en local ou à l'héberger (GitHub Pages, Netlify…).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'app');
const body = readFileSync(join(dir, 'devis.html'), 'utf8');
const head = body.slice(0, body.indexOf('</style>') + '</style>'.length);
const rest = body.slice(head.length);
const html = `<!doctype html>
<!-- Fichier généré par scripts/build.mjs à partir de devis.html : ne pas modifier à la main. -->
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#FFFFFF">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Store Luxe">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" type="image/png" href="icon-192.png">
<style>[hidden]{display:none!important}body{margin:0}</style>
${head}
</head>
<body>${rest}</body>
</html>
`;
writeFileSync(join(dir, 'index.html'), html);
console.log('app/index.html écrit');
