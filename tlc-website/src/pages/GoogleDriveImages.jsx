import React, { useEffect, useState, useRef } from 'react';
import { gapi } from 'gapi-script';
import Modal from './Modal'; // Import the Modal component
import './GoogleDriveImages.css';

const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

const GoogleDriveImages = ({ folderId }) => {
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null); // Track the index of the selected image
  const [selectedImage, setSelectedImage] = useState(null); // Store the selected image URL
  const isFirstRender = useRef(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await gapi.client.drive.files.list({
          q: `'${folderId}' in parents and mimeType contains 'image/'`,
          fields: 'files(id, name, thumbnailLink)',
          key: API_KEY,
        });
        setImages(response.result.files);
      } catch (error) {
        setError('Error fetching images');
      }
    };

    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (folderId) {
        fetchImages();
      }
    }
  }, [folderId]);

  const loadImage = async (index) => {
    try {
      const imageId = images[index].id;
      const response = await fetch(`${process.env.REACT_APP_GOOGLE_REDIRECT_URI}/image/${imageId}`);
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setSelectedImage(imageUrl);
      setSelectedIndex(index);
    } catch (error) {
      setError('Error fetching the original image');
    }
  };

  const handleThumbnailClick = (index) => {
    loadImage(index);
  };

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      loadImage(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex < images.length - 1) {
      loadImage(selectedIndex + 1);
    }
  };

  return (
    <div className="image-gallery">
      {error && <div>{error}</div>}
      {images.length > 0 ? (
        images.map((image, index) => (
          <div key={image.id} className="image-item">
            <img 
              src={image.thumbnailLink} 
              alt={image.name} 
              className="thumbnail" 
              onClick={() => handleThumbnailClick(index)}
              onError={(e) => e.target.style.display = 'none'} 
            />
            <p>{image.name}</p>
          </div>
        ))
      ) : (
        <div>No images found.</div>
      )}
      {selectedImage && (
        <Modal 
          isOpen={selectedImage !== null} 
          onClose={() => setSelectedImage(null)} 
          onPrevious={handlePrevious} 
          onNext={handleNext}
          imageName={images[selectedIndex].name} // Pass the image name
          currentIndex={selectedIndex} // Pass the current image index
          totalImages={images.length} // Pass the total number of images
        >
          <img src={selectedImage} alt={images[selectedIndex].name} />
        </Modal>
      )}
    </div>
  );
};

export default GoogleDriveImages;