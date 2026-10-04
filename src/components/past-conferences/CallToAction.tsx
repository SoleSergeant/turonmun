
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import { SeasonData } from '@/data/seasonsData';
import { useContent, useFill, rich } from '@/content/store';

interface CallToActionProps {
  selectedSeason: SeasonData;
}

const CallToAction: React.FC<CallToActionProps> = ({ selectedSeason }) => {
  const text = useContent('past_conferences');
  return (
    <AnimatePresence mode="wait">
      <motion.section 
        key={`cta-${selectedSeason.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="py-20 bg-diplomatic-700 text-white"
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-4 text-center"
        >
          <h2 className="text-3xl font-bold mb-6">{text.cta_title}</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            {text.cta_text}
          </p>
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <CustomButton variant="accent" size="lg" to="/register">
              <Sparkles className="mr-2 h-5 w-5" />
              {text.cta_button}
            </CustomButton>
          </motion.div>
        </motion.div>
      </motion.section>
    </AnimatePresence>
  );
};

export default CallToAction;
