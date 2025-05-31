/**
 * Image asset utilities
 */

// Default images (public path)
export const PUBLIC_IMAGES = {
  DEFAULT_LOGO: '/images/default-logo.png',
  FAVICON: '/images/favicon.png',
};

// Application images (imported from assets)
import reactLogo from '../assets/react.svg';

export const APP_IMAGES = {
  REACT_LOGO: reactLogo,
};

/**
 * Get an image URL, with fallback
 * @param {string|null} imageUrl - Primary image URL
 * @param {string} fallbackKey - Key from PUBLIC_IMAGES to use as fallback
 * @returns {string} - Valid image URL
 */
export const getImageWithFallback = (imageUrl, fallbackKey = 'DEFAULT_LOGO') => {
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl;
  }
  return PUBLIC_IMAGES[fallbackKey] || PUBLIC_IMAGES.DEFAULT_LOGO;
};

/**
 * Preload an image to ensure it's cached
 * @param {string} src - Image source URL
 * @returns {Promise} - Resolves when image is loaded
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

export default {
  PUBLIC_IMAGES,
  APP_IMAGES,
  getImageWithFallback,
  preloadImage
};