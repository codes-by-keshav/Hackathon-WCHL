import React, { useState, useRef } from 'react';
import { X, Image, Send } from 'lucide-react';
import extensionBridge from '../../utils/extensionBridge';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';

const CreatePost = ({ onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageDimensions, setImageDimensions] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }

      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        
        // Create an image element to get dimensions
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageDimensions(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getPreviewContainerStyle = () => {
    if (!imageDimensions) return { height: '200px' };
    
    const { width, height } = imageDimensions;
    const aspectRatio = width / height;
    
    // Calculate appropriate height based on aspect ratio
    if (aspectRatio > 1.5) {
      // Wide landscape image
      return { height: '250px' };
    } else if (aspectRatio < 0.75) {
      // Portrait image
      return { height: '400px' };
    } else {
      // Square or moderate aspect ratio
      return { height: '300px' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Please enter some content');
      return;
    }

    if (loading) return;

    setLoading(true);
    
    try {
      const token = await extensionBridge.getAuthToken();
      
      const postData = {
        content: content.trim(),
      };

      if (selectedImage) {
        console.log('🖼️ Image data added to post (GridFS upload)');
        postData.imageBase64 = imagePreview;
      }

      console.log('📡 Sending request to:', `${API_BASE_URL}${API_ENDPOINTS.POSTS.CREATE}`);
      
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.POSTS.CREATE}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success) {
        console.log('✅ Post created successfully');
        onPostCreated(data.post);
        onClose();
      } else {
        throw new Error(data.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('❌ Error creating post:', error);
      alert(error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="cyber-dialog bg-black/90 border-2 border-cyan-400 max-w-2xl w-full relative overflow-hidden">
        {/* Cyber corner decorations */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400"></div>
        
        {/* Animated border effect */}
        <div className="absolute inset-0 border border-cyan-400/20 animate-pulse"></div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cyan-500/30">
            <h2 className="text-2xl font-bold text-cyan-400 neon-text font-heading">Create Quantum Post</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors border border-gray-600/50 rounded-lg hover:border-red-400/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Text Content */}
            <div>
              <label className="block text-cyan-300 text-sm font-medium mb-2 uppercase tracking-wider font-mono">
                Share Your Thoughts
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening in the quantum realm?"
                className="w-full h-32 cyber-input bg-black/80 border-2 border-gray-600 focus:border-cyan-400 text-white placeholder-gray-400 resize-none p-4 font-mono"
                maxLength={2000}
              />
              <div className="text-right text-sm text-gray-400 mt-1 font-mono">
                {content.length}/2000
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative cyber-dialog bg-gray-800/50 p-4">
                <div 
                  className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gray-900/50"
                  style={getPreviewContainerStyle()}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    style={{ 
                      display: 'block',
                      margin: '0 auto'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors border border-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
              <div className="flex items-center space-x-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="cyber-button-secondary px-4 py-2 bg-transparent border-2 border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-300 relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <Image className="w-5 h-5" />
                    <span className="font-mono uppercase tracking-wider">Add Image</span>
                  </span>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="cyber-button-secondary px-6 py-2 bg-transparent border-2 border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white transition-all duration-300"
                >
                  <span className="font-mono uppercase tracking-wider">Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="cyber-button-primary px-6 py-2 bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-mono uppercase tracking-wider">Transmitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span className="font-mono uppercase tracking-wider">Quantum Post</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;