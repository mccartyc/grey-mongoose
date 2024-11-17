import React, { useState } from "react";

const Carousel = ({ testimonials }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((currentIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((currentIndex - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="carousel">
      <button className="carousel-button" onClick={prevTestimonial}>
        &#10094;
      </button>
      <div className="testimonial-item">
        <p>"{testimonials[currentIndex].text}"</p>
        <span>- {testimonials[currentIndex].author}</span>
      </div>
      <button className="carousel-button" onClick={nextTestimonial}>
        &#10095;
      </button>
    </div>
  );
};

export default Carousel;
