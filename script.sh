#!/bin/bash

# Navigate to the components directory
cd client/src/components

# Update LandingPage.jsx
cat > LandingPage.jsx << 'EOL'
import React from 'react';
import { motion } from 'framer-motion';

const LandingPage = ({ isLoading }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Image */}
      <motion.img
        className="w-full h-screen object-cover"
        src="./testing (2).jpg"
        alt="Team"
        initial={{ scale: 1.2 }}
        animate={!isLoading ? { scale: 1 } : {}}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        loading="lazy"
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>

      {/* Main Content */}
      <motion.div
        initial="hidden"
        animate={!isLoading ? "visible" : "hidden"}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.3 } },
        }}
        className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white text-center px-4"
      >
        <motion.h1
          variants={{
            hidden: { opacity: 0, x: 80 },
            visible: { opacity: 1, x: 0 },
          }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="ml-3 text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-wide leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300"
        >
          Connect. Collaborate. Succeed.
        </motion.h1>

        <motion.button
          variants={{
            hidden: { opacity: 0, x: 50 },
            visible: { opacity: 1, x: 0 },
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
          className="relative md:mt-53 px-6 py-3 w-3/4 md:w-1/3 lg:w-1/4 mt-64 rounded-full text-lg font-medium bg-gradient-to-r from-black to-zinc-400 shadow-lg overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white cursor-pointer"
            animate={!isLoading ? { opacity: [0, 1, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          Get Started
        </motion.button>
      </motion.div>

      {/* Testimonial 1 */}
      <motion.div
        initial={{ opacity: 0, x: -50, y: -50 }}
        animate={!isLoading ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        whileHover={{ scale: 1.05 }}
        className="absolute top-16 left-6 md:top-24 md:left-12 text-white rounded-md shadow-lg p-4 md:p-6 max-w-xs md:max-w-sm"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={!isLoading ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="text-center text-sm md:text-lg font-medium"
        >
          “This platform helped me connect with amazing professionals!”
        </motion.p>
      </motion.div>

      {/* Testimonial 2 */}
      <motion.div
        initial={{ opacity: 0, x: 50, y: 50 }}
        animate={!isLoading ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        className="absolute bottom-3 right-7 md:bottom-16 md:right-10 text-white rounded-md shadow-lg p-4 md:p-6 max-w-xs md:max-w-sm"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={!isLoading ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.8 }}
          className="text-sm md:text-lg text-center mt-6 font-medium"
        >
          “A game-changer for skill exchange and collaborations.”
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LandingPage;
EOL

# Create Dashboard.jsx
cat > Dashboard.jsx << 'EOL'
import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">Skill Exchange</div>
        <div className="navbar-links">
          <Link to="/dashboard/profile">Profile</Link>
          <Link to="/dashboard/skills">Skills</Link>
          <Link to="/dashboard/connections">Connections</Link>
          <Link to="/dashboard/activity">Activity</Link>
        </div>
        <div className="navbar-user">
          <img src="/profile-pic.jpg" alt="Profile" className="profile-pic" />
          <div className="dropdown">
            <button className="dropbtn">Settings</button>
            <div className="dropdown-content">
              <Link to="/logout">Logout</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div className="sidebar">
        <ul>
          <li>
            <button onClick={() => setActiveTab('profile')}>Profile</button>
          </li>
          <li>
            <button onClick={() => setActiveTab('skills')}>Skills</button>
          </li>
          <li>
            <button onClick={() => setActiveTab('connections')}>Connections</button>
          </li>
          <li>
            <button onClick={() => setActiveTab('activity')}>Activity</button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
EOL

# Create Profile.jsx
cat > Profile.jsx << 'EOL'
import React, { useState } from 'react';

const Profile = () => {
  const [user, setUser] = useState({
    email: 'user@example.com',
    profilePicture: '/profile-pic.jpg',
    bio: 'Freelancer specializing in web development and design.',
  });

  return (
    <div className="profile">
      <h2>Profile</h2>
      <div className="profile-info">
        <img src={user.profilePicture} alt="Profile" className="profile-pic" />
        <p>{user.email}</p>
        <p>{user.bio}</p>
        <button>Edit Profile</button>
      </div>
    </div>
  );
};

export default Profile;
EOL

# Create Skills.jsx
cat > Skills.jsx << 'EOL'
import React, { useState } from 'react';

const Skills = () => {
  const [skillsOffered, setSkillsOffered] = useState([
    { name: 'Web Development', description: 'Building responsive websites.' },
    { name: 'Graphic Design', description: 'Creating stunning visuals.' },
  ]);

  const [skillsNeeded, setSkillsNeeded] = useState([
    { name: 'SEO Optimization', description: 'Improving website rankings.' },
  ]);

  return (
    <div className="skills">
      <h2>Skills</h2>
      <div className="skills-tabs">
        <div>
          <h3>Skills Offered</h3>
          <ul>
            {skillsOffered.map((skill, index) => (
              <li key={index}>
                <strong>{skill.name}</strong>: {skill.description}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Skills Needed</h3>
          <ul>
            {skillsNeeded.map((skill, index) => (
              <li key={index}>
                <strong>{skill.name}</strong>: {skill.description}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button>Add Skill</button>
    </div>
  );
};

export default Skills;
EOL

# Create Connections.jsx
cat > Connections.jsx << 'EOL'
import React, { useState } from 'react';

const Connections = () => {
  const [connections, setConnections] = useState([
    { name: 'John Doe', skills: ['Web Development', 'SEO'] },
    { name: 'Jane Smith', skills: ['Graphic Design', 'UI/UX'] },
  ]);

  return (
    <div className="connections">
      <h2>Connections</h2>
      <input type="text" placeholder="Search by skill..." />
      <ul>
        {connections.map((connection, index) => (
          <li key={index}>
            <strong>{connection.name}</strong>: {connection.skills.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Connections;
EOL

# Create Activity.jsx
cat > Activity.jsx << 'EOL'
import React from 'react';

const Activity = () => {
  const activities = [
    'You connected with John Doe.',
    'Jane Smith added a new skill: UI/UX Design.',
  ];

  return (
    <div className="activity">
      <h2>Activity Feed</h2>
      <ul>
        {activities.map((activity, index) => (
          <li key={index}>{activity}</li>
        ))}
      </ul>
    </div>
  );
};

export default Activity;
EOL

# Create Dashboard.css
cat > Dashboard.css << 'EOL'
.dashboard {
  display: flex;
  height: 100vh;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #333;
  color: white;
}

.sidebar {
  width: 200px;
  background-color: #f4f4f4;
  padding: 1rem;
}

.main-content {
  flex: 1;
  padding: 1rem;
}

.profile-pic {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}
EOL

echo "Changes and new files created successfully!"