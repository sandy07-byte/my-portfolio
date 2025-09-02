import React from 'react';
import './About.css';

export default function About() {
  return (
    <div id='about' className='about'>
      <div className='about-title'>
        <h1>About Me</h1>
      </div>

      <div className='about-sections'>
        <div className='about-left'></div>

        <div className='about-right'>
          <div className='about-para'>
            <p>
              Hi, I’m <strong>Sandeep Damera</strong>, a passionate software developer
              who loves exploring new technologies and solving challenging problems.
              I have experience in C, C++, Java, Python, JavaScript, React.js, SQL, and Data Structures.
              I am currently learning DevOps, AI, and Machine Learning tools to broaden my expertise.
              I excel at problem-solving and logical thinking, which allows me to tackle complex coding challenges efficiently.
              I am highly adaptable and eager to learn, always exploring the latest tools and frameworks to stay ahead in technology.
              My goal is to build impactful projects that combine creativity, efficiency, and cutting-edge technology.
            </p>
          </div>

          <div className='about-skills'>
            <div className='about-skill'>
              <p>HTML & CSS</p>
              <hr style={{ width: '50%' }} />
            </div>
            <div className='about-skill'>
              <p>JavaScript</p>
              <hr style={{ width: '70%' }} />
            </div>
            <div className='about-skill'>
              <p>React.js</p>
              <hr style={{ width: '60%' }} />
            </div>
            <div className='about-skill'>
              <p>Python</p>
              <hr style={{ width: '70%' }} />
            </div>
            <div className='about-skill'>
              <p>Java</p>
              <hr style={{ width: '80%' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="about-achivements">
        <div className="about-achivement">
          <h1>6</h1>
          <p>Months of  Experience</p>
        </div>
        <hr />
        <div className="about-achivement">
          <h1>3+</h1>
          <p>Projects Completed</p>
        </div>
        <hr />
        <div className="about-achivement">
          <h1>5+</h1>
          <p>Certifications</p>
        </div>
      </div>
    </div>
  );
}
