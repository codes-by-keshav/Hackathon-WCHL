import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Eye, MoreHorizontal, User } from 'lucide-react';
import extensionBridge from '../../utils/extensionBridge';
import { API_BASE_URL } from '../../config/api';

const PostCard = ({ post, onUpdate, onCommentsClick }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.engagement.likes);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Check like status on component mount
  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const token = await extensionBridge.getAuthToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/posts/${post._id}/like-status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        
        if (data.success) {
          setLiked(data.liked);
          setLikeCount(data.likesCount);
          setCurrentUserId(data.currentUserId);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
        // Fallback: check if current user ID is in likedBy array
        try {
          const userResponse = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const userData = await userResponse.json();
          if (userData.success && userData.user) {
            const userId = userData.user._id;
            setCurrentUserId(userId);
            setLiked(post.engagement.likedBy?.includes(userId) || false);
          }
        } catch (fallbackError) {
          console.error('Fallback like status check failed:', fallbackError);
        }
      }
    };

    checkLikeStatus();
  }, [post._id, post.engagement.likedBy]);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return postTime.toLocaleDateString();
  };

  const getEmotionEmoji = (emotion) => {
    const emojiMap = {
      'very_happy': '😄',
      'happy': '😊',
      'excited': '🤩',
      'grateful': '🙏',
      'neutral': '😐',
      'anxious': '😰',
      'sad': '😢',
      'very_sad': '😭',
      'angry': '😠',
      'frustrated': '😤'
    };
    return emojiMap[emotion] || '😐';
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    
    console.log('🖼️ Processing image URL:', url);
    console.log('🔗 API_BASE_URL:', API_BASE_URL);
    
    if (url.startsWith('/api/upload/image/')) {
      const urlWithoutApi = url.replace('/api', '');
      const fullUrl = `${API_BASE_URL}${urlWithoutApi}`;
      console.log('🔗 Constructed full URL:', fullUrl);
      return fullUrl;
    }
    
    if (url.startsWith('http')) {
      console.log('🔗 Using existing full URL:', url);
      return url;
    }
    
    const filename = url.split('/').pop();
    const fullUrl = `${API_BASE_URL}/upload/image/${filename}`;
    console.log('🔗 Constructed URL from filename:', fullUrl);
    return fullUrl;
  };

  const handleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    
    // Optimistic update
    const wasLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    
    try {
      const token = await extensionBridge.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/posts/${post._id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        // Update with server response
        setLiked(data.liked);
        setLikeCount(data.likesCount);
        
        // Update parent component
        onUpdate({
          ...post,
          engagement: {
            ...post.engagement,
            likes: data.likesCount,
            likedBy: data.liked 
              ? [...(post.engagement.likedBy || []), currentUserId].filter(Boolean)
              : (post.engagement.likedBy || []).filter(id => id !== currentUserId)
          }
        });
      } else {
        // Revert optimistic update on failure
        setLiked(wasLiked);
        setLikeCount(prevCount);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update on error
      setLiked(wasLiked);
      setLikeCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const token = await extensionBridge.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/posts/${post._id}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        // Update parent component
        onUpdate({
          ...post,
          engagement: {
            ...post.engagement,
            shares: post.engagement.shares + 1
          }
        });

        // Create the correct share URL
        const shareUrl = `${window.location.origin}/dashboard?post=${post._id}`;
        await navigator.clipboard.writeText(shareUrl);
        alert('Post link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (e) => {
    console.error('❌ Image failed to load:', e.target.src);
    setImageError(true);
  };

  const handleImageLoad = (e) => {
    console.log('✅ Image loaded successfully:', e.target.src);
  };

  const renderImage = () => {
    if (!post.mediaUrls || post.mediaUrls.length === 0 || imageError) {
      return null;
    }

    const imageUrl = getImageUrl(post.mediaUrls[0]);
    
    if (!imageUrl) {
      console.warn('⚠️ No valid image URL found');
      return null;
    }

    return (
      <div className="mt-4">
        <img
          src={imageUrl}
          alt="Post content"
          className="w-full max-h-96 object-cover rounded-xl border border-gray-600"
          onError={handleImageError}
          onLoad={handleImageLoad}
          crossOrigin="anonymous"
        />
      </div>
    );
  };

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-white font-mono">
              {post.username}
            </h3>
            <p className="text-sm text-gray-400">
              {formatTimeAgo(post.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-sm text-gray-400">
            <span>{getEmotionEmoji(post.userFeeling?.emotion || 'neutral')}</span>
            <span className="capitalize">
              {(post.userFeeling?.emotion || 'neutral').replace('_', ' ')}
            </span>
          </div>
          <button className="p-1 text-gray-400 hover:text-cyan-400 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-white leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
        
        {/* Image */}
        {renderImage()}
      </div>

      {/* Engagement Stats */}
      <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <span>{likeCount} likes</span>
          <span>{post.engagement.comments} comments</span>
          <span>{post.engagement.shares} shares</span>
        </div>
        <div className="flex items-center space-x-1">
          <Eye className="w-4 h-4" />
          <span>{post.engagement.views} views</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t border-gray-700/50 pt-4">
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
            liked
              ? 'text-red-400 bg-red-500/10'
              : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
          }`}
        >
          <Heart
            className={`w-5 h-5 transition-transform ${
              liked ? 'fill-current scale-110' : 'group-hover:scale-110'
            }`}
          />
          <span className="font-medium">{liked ? 'Unlike' : 'Like'}</span>
        </button>

        <button
          onClick={() => onCommentsClick(post)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
        >
          <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="font-medium">Comment</span>
        </button>

        <button
          onClick={handleShare}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all duration-300"
        >
          <Share2 className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="font-medium">Share</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;