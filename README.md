# Pustopoljina - Automatizovani Raspored Radnika

Kompletna web aplikacija za automatizovano kreiranje sedmičnih rasporeda radnika.

## Tehnologije
- **Frontend**: React.js, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js
- **Baza podataka**: MongoDB (Mongoose)
- **Autentifikacija**: JWT (JSON Web Token)

## Struktura Projekta
- `/client`: React aplikacija (Vite)
- `/server`: Node.js API (Express)

## API Dokumentacija

### Autentifikacija
- `POST /api/auth/register`: Registracija novog administratora
- `POST /api/auth/login`: Prijava i dobijanje JWT tokena

### Radnici
- `GET /api/workers`: Lista svih radnika
- `POST /api/workers`: Dodavanje novog radnika
- `PUT /api/workers/:id`: Izmjena podataka radnika
- `DELETE /api/workers/:id`: Brisanje radnika

### Kategorije
- `GET /api/categories`: Lista kategorija
- `POST /api/categories`: Dodavanje nove kategorije
- `PUT /api/categories/:id`: Izmjena kategorije
- `DELETE /api/categories/:id`: Brisanje kategorije

### Odsutnosti
- `GET /api/absences`: Pregled svih odsutnosti
- `POST /api/absences`: Evidencija nove odsutnosti
- `DELETE /api/absences/:id`: Brisanje odsutnosti

### Rasporedi
- `GET /api/schedules`: Svi sačuvani rasporedi
- `POST /api/schedules/generate`: Pokretanje algoritma za generisanje rasporeda
- `DELETE /api/schedules/:weekStart`: Brisanje rasporeda za određenu sedmicu

## Deployment (Objavljivanje)

Pošto je ovo full-stack aplikacija, preporučuje se razdvajanje frontenda i backenda:

### 1. Backend (Node.js + MongoDB) - Preporuka: Render ili Railway
1. Povežite svoj GitHub repozitorij sa [Render.com](https://render.com).
2. Kreirajte novi "Web Service".
3. Root Directory: `server`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Dodajte Environment varijable:
   - `MONGODB_URI`: Link do vaše MongoDB Atlas baze.
   - `JWT_SECRET`: Nasumičan string za sigurnost.

### 2. Frontend (React) - Netlify
1. Povežite GitHub repozitorij sa [Netlify](https://netlify.com).
2. Root Directory: `client`
3. Build Command: `npm run build`
4. Publish Directory: `dist`
5. Dodajte Environment varijablu:
   - `VITE_API_URL`: Link do vašeg objavljenog Backenda (npr. `https://vaš-backend.onrender.com/api`).

### 3. Baza podataka - MongoDB Atlas
1. Kreirajte besplatan klaster na [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Dodajte IP adresu `0.0.0.0/24` u "Network Access" da bi server mogao pristupiti bazi.
3. Kopirajte Connection String u `MONGODB_URI`.

## Algoritam Raspoređivanja
Algoritam koristi sistem bodovanja za pravednu raspodjelu smjena, uzimajući u obzir:
- Kategoriju radnog mjesta
- Minimalni odmor između smjena (11h)
- Maksimalni sedmični fond sati (40h)
- Aktivne odsutnosti (bolovanja, godišnji odmori)
- Istorijsku zastupljenost smjena (fer raspodjela)
