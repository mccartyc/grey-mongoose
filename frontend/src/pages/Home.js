import React from "react";
import { Link } from "react-router-dom";
import LandingNavbar from "../components/landing/LandingNavbar";
import { motion } from "framer-motion";
import "../styles/homeStyles.css";
import { useInView } from "react-intersection-observer";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldAlt, faBrain, faUsers, faCloud } from "@fortawesome/free-solid-svg-icons";

const testimonials = [
  {
    text: "MindCloud transformed the way I manage my clients' data. It's secure, efficient, and reliable!",
    author: "Dr. Jane Smith, Therapist",
  },
  {
    text: "Collaboration with colleagues has never been easier. The AI tools are a game-changer.",
    author: "Dr. John Doe, Psychiatrist",
  },
  {
    text: "I feel confident knowing my practice adheres to HIPAA guidelines with MindCloud.",
    author: "Sarah Williams, Counselor",
  },
];

const Home = () => {
    const { ref: featureRef, inView: featureInView } = useInView({
        triggerOnce: true,
        threshold: 0.1,
      });

  return (
    <div className="main-container">
      <LandingNavbar />

      {/* Hero Section */}
      <motion.section 
        className="hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-content">
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Your Mental Health,<br />
            <span className="gradient-text">Secured in the Cloud</span>
          </motion.h1>
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Collaborate with mental health professionals and leverage cutting-edge,
            AI-powered technology to improve care while staying compliant with HIPAA guidelines.
          </motion.p>
          <motion.div 
            className="hero-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link to="/register" className="btn primary-btn">Get Started</Link>
            <Link to="/login" className="btn secondary-btn">Log In</Link>
          </motion.div>
        </div>
        <div className="hero-image">
          <div className="gradient-sphere"></div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        ref={featureRef} 
        className="features"
        initial={{ opacity: 0, y: 40 }}
        animate={featureInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <h2 className="section-title">Why Choose MindCloud?</h2>
        <div className="feature-list">
          <div className="feature-item">
            <FontAwesomeIcon icon={faShieldAlt} className="feature-icon" />
            <h3>HIPAA-Compliant Security</h3>
            <p>Your data is securely stored and accessible only to authorized professionals.</p>
          </div>
          <div className="feature-item">
            <FontAwesomeIcon icon={faBrain} className="feature-icon" />
            <h3>AI-Driven Insights</h3>
            <p>Leverage modern AI tools to analyze and improve treatment plans.</p>
          </div>
          {/* <div className="feature-item">
            <FontAwesomeIcon icon={faUsers} className="feature-icon" />
            <h3>Seamless Collaboration</h3>
            <p>Work closely with other mental health professionals in real-time.</p>
          </div> */}
          <div className="feature-item">
            <FontAwesomeIcon icon={faCloud} className="feature-icon" />
            <h3>Cloud-Based Access</h3>
            <p>Access your data anytime, anywhere, with our secure cloud-based platform.</p>
          </div>
        </div>
      </motion.section>
      {/* Testimonials Section */}
      <section className="testimonials">
        <h2 className="section-title">What Our Users Say</h2>
        <div className="testimonial-grid">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="testimonial-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
            >
              <p>"{testimonial.text}"</p>
              <cite>{testimonial.author}</cite>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>MindCloud</h3>
            <p>Empowering mental health professionals with secure, intelligent solutions.</p>
          </div>
          <div className="footer-links">
            <div className="footer-section">
              <h4>Product</h4>
              <Link to="/features">Features</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/security">Security</Link>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/careers">Careers</Link>
            </div>
            <div className="footer-section">
              <h4>Resources</h4>
              <Link to="/blog">Blog</Link>
              <Link to="/documentation">Documentation</Link>
              <Link to="/support">Support</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} MindCloud. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
