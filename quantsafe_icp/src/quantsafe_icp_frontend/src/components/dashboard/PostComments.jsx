import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, User, Heart } from 'lucide-react';
import extensionBridge from '../../utils/extensionBridge';
import { API_BASE_URL } from '../../config/api';

const PostComments = ({ post, onClose, onUpdate }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchComments = useCallback(async (pageNum = 1, reset = false) => {
    try {
      // Fixed: Removed duplicate /api from the URL
      const response = await fetch(
        `${API_BASE_URL}/posts/${post._id}/comments?page=${pageNum}&limit=20`
      );
      
      const data = await response.json();
      
      if (data.success) {
        setComments(prevComments => 
          reset ? data.comments : [...prevComments, ...data.comments]
        );
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [post._id]);

  useEffect(() => {
    fetchComments(1, true);
  }, [fetchComments]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    
    try {
      const token = await extensionBridge.getAuthToken();
      // Fixed: Removed duplicate /api from the URL
      const response = await fetch(`${API_BASE_URL}/posts/${post._id}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      const data = await response.json();
      
      if (data.success) {
        setComments(prevComments => [data.comment, ...prevComments]);
        setNewComment('');
        
        onUpdate({
          ...post,
          engagement: {
            ...post.engagement,
            comments: post.engagement.comments + 1
          }
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - commentTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return commentTime.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Increased modal size: max-w-2xl -> max-w-4xl and max-h-[90vh] -> max-h-[95vh] */}
      <div className="cyber-dialog bg-black/90 border-2 border-cyan-400 w-full max-w-4xl mx-4 max-h-[95vh] flex flex-col relative overflow-hidden">
        {/* Cyber corner decorations */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400"></div>
        
        {/* Animated border effect */}
        <div className="absolute inset-0 border border-cyan-400/20 animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Header - increased padding */}
          <div className="flex items-center justify-between p-8 border-b border-cyan-500/30">
            <h2 className="text-2xl font-bold text-cyan-400 font-heading neon-text">
              Quantum Comments
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors border border-gray-600/50 rounded-lg hover:border-red-400/50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Original Post Preview - increased padding and font size */}
          <div className="p-6 border-b border-cyan-500/30 bg-gray-800/30">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center border border-cyan-400/30">
                <User className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium text-white font-mono text-xl">{post.username}</span>
            </div>
            <p className="text-gray-300 text-base leading-relaxed font-mono">{post.content}</p>
          </div>

          {/* Comments List - improved spacing */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="cyber-spinner"></div>
                <span className="ml-3 text-cyan-400 font-mono text-lg">Decrypting comments...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl text-cyan-400/50 mb-6">💬</div>
                <p className="text-gray-400 font-mono text-lg">No quantum messages detected.</p>
                <p className="text-gray-500 text-base mt-3">Be the first to transmit!</p>
              </div>
            ) : (
              <>
                {comments.map((comment) => (
                  <div key={comment._id} className="cyber-dialog bg-gray-800/30 border border-cyan-500/20 hover:border-cyan-400/40 transition-colors relative overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 border border-cyan-400/30">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-medium text-white font-mono text-base">
                              {comment.username}
                            </span>
                            <span className="text-sm text-gray-400 font-mono">
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap font-mono">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {hasMore && (
                  <button
                    onClick={() => fetchComments(page + 1)}
                    className="w-full py-4 cyber-button-secondary border-2 border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400 transition-all duration-300"
                  >
                    <span className="font-mono uppercase tracking-wider text-base">Load More Transmissions...</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Add Comment Form - increased size and padding */}
          <div className="p-6 border-t border-cyan-500/30">
            <form onSubmit={handleSubmitComment} className="flex space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 border border-cyan-400/30">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 flex space-x-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Transmit your quantum message..."
                  className="flex-1 cyber-input bg-black/80 border-2 border-gray-600 focus:border-cyan-400 text-white placeholder-gray-400 resize-none p-4 font-mono text-base"
                  rows="3"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="cyber-button-primary px-6 py-4 bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  <span className="relative z-10">
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </span>
                </button>
              </div>
            </form>
            <div className="text-right text-sm text-gray-500 mt-2 font-mono">
              {newComment.length}/500
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostComments;