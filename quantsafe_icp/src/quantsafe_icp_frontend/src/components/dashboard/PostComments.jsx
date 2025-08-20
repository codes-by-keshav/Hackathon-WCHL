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
      const response = await fetch(
        `${API_BASE_URL}/api/posts/${post._id}/comments?page=${pageNum}&limit=20`
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
      const response = await fetch(`${API_BASE_URL}/api/posts/${post._id}/comment`, {
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
        
        // Update post comment count
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl border border-cyan-500/20 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-cyan-400 font-heading">
            Comments
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Original Post Preview */}
        <div className="p-4 border-b border-gray-700 bg-gray-700/30">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-white font-mono">{post.username}</span>
          </div>
          <p className="text-gray-300 text-sm line-clamp-3">{post.content}</p>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="cyber-spinner"></div>
              <span className="ml-3 text-cyan-400 font-mono">Loading comments...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 font-mono">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment._id} className="bg-gray-700/30 rounded-xl p-4 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-white font-mono text-sm">
                          {comment.username}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {hasMore && (
                <button
                  onClick={() => fetchComments(page + 1)}
                  className="w-full py-3 text-cyan-400 hover:text-cyan-300 font-mono text-sm transition-colors"
                >
                  Load more comments...
                </button>
              )}
            </>
          )}
        </div>

        {/* Add Comment Form */}
        <div className="p-4 border-t border-gray-700">
          <form onSubmit={handleSubmitComment} className="flex space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 flex space-x-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 p-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:border-cyan-500/50 transition-colors"
                rows="2"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl text-white transition-colors flex items-center justify-center"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
          <div className="text-right text-xs text-gray-500 mt-1">
            {newComment.length}/500
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostComments;