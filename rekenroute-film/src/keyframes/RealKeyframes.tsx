import React from "react";
import { Img, staticFile } from "remotion";
import { KF1Team, KF3IkDoe, KF4Rommelwind, KF5WijDoen, KF6JijDoet } from "./Keyframes";

/**
 * KEYFRAMES MET DE ECHTE BOLLOBO'S
 * De figuren zijn de officiële tekeningen (uitgeknipt), geplaatst in de 3D-sets.
 * 1 = kleuterbollobo · 2 = oranje (eerste graad) · 3 = paars (eerste graad)
 * 4/5 = tweede graad · 6/7 = derde graad
 */

/** hoogte van elke tekening in bronpixels (uitsnede / 4) */
const SRC_H: Record<number, number> = { 1: 86, 2: 91, 3: 119, 4: 146, 5: 167, 6: 174, 7: 187 };

const Fig: React.FC<{
  n: number;
  /** midden van de figuur (px) */
  x: number;
  /** voeten (px) */
  y: number;
  /** pixels per bronpixel */
  k: number;
  flip?: boolean;
  rot?: number;
  shadow?: boolean;
}> = ({ n, x, y, k, flip, rot = 0, shadow = true }) => {
  const h = SRC_H[n] * k;
  return (
    <>
      {shadow ? (
        <div
          style={{
            position: "absolute",
            left: x - h * 0.22,
            top: y - h * 0.03,
            width: h * 0.44,
            height: h * 0.07,
            borderRadius: "50%",
            background: "radial-gradient(closest-side, rgba(0,0,0,0.32), rgba(0,0,0,0))",
          }}
        />
      ) : null}
      <Img
        src={staticFile(`bollobos/bollobo-${n}.png`)}
        style={{
          position: "absolute",
          height: h,
          left: x,
          top: y - h,
          transform: `translateX(-50%) scaleX(${flip ? -1 : 1}) rotate(${rot}deg)`,
          transformOrigin: "50% 100%",
          filter: "drop-shadow(0 0 2px rgba(255,255,255,0.15))",
        }}
      />
    </>
  );
};

/** Titelbeeld: alle zeven Bollobo's op de Rekenroute */
export const R0Ploeg: React.FC = () => (
  <KF1Team
    real
    caption="De Bollobo's van Rekenroute · kleuter, eerste, tweede en derde graad"
    figures={
      <>
        <Fig n={7} x={1560} y={820} k={2.9} />
        <Fig n={6} x={1300} y={835} k={2.9} />
        <Fig n={5} x={1060} y={850} k={2.9} />
        <Fig n={4} x={830} y={860} k={2.9} />
        <Fig n={3} x={600} y={880} k={2.9} />
        <Fig n={2} x={395} y={895} k={2.9} />
        <Fig n={1} x={215} y={905} k={2.9} />
      </>
    }
  />
);

/** Seizoen 1: de ploeg van leerjaar 1 vertrekt */
export const R1Team: React.FC = () => (
  <KF1Team
    real
    caption="Keyframe 1 · Sc. 4: Uitrukken op de Rekenroute"
    figures={
      <>
        <Fig n={3} x={640} y={880} k={3.6} />
        <Fig n={2} x={980} y={900} k={3.6} />
        <Fig n={1} x={1290} y={905} k={3.6} />
      </>
    }
  />
);

export const R3IkDoe: React.FC = () => (
  <KF3IkDoe
    real
    caption="Keyframe 3 · Sc. 6: Ik doe, de oranje Bollobo toont de Tipkaart"
    figures={
      <>
        <Fig n={3} x={150} y={760} k={2.6} />
        <Fig n={1} x={300} y={800} k={2.6} />
        <Fig n={2} x={470} y={730} k={2.6} />
      </>
    }
  />
);

export const R4Rommelwind: React.FC = () => (
  <KF4Rommelwind
    real
    caption="Keyframe 4 · Sc. 7: Rommelwind blaast de plankjes weg"
    figures={
      <>
        <Fig n={2} x={190} y={860} k={2.8} />
        <Fig n={3} x={420} y={880} k={2.8} />
        <Fig n={1} x={620} y={860} k={2.8} />
      </>
    }
  />
);

export const R5WijDoen: React.FC = () => (
  <KF5WijDoen
    real
    caption="Keyframe 5 · Sc. 8: Wij doen, op de brug"
    figures={
      <>
        <Fig n={1} x={700} y={490} k={2.0} />
        <Fig n={2} x={880} y={490} k={2.0} />
        <Fig n={3} x={1080} y={490} k={2.0} />
      </>
    }
  />
);

export const R6JijDoet: React.FC = () => (
  <KF6JijDoet
    real
    caption="Keyframe 6 · Sc. 10: Jij doet, de lampionnen van Tiendorp"
    figures={
      <>
        <Fig n={3} x={600} y={980} k={3.2} />
        <Fig n={2} x={960} y={990} k={3.2} />
        <Fig n={1} x={1300} y={990} k={3.2} />
      </>
    }
  />
);
