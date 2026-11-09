import { Composition } from "remotion";
import { EPISODE_DURATION, Episode } from "./Episode";
import { FPS } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
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
  );
};
