import React from "react";
import { Composition, Folder } from "remotion";
import { Ad, adDuration } from "./Ad";
import { Slide } from "./Slide";
import { POSTERS, Poster } from "./Poster";
import { ADS } from "./data/ads";
import { CARS } from "./data/carousels";

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Motion">
      {Object.keys(ADS).map((id) => (
        <Composition key={id} id={id} component={Ad} durationInFrames={adDuration(id)} fps={30} width={1080} height={1920} defaultProps={{ id }} />
      ))}
    </Folder>
    <Folder name="Imagenes">
      {POSTERS.map((p) => (
        <Composition key={p.id} id={p.id} component={Poster} durationInFrames={60} fps={30} width={1080} height={1920} defaultProps={{ id: p.id }} />
      ))}
    </Folder>
    <Folder name="Carruseles">
      {Object.entries(CARS).flatMap(([id, c]) =>
        c.slides.map((_, i) => (
          <Composition key={`${id}-${i}`} id={`${id}-${i + 1}`} component={Slide} durationInFrames={150} fps={30} width={1080} height={1350} defaultProps={{ id, idx: i }} />
        )),
      )}
    </Folder>
  </>
);
