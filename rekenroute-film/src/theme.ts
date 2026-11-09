import { loadFont } from "@remotion/google-fonts/Fredoka";

export const { fontFamily } = loadFont("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

export const COLORS = {
  skyTop: "#7FD3FF",
  skyBottom: "#D9F4FF",
  grass: "#7BC950",
  grassDark: "#5DA83A",
  road: "#6B6F7A",
  water: "#4CC9F0",
  wood: "#B5793C",
  woodDark: "#8A5A2B",
  ink: "#24304A",
  white: "#FFFFFF",
  sun: "#FFD23F",
  route: "#FF6B35",
};

export const FPS = 30;
