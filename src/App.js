import { Pose } from "@mediapipe/pose";
import React, { useRef, useEffect, useState, useCallback } from "react";
import * as poseAll from "@mediapipe/pose";
import * as cam from "@mediapipe/camera_utils";
import Webcam from "react-webcam";
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null); // Use useRef for camera
  const [landmarks, setLandmarks] = useState([]); // Define a new state variable to hold the landmark results

  const connect = useCallback((canvasCtx, poseLandmarks, poseConnections, options) => {
    window.drawConnectors(canvasCtx, poseLandmarks, poseConnections, options);
  }, []);

  const land = useCallback((canvasCtx, poseLandmarks, options) => {
    window.drawLandmarks(canvasCtx, poseLandmarks, options);
  }, []);

  const onResults = useCallback((results) => {
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.globalCompositeOperation = 'source-in';
    canvasCtx.fillStyle = '#106C76';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'source-over';
    connect(canvasCtx, results.poseLandmarks, poseAll.POSE_CONNECTIONS,
              {color: '#106C76', lineWidth: 4});
    land(canvasCtx, results.poseLandmarks,
              {color: '#D6B6D7', lineWidth: 2});

    // Update the landmarks state variable with the new landmark results
    setLandmarks(results.poseWorldLandmarks);

  }, [connect, land]);

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => {
       return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    pose.onResults(onResults);

    if (
      typeof webcamRef.current!== "undefined" &&
      webcamRef.current!== null
    ) {
      cameraRef.current = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await pose.send({ image: webcamRef.current.video });
        },
        width: 640,
        height: 480,
      });
      cameraRef.current.start();
    }

    // Clean up function for useEffect
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [onResults]);

  return (
    <center>
      <div className="App">
      <h1>MediaPipe Pose Estimation</h1> 
    <p>Assisgnment for Internship</p>
      <p>This app demonstrates real-time pose estimation using MediaPipe.</p> 
      <Webcam
  ref={webcamRef}
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    width: "25%",
    height: "25%",
  }}
/>
<canvas
  ref={canvasRef}
  className="output_canvas"
  style={{
    position: "absolute",
    top: "25%",
    left: "4.5%",
    width: "50%",
    height: "70%",
    border: "1px solid black",
  }}
></canvas>
      </div>
      {landmarks.length > 0 && (
        <pre style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", overflow: "auto", color: "#ffffff" }}>
          {JSON.stringify(landmarks, null, 2)}
        </pre>
      )}
    </center>
  );
}

export default App;
