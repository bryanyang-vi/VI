import { Composition } from "remotion";
import { EPISODE_DURATION, Episode } from "./Episode";
import { FPS } from "./theme";
import {
  KF0Personages,
  KF7Closeup,
  KF1Team,
  KF2Alarm,
  KF3IkDoe,
  KF4Rommelwind,
  KF5WijDoen,
  KF6JijDoet,
} from "./keyframes/Keyframes";

const KEYFRAMES = [
  { id: "KF0-Personages", component: KF0Personages },
  { id: "KF7-Closeup", component: KF7Closeup },
  { id: "KF1-Team", component: KF1Team },
  { id: "KF2-Alarm", component: KF2Alarm },
  { id: "KF3-IkDoe", component: KF3IkDoe },
  { id: "KF4-Rommelwind", component: KF4Rommelwind },
  { id: "KF5-WijDoen", component: KF5WijDoen },
  { id: "KF6-JijDoet", component: KF6JijDoet },
];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Aflevering1-DeBrugVanTien"
        component={Episode}
        durationInFrames={EPISODE_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          episodeTitle: "Aflevering 1: De brug van tien",
          learningGoal: "Ik kan splitsen tot 10.",
          nextEpisode: "Het raadsel van de dubbele getallen",
        }}
      />
      {KEYFRAMES.map((k) => (
        <Composition
          key={k.id}
          id={k.id}
          component={k.component}
          durationInFrames={1}
          fps={FPS}
          width={1920}
          height={1080}
        />
      ))}
    </>
  );
};
