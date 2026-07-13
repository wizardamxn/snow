"use client";

import { useEffect, useRef, useState } from "react";

const Page = () => {
  const [player, setplayer] = useState({
    x: 100,
    y: 100,
  });
  const screenWidth = 1000;
  const screenHeight = 1000;

  const [camera, setCamera] = useState({
    x: 0,
    y: 0,
  });

  const tree = {
    x: 500,
    y: 200,
  };

  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "w":
          keys.current.w = true;
          break;
        case "s":
          keys.current.s = true;
          break;
        case "a":
          keys.current.a = true;
          break;
        case "d":
          keys.current.d = true;
          break;
        case " ":
          keys.current.space = true;
          break;
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.key) {
        case "w":
          keys.current.w = false;
          break;
        case "s":
          keys.current.s = false;
          break;
        case "a":
          keys.current.a = false;
          break;
        case "d":
          keys.current.d = false;
          break;
        case " ":
          keys.current.space = false;
          setplayer((prev) => ({ x: prev.x, y: 100 }));
          break;
      }
    };
    const gameLoop = () => {
      if (keys.current.w) {
        setplayer((prev) => {
          if (prev.y <= 0) {
            return prev;
          }
          return { x: prev.x, y: prev.y - 2 };
        });
        setCamera({
          x: player.x - window.innerWidth / 2,
          y: player.y - window.innerHeight / 2,
        });
      }

      if (keys.current.s) {
        setplayer((prev) => {
          if (prev.y >= screenHeight) {
            return prev;
          }
          return { x: prev.x, y: prev.y + 2 };
        });
        setCamera({
          x: player.x - window.innerWidth / 2,
          y: player.y - window.innerHeight / 2,
        });
      }
      if (keys.current.a) {
        setplayer((prev) => {
          if (prev.x <= 0) {
            return prev;
          }
          return { x: prev.x - 2, y: prev.y };
        });
        setCamera({
          x: player.x - window.innerWidth / 2,
          y: player.y - window.innerHeight / 2,
        });
      }
      if (keys.current.d) {
        setplayer((prev) => {
          if (prev.x >= screenWidth) {
            return prev;
          }
          return { x: prev.x + 2, y: prev.y };
        });
        setCamera({
          x: player.x - window.innerWidth / 2,
          y: player.y - window.innerHeight / 2,
        });
      }
      if (keys.current.space) {
        setplayer((prev) => ({ x: prev.x, y: prev.y - 5 }));
      }

      requestAnimationFrame(gameLoop);
    };
    gameLoop();
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div className="flex relative justify-center items-center  w-[3000px] h-[3000px]">
      <div
        className="absolute w-10 h-10 border-2 border-red-600"
        style={{
          left: player.x - camera.x,
          top: player.y - camera.y,
        }}
      />
      <div
        className="absolute w-10 h-40 top-rounded border-2 border-green-600"
        style={{
          left: tree.x - camera.x,
          top: tree.y - camera.y,
        }}
      />
    </div>
  );
};

export default Page;
