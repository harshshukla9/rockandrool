"use client";
import { useEffect } from "react";
import "./dice.css";

export default function DiceAnimation() {
  useEffect(() => {
    const dice1 = document.getElementById("dice1")!;
    const dice2 = document.getElementById("dice2")!;

    function roll() {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;

      // remove old classes
      for (let i = 1; i <= 6; i++) {
        dice1.classList.remove("show-" + i);
        dice2.classList.remove("show-" + i);
      }

      // force reflow so animation always runs
      void dice1.offsetWidth;
      void dice2.offsetWidth;

      // add new classes
      dice1.classList.add("show-" + d1);
      dice2.classList.add("show-" + d2);
    }

    roll();
    const id = setInterval(roll, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="dice-wrapper">
      <div className="dice-container">
        <div id="dice1" className="dice">{faces()}</div>
        <div id="dice2" className="dice">{faces()}</div>
      </div>
    </div>
  );
}

function faces() {
  return [1,2,3,4,5,6].map(n => (
    <div key={n} className={`face face-${n}`}>
      {Array.from({ length: n }).map((_,i)=>
        <span key={i} className={`pip pip-${n}-${i}`} />
      )}
    </div>
  ));
}
