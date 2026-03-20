"use client";

import { Rnd } from "react-rnd";

interface SignaturePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SignaturePlacerProps {
  placement: SignaturePlacement;
  onPlacementChange: (placement: SignaturePlacement) => void;
}

export default function SignaturePlacer({
  placement,
  onPlacementChange,
}: SignaturePlacerProps) {
  return (
    <Rnd
      size={{ width: placement.width, height: placement.height }}
      position={{ x: placement.x, y: placement.y }}
      onDragStop={(_e, d) => {
        onPlacementChange({ ...placement, x: d.x, y: d.y });
      }}
      onResizeStop={(_e, _direction, ref, _delta, position) => {
        onPlacementChange({
          x: position.x,
          y: position.y,
          width: parseFloat(ref.style.width),
          height: parseFloat(ref.style.height),
        });
      }}
      bounds="parent"
      minWidth={100}
      minHeight={40}
      className="border-2 border-dashed border-blue-500 bg-blue-500/10 flex items-center justify-center cursor-move z-10"
    >
      <span className="text-blue-600 text-xs font-medium select-none pointer-events-none">
        Sign Here
      </span>
    </Rnd>
  );
}
