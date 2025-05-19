import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Code, PenTool, Layout, Smartphone, BarChart, MessageSquare, CheckCircle } from 'lucide-react';

const Services = () => {
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

  // Service cards data
  const services = [
    {
      icon: <Code size={24} />,
      title: "Web Development",
      description: "Find skilled developers for your website projects or offer your coding expertise.",
      color: "blue"
    },
    {
      icon: <Smartphone size={24} />,
      title: "Mobile App Development",
      description: "Connect with app developers or showcase your mobile development skills.",
      color: "purple"
    },
    {
      icon: <Layout size={24} />,
      title: "UI/UX Design",
      description: "Hire talented designers or offer your creative skills to clients worldwide.",
      color: "orange"
    },
    {
      icon: <PenTool size={24} />,
      title: "Content Writing",
      description: "Find expert writers or monetize your writing skills through various projects.",
      color: "green"
    },
    {
      icon: <BarChart size={24} />,
      title: "Digital Marketing",
      description: "Connect with marketing experts or offer your skills to businesses needing exposure.",
      color: "red"
    },
    {
      icon: <MessageSquare size={24} />,
      title: "Translation Services",
      description: "Hire multilingual translators or offer your language skills to global clients.",
      color: "cyan"
    }
  ];

  // Colors for the service cards
  const colorClasses = {
    blue: "from-blue-600/20 to-blue-500/10 border-blue-500/30",
    purple: "from-purple-600/20 to-purple-500/10 border-purple-500/30",
    green: "from-green-600/20 to-green-500/10 border-green-500/30",
    orange: "from-orange-600/20 to-orange-500/10 border-orange-500/30",
    red: "from-red-600/20 to-red-500/10 border-red-500/30",
    cyan: "from-cyan-600/20 to-cyan-500/10 border-cyan-500/30"
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pt-24 pb-20">
      {/* Hero Section */}
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            Freelance Services
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Find skilled freelancers for your projects or offer your expertise in these popular categories.
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-cyan-400 mt-8 mx-auto rounded-full"></div>
        </motion.div>

        {/* Services Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`bg-gradient-to-br ${colorClasses[service.color]} backdrop-blur-sm rounded-xl p-6 border shadow-xl hover:shadow-${service.color}-900/20 hover:translate-y-[-2px] transition-all duration-300`}
            >
              <div className={`p-3 rounded-lg bg-${service.color}-500/20 inline-block mb-4`}>
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
              <p className="text-gray-300">{service.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Process Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-24 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
            How It Works
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
            Our platform makes it easy to connect skilled freelancers with clients who need their expertise.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            {[
              { number: "01", title: "Post a Project", description: "As a client, describe your project needs and budget requirements." },
              { number: "02", title: "Get Proposals", description: "Review proposals from qualified freelancers interested in your project." },
              { number: "03", title: "Collaborate", description: "Work directly with your chosen freelancer through our secure platform." },
              { number: "04", title: "Pay Securely", description: "Release payment only when you're completely satisfied with the work." }
            ].map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + (index * 0.2), duration: 0.5 }}
                className="relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-xl"
              >
                <div className="text-4xl font-bold text-gray-700 absolute -top-5 -left-3">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3 mt-4 text-white">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-24 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-2xl p-10 text-center backdrop-blur-sm border border-blue-500/20 shadow-xl"
        >
          <h2 className="text-3xl font-bold mb-4">Join Our Freelance Community</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Whether you're looking to hire skilled professionals or showcase your talents, FxE connects you with the right opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/community')} 
              className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:translate-y-[-2px]">
              Find Freelancers
            </button>
            <button 
              onClick={() => navigate('/projects')} 
              className="bg-gradient-to-r from-purple-500 to-pink-400 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:translate-y-[-2px]">
              Become a Freelancer
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Services;
