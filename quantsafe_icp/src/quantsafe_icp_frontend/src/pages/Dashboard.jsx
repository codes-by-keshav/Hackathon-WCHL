import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Plus, X, MessageCircle, Send } from 'lucide-react';
import PostCard from '../components/dashboard/PostCard';
import CreatePost from '../components/dashboard/CreatePost';
import PostComments from '../components/dashboard/PostComments';
import extensionBridge from '../utils/extensionBridge';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const Dashboard = ({ authState }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPostComments, setSelectedPostComments] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Add defensive check for authState
  if (!authState) {
    return <div>Loading...</div>;
  }

  const fetchPosts = useCallback(async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const token = await extensionBridge.getAuthToken();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.POSTS.GET_ALL}?page=${pageNum}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        if (reset || pageNum === 1) {
          setPosts(data.posts);
        } else {
          setPosts(prev => [...prev, ...data.posts]);
        }
        setHasMore(data.pagination.page < data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (authState?.isAuthenticated) {
      fetchPosts(1, true);
    }
  }, [authState?.isAuthenticated, fetchPosts]);

  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 1000 && hasMore && !loadingMore && !loading) {
      setPage(prev => {
        const newPage = prev + 1;
        fetchPosts(newPage);
        return newPage;
      });
    }
  }, [hasMore, loadingMore, loading, page, fetchPosts]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    setShowCreatePost(false);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const handleLogout = async () => {
    await extensionBridge.logout();
    window.location.reload();
  };

  if (!authState.isAuthenticated) {
    return <div>Please log in to access the dashboard.</div>;
  }

  return (
    <div className="min-h-screen relative">
      {/* Header with cyber styling - no background gradient here */}
      <div className="sticky top-0 z-50 backdrop-blur-md border-b border-cyan-500/20">
        <div className="cyber-dialog bg-black/40">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center relative">
                <span className="text-white font-bold text-lg neon-text">Q</span>
                <div className="absolute inset-0 border border-cyan-400/30 rounded-lg animate-pulse"></div>
              </div> */}
              <h1 className="text-5xl font-bold text-cyan-400 neon-text font-heading">QuantaVerse</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300 font-mono tracking-wider">
                Welcome, <span className="text-cyan-400">{authState.user?.username}</span>
              </span>
              <button
                onClick={handleLogout}
                className="cyber-button-primary relative overflow-hidden px-4 py-2 bg-transparent border-2 border-red-400 text-red-400 hover:bg-red-400 hover:text-black transition-all duration-300"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium uppercase tracking-wider">LOGOUT</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - removed the gradient background overlay */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Create Post Button with cyber styling */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreatePost(true)}
            className="w-full cyber-dialog bg-black/40 border-2 border-cyan-500/30 hover:border-cyan-400 transition-all duration-300 group relative overflow-hidden"
          >
            <div className="p-6 flex items-center justify-center space-x-3">
              <div className="p-2 bg-cyan-500/20 border border-cyan-400/50 rounded-lg">
                <Plus className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-gray-300 font-medium text-lg font-mono tracking-wider">
                Share your quantum thoughts...
              </span>
            </div>
            {/* Animated border effect */}
            <div className="absolute inset-0 border border-cyan-400/20 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity"></div>
          </button>
        </div>

        {/* Posts Feed */}
        <div className="space-y-8">
          {loading && posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="cyber-spinner mx-auto mb-4"></div>
              <p className="text-cyan-400 font-mono tracking-wider">Decrypting quantum feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 cyber-dialog bg-black/40">
              <div className="p-8">
                <div className="text-6xl text-cyan-400/50 mb-4">📡</div>
                <p className="text-gray-400 text-lg font-mono">No quantum transmissions detected.</p>
                <p className="text-gray-500 text-sm mt-2">Be the first to share in the QuantaVerse!</p>
              </div>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onUpdate={handlePostUpdate}
                onCommentsClick={(post) => setSelectedPostComments(post)}
              />
            ))
          )}
          
          {loadingMore && (
            <div className="text-center py-8">
              <div className="cyber-spinner mx-auto mb-4"></div>
              <p className="text-cyan-400 font-mono tracking-wider">Loading more quantum data...</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Comments Modal */}
      {selectedPostComments && (
        <PostComments
          post={selectedPostComments}
          onClose={() => setSelectedPostComments(null)}
          onUpdate={handlePostUpdate}
        />
      )}
    </div>
  );
};

export default Dashboard;