import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { AlarmScene, RideScene, RollCallScene, TitleScene } from "./scenes/Opening";
import { BalloonScene, BridgeScene } from "./scenes/Problems";
import { LearnedScene, OutroScene } from "./scenes/Ending";

/**
 * AFLEVERING 1 — "De brug van tien"
 * Leerdoel: splitsen tot 10 (aanvullen tot 10).
 *
 * Elke scène heeft een vaste lengte in frames (30 frames = 1 seconde).
 */
export const SCENES = {
  title: 165,
  alarm: 180,
  rollTeller: 100,
  rollSplitser: 100,
  rollKleuter: 100,
  ride: 150,
  bridge: 470,
  balloons: 470,
  learned: 240,
  outro: 180,
};

export const EPISODE_DURATION = Object.values(SCENES).reduce((a, b) => a + b, 0);

export type EpisodeProps = {
  episodeTitle: string;
  learningGoal: string;
  nextEpisode: string;
};

export const Episode: React.FC<EpisodeProps> = ({ episodeTitle, learningGoal, nextEpisode }) => {
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <Series>
        <Series.Sequence durationInFrames={SCENES.title} name="1. Titelgeneriek">
          <TitleScene duration={SCENES.title} episode={episodeTitle} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.alarm} name="2. Alarm">
          <AlarmScene duration={SCENES.alarm} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.rollTeller} name="3a. Voorstelling Tel">
          <RollCallScene duration={SCENES.rollTeller} id="teller" bg="#FF7B6B" />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.rollSplitser} name="3b. Voorstelling Splits">
          <RollCallScene duration={SCENES.rollSplitser} id="splitser" bg="#5C9DFF" />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.rollKleuter} name="3c. Voorstelling Kleine Bol">
          <RollCallScene duration={SCENES.rollKleuter} id="kleuter" bg="#A5D85A" />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.ride} name="4. Op de Rekenroute">
          <RideScene duration={SCENES.ride} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.bridge} name="5. De brug: 6 + ? = 10">
          <BridgeScene duration={SCENES.bridge} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.balloons} name="6. Ballonnen: 10 = 3 + ?">
          <BalloonScene duration={SCENES.balloons} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.learned} name="7. Wat heb ik geleerd?">
          <LearnedScene duration={SCENES.learned} goal={learningGoal} examples={["10 = 6 + 4", "10 = 3 + 7", "10 = 5 + 5"]} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.outro} name="8. Afsluiter">
          <OutroScene duration={SCENES.outro} nextEpisode={nextEpisode} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
