import { useEffect } from 'react';

// List of image paths to preload
const imagesToPreload = [
  '/images/logo.png',
  '/images/logo-dark.png',
  '/images/world-map.png',
  '/images/committees/HRC.png',
  '/images/committees/ecosoc.avif',
  '/images/committees/wto.jpg',
  '/images/committees/unga.png',
  '/images/past-conferences/season1.jpg',
  '/images/past-conferences/season2.jpg',
  '/images/past-conferences/season3.jpg',
  '/images/team/placeholder.jpg',
  // Add other important images here
];

const ImagePreloader: React.FC = () => {
  useEffect(() => {
    // Preload images in the background
    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
      console.log(`Preloading image: ${src}`);
    });
  }, []);

  // This component doesn't render anything
  return null;
};

export default ImagePreloader;
