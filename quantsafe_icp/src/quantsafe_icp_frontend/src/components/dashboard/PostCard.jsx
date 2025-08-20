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
  const [imageDimensions, setImageDimensions] = useState(null);

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
        setLiked(data.liked);
        setLikeCount(data.likesCount);
        
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
        setLiked(wasLiked);
        setLikeCount(prevCount);
      }
    } catch (error) {
      console.error('Error liking post:', error);
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
        onUpdate({
          ...post,
          engagement: {
            ...post.engagement,
            shares: post.engagement.shares + 1
          }
        });

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
    const { naturalWidth, naturalHeight } = e.target;
    setImageDimensions({ width: naturalWidth, height: naturalHeight });
  };

  const getImageDisplayStyle = () => {
    if (!imageDimensions) return { maxWidth: '100%' };
    
    const { width, height } = imageDimensions;
    const aspectRatio = width / height;
    const containerWidth = 580; // Approximate container width
    
    if (aspectRatio > 1.8) {
      // Very wide landscape - limit height
      const displayHeight = Math.min(320, containerWidth / aspectRatio);
      return {
        width: 'auto',
        height: `${displayHeight}px`,
        maxWidth: '100%'
      };
    } else if (aspectRatio < 0.6) {
      // Very tall portrait - limit width but allow full height up to reasonable limit
      const displayWidth = Math.min(containerWidth * 0.7, width);
      const displayHeight = Math.min(700, displayWidth / aspectRatio);
      return {
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
        maxWidth: '100%'
      };
    } else {
      // Normal aspect ratios - scale to fit container width
      const displayHeight = Math.min(600, containerWidth / aspectRatio);
      return {
        width: '100%',
        height: 'auto',
        maxHeight: `${displayHeight}px`
      };
    }
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
      <div className="mt-4 post-image">
        <div className="flex justify-center rounded-xl border border-cyan-500/30 bg-gray-900/50 p-2">
          <img
            src={imageUrl}
            alt="Post content"
            className="post-image rounded-lg"
            onError={handleImageError}
            onLoad={handleImageLoad}
            crossOrigin="anonymous"
            style={{
              ...getImageDisplayStyle(),
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="cyber-dialog bg-black/40 border-2 border-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 group relative overflow-hidden">
      {/* Animated border effect */}
      <div className="absolute inset-0 border border-cyan-400/10 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity"></div>
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center border border-cyan-400/30">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white font-mono text-lg">
                {post.username}
              </h3>
              <p className="text-sm text-gray-400 font-mono">
                {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>
          
          {/* <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-600/50">
              <span className="text-lg">{getEmotionEmoji(post.userFeeling?.emotion || 'neutral')}</span>
              <span className="capitalize font-mono">
                {(post.userFeeling?.emotion || 'neutral').replace('_', ' ')}
              </span>
            </div>
            <button className="p-2 text-gray-400 hover:text-cyan-400 transition-colors border border-gray-600/50 rounded-lg hover:border-cyan-400/50">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div> */}
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-white leading-relaxed whitespace-pre-wrap font-mono text-base">
            {post.content}
          </p>
          
          {/* Image */}
          {renderImage()}
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center justify-between mb-6 text-sm text-gray-400 bg-gray-800/30 p-3 rounded-lg border border-gray-600/30">
          <div className="flex items-center space-x-6 font-mono">
            <span className="flex items-center space-x-1">
              <Heart className="w-4 h-4 text-red-400" />
              <span>{likeCount} likes</span>
            </span>
            <span className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span>{post.engagement.comments} comments</span>
            </span>
            <span className="flex items-center space-x-1">
              <Share2 className="w-4 h-4 text-green-400" />
              <span>{post.engagement.shares} shares</span>
            </span>
          </div>
          <div className="flex items-center space-x-1 font-mono">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>{post.engagement.views} views</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-gray-700/50 pt-4 gap-2">
          <button
            onClick={handleLike}
            disabled={loading}
            className={`flex-1 cyber-button-secondary relative overflow-hidden px-4 py-3 bg-transparent border-2 transition-all duration-300 ${
              liked
                ? 'border-red-400 text-red-400 bg-red-500/10'
                : 'border-gray-600 text-gray-400 hover:border-red-400 hover:text-red-400 hover:bg-red-500/10'
            }`}
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <Heart className={`w-5 h-5 transition-transform ${liked ? 'fill-current scale-110' : 'group-hover:scale-110'}`} />
              <span className="font-medium font-mono uppercase tracking-wider">{liked ? 'Unlike' : 'Like'}</span>
            </span>
          </button>

          <button
            onClick={() => onCommentsClick(post)}
            className="flex-1 cyber-button-secondary relative overflow-hidden px-4 py-3 bg-transparent border-2 border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="font-medium font-mono uppercase tracking-wider">Comment</span>
            </span>
          </button>

          <button
            onClick={handleShare}
            disabled={loading}
            className="flex-1 cyber-button-secondary relative overflow-hidden px-4 py-3 bg-transparent border-2 border-gray-600 text-gray-400 hover:border-green-400 hover:text-green-400 hover:bg-green-500/10 transition-all duration-300"
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              <Share2 className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="font-medium font-mono uppercase tracking-wider">Share</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;