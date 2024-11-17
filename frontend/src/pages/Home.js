import React from "react";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import Carousel from "../components/Carousel";
import "../styles/styles.css";

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
  return (
    <div className="home-container">
      <Navbar />
      <section className="hero">
        <h1 className="hero-title">Your Mental Health, Secured in the Cloud</h1>
        <p className="hero-subtitle">
          Collaborate with mental health professionals and leverage cutting-edge, AI-powered technology to improve care while staying compliant with HIPAA guidelines.
        </p>
        <div className="hero-buttons">
          <Button type="primary">Get Started</Button>
          <Button type="secondary">Learn More</Button>
        </div>
      </section>
      <section className="features">
        <h2>Why Choose MindCloud?</h2>
            <div className="feature-list">
                <div className="feature-item">
                <h3>HIPAA-Compliant Security</h3>
                <p>Your data is securely stored and accessible only to authorized professionals.</p>
                </div>
                <div className="feature-item">
                <h3>AI-Driven Insights</h3>
                <p>Leverage modern AI tools to analyze and improve treatment plans.</p>
                </div>
                <div className="feature-item">
                    <h3>Seamless Collaboration</h3>
                <p>Work closely with other mental health professionals in real-time.</p>
                </div>
                <div className="feature-item">
                <h3>Cloud-Based Access</h3>
                <p>Access your data anytime, anywhere, with our secure cloud-based platform.</p>
                </div>
            </div>
        </section>
      <section className="testimonials">
        <h2>What Our Users Say</h2>
        <Carousel testimonials={testimonials} />
      </section>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} MindCloud. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
