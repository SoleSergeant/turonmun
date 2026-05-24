import React from 'react';
import { ArrowRight, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { CustomButton } from './ui/custom-button';

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-diplomatic-900 to-diplomatic-800 text-white relative overflow-hidden">
      {/* Animated floating orbs */}
      <motion.div 
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-diplomatic-700 opacity-20 blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.3, 0.2],
          x: [0, 30, 0],
          y: [0, -30, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      <motion.div 
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-diplomatic-700 opacity-20 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.25, 0.2],
          x: [0, -30, 0],
          y: [0, 30, 0]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      <motion.div
        className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-diplomatic-900 to-transparent"
        animate={{
          opacity: [0.5, 0.7, 0.5]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/40"
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: Math.random() * 500 
          }}
          animate={{
            y: [null, Math.random() * -200 - 100, Math.random() * 200 + 100, null],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      ))}
      
      <div className="container relative z-10 text-center">
        <motion.div 
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ 
            duration: 0.8,
            type: "spring",
            stiffness: 100
          }}
        >
          <motion.span 
            className="inline-block bg-white/10 backdrop-blur-sm text-white text-sm px-4 py-1 rounded-full mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ 
              scale: 1.05,
              backgroundColor: "rgba(255,255,255,0.15)"
            }}
          >
            <motion.span
              animate={{ 
                color: ["#fff", "#FFD700", "#fff"]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Join Us in 2025
            </motion.span>
          </motion.span>
          
          <motion.h2 
            className="text-3xl md:text-4xl font-display font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.span
              animate={{
                textShadow: [
                  "0 0 5px rgba(255,255,255,0)",
                  "0 0 15px rgba(255,255,255,0.3)",
                  "0 0 5px rgba(255,255,255,0)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Ready to Represent Your Nation?
            </motion.span>
          </motion.h2>
          
          <motion.p 
            className="text-diplomatic-100 mb-8 text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Join hundreds of delegates from around the world in addressing pressing global challenges at our MUN conference.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <CustomButton 
                to="/about" 
                variant="accent"
                size="lg"
                className="group relative overflow-hidden"
              >
                <motion.span 
                  className="absolute inset-0 bg-gradient-to-r from-gold-400/0 via-gold-400/30 to-gold-400/0"
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
                Learn More
              </CustomButton>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <CustomButton 
                to="/contact" 
                variant="accent"
                size="lg"
                className="bg-purple-500 hover:bg-purple-600 hover:border-purple-600 text-white group relative"
              >
                Contact Us 
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                >
                  <ArrowRight className="transition-transform group-hover:translate-x-1" size={16} />
                </motion.div>
              </CustomButton>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
