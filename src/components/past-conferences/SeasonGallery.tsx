import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SeasonData } from '@/data/seasonsData';
import { X, ZoomIn } from 'lucide-react';
import { transitionVariants } from '@/lib/transition-utils';

interface SeasonGalleryProps {
  season: SeasonData;
}

const SeasonGallery: React.FC<SeasonGalleryProps> = ({ season }) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedImage(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <motion.div
      variants={transitionVariants.containerVariants}
      initial="initial"
      animate="visible"
      className="py-12"
    >
      <motion.div 
        variants={transitionVariants.slideInUp}
        className="text-center mb-12"
      >
        <h2 className={`text-3xl font-bold ${season.textColor} dark:text-white`}>Photo Gallery</h2>
        <p className="text-neutral-600 dark:text-neutral-300 mt-3 max-w-2xl mx-auto">
          Visual highlights from our Season {season.year} conference capturing key moments and memories.
        </p>
      </motion.div>

      <motion.div 
        variants={transitionVariants.containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {season.photos.map((photo, index) => (
          <motion.div
            key={index}
            className="rounded-xl overflow-hidden shadow-lg group relative cursor-pointer"
            variants={transitionVariants.itemVariants}
            whileHover={{ 
              y: -10, 
              scale: 1.03,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20
              }
            }}
            onClick={() => openLightbox(index)}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <motion.img 
                src={photo.url} 
                alt={photo.caption}
                className="w-full h-full object-cover" 
                whileHover={{ 
                  scale: 1.12,
                  transition: {
                    duration: 0.8,
                    ease: [0.25, 0.1, 0.25, 1]
                  }
                }}
              />
            </div>
            <motion.div 
              className={`absolute inset-0 bg-gradient-to-t ${season.color} opacity-0 group-hover:opacity-50`}
              initial={{ opacity: 0 }}
              whileHover={{ 
                opacity: 0.5,
                transition: {
                  duration: 0.3
                }
              }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 right-0 p-5 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
              initial={{ y: 20, opacity: 0 }}
              whileHover={{ 
                y: 0, 
                opacity: 1,
                transition: {
                  duration: 0.3,
                  ease: "easeOut"
                }
              }}
            >
              <h3 className="text-white font-semibold text-lg">{photo.caption}</h3>
              <p className="text-white/90 text-sm">Season {season.year}</p>
            </motion.div>
            
            <motion.div 
              className={`absolute top-3 right-3 ${season.mediumBg} ${season.textColor} text-xs font-medium px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 flex items-center gap-1`}
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ 
                scale: 1.1,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 10
                }
              }}
            >
              <ZoomIn size={12} />
              <span>{index + 1}/{season.photos.length}</span>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }
              }}
              exit={{ 
                scale: 0.9, 
                opacity: 0,
                transition: { duration: 0.2 } 
              }}
              className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img 
                src={season.photos[selectedImage].url} 
                alt={season.photos[selectedImage].caption} 
                className="w-full h-full object-contain"
                layoutId={`photo-${selectedImage}`}
              />
              <motion.button 
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                onClick={closeLightbox}
                whileHover={{ 
                  scale: 1.1,
                  rotate: 90,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} />
              </motion.button>
              <motion.div 
                className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-black/0 text-white"
                initial={{ y: 50, opacity: 0 }}
                animate={{ 
                  y: 0, 
                  opacity: 1,
                  transition: { delay: 0.2, duration: 0.3 }
                }}
                exit={{ y: 30, opacity: 0 }}
              >
                <h3 className="text-lg font-semibold">{season.photos[selectedImage].caption}</h3>
                <p className="text-sm opacity-80">Season {season.year}</p>
              </motion.div>
              
              {/* Navigation buttons */}
              {selectedImage > 0 && (
                <motion.button
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/80 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(selectedImage - 1);
                  }}
                  whileHover={{ scale: 1.1, x: -5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </motion.button>
              )}
              
              {selectedImage < season.photos.length - 1 && (
                <motion.button
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/80 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(selectedImage + 1);
                  }}
                  whileHover={{ scale: 1.1, x: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SeasonGallery;
