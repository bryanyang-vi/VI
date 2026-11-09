/**
 * DE PERSONAGES VAN DE REKENROUTE-PLOEG
 *
 * Pas hier namen, kleuren en eigenschappen aan zodat ze overeenkomen met de
 * officiële Bollobo's uit Rekenroute (2 per graad + 1 kleuterbollobo).
 * Alles in de film leest uit dit bestand: verander je hier een naam of kleur,
 * dan verandert die overal mee.
 */

export type CharacterId = "teller" | "splitser" | "kleuter";

export type Character = {
  id: CharacterId;
  /** Naam die in beeld verschijnt */
  name: string;
  /** Rol in de ploeg (zoals elke held in een kinderreeks een eigen talent heeft) */
  role: string;
  /** Vaste uitspraak bij de voorstelling ("catchphrase") */
  catchphrase: string;
  /** Hoofdkleur van het lijf */
  body: string;
  /** Donkerdere tint voor voeten en schaduw */
  shade: string;
  /** Kleur van helm/pet */
  hat: string;
  /** Symbool op de helm */
  badge: string;
  /** Lichaamsgrootte (1 = normaal) */
  scale: number;
};

export const CHARACTERS: Record<CharacterId, Character> = {
  teller: {
    id: "teller",
    name: "Bollo Tel",
    role: "de snelle teller",
    catchphrase: "Tellen? Dat doe ik met plezier!",
    body: "#F25C54",
    shade: "#C23B34",
    hat: "#FFD23F",
    badge: "123",
    scale: 1,
  },
  splitser: {
    id: "splitser",
    name: "Bollo Splits",
    role: "de slimme splitser",
    catchphrase: "Ik splits elk getal in twee!",
    body: "#3A86FF",
    shade: "#2559B8",
    hat: "#FF8C42",
    badge: "+",
    scale: 1,
  },
  kleuter: {
    id: "kleuter",
    name: "Kleine Bol",
    role: "de kleinste speurneus",
    catchphrase: "Ik kijk héél goed!",
    body: "#8AC926",
    shade: "#5E8E17",
    hat: "#B388EB",
    badge: "★",
    scale: 0.78,
  },
};

export const TEAM_NAME = "De Rekenroute-ploeg";
