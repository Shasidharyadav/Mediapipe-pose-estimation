import { Pose } from "@mediapipe/pose";
import React, { useRef, useEffect, useState, useCallback } from "react";
import * as poseAll from "@mediapipe/pose";
import * as cam from "@mediapipe/camera_utils";
import Webcam from "react-webcam";
import logo from "./img.png";
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null); // Use useRef for camera
  const [landmarks, setLandmarks] = useState([]);
  const [leftAngle, setLeftAngle] = useState(0);
  const [rightAngle, setRightAngle] = useState(0);
  const [indices, setIndices] = useState({
    leftShoulderIndex: null,
    leftHandIndex: null,
    rightShoulderIndex: null,
    rightHandIndex: null,
  });

  const [leftShoulderIndex, setLeftShoulderIndex] = useState(null);
  const [leftHandIndex, setLeftHandIndex] = useState(null);
  const [rightShoulderIndex, setRightShoulderIndex] = useState(null);
  const [rightHandIndex, setRightHandIndex] = useState(null);

  const connect = useCallback((canvasCtx, poseLandmarks, poseConnections, options) => {
    window.drawConnectors(canvasCtx, poseLandmarks, poseConnections, options);
  }, []);

  const land = useCallback((canvasCtx, poseLandmarks, options) => {
    window.drawLandmarks(canvasCtx, poseLandmarks, options);
  }, []);

  const calculateAngle = (point1, point2, side) => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    console.log(`${side} angle: ${angle}`);
    return angle;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setIndices({
      leftShoulderIndex: parseInt(leftShoulderIndex, 10),
      leftHandIndex: parseInt(leftHandIndex, 10),
      rightShoulderIndex: parseInt(rightShoulderIndex, 10),
      rightHandIndex: parseInt(rightHandIndex, 10),
    });
  };

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
    canvasCtx.fillStyle = '#ffffff';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'source-over';
    connect(canvasCtx, results.poseLandmarks, poseAll.POSE_CONNECTIONS,
              {color: '#106C76', lineWidth: 4});
    land(canvasCtx, results.poseLandmarks,
              {color: '#D6B6D7', lineWidth: 2});

    const leftShoulder = results.poseLandmarks[indices.leftShoulderIndex];
    const leftHand = results.poseLandmarks[indices.leftHandIndex];
    const rightShoulder = results.poseLandmarks[indices.rightShoulderIndex];
    const rightHand = results.poseLandmarks[indices.rightHandIndex];

    if (leftShoulder && leftHand && rightShoulder && rightHand) {
      const leftAngle = calculateAngle(leftShoulder, leftHand, "Left");
      setLeftAngle(leftAngle);

      const rightAngle = calculateAngle(rightShoulder, rightHand, "Right");
      setRightAngle(rightAngle);
    }

    setLandmarks(results.poseWorldLandmarks);

  }, [connect, land, indices, leftShoulderIndex, leftHandIndex, rightShoulderIndex, rightHandIndex]);

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
selfieMode: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(onResults);

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.srcObject !== null
    ) {
      pose.send({
        image: webcamRef.current.video,
      });
    }

    const camera = new cam.Camera(webcamRef.current.video, {
      onFrame: async () => {
        await pose.send({ image: webcamRef.current.video });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
      pose.close();
    };
  }, [onResults]);

  return (
    <div className="App">
      <header className="App-header">
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
            top: "40%",
            left: "5%",
            width: "50%",
            height: "50%",
            border: "1px solid black",
          }}
        ></canvas>
        <img
          src= {logo}
          alt="Image"
          style={{  position: "absolute",
          top: "40%",
          left: "50%",
          width: "40%",
          height: "50%",
          border: "1px solid black", }}
        />
        <div style={{ color : "white"}}>
         Left angle: {leftAngle}
          <br />
          Right angle: {rightAngle}
          <br />
          <form onSubmit={handleSubmit}>
            Left index - 1: <input type="number" id="leftShoulderIndex" value={leftShoulderIndex} onChange={(e) => setLeftShoulderIndex(e.target.value)} />
            Left index - 2: <input type="number" id="leftHandIndex" value={leftHandIndex} onChange={(e) => setLeftHandIndex(e.target.value)} />
            Right index - 1: <input type="number" id="rightShoulderIndex" value={rightShoulderIndex} onChange={(e) => setRightShoulderIndex(e.target.value)} />
            Right index - 2: <input type="number" id="rightHandIndex" value={rightHandIndex} onChange={(e) => setRightHandIndex(e.target.value)} />
            <button type="submit">Submit</button>
          </form>
        </div>
      </header>
    </div>
  );
}

export default App;
