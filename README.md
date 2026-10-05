# PPV Sénégal — Prototype

Prototype commercial de plateforme Pay-Per-View pour la lutte sénégalaise.

## Fonctionnalités
- Page événement mobile-first
- Paiement Wave / Orange Money simulé
- Code PPV de démonstration
- Player compatible HLS (.m3u8), MP4, YouTube et Vimeo
- Mode faible latence HLS via hls.js
- Générateur de lien spectateur depuis l'administration
- Dashboard promoteur avec données explicitement marquées comme démonstration

## Utilisation
Ouvrir l'onglet **Promoteur**, coller le lien live communiqué par la chaîne ou le promoteur, renseigner les informations du combat et cliquer sur **Générer le lien spectateur**.

> Prototype uniquement : le lien et le code PPV sont encodés côté client et ne constituent pas une protection de production.

## Production
La version de production remplacera ce mécanisme par Supabase + paiement réel + jetons vidéo signés + CDN/LL-HLS.
