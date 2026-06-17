# Pour lancer le projet

## En mode dev

### Pour la bdd

- Renommer .env.example en .env

- Changer les variables et les faire correspondre dans le DATABASE_URL

- Lancer la commande `docker compose up --build -d`

- Lancer la commande `npm install`

- Lancer la commande `docker exec -it backend npx prisma migrate deploy`

- Lancer la commande `docker exec -it backend npx prisma generate` pour générer les nouveaux types des modèle qui seront utilisés par le client Prisma

- Lancer la commande `docker exec -it backend npx prisma db seed`

### Comptes de démo

- Client famille : `sophie.martin@example.com` / `Password123!`
- Admin : `admin.demo@example.com` / `Admin123!`
- Admin opérations : `operations.admin@example.com` / `Admin123!`

### Pour le front

- Lancer la commande `npm run dev`

## En mode prod

- À voir

## Architecture du projet

- Le dossier `/app` contient la logique du front

- Le dossier `/app/api` contient la logique backend ainsi que la déclaration des routes. Le système de routage est le même que Next.js pour le front. Tout passe par le nom des dossiers et les fichiers route.ts contiennent la logique pour chaque verbe HTTP (GET, POST, PUT, etc..)

- Le dossier `/lib` centralise la logique métier (gestion utilisateur et tout...)

- Le dossier `/prisma` contient la définition des modèles et les migrations.

### Pour créer une migration:

- Modifier le fichier `/prisma/schema.prisma` pour y modifier les modèles ou en ajouter d'autres

- Lancer la commande `npx prisma migrate dev --name <now_nouvelle_migration>`

- Lancer la commande `npx prisma generate` pour générer les nouveaux types des modèle qui seront utilisés par le client Prisma

### ANDROID

Depuis la racine du projet:

```bash
docker build -t hackathon-capacitor -f frontend/Dockerfile.capacitor frontend

docker create --name temp-cap hackathon-capacitor

docker cp temp-cap:/app/android/app/build/outputs/apk/debug/app-debug.apk ./app-debug.apk

docker rm temp-cap
```

L'APK est généré dans `./app-debug.apk`.
