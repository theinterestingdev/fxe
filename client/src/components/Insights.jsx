import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User, Tag, ChevronRight, Search, BookOpen, Bookmark, BarChart } from 'lucide-react';

const Insights = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // Blog posts data
  const blogPosts = [
    {
      title: "The Future of Web Development: Trends to Watch in 2025",
      excerpt: "Explore the emerging technologies and methodologies that will shape the web development landscape in the coming year.",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      author: "Alex Johnson",
      date: "May 15, 2025",
      category: "Technology",
      readTime: "6 min read"
    },
    {
      title: "How AI is Transforming Mobile App Development",
      excerpt: "Discover how artificial intelligence is revolutionizing the way mobile applications are built, tested, and deployed.",
      image: "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      author: "Maya Patel",
      date: "May 10, 2025",
      category: "Artificial Intelligence",
      readTime: "8 min read"
    },
    {
      title: "The Psychology of User Experience: Designing for Human Behavior",
      excerpt: "Learn how understanding cognitive psychology can help you create more intuitive and engaging user interfaces.",
      image: "https://images.unsplash.com/photo-1517292987719-0369a794ec0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      author: "David Kim",
      date: "May 5, 2025",
      category: "UX Design",
      readTime: "7 min read"
    },
    {
      title: "Serverless Architecture: Benefits and Challenges",
      excerpt: "An in-depth look at the advantages and potential pitfalls of adopting serverless computing for your applications.",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      author: "Sophia Martinez",
      date: "April 28, 2025",
      category: "Cloud Computing",
      readTime: "9 min read"
    },
    {
      title: "Building Accessible Web Applications: A Comprehensive Guide",
      excerpt: "Essential practices and techniques for creating web applications that are usable by people of all abilities.",
      image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      author: "Alex Johnson",
      date: "April 20, 2025",
      category: "Accessibility",
      readTime: "10 min read"
    },
    {
      title: "The Rise of Microservices: Breaking Down Monolithic Applications",
      excerpt: "How the microservices architecture pattern is changing the way we design, develop, and scale software systems.",
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      author: "Maya Patel",
      date: "April 15, 2025",
      category: "Architecture",
      readTime: "8 min read"
    }
  ];

  // Featured categories
  const categories = [
    "Technology", "Artificial Intelligence", "UX Design", "Cloud Computing", 
    "Accessibility", "Architecture", "Development", "Best Practices"
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
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-300">
            Freelance Insights
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover tips, trends, and strategies to succeed in the freelance marketplace and grow your career.
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-orange-500 to-red-400 mt-8 mx-auto rounded-full"></div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-1/2">
              <input 
                type="text" 
                placeholder="Search articles..." 
                className="w-full bg-gray-800/70 border border-gray-700 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
              <button className="whitespace-nowrap px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-300 hover:bg-orange-500/30 transition-colors">
                All Topics
              </button>
              <button className="whitespace-nowrap px-4 py-2 bg-gray-800/70 border border-gray-700 rounded-lg hover:bg-gray-700/70 transition-colors">
                Technology
              </button>
              <button className="whitespace-nowrap px-4 py-2 bg-gray-800/70 border border-gray-700 rounded-lg hover:bg-gray-700/70 transition-colors">
                Design
              </button>
              <button className="whitespace-nowrap px-4 py-2 bg-gray-800/70 border border-gray-700 rounded-lg hover:bg-gray-700/70 transition-colors">
                Business
              </button>
            </div>
          </div>
        </motion.div>

        {/* Featured Article */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mb-16"
        >
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              alt="Featured Article" 
              className="w-full h-[500px] object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
              <span className="inline-block px-4 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-300 text-sm mb-4">
                Featured
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">The Evolution of Web3: Decentralizing the Internet</h2>
              <p className="text-gray-300 mb-6 max-w-3xl">
                An in-depth exploration of how blockchain technology and Web3 principles are reshaping the digital landscape and creating new possibilities for decentralized applications.
              </p>
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center">
                  <User size={16} className="text-gray-400 mr-2" />
                  <span className="text-sm">James Wilson</span>
                </div>
                <div className="flex items-center">
                  <Clock size={16} className="text-gray-400 mr-2" />
                  <span className="text-sm">May 18, 2025</span>
                </div>
                <div className="flex items-center">
                  <BookOpen size={16} className="text-gray-400 mr-2" />
                  <span className="text-sm">12 min read</span>
                </div>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-400 rounded-lg font-medium hover:shadow-orange-500/30 hover:translate-y-[-2px] transition-all duration-300">
                Read Article
              </button>
            </div>
          </div>
        </motion.div>

        {/* Blog Posts Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {blogPosts.map((post, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 shadow-xl hover:shadow-orange-900/10 transition-all duration-300 hover:translate-y-[-2px] group"
            >
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    {post.category}
                  </span>
                  <div className="flex items-center text-gray-400 text-xs">
                    <Clock size={14} className="mr-1" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{post.title}</h3>
                <p className="text-gray-300 mb-4">{post.excerpt}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <User size={14} className="text-gray-400 mr-1" />
                    <span className="text-sm text-gray-400">{post.author}</span>
                  </div>
                  <button className="flex items-center text-sm text-orange-400 hover:text-orange-300 transition-colors">
                    <span className="mr-1">Read More</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Section: Categories and Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Categories */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="lg:col-span-4"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-xl">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <Tag size={20} className="mr-2 text-orange-400" />
                Popular Categories
              </h3>
              <div className="space-y-3">
                {categories.map((category, index) => (
                  <button 
                    key={index}
                    className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <span>{category}</span>
                    <ChevronRight size={16} className="text-orange-400" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Newsletter */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="lg:col-span-8"
          >
            <div className="bg-gradient-to-r from-orange-600/30 to-red-600/30 rounded-xl p-8 backdrop-blur-sm border border-orange-500/20 shadow-xl">
              <div className="flex items-start mb-6">
                <div className="p-3 rounded-lg bg-orange-500/20 mr-4">
                  <Bookmark size={24} className="text-orange-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Subscribe to Our Newsletter</h3>
                  <p className="text-gray-300">
                    Get the latest insights and articles delivered straight to your inbox.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="flex-grow bg-gray-800/70 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button className="whitespace-nowrap bg-gradient-to-r from-orange-500 to-red-400 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-orange-500/50 transition-all duration-300 hover:translate-y-[-2px]">
                  Subscribe
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
