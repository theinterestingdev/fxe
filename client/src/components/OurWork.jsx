import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Code, Users, BarChart, Shield } from 'lucide-react';

const OurWork = () => {
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

  // Project data
  const projects = [
    {
      title: "E-Commerce Platform",
      description: "A complete online shopping solution with integrated payment processing and inventory management.",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      tags: ["React", "Node.js", "MongoDB", "Stripe"],
      color: "blue"
    },
    {
      title: "Healthcare App",
      description: "Mobile application allowing patients to schedule appointments and consult with doctors remotely.",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      tags: ["React Native", "Firebase", "WebRTC"],
      color: "green"
    },
    {
      title: "Financial Dashboard",
      description: "Interactive analytics platform for financial data visualization and reporting.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      tags: ["Vue.js", "D3.js", "Express", "PostgreSQL"],
      color: "purple"
    },
    {
      title: "Educational Platform",
      description: "Online learning management system with course creation, student tracking, and interactive lessons.",
      image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      tags: ["Angular", "Django", "AWS", "Socket.io"],
      color: "orange"
    },
    {
      title: "Real Estate App",
      description: "Property listing and management tool with virtual tours and mortgage calculator.",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      tags: ["Next.js", "GraphQL", "Mapbox", "Tailwind CSS"],
      color: "cyan"
    },
    {
      title: "Social Network",
      description: "Community platform with real-time messaging, content sharing, and user engagement analytics.",
      image: "https://images.unsplash.com/photo-1556155092-490a1ba16284?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      tags: ["React", "Redux", "Node.js", "MongoDB", "Redis"],
      color: "red"
    }
  ];

  // Client testimonials
  const testimonials = [
    {
      name: "Sarah Johnson",
      company: "TechInnovate Inc.",
      quote: "FxE delivered an exceptional e-commerce platform that exceeded our expectations. Their attention to detail and commitment to quality is unparalleled.",
      avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    },
    {
      name: "Michael Chen",
      company: "HealthPlus",
      quote: "Working with FxE was a game-changer for our healthcare app. They understood our vision and brought it to life with cutting-edge technology.",
      avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    },
    {
      name: "Emily Rodriguez",
      company: "EduTech Solutions",
      quote: "The educational platform FxE built for us has transformed how we deliver online learning. Their innovative approach and technical expertise are impressive.",
      avatar: "https://randomuser.me/api/portraits/women/3.jpg",
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
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
            Success Stories
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore how freelancers and clients have achieved great results through our platform.
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-pink-400 mt-8 mx-auto rounded-full"></div>
        </motion.div>

        {/* Projects Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {projects.map((project, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 shadow-xl hover:shadow-indigo-900/10 transition-all duration-300 hover:translate-y-[-2px] group"
            >
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-3">{project.title}</h3>
                <p className="text-gray-300 mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  <span className="mr-1">View Project</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-24 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-2xl p-10 backdrop-blur-sm border border-indigo-500/20 shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: <Users size={28} />, number: "10,000+", label: "Active Freelancers", color: "text-blue-400" },
              { icon: <Code size={28} />, number: "25,000+", label: "Completed Projects", color: "text-purple-400" },
              { icon: <BarChart size={28} />, number: "98%", label: "Client Satisfaction", color: "text-green-400" },
              { icon: <Shield size={28} />, number: "100+", label: "Skill Categories", color: "text-orange-400" }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + (index * 0.2), duration: 0.5 }}
                className="text-center"
              >
                <div className={`${stat.color} inline-block mb-3`}>
                  {stat.icon}
                </div>
                <h3 className="text-3xl font-bold mb-1">{stat.number}</h3>
                <p className="text-gray-300">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-24 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            What Clients Say
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
            Don't just take our word for it - hear from our satisfied clients.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + (index * 0.2), duration: 0.5 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-xl text-left"
              >
                <p className="italic text-gray-300 mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full mr-4 border-2 border-indigo-500"
                  />
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">{testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OurWork;
