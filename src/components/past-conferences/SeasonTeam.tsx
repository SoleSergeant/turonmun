import React from 'react';
import { motion } from 'framer-motion';
import { SeasonData } from '@/data/seasonsData';
import { Facebook, Twitter, Linkedin, Instagram, Github, ExternalLink } from 'lucide-react';
import { transitionVariants } from '@/lib/transition-utils';

interface SeasonTeamProps {
  season: SeasonData;
}

const SeasonTeam: React.FC<SeasonTeamProps> = ({ season }) => {
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook size={16} />;
      case 'twitter':
        return <Twitter size={16} />;
      case 'linkedin':
        return <Linkedin size={16} />;
      case 'instagram':
        return <Instagram size={16} />;
      case 'github':
        return <Github size={16} />;
      default:
        return <ExternalLink size={16} />;
    }
  };

  return (
    <motion.div
      variants={transitionVariants.containerVariants}
      initial="initial"
      animate="visible"
      className="py-16 bg-neutral-50 dark:bg-neutral-900"
    >
      <motion.div 
        variants={transitionVariants.slideInUp}
        className="text-center mb-16"
      >
        <h2 className={`text-3xl font-bold ${season.textColor} dark:text-white`}>
          Organizing Team
        </h2>
        <p className="text-neutral-600 dark:text-neutral-300 mt-3 max-w-2xl mx-auto">
          Meet the dedicated individuals who made Season {season.year} possible through their hard work and commitment.
        </p>
      </motion.div>

      <motion.div 
        variants={transitionVariants.staggerContainer}
        className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
      >
        {season.organizers.map((member, index) => (
          <motion.div
            key={index}
            variants={transitionVariants.itemFadeIn}
            whileHover={{ 
              y: -10,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 15
              }
            }}
            className={`bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-lg group ${season.borderColor}`}
          >
            <div className="relative overflow-hidden">
              <motion.div
                className="aspect-[3/4] overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.5 }}
              >
                <motion.img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover object-center" 
                  whileHover={{ 
                    scale: 1.1,
                    transition: {
                      duration: 0.8,
                      ease: [0.25, 0.1, 0.25, 1]
                    }
                  }}
                />
              </motion.div>
              
              <motion.div 
                className={`absolute inset-0 ${season.color} opacity-0 group-hover:opacity-30 transition-opacity duration-300`}
                whileHover={{ opacity: 0.3 }}
              />
              
              {/* Social links */}
              {index % 2 === 0 && (
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 p-3 flex justify-center space-x-2 translate-y-full group-hover:translate-y-0"
                  variants={transitionVariants.slideInUp}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                >
                  {['linkedin', 'twitter', 'facebook'].map((platform, idx) => (
                    <motion.a
                      key={idx}
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${season.mediumBg} text-white p-2 rounded-full hover:scale-110 transition-transform`}
                      whileHover={{ 
                        scale: 1.2,
                        rotate: [0, -5, 5, -5, 0],
                        transition: {
                          duration: 0.3,
                          type: "spring",
                          stiffness: 400
                        }
                      }}
                      whileTap={{ scale: 0.9 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: {
                          delay: 0.1 * idx,
                          duration: 0.3
                        }
                      }}
                    >
                      {getSocialIcon(platform)}
                    </motion.a>
                  ))}
                </motion.div>
              )}
            </div>
            
            <motion.div 
              className={`p-5 ${season.lightBg}`}
              variants={transitionVariants.fadeVariants}
            >
              <motion.h3 
                className={`text-lg font-bold ${season.textColor} dark:text-white`}
                variants={transitionVariants.slideInLeft}
              >
                {member.name}
              </motion.h3>
              <motion.p 
                className="text-neutral-600 dark:text-neutral-400 text-sm mt-1"
                variants={transitionVariants.slideInLeft}
              >
                {member.role}
              </motion.p>
              
              <motion.p 
                className="mt-3 text-neutral-500 dark:text-neutral-400 text-sm"
                variants={transitionVariants.fadeVariants}
              >
                Played a key role in organizing the {season.year} conference, bringing expertise in international relations and diplomatic protocol.
              </motion.p>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default SeasonTeam;
