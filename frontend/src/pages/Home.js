import React from "react";
// import { Link } from "react-router-dom";
import '../styles/styles.css';

const Home = () => {
    return (
      <div className="container">
        <h1>Welcome to the Home Page</h1>
        <p>This is the main page of your application.</p>
        <nav className="nav">
          {/* <Link to="/login" className="link">Login</Link>
          <Link to="/register" className="link">Register</Link> */}
        </nav>
      </div>
    );
  };
  
  export default Home;


// import React from 'react';

// const Home = () => <h1>Home is Rendering</h1>;

// export default Home;