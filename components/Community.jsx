import { useRef, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

const Community = ({ socket, userId }) => {
  const [chatUser, setChatUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isDirectChatOpen, setIsDirectChatOpen] = useState(false);
  
  
  const videoRefs = useRef({});
  
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('online_users', (users) => {
      console.log('Received online users:', users);
      setOnlineUsers(users);
    });
    
    return () => {
      socket.off('online_users');
    };
  }, [socket]);

  
  const handleVideoInView = (id, inView) => {
    const videoElement = videoRefs.current[id];
    if (!videoElement) return;
    
    if (inView) {
      
      videoElement.play().catch(err => {
        console.log('Autoplay prevented:', err);
        
        videoElement.muted = true;
        videoElement.play().catch(e => 
          console.log('Still cannot autoplay:', e)
        );
      });
    } else {
      
      videoElement.pause();
    }
  };
  
  
  const openDirectChat = (user) => {
    setChatUser(user);
    setIsDirectChatOpen(true);
  };
  
  
  const closeDirectChat = () => {
    setIsDirectChatOpen(false);
    setChatUser(null);
  };
  
  
  const renderProjects = () => {
    
    return projects.map((project) => {
      
      const [ref, inView] = useInView({
        threshold: 0.5,
        triggerOnce: false
      });
      
      
      const setVideoRef = (element) => {
        if (element) {
          videoRefs.current[project._id] = element;
        
          if (inView) {
            element.play().catch(err => {
              console.log('Initial autoplay prevented:', err);
              element.muted = true;
              element.play().catch(e => console.log('Still cannot autoplay:', e));
            });
          }
        }
      };
      
    
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
      
      <div className="projects-container">
        {loading ? <p>Loading...</p> : renderProjects()}
      </div>
      
      {isDirectChatOpen && chatUser && (
        <div className="direct-chat-overlay">
          <div className="direct-chat-container">
            <div className="direct-chat-header">
              <h3>Chat with {chatUser.name}</h3>
              <button onClick={closeDirectChat}>Close</button>
            </div>
            <DirectChat 
              socket={socket} 
              userId={userId} 
              recipientId={chatUser.id}
              recipientName={chatUser.name}
              isOnline={onlineUsers.includes(chatUser.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Community; 