/**
 * @file        SubhaLagna v3.4.0 — Interactive Landing Page
 * @description Transitioned to session-aware UI. Component splitted.
 * @author        SubhaLagna Team
 * @version      3.4.0
 */
import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from './home/HomeHeader';
import { HeroSection, StatsSection, HowItWorks, SuccessStories, MarriageExperience, CTASection, Footer } from './home/HomeSections';


// ─── Main Home Component ─────────────────────────────────────────────────────
const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>SubhaLagna — Trusted Matrimony for Modern Indian Soulmates</title>
        <meta
          name="description"
          content="Find your life partner on SubhaLagna. Verified profiles, smart matchmaking, and secure conversations."
        />
      </Helmet>
      <Header />
      <HeroSection />
      <StatsSection />
      <HowItWorks />
      <SuccessStories />
      <MarriageExperience />
      <CTASection />
      <Footer />

      <style>{`
            @keyframes bounce-slow {
               0%, 100% { transform: translateY(0); }
               50% { transform: translateY(-5px); }
            }
            .animate-bounce-slow {
               animation: bounce-slow 3s ease-in-out infinite;
            }
            @keyframes float-heart {
               0%, 100% {
                  transform: translateY(0px) rotate(0deg) scale(1);
                  opacity: 0.4;
               }
               25% {
                  transform: translateY(-8px) rotate(5deg) scale(1.1);
                  opacity: 0.7;
               }
               50% {
                  transform: translateY(-3px) rotate(-3deg) scale(0.95);
                  opacity: 0.5;
               }
               75% {
                  transform: translateY(-10px) rotate(3deg) scale(1.05);
                  opacity: 0.6;
               }
            }
            .animate-float-heart {
               animation: float-heart 4s ease-in-out infinite;
               color: #fecdd3;
            }
            html {
               scroll-behavior: smooth;
            }
            ::-webkit-scrollbar {
               display: none;
            }
            html {
               -ms-overflow-style: none;
               scrollbar-width: none;
            }
         `}</style>
    </div>
  );
};

export default Home;
