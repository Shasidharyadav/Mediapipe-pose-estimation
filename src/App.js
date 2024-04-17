import { Pose } from "@mediapipe/pose";
import React, { useRef, useEffect, useCallback } from "react";
import * as poseAll from "@mediapipe/pose";
import * as cam from "@mediapipe/camera_utils";
import Webcam from "react-webcam";
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null); // Use useRef for camera

  const connect = useCallback((canvasCtx, poseLandmarks, poseConnections, options) => {
    window.drawConnectors(canvasCtx, poseLandmarks, poseConnections, options);
  }, []);

  const land = useCallback((canvasCtx, poseLandmarks, options) => {
    window.drawLandmarks(canvasCtx, poseLandmarks, options);
  }, []);

  useEffect(() => {
    const onResults = (results) => {
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
      canvasCtx.restore();

      console.log(results.poseWorldLandmarks);
    };

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
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
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
  }, [connect, land]);

  return (
    <center>
      <div className="App">
      <h1>MediaPipe Pose Estimation</h1> 
      <p>This app demonstrates real-time pose estimation using MediaPipe.</p> 
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: 640,
            height: 480,
          }}
        />
        <canvas
          ref={canvasRef}
          className="output_canvas"
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 9,
            width: 640,
            height: 480,
          }}
        ></canvas>
      </div>
    </center>
  );
}

export default App;
