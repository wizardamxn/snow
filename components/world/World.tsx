"use client";

import PixiCanvas from "./PixiCanvas";

export default function World() {
  return (
    <div className="absolute inset-0 z-0">
      <PixiCanvas />
    </div>
  );
}
