'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react';

// A mock function to simulate fetching data from a Google Sheet.
// In a real application, you would replace this with an actual API call.
const fetchGuestList = async () => {
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1qmH94UaJRNijT3QW97AgUT5Kc7m7Q-q5OZRlhFKziLs/export?format=csv';

  try {
    const response = await fetch(sheetUrl);
    const csvText = await response.text();
    const rows = csvText.split('\n').slice(1); // Remove header row

    const guests = rows
        .map(row => {
          const columns = row.split(',');
          const name = columns[0] ? columns[0].trim() : null;
          const guestsAllowedStr = columns[1] ? columns[1].trim() : null; // Null if empty
          const rsvpStatus = columns[2] ? columns[2].trim() : '';

          if (!name || rsvpStatus) {
            return null;
          }

          let guestsAllowed: number | null = null;
          if (guestsAllowedStr) {
            const parsedGuests = parseInt(guestsAllowedStr, 10);
            if (!isNaN(parsedGuests) && parsedGuests > 0) {
              guestsAllowed = parsedGuests;
            }
          }

          return {
            name: name,
            guests: guestsAllowed, // Can be number or null
          };
        })
        .filter((guest): guest is { name: string; guests: number | null } => guest !== null);

    return guests;
  } catch (error) {
    console.error('Error fetching guest list:', error);
    return [];
  }
};


// Icon Components (retained from original code)
const ChevronDownIcon = () => (
    <svg className="w-6 h-6 text-gold-texture" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
)

const HeartIcon = () => (
    <svg className="w-8 h-8 text-gold-texture" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
)

const CalendarIcon = () => (
    <svg className="w-6 h-6 text-gold-texture" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
)

const LocationIcon = () => (
    <svg className="w-6 h-6 text-gold-texture" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
)

const TimeIcon = () => (
    <svg className="w-6 h-6 text-gold-texture" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

// UPDATED Scroll Section Component with Intersection Observer
interface ScrollSectionProps {
  children: React.ReactNode;
  id: string;
  className?: string;
  noWrapper?: boolean; // New optional prop
}
const ScrollSection = ({ children, id, className = "", noWrapper = false }: ScrollSectionProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setIsVisible(true)
              observer.unobserve(entry.target); // Unobserve after it's visible for performance
            }
          })
        },
        { threshold: 0.2 }
    )

    const currentRef = sectionRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  return (
      <section
          id={id}
          ref={sectionRef}
          className={`min-h-screen flex flex-col justify-center items-center p-6 transition-all duration-1000 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          } ${className}`}
      >
        {noWrapper ? (
            <>{children}</>
        ) : (
            <div className="bg-amber-950/20 border border-amber-300/20 rounded-3xl shadow-2xl max-w-4xl w-full p-8 md:p-12 text-center">
              {children}
            </div>
        )}
      </section>
  )
}

// Floating Animation Component
interface FloatingElementProps {
  children: React.ReactNode;
  delay?: number;
}
const FloatingElement = ({ children, delay = 0 }: FloatingElementProps) => (
    <div
        className="animate-float"
        style={{
          animationDelay: `${delay}s`,
          animation: 'float 6s ease-in-out infinite'
        }}
    >
      {children}
    </div>
)


// Main Wedding Website Component
export default function WeddingRSVPWebsite() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isScrollLocked, setIsScrollLocked] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [guestList, setGuestList] = useState<{ name: string; guests: number | null }[]>([]);
  const [name, setName] = useState('');
  const [suggestions, setSuggestions] = useState<{ name: string; guests: number | null }[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<{ name: string; guests: number | null } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '', // Changed from email to phoneNumber
    attending: '',
    guests: '1',
    dietary: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const mainContentRef = useRef<HTMLDivElement | null>(null)

  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  // Fetch guest list from the mock API on component mount
  useEffect(() => {
    const loadGuestList = async () => {
      const list = await fetchGuestList();
      setGuestList(list);
    };
    loadGuestList();
  }, []);

  // Handle name input changes and provide suggestions
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (value.length > 1) {
      const filteredSuggestions = guestList.filter(guest =>
          guest.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  // Handle selection of a guest from the suggestions
  const handleSuggestionClick = (guest: { name: string; guests: number | null }) => {
    setName(guest.name);
    setSelectedGuest(guest);
    setSuggestions([]);
    setFormData(prev => ({
      ...prev,
      name: guest.name,
      guests: '1',
      phoneNumber: prev.phoneNumber // Keep existing phone number or clear if needed
    }));
  };

  // Generate guest number options based on the selected guest's allowance
  const guestNumberOptions = useMemo(() => {
    if (!selectedGuest || selectedGuest.guests === null) {
      return [<option key="1" value="1">Just me</option>];
    }
    return Array.from({ length: selectedGuest.guests }, (_, i) => i + 1).map(num => (
        <option key={num} value={num}>
          {num} {num > 1 ? 'people' : 'person'}
        </option>
    ));
  }, [selectedGuest]);

  // New useEffect for preloading videos
  useEffect(() => {
    const preloadVideoLink = (href: string, type: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = href;
      link.type = type;
      document.head.appendChild(link);
      return link;
    };

    const preloadAudio = () => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'audio';
      link.href = '/backgroundsound.mp3';
      link.type = 'audio/mpeg';
      document.head.appendChild(link);
      return link;
    };

    const mp4Preload = preloadVideoLink('/charlyandelyzasavethedate.mp4', 'video/mp4');
    const webmPreload = preloadVideoLink('/charlyandelyzasavethedate.webm', 'video/webm');
    const audioPreload = preloadAudio();

    // Create and start loading the audio element early
    const audioElement = new Audio('/backgroundsound.mp3');
    audioElement.load(); // Start loading audio in background

    return () => {
      // Cleanup preload links on component unmount
      if (mp4Preload && mp4Preload.parentNode) {
        document.head.removeChild(mp4Preload);
      }
      if (webmPreload && webmPreload.parentNode) {
        document.head.removeChild(webmPreload);
      }
      if (audioPreload && audioPreload.parentNode) {
        document.head.removeChild(audioPreload);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const handlePlayMedia = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setMediaPlaying(true);
      }).catch(error => {
        console.error("Audio play failed:", error);
      });
    }
  }

  const handleStart = () => {
    // Apply scroll settings first, before any state changes
    // Reset ALL scroll-related styles immediately to enable scrolling
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';

    // Re-enable scrollbars explicitly for phase 2 and apply immediately
    const enableScrollbars = document.createElement('style');
    enableScrollbars.id = 'enable-scrollbars-style';
    enableScrollbars.textContent = `
      html, body {
        scrollbar-width: auto !important;
        -ms-overflow-style: auto !important;
        overflow: auto !important;
        scroll-behavior: smooth !important;
        
      }
      
      html::-webkit-scrollbar, body::-webkit-scrollbar {
        display: none;
        width: 8px;
      }
    `;

    // Remove any existing scroll style first to avoid conflicts
    const existingStyle = document.getElementById('enable-scrollbars-style');
    if (existingStyle) {
      document.head.removeChild(existingStyle);
    }

    document.head.appendChild(enableScrollbars);

    // Force a small scroll to activate the scrollbar
    window.scrollBy(0, 1);
    window.scrollBy(0, -1);

    // Now set states after scrolling behavior is established
    setIsScrollLocked(false);
    setHasStarted(true);

    // Play audio when the user starts the experience
    handlePlayMedia();

    // Scroll to content with a delay, but shorter than before
    setTimeout(() => {
      mainContentRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 400); // Reduced from 800ms
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Basic validation
    if (!formData.name || !formData.attending || !formData.phoneNumber) {
      alert('Please fill out all required fields: Name, Attending status, and Phone Number.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          attending: formData.attending,
          guests: formData.guests,
          phonenumber: formData.phoneNumber, // Ensure this matches API expectation
          message: formData.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong with the submission.');
      }

      alert('Thank you for your RSVP! We can\'t wait to celebrate with you! 💕');
      // Reset form state on successful submission
      setFormData({
        name: '',
        phoneNumber: '', // Reset phoneNumber
        attending: '',
        guests: '1',
        dietary: '',
        message: ''
      });
      setName(''); // Also reset the separate name state for the input field
      setSelectedGuest(null);

    } catch (error: any) {
      console.error('Submission Error:', error);
      alert(`There was an error submitting your RSVP: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // MODIFY the existing useEffect for video loading logic.
  useEffect(() => {
    if (isLoading) { // <-- ADD THIS GUARD: Wait for the main 2s loading to complete
      return;
    }

    const videoElement = videoRef.current;
    let fallbackTimer: NodeJS.Timeout | undefined;

    const onVideoReady = () => {
      setIsVideoReady(true);
      setIsInitialLoading(false); // Hide initial loading screen when video is ready
      if (fallbackTimer) clearTimeout(fallbackTimer);
      // Clean up listeners once ready
      if (videoElement) {
        videoElement.removeEventListener('canplaythrough', onVideoReady);
        videoElement.removeEventListener('loadeddata', onVideoReady);
      }
    };

    if (videoElement) {
      if (videoElement.readyState >= 3) { // HTMLMediaElement.HAVE_FUTURE_DATA
        onVideoReady();
      } else {
        videoElement.addEventListener('canplaythrough', onVideoReady);
        videoElement.addEventListener('loadeddata', onVideoReady); // Fallback for broader compatibility

        fallbackTimer = setTimeout(() => {
          console.warn('Video load timeout. Hiding initial load screen & showing overlay content.');
          onVideoReady();
        }, 5000); // 5-second fallback
      }
    } else {
      // This path should be less likely now, but keep fallback
      console.warn('Video element not found after main loading. Hiding initial load screen & showing overlay content after short delay.');
      fallbackTimer = setTimeout(() => {
        setIsVideoReady(true);
        setIsInitialLoading(false);
      }, 1000);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('canplaythrough', onVideoReady);
        videoElement.removeEventListener('loadeddata', onVideoReady);
      }
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [isLoading, videoRef]); // <-- CHANGE DEPENDENCY ARRAY to [isLoading, videoRef]

  // MODIFY the existing audio playback useEffect to only setup the audio but not play it automatically
  useEffect(() => {
    if (isVideoReady && !isInitialLoading && audioRef.current) {
      const audio = audioRef.current;

      const handleCanPlayThrough = () => {
        console.log("Audio loaded successfully and can play through (WeddingRSVPWebsite).");
        audio.removeEventListener('canplaythrough', handleCanPlayThrough);
        setShowPlayButton(true); // Show play button when audio is ready
      };
      audio.addEventListener('canplaythrough', handleCanPlayThrough);
    }
  }, [isVideoReady, isInitialLoading]); // Play when video is ready and initial loading is done

  useEffect(() => {
    // Add Google Fonts
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    const handleScrollLock = () => {
      if (isScrollLocked) {
        document.body.style.overflow = 'hidden'
        document.documentElement.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
        document.documentElement.style.overflow = 'unset'
      }
    }

    handleScrollLock()

    const handleResize = () => {
      handleScrollLock()
    }

    window.addEventListener('resize', handleResize)

    const style = document.createElement('style')
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(3deg); }
      }
      
      @keyframes sparkle {
        0%, 100% { opacity: 0; transform: scale(0); }
        50% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slideInFromTop {
        from { opacity: 0; transform: translateY(-100vh); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
      }
      
      .animate-sparkle {
        animation: sparkle 2s ease-in-out infinite;
      }
      
      .animate-fadeInUp {
        animation: fadeInUp 0.8s ease-out forwards;
      }
      
      .animate-pulse-gentle {
        animation: pulse 3s ease-in-out infinite;
      }
      
      .glass-effect {
        backdrop-filter: blur(16px) saturate(180%);
        background-color: rgba(139, 115, 85, 0.1);
        border: 1px solid rgba(251, 191, 36, 0.2);
      }
      
      .text-shadow-romantic {
        text-shadow: 2px 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(251, 191, 36, 0.3);
      }

      .text-gold-texture {
        background-image: url('/goldtext.jpeg');
        background-size: cover;
        background-position: center;
        -webkit-background-clip: text;
        background-clip: text;
        color: #B8860B; /* Fallback gold color */
        -webkit-text-fill-color: transparent;
      }
      
      * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }

      *::-webkit-scrollbar {
        width: 0 !important;
        display: none !important;
      }

      html, body {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
        overflow-x: hidden !important;
      }

      html::-webkit-scrollbar, body::-webkit-scrollbar {
        width: 0 !important;
        display: none !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(link)
      document.head.removeChild(style)
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
      window.removeEventListener('resize', handleResize)
    }
  }, [isScrollLocked])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const contentTimer = setTimeout(() => {
        setShowContent(true);
      }, 100);
      return () => clearTimeout(contentTimer);
    }
  }, [isLoading]);

  useEffect(() => {
    const backgroundAudio = new Audio('/backgroundsound.mp3');
    backgroundAudio.preload = 'auto';
    backgroundAudio.load();

    if (audioRef.current === null) {
      audioRef.current = backgroundAudio;
    }

    backgroundAudio.loop = true;
    backgroundAudio.volume = 0.6;

    fetch('/backgroundsound.mp3')
        .then(response => response.blob())
        .then(blob => {
          console.log('Audio file prefetched successfully');
        })
        .catch(error => {
          console.warn('Audio prefetch failed, will still use normal loading', error);
        });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  if (isLoading) {
    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col justify-center items-center bg-cover bg-center"
            style={{ backgroundImage: "url('/charlyandelyzasavethedate-thumbnail.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
          <div className="relative z-10 text-center p-4">
            <h1 className="text-5xl md:text-7xl font-bold text-white text-shadow-romantic animate-pulse pb-2" style={{ fontFamily: 'Playfair Display, serif', lineHeight: '1.3' }}>
              Charly & Elyza
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mt-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Our moments are loading...
            </p>
            <div className="mt-8 w-12 h-12 border-2 border-t-2 border-amber-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
    );
  }

  return (
      <div className="relative min-h-screen overflow-x-hidden font-serif text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
        {isInitialLoading && (
            <div
                className="fixed inset-0 z-[100] flex flex-col justify-center items-center bg-cover bg-center"
                style={{ backgroundImage: "url('/charlyandelyzasavethedate-thumbnail.jpg')" }}
            >
              <div className="absolute inset-0 bg-black/70 backdrop-blur-lg"></div>
              <div className="relative z-10 text-center p-4">
                <h1 className="text-5xl md:text-7xl font-bold text-white text-shadow-romantic animate-pulse pb-2" style={{ lineHeight: '1.3' }}>
                  Charly & Elyza
                </h1>
                <p className="text-xl md:text-2xl text-white/80 mt-6">
                  Our love story is loading...
                </p>
              </div>
            </div>
        )}

        <div className="fixed inset-0 -z-10 overflow-hidden">
          <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23f4f1eb' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23f4f1eb'/%3E%3Ctext x='50%25' y='50%25' font-family='serif' font-size='48' fill='%23B8860B' text-anchor='middle' dy='0.25em'%3EElyza %26 Charly%3C/text%3E%3C/svg%3E"
          >
            <source src="/charlyandelyzasavethedate.mp4" type="video/mp4" />
            <source src="/charlyandelyzasavethedate.webm" type="video/webm" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-amber-900/20 to-black/60"></div>
        </div>
        {!isInitialLoading && isVideoReady}
        <div
            className={`fixed inset-0 z-50 flex flex-col justify-center items-center transition-opacity duration-1000 cursor-pointer ${
                (!isInitialLoading && isVideoReady && !hasStarted) ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={handleStart}
        >
          {!isInitialLoading && isVideoReady && !hasStarted && (
              <div className="text-center animate-fadeInUp pointer-events-none">
                <p className="mt-8 text-lg font-light opacity-80 text-amber-200">
                  {typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'Click anywhere to continue' : 'Touch anywhere to start'}
                </p>
              </div>
          )}
        </div>
        <main
            ref={mainContentRef}
            className={`relative transition-opacity duration-1000 ${hasStarted ? 'opacity-100' : 'opacity-0'}`}
        >
          <ScrollSection id="bible-verse" noWrapper={true} className="relative pt-1 md:pt-1">
            {/* Logo outside the box */}
            <div className="logo-gold-texture mb-8 mx-auto mt-6"></div>

            {/* Manually create the glass box here */}
            <div className="bg-amber-950/20 border border-amber-300/20 rounded-3xl shadow-2xl max-w-4xl w-full p-8 md:p-12 text-center">
              <p className="text-2xl md:text-3xl font-light text-shadow-romantic text-amber-100 mb-4 italic">
                "Therefore what God has joined together, let no one separate."
              </p>
              <p className="text-xl md:text-2xl font-semibold text-amber-200">
                Mark 10:9
              </p>
            </div>

            {/* Chevron scroll down animation */}
            <div className="absolute left-[50%] -translate-x-1/2 bottom-20 z-20 flex flex-col items-center text-gold-texture">
              <p className="mb-2 text-center">Scroll Down</p>
              <div className="chevron-container">
                <div className="chevron"></div>
                <div className="chevron"></div>
                <div className="chevron"></div>
              </div>
            </div>
          </ScrollSection>

          <ScrollSection id="introduction">
            <div className="text-center">
              <p className="text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto font-light text-amber-200">
                Mr Ramez & Mrs Bernadette Nassif with Mr Youssef & Mrs Liliane Geitany alongside their families are honoured to invite you to the
                wedding of their beloved children,
              </p>
              <div className="mb-8">
                <h1 className="text-6xl md:text-8xl font-bold mb-6 text-gold-texture pb-2" style={{lineHeight: '1.4'}}>
                  Charly & Elyza
                </h1>
              </div>
            </div>
          </ScrollSection>
          <ScrollSection id="details">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-texture leading-snug">
                Wedding Details
              </h2>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="glass-effect rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 border border-amber-300/20 hover:border-amber-300/40">
                  <div className="flex justify-center mb-4 text-amber-300">
                    <CalendarIcon />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-amber-100">Date & Time</h3>
                  <p className="text-lg text-amber-50">Saturday, July 19th, 2025</p>
                  <p className="text-lg text-amber-50">6:30 PM Ceremony</p>
                  <p className="text-sm opacity-80 mt-2 text-amber-200">Reception to follow</p>
                </div>

                <div
                    className="glass-effect rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 border border-amber-300/20 hover:border-amber-300/40" >
                  <a
                      href="https://maps.app.goo.gl/4AAVmsZKLY3876Ya8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block glass-effect rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 border border-amber-300/20 hover:border-amber-300/40 cursor-pointer"
                  >
                    <div className="flex justify-center mb-4 text-amber-300">
                      <LocationIcon/>
                    </div>
                    <h3 className="text-2xl font-semibold mb-3 text-amber-100">Location</h3>
                    <p className="text-lg font-semibold text-amber-50">Saint John</p>
                    <p className="text-base text-amber-100">Imar</p>
                    <p className=" text-amber-100">click to open google maps</p>
                  </a>
                </div>
              </div>
            </div>
          </ScrollSection>
          <ScrollSection id="timeline">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-texture">
                Celebration Timeline
              </h2>
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="glass-effect rounded-xl p-6 text-left border border-amber-300/20">
                  <div className="flex items-center mb-2">
                    <div className="text-amber-300">
                      <TimeIcon />
                    </div>
                    <span className="ml-3 text-xl font-semibold text-amber-100">6:30 PM - Ceremony</span>
                  </div>
                  <p className="ml-9 opacity-90 text-amber-200">Exchange of vows in the church courtyard</p>
                </div>
                <div className="glass-effect rounded-xl p-6 text-left border border-amber-300/20">
                  <div className="flex items-center mb-2">
                    <div className="text-amber-300">
                      <TimeIcon />
                    </div>
                    <span className="ml-3 text-xl font-semibold text-amber-100">7:30 PM - Welcome drink</span>
                  </div>
                  <p className="ml-9 opacity-90 text-amber-200">Celebrating with cocktails and canapés</p>
                </div>

                <div className="glass-effect rounded-xl p-6 text-left border border-amber-300/20">
                  <div className="flex items-center mb-2">
                    <div className="text-amber-300">
                      <TimeIcon />
                    </div>
                    <span className="ml-3 text-xl font-semibold text-amber-100">8:15 PM - Reception</span>
                  </div>
                  <p className="ml-9 opacity-90 text-amber-200">Dinner, dancing, and memories</p>
                </div>
              </div>
            </div>
          </ScrollSection>
          <ScrollSection id="info">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-texture">
                Important Information
              </h2>
              <div className="grid md:grid-cols-1 gap-8 max-w-4xl mx-auto text-left">
                <div className="glass-effect rounded-2xl p-6 border border-amber-300/20">
                  <p className="text-lg leading-relaxed text-amber-200">
                    Because love is in the air—but so is a timeline! Please arrive fashionably on time, dress to impress (yes, photos will happen)
                    , and bring your dancing shoes. The ceremony starts promptly, the food will be fabulous, and the vibes? Immaculate.
                    Kindly note this is an adults-only celebration—so book the babysitter and get ready for an unforgettable night!
                  </p>
                </div>
              </div>
            </div>
          </ScrollSection>
          <ScrollSection id="rsvp">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gold-texture">
                Please RSVP
              </h2>
              <p className="text-xl mb-8 opacity-90 text-amber-100">
                Kindly respond by July 5th, 2025
              </p>
              <div className="max-w-2xl mx-auto space-y-6 text-left">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label htmlFor="name" className="block text-lg font-medium mb-2 text-amber-100">
                      Full Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={name}
                        onChange={handleNameChange}
                        required
                        className="w-full px-4 py-3 rounded-xl glass-effect border border-amber-300/30 focus:border-amber-300/60 focus:outline-none text-gold-texture placeholder-yellow-600 bg-amber-950/20"
                        placeholder="Your full name"
                        autoComplete="off"
                    />
                    {suggestions.length > 0 && (
                        <ul className="absolute z-10 w-full bg-amber-950/80 border border-amber-300/30 rounded-xl mt-1 max-h-60 overflow-auto">
                          {suggestions.map((guest, index) => (
                              <li
                                  key={index}
                                  className="px-4 py-2 cursor-pointer hover:bg-amber-900/50 text-amber-100"
                                  onClick={() => handleSuggestionClick(guest)}
                              >
                                {guest.name}
                              </li>
                          ))}
                        </ul>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phonenumber" className="block text-lg font-medium mb-2 text-amber-100">
                      Phone Number *
                    </label>
                    <input
                        type="tel"
                        id="phonenumber"
                        name="phoneNumber" // Changed to phoneNumber to match state
                        value={formData.phoneNumber} // Changed from formData.email
                        onChange={handleFormChange}
                        required
                        className="w-full px-4 py-3 rounded-xl glass-effect border border-amber-300/30 focus:border-amber-300/60 focus:outline-none text-gold-texture placeholder-yellow-600 bg-amber-950/20"
                        placeholder="123-456-7890"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-lg font-medium mb-4 text-amber-100">
                    Will you be attending? *
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 glass-effect rounded-xl p-4 cursor-pointer hover:bg-amber-900/30 transition-all duration-300 border border-amber-300/20 hover:border-amber-300/40">
                      <input
                          type="radio"
                          name="attending"
                          value="yes"
                          checked={formData.attending === 'yes'}
                          onChange={handleFormChange}
                          className="w-5 h-5 text-amber-500"
                      />
                      <span className="text-lg text-amber-100"> Joyfully Accept</span>
                    </label>
                    <label className="flex items-center space-x-3 glass-effect rounded-xl p-4 cursor-pointer hover:bg-amber-900/30 transition-all duration-300 border border-amber-300/20 hover:border-amber-300/40">
                      <input
                          type="radio"
                          name="attending"
                          value="no"
                          checked={formData.attending === 'no'}
                          onChange={handleFormChange}
                          className="w-5 h-5 text-amber-500"
                      />
                      <span className="text-lg text-amber-100"> Regretfully Decline</span>
                    </label>
                  </div>
                </div>
                {formData.attending === 'yes' && (
                    <div className="space-y-6 animate-fadeInUp">
                      <div>
                        <label htmlFor="guests" className="block text-lg font-medium mb-2 text-amber-100">
                          Number of Guests
                        </label>
                        {!selectedGuest ? (
                            // Case when no guest is selected from the suggestion list yet
                            <>
                              <select
                                  id="guests"
                                  name="guests"
                                  value={formData.guests}
                                  onChange={handleFormChange}
                                  className="w-full px-4 py-3 rounded-xl glass-effect border border-amber-300/30 focus:border-amber-300/60 focus:outline-none text-gold-texture bg-amber-950/20"
                                  disabled={true}
                              >
                                {guestNumberOptions}
                              </select>
                              <p className="text-amber-200 text-sm mt-2">Please select your name from the list to see guest options.</p>
                            </>
                        ) : selectedGuest.guests !== null ? (
                            // Case when the selected guest has a specific number of guests allowed
                            <select
                                id="guests"
                                name="guests"
                                value={formData.guests}
                                onChange={handleFormChange}
                                className="w-full px-4 py-3 rounded-xl glass-effect border border-amber-300/30 focus:border-amber-300/60 focus:outline-none text-gold-texture bg-amber-950/20"
                            >
                              {guestNumberOptions}
                            </select>
                        ) : (
                            // Case when the guest can bring any number of guests (Column B is empty)
                            <input
                                type="number"
                                id="guests"
                                name="guests"
                                value={formData.guests}
                                onChange={handleFormChange}
                                min="1"
                                className="w-full px-4 py-3 rounded-xl glass-effect border border-amber-300/30 focus:border-amber-300/60 focus:outline-none text-gold-texture placeholder-yellow-600 bg-amber-950/20"
                                placeholder="Enter number of guests"
                            />
                        )}
                      </div>
                    </div>
                )}
                <div>
                  <label htmlFor="message" className="block text-lg font-medium mb-2 text-amber-100">
                    Special Message (Optional)
                  </label>
                  <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleFormChange}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl glass-effect border border-amber-300/30 focus:border-amber-300/60 focus:outline-none text-gold-texture placeholder-yellow-600 resize-none bg-amber-950/20"
                      placeholder="Share your excitement or well wishes with us!"
                  />
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="glass-effect hover:bg-amber-900/30 transition-all duration-300 text-amber-100 hover:text-white font-semibold py-6 px-12 rounded-full flex items-center space-x-4 mx-auto transform hover:scale-105 active:scale-95 border border-amber-300/30 hover:border-amber-300/50 animate-pulse-gentle text-xl pointer-events-auto"
                >
                  {isSubmitting ? (
                      <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending RSVP...
                  </span>
                  ) : (
                      'Send RSVP'
                  )}
                </button>
                <div className="mt-8 text-center text-amber-200">
                  <p>Your presence at our wedding is the greatest gift of all.</p>
                  <p>For those who wish, whish account: 20507813-03</p>
                </div>
              </div>
            </div>
          </ScrollSection>
        </main>
      </div>
  );
}

