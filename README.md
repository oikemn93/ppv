# LÀMB LIVE — Prototype PPV Sénégal

Prototype commercial d'une plateforme Pay-Per-View multi-combats pour la lutte sénégalaise.

## Démo
- Catalogue de plusieurs combats
- Fiche événement + prix PPV
- Player HLS/LL-HLS, MP4, YouTube et Vimeo
- Un code PPV ne peut être actif que sur un seul appareil à la fois
- Backend de session séparé `ppv-sessions`
- PayDunya Sandbox intégré côté serveur
- Mode de paiement simulé automatique tant que les clés PayDunya ne sont pas configurées
- Dashboard promoteur et génération de lien spectateur

## PayDunya Sandbox

Configurer dans les variables d'environnement Vercel :

- `PAYDUNYA_MASTER_KEY`
- `PAYDUNYA_PRIVATE_KEY`
- `PAYDUNYA_TOKEN`

Le navigateur n'a jamais accès aux clés privées.

## Supabase

Le projet Supabase `ppv` n'a pas encore pu être créé, car le compte a atteint la limite de deux projets Free actifs. Aucune ressource Supabase existante n'a été modifiée.

Architecture prévue :
- `events` : combats et flux live
- `purchases` : paiements / transactions
- `access_codes` : codes PPV
- Admin sécurisé par Supabase Auth
- RLS sur toutes les tables exposées

Supabase ne distribuera pas la vidéo. Le flux live doit aller directement du fournisseur/CDN vers le player.

## Production cible

```
Promoteur / chaîne
    ↓ SRT
MediaLive / fournisseur live
    ↓
LL-HLS + CDN
    ↓
spectateurs

Web / API
    ├─ PayDunya / Wave / Orange Money
    ├─ Supabase PostgreSQL (événements + paiements)
    └─ service de sessions PPV / tokens vidéo
```
