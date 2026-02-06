import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import GeotagCamera from "@/components/GeotagCamera";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const GeotagPhoto = () => {
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const handleDownload = () => {
        if (capturedImage) {
            const link = document.createElement("a");
            link.href = capturedImage;
            link.download = `geotagged_photo_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <MainLayout>
            <section className="header-gradient py-12">
                <div className="container-narrow text-center">
                    <h1 className="text-3xl font-bold text-primary-foreground mb-2">
                        Geotag Photo Tool
                    </h1>
                    <p className="text-primary-foreground/80">
                        Capture or upload specific photos and automatically embed location data.
                    </p>
                </div>
            </section>

            <section className="py-12 bg-background">
                <div className="container-narrow space-y-8">
                    <div className="bg-card rounded-lg border p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">Capture & Tag</h2>
                        <p className="text-muted-foreground mb-6">
                            Use this tool to create verifiable evidence with embedded GPS metadata.
                            The photo will be stamped visually and metadata will be added to the file.
                        </p>

                        <GeotagCamera onCapture={setCapturedImage} />

                        {capturedImage && (
                            <div className="mt-6 flex justify-center">
                                <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Geotagged Photo
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="bg-secondary/50 rounded-lg p-6">
                        <h3 className="font-medium mb-2">How it works</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>Allow location access when prompted.</li>
                            <li>Take a photo or upload an existing image.</li>
                            <li>The system fetches your precise GPS coordinates.</li>
                            <li>Coordinates are stamped visually on the image.</li>
                            <li>GPS metadata (EXIF) is hidden inside the image file for verification.</li>
                        </ul>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
};

export default GeotagPhoto;
