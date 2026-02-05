import React from 'react';
import './Certification.css';
import nptel from "../../assets/nptel.jpg"

const certifications = [
  {
    title: "NPTEL-CloudComputing",
    issuer: "NPTEL-CloudComputing",
    date: "Jan-April 2025",
    link: "https://image2url.com/images/1756216628134-39bf92d1-8c61-4d48-a2bd-7fbc43e0bccf.jpg"
  },
  {
    title: "cyber job simulation",
    issuer: "Deloitte",
    date: "July 2025",
    link: "https://image2url.com/images/1756217046037-f2a38c81-fbc8-4b24-8ea4-65f200d038d5.jpg"
  },
  {
    title: "Ai-Data Scientist",
    issuer: "APPC",
    date: " April 2024",
    link: "https://image2url.com/images/1756229460595-3d882888-f57a-4258-bb88-66824e7eb5b8.jpg"
  },
  {
    title: "Industrial training",
    issuer: "IDE kalam technologies",
    date: "Dec 2023-April 2024",
    link: "https://image2url.com/images/1756230100383-61b360b3-5c5b-4a90-b58c-ffccf2742008.jpg"
  },
  {
    title: "TensorFlow",
    issuer: "Geeks for Geeks",
    date: "June 2025",
    link: "https://image2url.com/images/1756229878978-1078a68f-b4ff-4f93-804c-0e5c08cfaaa1.jpg"
  },
  {
    title: "Java Programming",
    issuer: "Java Certification",
    date: "May 2024",
    link: "https://image2url.com/images/java-certificate.jpg"
  },
];

function Certification() {
  return (
    <div id='certification' className="certification-page">
      <h2 className="cert-heading">📜 Certifications</h2>
      <p className="cert-intro">
        Here are some of the certifications I’ve earned to strengthen my skills.
      </p>

      <div className="cert-grid">
        {certifications.map((cert, index) => (
          <div className="cert-card" key={index}>
            <h3>{cert.title}</h3>
            <p className="issuer">{cert.issuer}</p>
            <p className="date">{cert.date}</p>
            <a 
              href={cert.link} 
              target="_blank" 
              rel="noreferrer" 
              className="view-btn"
            >
              View Certificate
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Certification;
