import React from 'react';
interface EvidenceGalleryProps {
  images: string[];
}
const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({ images }) => (
  <div className="grid grid-cols-3 gap-4">
    {images.map((img, idx) => (
      <img key={idx} src={img} alt={`Evidence ${idx}`} className="w-full h-32 object-cover" />
    ))}
  </div>
);
export default EvidenceGallery;
