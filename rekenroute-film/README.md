# De Rekenroute-ploeg — animatiereeks

Een korte animatiefilm voor kinderen in de stijl van een avontuurlijke kinderreeks: een ploeg helden, een alarm, een probleem dat ze samen oplossen, en tussendoor rekenen uit Rekenroute.

Gemaakt met [Remotion](https://www.remotion.dev): de film is React-code, zodat je personages, teksten en rekenopgaven makkelijk kunt aanpassen en opnieuw kunt exporteren.

## Aflevering 1: De brug van tien

**Leerdoel:** splitsen tot 10 (leerjaar 1).

| # | Scène | Wat gebeurt er | Duur |
|---|-------|----------------|------|
| 1 | Titelgeneriek | Titel, de ploeg springt in beeld, de oranje route tekent zichzelf | 5,5 s |
| 2 | Alarm | In het hoofdkwartier gaat het alarm: de brug naar Telstad heeft gaten | 6 s |
| 3 | Voorstelling | Elke Bollobo stelt zich voor met naam, talent en vaste uitspraak | 10 s |
| 4 | Op de Rekenroute | De ploeg huppelt over de weg langs getallenpaaltjes 1–10 | 5 s |
| 5 | De brug | Tellen tot 6, de vraag **6 + ? = 10**, een “Wat denk jij?”-pauze met aftelling, en dan vallen de 4 plankjes erbij | 15,5 s |
| 6 | Feest in Telstad | Een **splitsbeen** (10 → 3 en ?) met een **tienveld** van ballonnen: 7 ballonnen erbij | 15,5 s |
| 7 | Wat heb ik geleerd? | Het lesdoel, net zoals in het werkschrift: 10 = 6 + 4, 10 = 3 + 7, 10 = 5 + 5 | 8 s |
| 8 | Afsluiter | De ploeg zwaait en er volgt een teaser voor de volgende aflevering | 6 s |

Totaal: ongeveer 72 seconden, 1920×1080, 30 fps.

## Personages aanpassen

Alle personages staan in **`src/characters.ts`**: naam, rol, uitspraak, kleuren en het symbool op de helm. Verander je daar iets, dan verandert het overal in de film.

> De huidige drie figuren zijn **voorlopige ontwerpen** in Bollobo-stijl. Vervang namen en kleuren door die van de officiële Bollobo's uit Rekenroute. Wil je de echte tekeningen gebruiken, zet de afbeeldingen (PNG of SVG) dan in `public/` en vervang het SVG-figuurtje in `src/components/Bollobo.tsx` door een `<Img src={staticFile(...)} />`.

## Rekenopgaven aanpassen

- Brug: `BRIDGE = { have: 6, total: 10 }` in `src/scenes/Problems.tsx`
- Ballonnen: `BALLOONS = { have: 3, total: 10 }` in hetzelfde bestand
- Titel, leerdoel en volgende aflevering: `defaultProps` in `src/Root.tsx`
- Lengte per scène: `SCENES` in `src/Episode.tsx`

## Bekijken en exporteren

```bash
npm install
npm run dev                # opent Remotion Studio in je browser om te bekijken en bewerken
npx remotion render        # exporteert naar out/ als MP4
```

## Ideeën voor volgende stappen

- **Stemmen en muziek:** neem de zinnen in de spreekwolken in als voice-over en zet ze met `<Audio>` op de juiste plek, samen met een vrolijk themadeuntje.
- **Meer afleveringen:** elke aflevering behandelt één blok of lesdoel (dubbels, brug over 10, meten, klokkijken, ...).
- **Interactief in de klas:** de leerkracht pauzeert bij “Wat denk jij?” en laat de klas antwoorden.
