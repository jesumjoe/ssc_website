import { useState, useRef } from "react";
import { Camera, RefreshCw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import piexif from "piexifjs";

interface GeotagCameraProps {
  onCapture: (imageData: string | null) => void;
}

const GeotagCamera = ({ onCapture }: GeotagCameraProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processImage(file);
    }
  };

  const getLocation = (): Promise<{ lat: number; lng: number; address: string | null }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            resolve({
              lat: latitude,
              lng: longitude,
              address: data.display_name || "Unknown Location",
            });
          } catch (error) {
            console.error("Geocoding error:", error);
            resolve({ lat: latitude, lng: longitude, address: "Address unavailable" });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const toDegMinSec = (coordinate: number): [[number, number], [number, number], [number, number]] => {
    const absolute = Math.abs(coordinate);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60 * 100);

    return [[degrees, 1], [minutes, 1], [seconds, 100]];
  };

  const processImage = async (file: File) => {
    setLoading(true);
    setLoadingText("Fetching location...");

    try {
      // 1. Get Location first
      let locationData;
      try {
        locationData = await getLocation();
      } catch (err) {
        console.error("Failed to get location:", err);
        toast({
          title: "Location Error",
          description: "Could not retrieve current location. Please ensure location services are enabled.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setLoadingText("Processing image...");

      // 2. Load Image
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        // Resize logic
        const maxDim = 1920;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          const ratio = width / height;
          if (width > height) {
            width = maxDim;
            height = maxDim / ratio;
          } else {
            height = maxDim;
            width = maxDim * ratio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw Image
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);

        // Overlay Logic
        const overlayHeight = Math.max(120, height * 0.15);
        const fontSize = Math.max(24, height * 0.03);
        const padding = Math.max(20, width * 0.02);

        // Gradient
        const gradient = ctx.createLinearGradient(0, height - overlayHeight * 1.5, 0, height);
        gradient.addColorStop(0, "transparent");
        gradient.addColorStop(1, "rgba(0,0,0,0.8)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - overlayHeight * 1.5, width, overlayHeight * 1.5);

        // Text
        ctx.fillStyle = "white";

        // Header
        ctx.font = `bold ${fontSize * 1.2}px Arial`;
        ctx.fillText("GPS Map Camera", padding, height - overlayHeight + fontSize);

        // Address (Wrapped)
        ctx.font = `${fontSize}px Arial`;
        const address = locationData.address || "Unknown Location";
        const maxWidth = width - (padding * 2);

        const words = address.split(" ");
        let line = "";
        let y = height - overlayHeight + fontSize * 2.5;

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, padding, y);
            line = words[i] + " ";
            y += fontSize * 1.2;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, padding, y);

        // Coords & Date
        y += fontSize * 1.5;
        const dateStr = new Date().toLocaleString();
        const coordsStr = `Lat: ${locationData.lat.toFixed(6)}, Long: ${locationData.lng.toFixed(6)}`;

        ctx.font = `${fontSize * 0.8}px Arial`;
        ctx.fillStyle = "#e0e0e0";
        ctx.fillText(coordsStr, padding, y);
        ctx.fillText(dateStr, padding, y + (fontSize * 1.2));

        // Export as JPEG
        let dataUrl = canvas.toDataURL("image/jpeg", 0.9);

        // --- EXIF EMBEDDING START ---
        try {
          const gps = {};
          gps[piexif.GPSIFD.GPSLatitudeRef] = locationData.lat < 0 ? "S" : "N";
          gps[piexif.GPSIFD.GPSLatitude] = toDegMinSec(locationData.lat);
          gps[piexif.GPSIFD.GPSLongitudeRef] = locationData.lng < 0 ? "W" : "E";
          gps[piexif.GPSIFD.GPSLongitude] = toDegMinSec(locationData.lng);

          const exifObj = { "GPS": gps };
          const exifBytes = piexif.dump(exifObj);

          // Insert EXIF into the JPEG data URL
          dataUrl = piexif.insert(exifBytes, dataUrl);
          console.log("EXIF data inserted successfully");
        } catch (exifErr) {
          console.error("Error inserting EXIF data:", exifErr);
          toast({
            title: "Warning",
            description: "Visual overlay added, but failed to embed GPS metadata in file.",
            variant: "default" // Not destructive, as image is still usable
          });
        }
        // --- EXIF EMBEDDING END ---

        setImage(dataUrl);
        onCapture(dataUrl);
        setLoading(false);
      };

      img.src = objectUrl;

    } catch (err) {
      console.error("Processing error:", err);
      toast({
        title: "Error",
        description: "Failed to process image.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleRetake = (e: React.MouseEvent) => {
    e.preventDefault();
    setImage(null);
    onCapture(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const triggerInput = (e: React.MouseEvent) => {
    e.preventDefault();
    inputRef.current?.click();
  };

  return (
    <div className="space-y-4 w-full">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={inputRef}
        onChange={handleFileSelect}
      />

      {!image ? (
        <div className="relative rounded-lg overflow-hidden bg-secondary border-2 border-dashed border-muted-foreground/25 aspect-video flex flex-col items-center justify-center p-6 text-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium animate-pulse">{loadingText}</p>
            </div>
          ) : (
            <>
              <Camera className="w-10 h-10 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Tap to launch camera with location stamping
              </p>
              <Button
                type="button"
                onClick={triggerInput}
                variant="secondary"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border bg-background">
          <img src={image} alt="Captured Concern" className="w-full h-auto" />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRetake}
              className="h-8 w-8 p-0 rounded-full shadow-lg"
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="bg-green-500 text-white rounded-full h-8 w-8 flex items-center justify-center shadow-lg">
              <Check className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default GeotagCamera;
