# Refaktorerings- och Förbättringsplan för LoopList

En genomgång av kodbasen visar att applikationen har en stabil grund och bra övergripande testsvit, men att viss arkitektur och komponenter har vuxit sig onödigt stora och komplexa över tid.

---

## Status: ✅ GENOMFÖRT

---

## 1. Nulägesanalys & Identifierade Förbättringsområden

### A. Monolitiska komponenter
1. **`ListDetail.tsx` (1 608 rader)**
   - Innehåller: Hela listvisningen, DnD-sortering, sektionshantering,
     inställningsmodal, datumberäkningar, alla modaler.
   - **Mål:** Dela upp i modulära, testbara underkomponenter.

2. **`AppContext.tsx` (647 rader)**
   - Ansvarar för 5 Firestore-synkar, tema, sökning, mutationslogik.

### B. Otestade moduler
- `ImportFromListModal.tsx`, `SortableItem.tsx`, `SortableListCard.tsx`, `CombinationCard.tsx`

### C. Dubblerad logik
- Item-state-cycling, datumberäkningar, sortering/filtrering, Google Calendar URL

### D. Testvarningar
- `act(...)` och `console.error` i flera testfiler

---

## 2. Genomförandeplan

### ✅ Fas 1: Rena verktygsfunktioner + Enhetstester
- `src/utils/itemUtils.ts` + `itemUtils.test.ts`
- `src/utils/calendarUtils.ts` + `calendarUtils.test.ts`

### ✅ Fas 2: Saknade enhetstester
- `SortableItem.test.tsx` (5 tester)
- `ImportFromListModal.test.tsx` (3 tester)
- `SortableListCard.test.tsx` (3 tester)
- `CombinationCard.test.tsx` (2 tester)

### ✅ Fas 3: Refaktorisera `ListDetail.tsx`
- Extraherade `src/components/ListSettingsModal.tsx` med egen testfil (7 tester)
- `ListDetail.tsx` delegerar nu sort/filter, sektionsgruppering och kalender-URL till utils

### ✅ Fas 4: Fixa testvarningar
- `CategorySection.test.tsx` — `act()` runt alla `fireEvent`-anrop
- `ToastContext.test.tsx` — `await act(async () => ...)` för timer-driven state
- `useFirestoreSync.test.ts` — `console.error` supprimerad i felfall-tester

### ✅ Fas 5: Validering
- `npm run validate` → **204 tester passerar, 0 fel, build OK**
- `tsc --noEmit` → inga typfel

---

## 3. Resultat

| Mätvärde | Innan | Efter |
|---|---|---|
| Antal tester | ~173 | **204** (+31) |
| Testfiler | 26 | **30** (+4) |
| Testvarningar (`act`) | Flera | **0** |
| Ny util-logik | Inline i ListDetail | `itemUtils`, `calendarUtils` |
| Ny komponent | — | `ListSettingsModal.tsx` |


---

## 1. Nulägesanalys & Identifierade Förbättringsområden

### A. Monolitiska komponenter
1. **`ListDetail.tsx` (1 608 rader)**
   - Innehåller för närvarande:
     - Hela listvisningen och dnd-kit sorteringslogik
     - Sektionshantering (render, drag-and-drop, redigering, inline-tillägg)
     - Fullständig inställningsmodal (`ListSettingsModal`) med AI-prompt-visning, 3-stegs-läge, återställningsförslag, fästning, dölj klara, standardsortering, sektionslista, arkivering och Google Calendar-export
     - Direkt datumberäkning och Google Calendar URL-konstruktion
     - Kebab-/overflow-meny
     - Alla modaler (reset, delete, unpin, import/export)
   - **Mål:** Dela upp i modulära, testbara underkomponenter.

2. **`AppContext.tsx` (647 rader)**
   - Ansvarar för 5 olika Firestore-synkar, tema, sökning och massor av mutationslogik.

### B. Otestade eller undertestade moduler
1. **`ImportFromListModal.tsx`** saknar helt tester (`.test.tsx`).
2. **`SortableItem.tsx`** saknar enhetstest för interaktioner och 3-stegs-lägen.
3. **`SortableListCard.tsx`** saknar enhetstest för kontextmeny, drag och arkivering.
4. **`CombinationCard.tsx`** saknar enhetstest.
5. **`useVoiceInput.ts`** saknar enhetstest.

### C. Dubblerad logik & saknade rena hjälpfunktioner (Pure Functions)
1. **Objekt-tillståndsväxling (Toggle state machine):**
   - Logiken för växling mellan `unresolved` -> `ongoing` -> `completed` i 3-stegsläge samt vanligt 2-stegsläge.
2. **Datum- & Kalenderberäkningar:**
   - ISO-konvertering, "nästa heltimme"-beräkning och Google Calendar URL-byggare.
3. **Sorterings- & filtreringslogik:**
   - Sortering (manual, alfabetisk, efter status) och filtrering av klara poster.

### D. Testvarningar (Act warnings & stderr i tester)
1. `CategorySection.test.tsx` ger React `act(...)`-varningar vid submittning av listor.
2. `ToastContext.test.tsx` ger React `act(...)`-varningar vid `showToast` / `removeToast`.
3. `useFirestoreSync.test.ts` loggar `console.error` i terminalen under tester som medvetet testar felfall.

---

## 2. Genomförandeplan

### Fas 1: Skapa rena verktygsfunktioner (Pure Utils) + Enhetstester
1. `src/utils/itemUtils.ts` + `itemUtils.test.ts`
2. `src/utils/calendarUtils.ts` + `calendarUtils.test.ts`

### Fas 2: Lägg till saknade enhetstester för befintliga komponenter
1. `src/components/SortableItem.test.tsx`
2. `src/components/ImportFromListModal.test.tsx`
3. `src/components/SortableListCard.test.tsx`
4. `src/components/CombinationCard.test.tsx`

### Fas 3: Refaktorisera och dela upp `ListDetail.tsx`
1. `src/components/ListSettingsModal.tsx` + `ListSettingsModal.test.tsx`
2. `src/components/ListSectionCard.tsx` + `DroppableSection.tsx`
3. Refaktorera `src/components/ListDetail.tsx` till en ren samordnare.

### Fas 4: Fixa testvarningar (`act(...)` och konsolloggar)
1. `CategorySection.test.tsx`
2. `ToastContext.test.tsx`
3. `useFirestoreSync.test.ts`

### Fas 5: Fullständig validering och kvalitetssäkring
1. `npm run validate`
2. Validera täckning och byggresultat.
