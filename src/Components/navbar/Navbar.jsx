import React, { useState } from "react";
import "./Navbar.css";
import AnchorLink from "react-anchor-link-smooth-scroll";
import open from "../../assets/open.png";
import close from "../../assets/closing.png";

const Navbar = () => {
  const [menu, setMenu] = useState("home");
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { key: "home", label: "Home", id: "home" },
    { key: "about", label: "About Me", id: "about" },
    { key: "projects", label: "Projects", id: "projects" },
    { key: "certification", label: "Certifications", id: "certification" },
    { key: "contact", label: "Contact Me", id: "contact" },
    { key: "social", label: "Social Media", id: "foot" }, // footer ID
  ];

  return (
    <div className="navbar">
      <div className="nav-left">
        <h1 className="logo-text">Sañvin</h1>
      </div>

      <div className="nav-right">
        {/* Hamburger open icon */}
        <img
          src={open}
          alt="open menu"
          className="nav-open"
          onClick={() => setIsOpen(true)}
        />

        {/* Navigation Menu */}
        <ul className={`nav-menu ${isOpen ? "active" : ""}`}>
          <img
            src={close}
            alt="close menu"
            className="nav-close"
            onClick={() => setIsOpen(false)}
          />

          {navItems.map((item) => (
            <li key={item.key}>
              <AnchorLink
                className={`anchor-link ${menu === item.key ? "active" : ""}`}
                href={`#${item.id}`}
                onClick={() => {
                  setMenu(item.key);
                  setIsOpen(false);
                }}
              >
                {item.label}
              </AnchorLink>
            </li>
          ))}
        </ul>

        {/* Desktop Connect Button */}
        <div className="nav-connect">
          <AnchorLink
            className="anchor-link nav-contact"
            href="#contact"
            onClick={() => setMenu("contact")}
          >
            Connect with me
          </AnchorLink>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
