# My List App - PWA

A mobile-first Progressive Web App for managing reusable lists, built with React, Tailwind CSS, and Vite.

## Features
- **Categories**: Group lists into categories (e.g., Jobb, Privat, Resor).
- **Lists**: Create, copy, move, and delete lists.
- **Items**: Add, edit, delete, check/uncheck items.
- **Drag and Drop**: Reorder items within a list.
- **Dark Mode**: Toggle between light and dark themes.
- **Local Storage**: Data is persisted locally on the device.
- **PWA**: Installable on mobile devices.

## Tech Stack
- React (TypeScript)
- Tailwind CSS
- Vite
- @dnd-kit (Drag and Drop)
- Lucide React (Icons)
- vite-plugin-pwa

## Setup & Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## PWA Icons
To fully enable PWA installation, please add the following icons to the `public` directory:
- `pwa-192x192.png`
- `pwa-512x512.png`

## Original Prompt
> Jag vill bygga en progressive web app som jag ska kunna spara ner till min telefon, den behöver vara mobile first. Lagring kan ske i localstorage. Den har till syfte att skapa listor som jag återanvänder. Det skulle kunna vara en lista för att komma ihåg vad jag ska ta med till jobbet. Det skulle också kunna vara en lista för att komma ihåg vad jag ska packa när jag går till gymmet eller vad jag ska fixa inför en långrunda när jag går ut och springer osv osv. Viktig funktion på varje lista är att jag ska kunna: 1. Lägga till och ta bort nya punkter, bocka av varje punkt, redigera befintliga punkter, dra och släppa varje punkt upp och ner. Också viktigt att kunna via en knapp kunna avbocka alla så att alla punkter i listan nollställs. Listor ska grupperas in i kategorier så som Jobb, Privat, Resor osv osv. Man ska kunna ta bort och lägga till kategorier. Tar man bort en kategori, tas även listan/listorna i kategorin bort. Listor ska kunna flyttas mellan kategorier. Listor ska också kunna kopieras och få samma namn men med (kopia) tillagt i namnet. Jag vill ha ett modernt utseende och helst använda tailwind CSS. Det Lightmode ska vara default men man ska även kunna toggla till Darkmode. Jag vill att utssendet liknar utseendet i denna demon https://www.youtube.com/watch?v=L8wEC6A5HQY
> Sen vill jag också att applikationen dokumenteras i en markdownfil, så om jag behöver justera någonstans vet vart de olika delarna har till syfte. Spara denna prompt i markdown dokumentationen också
