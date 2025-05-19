import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Award, Heart, MapPin, Mail, Phone, Linkedin, Twitter, Instagram, Github } from 'lucide-react';

const AboutUs = () => {
  const navigate = useNavigate();
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // Platform values
  const values = [
    {
      icon: <Award size={24} className="text-blue-400" />,
      title: "Quality Skills",
      description: "We connect you with skilled freelancers who deliver exceptional work across various domains."
    },
    {
      icon: <Heart size={24} className="text-purple-400" />,
      title: "Community",
      description: "We foster a supportive community where freelancers and clients can grow together."
    },
    {
      icon: <MapPin size={24} className="text-green-400" />,
      title: "Opportunity",
      description: "We create opportunities for talented individuals to showcase their skills and find meaningful work."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyan-300">
            About Us
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Learn about FxE's mission to connect talented freelancers with clients seeking their skills.
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-green-500 to-cyan-400 mt-8 mx-auto rounded-full"></div>
        </motion.div>

        {/* Our Story Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-24"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-white">Our Story</h2>
              <p className="text-gray-300 mb-4">
                Founded in 2025, FxE began with a simple mission: to create a platform where skilled freelancers and clients can connect, collaborate, and thrive. What started as an idea to bridge the gap between talent and opportunity has grown into a vibrant marketplace for skill exchange.
              </p>
              <p className="text-gray-300 mb-4">
                We believe that everyone has valuable skills to offer, and that the gig economy should be accessible, transparent, and rewarding. Our platform empowers freelancers to showcase their talents and helps clients find the perfect match for their project needs.
              </p>
              <p className="text-gray-300">
                Today, we're proud to host a growing community of freelancers across various skills and disciplines, from development and design to content creation and consulting, enabling meaningful collaborations that drive success.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-green-500/20 to-cyan-500/20 blur-xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Team meeting" 
                className="rounded-xl relative z-10 w-full shadow-2xl border border-gray-800/50"
              />
            </div>
          </div>
        </motion.div>

        {/* Our Values */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-24 text-center"
        >
          <h2 className="text-3xl font-bold mb-6 text-white">Our Values</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
            These core principles guide everything we do at FxE.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + (index * 0.2), duration: 0.5 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 shadow-xl"
              >
                <div className="p-4 rounded-full bg-gray-700/50 inline-block mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-gray-300">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mb-24 text-center"
        >
          <h2 className="text-3xl font-bold mb-6 text-white">How FxE Works</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
            A simple process to connect freelancers with clients seeking their skills
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-xl relative"
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-cyan-400 flex items-center justify-center font-bold text-2xl">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4 mt-2">Create Your Profile</h3>
              <p className="text-gray-300">
                Sign up and build your freelancer profile showcasing your skills, portfolio, and experience.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-xl relative"
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-cyan-400 flex items-center justify-center font-bold text-2xl">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4 mt-2">Connect With Clients</h3>
              <p className="text-gray-300">
                Browse project opportunities or receive inquiries directly from clients looking for your expertise.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-xl relative"
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-cyan-400 flex items-center justify-center font-bold text-2xl">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4 mt-2">Get Rewarded</h3>
              <p className="text-gray-300">
                Complete projects, receive payments securely, and build your reputation through client reviews.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="bg-gradient-to-r from-green-600/30 to-cyan-600/30 rounded-2xl p-10 backdrop-blur-sm border border-green-500/20 shadow-xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
              <p className="text-gray-300 mb-8">
                Have a question or want to work with us? We'd love to hear from you!
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin size={20} className="text-green-400 mr-3" />
                  <span>123 Innovation Way, Tech City, TC 10101</span>
                </div>
                <div className="flex items-center">
                  <Mail size={20} className="text-green-400 mr-3" />
                  <span>hello@fxe.com</span>
                </div>
                <div className="flex items-center">
                  <Phone size={20} className="text-green-400 mr-3" />
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>
              <div className="flex mt-8 space-x-4">
                <a href="#" className="p-3 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
                  <Linkedin size={20} className="text-green-400" />
                </a>
                <a href="#" className="p-3 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
                  <Twitter size={20} className="text-green-400" />
                </a>
                <a href="#" className="p-3 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
                  <Instagram size={20} className="text-green-400" />
                </a>
                <a href="#" className="p-3 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
                  <Github size={20} className="text-green-400" />
                </a>
              </div>
            </div>
            <div>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-800/70 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input 
                      type="email" 
                      className="w-full bg-gray-800/70 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Your email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-800/70 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Subject"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea 
                    rows="4" 
                    className="w-full bg-gray-800/70 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Your message"
                  ></textarea>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    type="submit" 
                    className="bg-gradient-to-r from-green-500 to-cyan-400 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-green-500/50 transition-all duration-300 hover:translate-y-[-2px]"
                  >
                    Send Message
                  </button>
                  <button 
                    type="button" 
                    onClick={() => navigate('/community')}
                    className="bg-gradient-to-r from-blue-500 to-blue-400 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:translate-y-[-2px]"
                  >
                    Find Freelancers
                  </button>
                  <button 
                    type="button" 
                    onClick={() => navigate('/projects')}
                    className="bg-gradient-to-r from-purple-500 to-pink-400 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:translate-y-[-2px]"
                  >
                    Become a Freelancer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
