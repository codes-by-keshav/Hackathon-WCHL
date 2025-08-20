import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Plus, X, MessageCircle, Send } from 'lucide-react';
import PostCard from '../components/dashboard/PostCard';
import CreatePost from '../components/dashboard/CreatePost';
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
      // FIXED: Use API_BASE_URL + endpoint instead of constructing manually
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <h1 className="text-xl font-bold text-white">QuantSafe Social</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-300">Welcome, {authState.user?.username}</span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Create Post Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreatePost(true)}
            className="w-full flex items-center justify-center space-x-2 p-4 bg-gray-800/60 border border-gray-700/50 rounded-2xl hover:border-cyan-500/30 transition-all duration-300 group"
          >
            <Plus className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-gray-300 font-medium">Share your thoughts...</span>
          </button>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {loading && posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              <p className="text-gray-400 mt-4">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No posts yet. Be the first to share!</p>
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
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
              <p className="text-gray-400 mt-2">Loading more posts...</p>
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
        <CommentsModal
          post={selectedPostComments}
          onClose={() => setSelectedPostComments(null)}
        />
      )}
    </div>
  );
};

// Comments Modal Component
const CommentsModal = ({ post, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [post._id]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const token = await extensionBridge.getAuthToken();
      // FIXED: Use API_BASE_URL + endpoint
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.POSTS.COMMENTS(post._id)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      const token = await extensionBridge.getAuthToken();
      // FIXED: Use API_BASE_URL + endpoint
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.POSTS.ADD_COMMENT(post._id)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      const data = await response.json();
      
      if (data.success) {
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Comments</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-96">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
              <p className="text-gray-400 mt-2">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {comment.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white">{comment.username}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-200">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <div className="border-t border-gray-700 p-6">
          <form onSubmit={handleSubmitComment} className="flex space-x-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Post</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;