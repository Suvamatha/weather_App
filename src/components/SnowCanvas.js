import React, { useRef } from "react";
import { useSnowAnimation } from "../hooks/useSnowAnimation";

export default function SnowCanvas({ isSnowing, isTyping }) {
  const canvasRef = useRef(null);
  const { performanceAlert, reEnableSnow } = useSnowAnimation(
    canvasRef,
    isSnowing,
    isTyping
  );

  return (
    <>
      <canvas
        ref={canvasRef}
        className="snow-canvas"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {performanceAlert && (
        <div className="performance-alert-bubble">
          <span>❄️ Snow animation disabled to save performance</span>
          <button onClick={reEnableSnow} className="performance-alert-btn">
            Re-enable
          </button>
        </div>
      )}
    </>
  );
}
