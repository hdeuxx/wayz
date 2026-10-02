# Wayz

Application mobile de signalement d'incidents géolocalisés (type Waze minimaliste).

- `mobile/` : React Native (Expo SDK 57), `react-native-maps`, `expo-location`, `expo-camera`, `expo-notifications`
- `backend/` : Node.js + Express + SQLite (`better-sqlite3`), upload de photos avec `multer`

## Lancer le backend

```bash
cd backend
npm install
npm start        # port 3000
npm test
```

Variables : `PORT` (défaut 3000), `DATA_DIR` (base SQLite et photos, défaut `backend/data`).

## Lancer l'application

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=https://<url-du-backend> npx expo start
```

Scanner le QR code avec Expo Go. Les notifications push distantes demandent un development build sur Android.

## API REST

| Méthode | Route | Description |
| --- | --- | --- |
| GET | `/incidents` | Incidents actifs |
| GET | `/incidents/:id` | Un incident |
| POST | `/incidents` | Créer (multipart, champ `photo` optionnel) |
| PUT | `/incidents/:id` | Modifier `type` / `description` |
| DELETE | `/incidents/:id` | Supprimer |
| POST | `/incidents/:id/confirm` | « Toujours présent » |
| POST | `/incidents/:id/dismiss` | « Plus présent » |
| PUT | `/devices` | Enregistrer le token push et la position |

Les créations et votes exigent `user_latitude` / `user_longitude` à moins de 200 m de l'incident (sinon 403).

## Types d'incidents

`accident`, `traffic_jam`, `roadworks`, `road_hazard`, `police`, `obstacle`, `dangerous_weather`, `broken_down_vehicle`.

## Cycle de vie

- Durée de vie initiale : 30 min.
- « Toujours présent » : `confirmed_count` + 1 et l'expiration repart à 30 min.
- « Plus présent » : `dismissed_count` + 1 et l'expiration est réduite de 10 min.
- Expiration anticipée si `dismissed_count >= confirmed_count + 3`.
- `GET /incidents` ne renvoie que les incidents dont `expires_at` n'est pas dépassé.

## Déploiement

`render.yaml` à la racine du dépôt décrit un service Docker pour Render. Sur l'offre gratuite, le disque est éphémère : la base et les photos sont perdues à chaque redéploiement ou mise en veille.
