# Prompts Made

Here is a sequential history of the prompts made during the development of this application.

## 1. Initial Project Request
> Jag vill bygga en progressive web app som jag ska kunna spara ner till min telefon, den behöver vara mobile first. Lagring kan ske i localstorage. Den har till syfte att skapa listor som jag återanvänder. Det skulle kunna vara en lista för att komma ihåg vad jag ska ta med till jobbet. Det skulle också kunna vara en lista för att komma ihåg vad jag ska packa när jag går till gymmet eller vad jag ska fixa inför en långrunda när jag går ut och springer osv osv. Viktig funktion på varje lista är att jag ska kunna: 1. Lägga till och ta bort nya punkter, bocka av varje punkt, redigera befintliga punkter, dra och släppa varje punkt upp och ner. Också viktigt att kunna via en knapp kunna avbocka alla så att alla punkter i listan nollställs. Listor ska grupperas in i kategorier så som Jobb, Privat, Resor osv osv. Man ska kunna ta bort och lägga till kategorier. Tar man bort en kategori, tas även listan/listorna i kategorin bort. Listor ska kunna flyttas mellan kategorier. Listor ska också kunna kopieras och få samma namn men med (kopia) tillagt i namnet. Jag vill ha ett modernt utseende och helst använda tailwind CSS. Det Lightmode ska vara default men man ska även kunna toggla till Darkmode. Jag vill att utssendet liknar utseendet i denna demon https://www.youtube.com/watch?v=L8wEC6A5HQY
> Sen vill jag också att applikationen dokumenteras i en markdownfil, så om jag behöver justera någonstans vet vart de olika delarna har till syfte. Spara denna prompt i markdown dokumentationen också

## 2. Fix Dark Mode
> Fixing Dark Mode Theme (The user wants the dark mode to correctly apply to the UI when toggled, and vice versa for light mode.)

## 3. Branding & Titles
> I want a new colorful favicon that that represent a checkbox that is checked, also update the Page title to 'Anti' and on a specific Category page, print 'Anti - <category>' And on List page print out 'Anti <List>'

## 4. Header Update
> Change the <h1> where it now says ListApp to match the page title, but keep the style of the text

## 5. Logo in Header
> Add the favicon as an logo that preceeds the <h1> title in the header

## 6. Clickable Header
> And make the logo and the h1 is clickable so when clicked it takes the user back to first default route/page

## 7. Smart Copy Logic
> Update a small thing, when the user copies a list, lets say it's called List, have it say List kopia 1. If the user copies the original list or the "List kopia 1" call the next version "List kopia 2" and so forth, do you understand?

## 8. Custom Modal
> When a confirmation is prompted to the user in the app, lets build something more refined than a normal javascript confirm. Is the a component in tailwind css we can use. Like the one found here - https://tailwindcss.com/plus/ui-blocks/application-ui/overlays/modal-dialogs

## 9. Prompt History
> Lägg till en PromptsMade.md och lägg till alla promptar jag har gjort sekventiellt så att det finns en historik på vad jag har promptat.

## 10. Auto Theme Request
> Om det är möjligt vill jag att du först gör research på när solen går upp och ner där användaren är när applikationen startar, webbläsaren får kanske fråga om tillåtelse för att använda platsdata. Om användaren svarar ja på den frågan så applicera light mode om det är när solen är uppe och om det är efter solens ned gång men innna solens uppgång så applicera darkmode

## 11. Git Init
> initial a git repo in the project folder

## 12. Git Remote
> add following remote for the git repo: https://github.com/Jojjeboy/anti.git

## 13. Git Status
> Är allt comittat?
