import React from 'react';
import './Footer.css';
import insta from '../../assets/insta.jpg';
import linkedin from '../../assets/linkedin.jpg';
import call from '../../assets/contact.jpg';

function Footer() {
  return (
    <div id="foot" className="footer">
      <div className="footer-top">
        <div className="footer-top-left">
          <h1>Sandeep</h1>
          <p>A passionate software developer who loves exploring new technologies and solving challenging problems.</p>
        </div>

        <a href="https://www.linkedin.com/in/your-linkedin-username" target="_blank" rel="noopener noreferrer" className="socialmedia-detail">
          <img src={linkedin} alt="LinkedIn" />
          <p>LinkedIn</p>
        </a>

        <a href="https://www.instagram.com/your-instagram-username" target="_blank" rel="noopener noreferrer" className="socialmedia-detail">
          <img src={insta} alt="Instagram" />
          <p>Instagram</p>
        </a>

        <a href="tel:+917989357929" className="socialmedia-detail">
          <img src={call} alt="Phone" />
          <p>+91 7989357929</p>
        </a>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Sandeep Damera. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Footer;
