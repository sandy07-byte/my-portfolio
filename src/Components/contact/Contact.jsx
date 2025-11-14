import React from 'react';
import './Contact.css';
import mail from '../../assets/mail.jpg';
import call from '../../assets/contact.jpg';

 function Contact() {
  const [result, setResult] = React.useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setResult("Sending....");
    
    const formData = new FormData(event.target);
    const contactData = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message")
    };

    try {
      const response = await fetch("http://localhost:5000/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData)
      });

      const data = await response.json();

      if (data.ok) {
        setResult("Message sent successfully!");
        event.target.reset();
      } else {
        console.log("Error", data);
        setResult(data.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Network error:", error);
      setResult("Failed to send message. Please check if the server is running.");
    }
  };

  return (
    <div id='contact' className="contact">
      <div className="contact-title">
        <h1>Get in Touch</h1>
      </div>

      <div className="contact-section">
        <div className="contact-left">
          <h1>Let's Talk</h1>
          <p>
            I am currently available to take on new projects and collaborations.
            Whether you need a dynamic web application, a responsive website, or a robust backend solution,
            I am ready to bring your ideas to life. Let’s connect and make something amazing together!
          </p>

          <div className="contact-details">
            <div className="contact-detail">
              <img src={mail} alt="Mail" />
              <a href="mailto:sandeepdamera11@gmail.com">sandeepdamera11@gmail.com</a>
            </div>
            <div className="contact-detail">
              <img src={call} alt="Phone" />
              <a href="tel:+917989357929">+91 7989357929</a>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="contact-right">
          <label htmlFor="name">Your Name</label>
          <input id="name" type="text" placeholder="Enter your name" name="name" required />

          <label htmlFor="email">Your Email</label>
          <input id="email" type="email" placeholder="Enter your email" name="email" required />

          <label htmlFor="message">Your Message</label>
          <textarea id="message" name="message" rows="8" placeholder="Enter your message" required></textarea>

          <button type="submit" className="contact-submit">Submit Now</button>
        </form>
      </div>
    </div>
  );
}

export default Contact;
