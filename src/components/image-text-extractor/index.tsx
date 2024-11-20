import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Crop, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ImageTextExtractor = ({ onExtractedText }) => {
  const [image, setImage] = useState(null);
  const [croppedArea, setCroppedArea] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera capture
  const handleCameraToggle = async () => {
    try {
      if (!cameraActive) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      } else {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        setCameraActive(false);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  // Capture image from camera
  const captureImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setImage(canvas.toDataURL('image/jpeg'));
    setIsCropping(true);
    handleCameraToggle();
  };

  // Clear selected image
  const clearImage = () => {
    setImage(null);
    setCroppedArea(null);
    setIsCropping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button
          onClick={() => fileInputRef.current.click()}
          className="flex items-center space-x-2"
          disabled={cameraActive}
        >
          <Upload className="w-4 h-4" />
          <span>Upload</span>
        </Button>

        <Button
          onClick={handleCameraToggle}
          className="flex items-center space-x-2"
          disabled={image !== null}
        >
          <Camera className="w-4 h-4" />
          <span>{cameraActive ? 'Stop Camera' : 'Start Camera'}</span>
        </Button>

        {cameraActive && (
          <Button onClick={captureImage}>
            <Camera className="w-4 h-4 mr-2" />
            Capture
          </Button>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      {cameraActive && (
        <Card className="p-2">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-h-[400px] object-contain"
          />
        </Card>
      )}

      {image && (
        <Card className="p-2">
          <div className="relative">
            <img
              src={image}
              alt="Selected"
              className="w-full max-h-[400px] object-contain"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={clearImage}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ImageTextExtractor;