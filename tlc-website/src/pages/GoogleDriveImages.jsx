import React, { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';
import Modal from './Modal'; // Import the Modal component
import './GoogleDriveImages.css';

const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

const GoogleDriveImages = ({ folderId, reloadTrigger }) => {
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state
  const [selectedIndex, setSelectedIndex] = useState(null); // Track the index of the selected image
  const [selectedImageUrl, setSelectedImageUrl] = useState(null); // Store the selected image URL

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await gapi.client.drive.files.list({
          q: `'${folderId}' in parents and mimeType contains 'image/'`,
          fields: 'files(id, name, thumbnailLink)',
          key: API_KEY,
        });
        setImages(response.result.files);
      } catch (error) {
        console.error('Error fetching images:', error);
        setError('Error fetching images. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (folderId) {
      fetchImages();
    }
  }, [folderId, reloadTrigger]); // Re-fetch images when folderId or reloadTrigger changes

  const handleThumbnailClick = (index) => {
    const imageId = images[index].id;
    const imageUrl = `${process.env.REACT_APP_GOOGLE_REDIRECT_URI}/image/${imageId}`;
    setSelectedImageUrl(imageUrl);
    setSelectedIndex(index);
  };

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      handleThumbnailClick(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex < images.length - 1) {
      handleThumbnailClick(selectedIndex + 1);
    }
  };

  return (
    <div className="image-gallery">
      {loading && <div>Loading images...</div>}
      {error && <div className="error-message">{error}</div>}
      {!loading && images.length > 0 ? (
        images.map((image, index) => (
          <div key={image.id} className="image-item" onClick={() => handleThumbnailClick(index)}>
            <img 
              src={image.thumbnailLink} 
              alt={image.name} 
              className="thumbnail" 
              onError={(e) => e.target.style.display = 'none'} 
            />
            <p>{image.name}</p>
          </div>
        ))
      ) : (
        !loading && <div>No images found.</div>
      )}
      {selectedImageUrl && (
        <Modal 
          isOpen={selectedImageUrl !== null} 
          onClose={() => setSelectedImageUrl(null)} 
          onPrevious={handlePrevious} 
          onNext={handleNext}
          imageName={images[selectedIndex]?.name} // Pass the image name safely
          currentIndex={selectedIndex} // Pass the current image index
          totalImages={images.length} // Pass the total number of images
        >
          <img src={selectedImageUrl} alt={images[selectedIndex]?.name} />
        </Modal>
      )}
    </div>
  );
};

export default GoogleDriveImages;
