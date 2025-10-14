import { User, Swords, BrainCircuit, ScrollText, GitBranchPlus, Facebook, Twitter, Instagram } from 'lucide-react';
import chessBoardImg from '../assets/Landing_page_background_image.png';
import React from 'react';
import { useState } from 'react';
import ExploreDialog from '../components/ExploreDialog';

const testimonial1Img = 'https://i.imgur.com/I2kWK9z.jpg';
const testimonial2Img = 'https://i.imgur.com/Lisfn0s.jpg';
const testimonial3Img = 'https://i.imgur.com/eYw73b2.jpg';

// 🎨 Color palette
const COLORS = {
  bg: '#1a1a2e',
  surface: '#162447',
  primary: '#e94560',
  secondary: '#f0e3ca',
  text: '#f0e3ca',
};

const LandingPage = () => {
  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          background-color: #1a1a2e;
          color: #f0e3ca;
          font-family: 'Poppins', sans-serif;
          overflow-x: hidden;
        }
      `}</style>
      <div style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: '"Poppins", sans-serif' }}>
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <ExploreSection/>
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

const Navbar = () => (
  <header
    style={{
      backgroundColor: COLORS.bg,
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '1.5rem 4rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <a href="#" style={{ fontSize: '1.8rem', fontWeight: 'bold', color: COLORS.secondary, fontFamily: '"Playfair Display", serif' }}>
      Chaturanga
    </a>
    <nav style={{ display: 'flex', gap: '2rem' }}>
      <a href="#features" style={{ color: COLORS.text, textDecoration: 'none' }}>Features</a>
      <a href="#explore" style={{ color: COLORS.text, textDecoration: 'none' }}>Explore</a>
    </nav>
    <button style={{ background: 'none', border: 'none', color: COLORS.secondary }}>
      <User size={24} />
    </button>
  </header>
);

const HeroSection = () => (
  <section
    style={{
      width: '100%',
      maxWidth: '1632px',
      margin: '0 auto',
      aspectRatio: '1632 / 640',
      position: 'relative', 
      backgroundImage: `url(${chessBoardImg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}
  >
    {/* Aspect ratio placeholder */}
    <div style={{ paddingTop: '39.2%' }}></div>

    {/* Content absolutely positioned on top */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '4rem',
        padding: '2rem',
      }}
    >
      <div style={{ flex: 1 }}>
        <h1
          style={{
            fontSize: '3rem',
            color: COLORS.secondary,
            fontFamily: '"Playfair Display", serif',
            fontWeight: 'bold',
          }}
        >
          Chaturanga: The Ancient Game, Reimagined.
        </h1>
        <p style={{ marginTop: '1.5rem', color: '#ccc' }}>
          Harness the wisdom of the ancients and empower modern AI to master true strategies.
        </p>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button
            style={{
              backgroundColor: COLORS.primary,
              color: 'white',
              fontWeight: 'bold',
              padding: '0.8rem 2rem',
              borderRadius: '8px',
              border: 'none',
            }}
          >
            Begin Your Journey
          </button>
          <button
            style={{
              backgroundColor: 'transparent',
              border: `2px solid ${COLORS.secondary}`,
              color: COLORS.secondary,
              fontWeight: 'bold',
              padding: '0.8rem 2rem',
              borderRadius: '8px',
            }}
          >
            Discover Your Legacy
          </button>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#aaa' }}>
          Available for all major platforms
        </p>
      </div>

      <div style={{ flex: 1 }}></div>
    </div>
  </section>
);



const features = [
  { icon: <Swords size={40} />, title: 'Masterful Strategy', desc: 'Unveil profound tactics and depths of wisdom.' },
  { icon: <BrainCircuit size={40} />, title: 'Personalized Mentorship', desc: 'Learn from AI tailored to your mastery journey.' },
  { icon: <ScrollText size={40} />, title: 'Historical Insights', desc: 'Explore the origins and timeless strategies.' },
  { icon: <GitBranchPlus size={40} />, title: 'Seamless Experience', desc: 'Where game meets power.' },
];

const FeaturesSection = () => (
  <section id="features" style={{ backgroundColor: COLORS.surface, padding: '5rem 2rem' }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{ fontSize: '2.5rem', color: COLORS.secondary, fontFamily: '"Playfair Display", serif' }}>
        From Ancient India to Your Fingertip
      </h2>
      <p style={{ color: '#aaa', marginTop: '1rem' }}>
        Experience the strategy, intellect, and legacy of an ancient tradition reborn.
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem',
        marginTop: '3rem',
      }}>
        {features.map((f, i) => (
          <div key={i} style={{
            backgroundColor: '#1a1a2e',
            border: '1px solid #444',
            borderRadius: '10px',
            padding: '2rem',
          }}>
            <div style={{
              display: 'inline-block',
              backgroundColor: COLORS.surface,
              borderRadius: '50%',
              padding: '1rem',
              color: COLORS.primary,
              marginBottom: '1rem',
            }}>
              {f.icon}
            </div>
            <h3 style={{ color: COLORS.secondary, fontSize: '1.2rem', marginBottom: '0.5rem' }}>{f.title}</h3>
            <p style={{ color: '#ccc' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);


const explore = [
  { name: "Player VS Player", quote: "Play with your friends !", image: testimonial1Img, type: "pvp" },
  { name: "Player VS Computer", quote: "Test your skills with computer !", image: testimonial2Img, type: "pvc" },
  { name: "Explore More", quote: "Explore more exciting adventures !", image: testimonial3Img, type: "explore" },
];

const ExploreSection = () => {
  const [dialogType, setDialogType] = useState(null);

  const handleClick = (type) => {
    if (type === "explore") {
      window.location.href = "#explore-more";
    } else {
      setDialogType(type);
    }
  };

  return (
    <section id="explore" style={{ padding: "5rem 2rem", textAlign: "center" }}>
      <h2
        style={{
          fontSize: "2.5rem",
          color: COLORS.secondary,
          fontFamily: '"Playfair Display", serif',
          marginBottom: "3rem",
        }}
      >
        Explore the features
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "3rem",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        {explore.map((t, i) => (
          <div key={i}>
            <div onClick={() => handleClick(t.type)} style={{ cursor: "pointer" }}>
              <img
                src={t.image}
                alt={t.name}
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `4px solid ${COLORS.secondary}`,
                  marginBottom: "1rem",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "scale(1.08)";
                  e.currentTarget.style.boxShadow = `0 0 20px ${COLORS.secondary}`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <p style={{ color: COLORS.secondary, fontWeight: "bold" }}>{t.name}</p>
              <p style={{ color: "#ddd", fontStyle: "italic" }}>"{t.quote}"</p>
            </div>
          </div>
        ))}
      </div>

      {dialogType && (
        <ExploreDialog type={dialogType} onClose={() => setDialogType(null)} />
      )}
    </section>
  );
};




const CTASection = () => (
  <section style={{ backgroundColor: COLORS.surface, textAlign: 'center', padding: '5rem 2rem' }}>
    <h2 style={{ color: COLORS.secondary, fontSize: '2.5rem', fontFamily: '"Playfair Display", serif' }}>
      Embark on Your Quest for Mastery.
    </h2>
    <button style={{
      backgroundColor: COLORS.primary,
      color: 'white',
      fontWeight: 'bold',
      padding: '1rem 3rem',
      borderRadius: '8px',
      border: 'none',
      marginTop: '1.5rem',
    }}>
      Begin Your Journey Now
    </button>
    <p style={{ color: '#aaa', marginTop: '1rem' }}>Free access to foundational strategies.</p>
  </section>
);

const Footer = () => (
  <footer style={{ backgroundColor: '#00000050', padding: '2rem', textAlign: 'center', color: '#aaa' }}>
    <h3 style={{ color: COLORS.secondary, fontFamily: '"Playfair Display", serif', fontSize: '1.5rem' }}>Chaturanga</h3>
    <p style={{ marginTop: '0.5rem' }}>© 2025 Chaturanga. All rights reserved.</p>
    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
      <Facebook size={20} />
      <Twitter size={20} />
      <Instagram size={20} />
    </div>
  </footer>
);

export default LandingPage;
