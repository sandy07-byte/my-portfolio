import React from "react";
import "./Home.css";
import AnchorLink from "react-anchor-link-smooth-scroll";

function Home() {
  return (
    <div id="home" className="hero">
      <h1 className="hero-title">
        <span>Hello.. Iam Sandeep Damera</span>
      </h1>

      <p className="hero-content">
        Hi, I’m <strong>Sandeep Damera</strong>, a passionate software developer who loves
        exploring new technologies and solving challenging problems.  
        I have hands-on experience in C, C++, Java, Python, JavaScript, React.js, SQL, and
        Data Structures, along with a growing interest in DevOps.  
        With a strong foundation in programming and problem-solving, I enjoy building
        projects that are both practical and impactful.  
        I’m an enthusiastic learner who thrives on exploring emerging tech and constantly
        upgrading my skills.  
        I am currently learning DevOps, AI, and Machine Learning tools to broaden my
        expertise and stay ahead in the evolving tech world.  
        Let’s connect and create something amazing together!
      </p>

      <div className="hero-section">
        <div className="hero-connect">
          <AnchorLink
            className="anchor-link nav-contact"
            href="#contact"
            offset="50"
          >
            Connect with me
          </AnchorLink>
        </div>

        <a className="hero-resume" href="/resume.pdf" target="_blank" rel="noopener noreferrer">My Resume</a>
      </div>
    </div>
  );
}

export default Home;
