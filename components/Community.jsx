import { useRef, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { ChatProvider } from '../client/src/components/WebSocketContext';
import DirectChat from './DirectChat';
import { useSocket } from '../client/src/components/SocketContext';

const Community = ({ userId }) => {
  const { socket } = useSocket();
  const [chatUser, setChatUser] = useState(null);
  const [isDirectChatOpen, setIsDirectChatOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  // Keep chat state in memory so overlay doesn't unmount DirectChat
  const [directChatState, setDirectChatState] = useState({});
  
  // Derive username from userId for the chat
  const username = userId ? `User-${userId.toString().substr(0, 5)}` : 'Guest';

  // Create a map to store video element refs
  const videoRefs = useRef({});

  // Handle online users updates from socket
  useEffect(() => {
    if (!socket) return;
    
    // Listen for online users
    const handleOnlineUsers = (users) => {
      console.log('Community: Received online users:', users);
      setOnlineUsers(users || []);
    };
    
    socket.on('online_users', handleOnlineUsers);
    
    // Listen for single user status update
    const handleUserStatusUpdate = ({ userId, isOnline }) => {
      console.log('Community: User status update:', userId, isOnline);
      setOnlineUsers(prev => {
        if (isOnline && !prev.includes(userId)) {
          return [...prev, userId];
        } else if (!isOnline && prev.includes(userId)) {
          return prev.filter(id => id !== userId);
        }
        return prev;
      });
    };
    
    socket.on('userStatusUpdate', handleUserStatusUpdate);
    
    return () => {
      socket.off('online_users', handleOnlineUsers);
      socket.off('userStatusUpdate', handleUserStatusUpdate);
    };
  }, [socket]);

  // Handle video autoplay
  const handleVideoInView = (id, inView) => {
    const videoElement = videoRefs.current[id];
    if (!videoElement) return;

    if (inView) {
      // Play video when in view
      videoElement.play().catch(err => {
        console.log('Autoplay prevented:', err);
        // Add muted attribute and try again for mobile
        videoElement.muted = true;
        videoElement.play().catch(e => 
          console.log('Still cannot autoplay:', e)
        );
      });
    } else {
      // Pause when out of view
      videoElement.pause();
    }
  };

  // Open direct chat with a user
  const openDirectChat = (user) => {
    setChatUser(user);
    setIsDirectChatOpen(true);
  };
  // Close direct chat but keep chat state in memory
  const closeDirectChat = () => {
    setIsDirectChatOpen(false);
    // Do not clear chatUser so DirectChat stays mounted, just hide overlay
  };

  // Project list rendering
  const renderProjects = () => {
    // ... existing code ...
    return projects.map((project) => {
      // Create ref for IntersectionObserver hook
      const [ref, inView] = useInView({
        threshold: 0.5,
        triggerOnce: false
      });

      // Set up video ref
      const setVideoRef = (element) => {
        if (element) {
          videoRefs.current[project._id] = element;
          // Initial check for visibility
          if (inView) {
            element.play().catch(err => {
              console.log('Initial autoplay prevented:', err);
              element.muted = true;
              element.play().catch(e => console.log('Still cannot autoplay:', e));
            });
          }
        }
      };

      // Watch for changes in view status
      useEffect(() => {
        handleVideoInView(project._id, inView);
      }, [inView, project._id]);

      const isUserOnline = onlineUsers.includes(project.userId);

      return (
        <div key={project._id} className="project-card" ref={ref}>
          <div className="project-header">
            <div className="user-info">
              <img src="/profile.png" alt="Profile" />
              <div>
                <span className="username">{project.username || 'user'}</span>
                <span className={`status-indicator ${isUserOnline ? 'online' : 'offline'}`}>
                  {isUserOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            {userId !== project.userId && (
              <button 
                className="chat-btn"
                onClick={() => openDirectChat({
                  id: project.userId,
                  name: project.username || 'user'
                })}
              >
                Chat
              </button>
            )}
          </div>

          {project.projectType === 'image' ? (
            <img src={project.projectUrl} alt={project.description || 'Project'} className="project-media" />
          ) : (
            <video 
              ref={setVideoRef}
              className="project-media" 
              loop
              playsInline
              controls={false}
              src={project.projectUrl}
            />
          )}

          <div className="project-footer">
            <p>{project.description || 'No description'}</p>
            <div className="project-actions">
              <button className="like-btn">
                <i className="fa fa-heart"></i> {project.likes || 0}
              </button>
              <button className="comment-btn">
                <i className="fa fa-comment"></i> {project.comments?.length || 0}
              </button>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="community-container">
      {/* ... existing code ... */}
      <div className="projects-container">
        {loading ? <p>Loading...</p> : renderProjects()}
      </div>

      {/* Keep DirectChat mounted, just toggle overlay visibility */}
      <div style={{ display: isDirectChatOpen && chatUser ? 'block' : 'none' }} className="direct-chat-overlay">
        {chatUser && (
          <div className="direct-chat-container">
            <div className="direct-chat-header">
              <h3>Chat with {chatUser.name}</h3>
              <button onClick={closeDirectChat}>Close</button>
            </div>
            <ChatProvider username={username} roomId={`direct_${userId}_${chatUser.id}`}>
              <DirectChat 
                username={username}
                recipientName={chatUser.name}
              />
            </ChatProvider>
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;