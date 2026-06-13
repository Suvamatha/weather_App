import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";

// Helper function to copy styles from the main window to the PiP window
function copyStyles(targetDoc) {
  // 1. Copy link elements
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  links.forEach((link) => {
    const newLink = targetDoc.createElement("link");
    newLink.rel = "stylesheet";
    newLink.href = link.href;
    targetDoc.head.appendChild(newLink);
  });

  // 2. Copy style elements (crucial for CSS injected in CRA development)
  const styles = Array.from(document.querySelectorAll("style"));
  styles.forEach((style) => {
    const newStyle = targetDoc.createElement("style");
    newStyle.textContent = style.textContent;
    targetDoc.head.appendChild(newStyle);
  });
}

export default function MiniWidget({
  weather,
  isDarkMode,
  toggleDarkMode,
  onCloseWidget,
  onRefresh,
  widgetPosition,
  saveWidgetPosition,
  getWeatherIcon,
}) {
  const [pipWindow, setPipWindow] = useState(null);
  const widgetRef = useRef(null);
  const dragStartRef = useRef(null);

  // Clean up PiP window on unmount
  useEffect(() => {
    return () => {
      if (pipWindow) {
        pipWindow.close();
      }
    };
  }, [pipWindow]);

  // Handle opening Document Picture-in-Picture
  const handleToggleAlwaysOnTop = async () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }

    if (!("documentPictureInPicture" in window)) {
      alert(
        "Document Picture-in-Picture is not supported in this browser. Try Chrome, Edge, or Opera for always-on-top desktop mode!"
      );
      return;
    }

    try {
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 300,
        height: 180,
      });

      // Copy stylesheet contents
      copyStyles(pip.document);

      // Add dark/light class to PiP body
      pip.document.body.className = isDarkMode ? "dark-mode-body" : "";
      pip.document.body.style.margin = "0";
      pip.document.body.style.overflow = "hidden";
      pip.document.body.style.backgroundColor = isDarkMode
        ? "#0f172a"
        : "#667eea";

      // Listen for window close
      pip.addEventListener("pagehide", () => {
        setPipWindow(null);
      });

      setPipWindow(pip);
    } catch (err) {
      console.error("Failed to open Document Picture-in-Picture window:", err);
    }
  };

  // Dragging event handlers (only active when NOT in PiP mode)
  const handleStartDrag = (e) => {
    const isTouch = e.type === "touchstart";
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      startX: clientX - widgetPosition.x,
      startY: clientY - widgetPosition.y,
    };

    const handleDragMove = (moveEvent) => {
      if (!dragStartRef.current) return;
      const moveX = isTouch ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveY = isTouch ? moveEvent.touches[0].clientY : moveEvent.clientY;

      let newX = moveX - dragStartRef.current.startX;
      let newY = moveY - dragStartRef.current.startY;

      // Keep widget inside screen boundaries
      const widgetWidth = 300;
      const widgetHeight = 160;
      newX = Math.max(0, Math.min(newX, window.innerWidth - widgetWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - widgetHeight));

      saveWidgetPosition({ x: newX, y: newY });
    };

    const handleStopDrag = () => {
      dragStartRef.current = null;
      if (isTouch) {
        document.removeEventListener("touchmove", handleDragMove);
        document.removeEventListener("touchend", handleStopDrag);
      } else {
        document.removeEventListener("mousemove", handleDragMove);
        document.removeEventListener("mouseup", handleStopDrag);
      }
    };

    if (isTouch) {
      document.addEventListener("touchmove", handleDragMove, { passive: false });
      document.addEventListener("touchend", handleStopDrag);
    } else {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleStopDrag);
    }
  };

  // Sync background of PiP window body when dark mode changes
  useEffect(() => {
    if (pipWindow) {
      pipWindow.document.body.className = isDarkMode ? "dark-mode-body" : "";
      pipWindow.document.body.style.backgroundColor = isDarkMode
        ? "#0f172a"
        : "#667eea";
    }
  }, [isDarkMode, pipWindow]);

  const hasPipSupport = "documentPictureInPicture" in window;

  // Render the widget UI
  const renderWidgetContent = (isPip) => {
    if (!weather) {
      return (
        <div className={`mini-widget-content error ${isDarkMode ? "dark" : ""}`}>
          <div className="mini-widget-header">
            <span>Widget Mode</span>
            <button className="widget-icon-btnClose" onClick={onCloseWidget}>
              ✕
            </button>
          </div>
          <p className="no-data-msg">No active city selected. Open app to search.</p>
        </div>
      );
    }

    return (
      <div
        className={`mini-widget-content ${isDarkMode ? "dark" : ""} ${
          isPip ? "pip-mode" : ""
        }`}
        style={isPip ? { width: "100%", height: "100%", borderRadius: 0 } : {}}
      >
        {/* Top Header & Drag Handle */}
        <div
          className={`mini-widget-header ${!isPip ? "widget-drag-handle" : ""}`}
          onMouseDown={!isPip ? handleStartDrag : undefined}
          onTouchStart={!isPip ? handleStartDrag : undefined}
          title={!isPip ? "Drag widget to reposition" : ""}
        >
          <span className="location-name">
            📌 {weather.city}, {weather.country}
          </span>
          <div className="widget-controls">
            <button
              className="widget-icon-btn"
              onClick={() => onRefresh(weather.city)}
              title="Refresh Weather"
            >
              🔄
            </button>
            {hasPipSupport && (
              <button
                className={`widget-icon-btn ${isPip ? "active" : ""}`}
                onClick={handleToggleAlwaysOnTop}
                title={isPip ? "Close Always-on-top" : "Float Always-on-top"}
              >
                📺
              </button>
            )}
            {!isPip && (
              <button
                className="widget-icon-btn close-btn"
                onClick={onCloseWidget}
                title="Return to Full App"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="mini-widget-body" onClick={isPip ? undefined : onCloseWidget}>
          <div className="mini-widget-main">
            <div className="mini-temp-section">
              <span className="mini-temp">{weather.temperature}°C</span>
              <span className="mini-range">
                {weather.tempMin !== undefined && weather.tempMax !== undefined
                  ? `👇${weather.tempMin}° / 👆${weather.tempMax}°`
                  : "N/A"}
              </span>
            </div>
            <div className="mini-condition">
              <span className="mini-icon">
                {getWeatherIcon(weather.description, weather.temperature)}
              </span>
              <span className="mini-desc">{weather.description}</span>
            </div>
          </div>
          <div className="mini-widget-footer">
            <span>Last update: {new Date().toLocaleTimeString()}</span>
            {!isPip && <span className="click-expand">Double-click to expand</span>}
          </div>
        </div>
      </div>
    );
  };

  // If in PiP mode, render to the pop-out window using React Portal
  if (pipWindow) {
    return ReactDOM.createPortal(
      renderWidgetContent(true),
      pipWindow.document.body
    );
  }

  // Otherwise, render floating absolute element on screen
  return (
    <div
      ref={widgetRef}
      className="mini-widget-container"
      style={{
        position: "fixed",
        left: `${widgetPosition.x}px`,
        top: `${widgetPosition.y}px`,
        zIndex: 9999,
        width: "300px",
        height: "160px",
      }}
      onDoubleClick={onCloseWidget}
    >
      {renderWidgetContent(false)}
    </div>
  );
}
