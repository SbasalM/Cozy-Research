import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Monitor, Flashlight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const ImageTextExtractor = ({ onExtractedText }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MediaStreamTrack | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      if (cameraActive) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'environment' // Prefer back camera
            }
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            const videoTrack = stream.getVideoTracks()[0];
            setCurrentTrack(videoTrack);

            videoRef.current.onloadedmetadata = async () => {
              try {
                await videoRef.current?.play();
                setVideoStarted(true);
              } catch (e) {
                console.error('Playback failed:', e);
              }
            };
          }
        } catch (error) {
          console.error('Camera setup failed:', error);
          setCameraActive(false);
        }
      }
    };

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setCurrentTrack(null);
    };
  }, [cameraActive]);

  const toggleFlashlight = async () => {
    if (currentTrack) {
      const capabilities = currentTrack.getCapabilities();
      if (capabilities.torch) {
        try {
          await currentTrack.applyConstraints({
            advanced: [{ torch: !flashlightOn }]
          });
          setFlashlightOn(!flashlightOn);
        } catch (err) {
          console.error('Flashlight control failed:', err);
        }
      }
    }
  };

  const handleCameraToggle = () => {
    setCameraActive(!cameraActive);
    if (cameraActive) {
      setVideoStarted(false);
      setFlashlightOn(false);
    }
  };

  const handleCrop = () => {
    if (!imageRef.current || !crop.width || !crop.height) return;

    const canvas = document.createElement('canvas');
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imageRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    const croppedImage = canvas.toDataURL('image/jpeg');
    setImage(croppedImage);
    setIsCropping(false);
    setCrop({ unit: 'px', x: 0, y: 0, width: 0, height: 0 });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const captureScreenshot = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        preferCurrentTab: true,
        video: { displaySurface: "monitor" }
      });

      const video = document.createElement('video');
      video.srcObject = stream;

      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve(null);
        };
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach(track => track.stop());

      const imageData = canvas.toDataURL('image/png');
      setImage(imageData);
      setIsCropping(true);
    } catch (error) {
      console.error('Screenshot failed:', error);
      alert('Unable to capture screenshot. Please check permissions.');
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !videoStarted) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg');
      setImage(imageData);
      setIsCropping(true);
      handleCameraToggle();
    }
  };

  const processImage = async (imageData: string) => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const { text } = await response.json();
      if (text) {
        onExtractedText(text);
      }
    } catch (error) {
      console.error('Processing failed:', error);
      alert('Failed to extract text from image. Please try again.');
    } finally {
      setIsProcessing(false);
      setIsCropping(false);
      setImage(null);
    }
  };

  const clearImage = () => {
    setImage(null);
    setIsCropping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile-optimized button layout */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:space-x-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          disabled={cameraActive || isProcessing || isCropping}
        >
          <Upload className="w-4 h-4" />
          <span className="text-white">Upload</span>
        </Button>

        <Button
          onClick={handleCameraToggle}
          className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          disabled={image !== null || isProcessing}
        >
          <Camera className="w-4 h-4" />
          <span className="text-white">{cameraActive ? 'Stop' : 'Camera'}</span>
        </Button>

        {cameraActive && videoStarted ? (
          <>
            <Button
              onClick={toggleFlashlight}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto col-span-1"
              disabled={!currentTrack?.getCapabilities()?.torch}
            >
              <Flashlight className={`w-4 h-4 ${flashlightOn ? 'text-yellow-400' : ''}`} />
              <span className="text-white">{flashlightOn ? 'Light Off' : 'Light'}</span>
            </Button>

            <Button 
              onClick={captureImage} 
              disabled={isProcessing}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto col-span-1"
            >
              <Camera className="w-4 h-4" />
              <span className="text-white">Capture</span>
            </Button>
          </>
        ) : (
          <Button
            onClick={captureScreenshot}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto col-span-2 sm:col-span-1"
            disabled={cameraActive || isProcessing || isCropping}
          >
            <Monitor className="w-4 h-4" />
            <span className="text-white">Screenshot</span>
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
        <Card className="p-2 bg-black">
          <div className="relative w-full h-[400px] flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
          </div>
        </Card>
      )}

      {image && (
        <Card className="p-2">
          <div className="relative">
            {isCropping ? (
              <div>
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  aspect={undefined}
                >
                  <img
                    ref={imageRef}
                    src={image}
                    alt="To crop"
                    className="max-h-[400px] w-full object-contain"
                  />
                </ReactCrop>
                <div className="flex justify-end space-x-2 mt-2">
                  <Button variant="outline" onClick={clearImage}>
                    <span className="text-[#4A2B1B]">Cancel</span>
                  </Button>
                  <Button 
                    onClick={handleCrop} 
                    disabled={!crop.width || !crop.height}
                  >
                    <span className="text-white">Crop & Continue</span>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <img
                  src={image}
                  alt="Selected"
                  className="max-h-[400px] w-full object-contain"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={clearImage}
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="flex justify-end space-x-2 mt-2">
                  <Button variant="outline" onClick={clearImage}>
                    <span className="text-[#4A2B1B]">Cancel</span>
                  </Button>
                  <Button onClick={() => processImage(image)}>
                    <span className="text-white">Extract Text</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {isProcessing && (
        <div className="text-center text-sm text-[#4A2B1B]">
          Processing image...
        </div>
      )}
    </div>
  );
};

export default ImageTextExtractor;