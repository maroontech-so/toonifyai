
"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

const loadingTexts = [
  "Toonifying your pixels...",
  "Sharpening the digital pencils...",
  "Adding a dash of cartoon chaos...",
  "Talking to the AI artists...",
  "Unleashing the creative robots...",
  "Painting with light and code...",
  "Almost there, stay tooned...",
];

const ESTIMATED_GENERATION_TIME_MS = 15000; // 15 seconds

export function GeneratingIndicator() {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState(loadingTexts[0]);

  useEffect(() => {
    // Animate the progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, ESTIMATED_GENERATION_TIME_MS / 20); // Update progress 20 times

    // Cycle through loading texts
    let textIndex = 0;
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % loadingTexts.length;
      setCurrentText(loadingTexts[textIndex]);
    }, 2500); // Change text every 2.5 seconds

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-3 w-full max-w-sm">
      <div className="w-full">
        <Progress value={progress} className="h-2" />
      </div>
      <div className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground">
        <span>{currentText}</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

    