import React, { useState } from "react";
import { Image, Card, Row, Col, Form , Button, ProgressBar} from "react-bootstrap";
import { ChevronRight, ChevronLeft, List, Trophy, Fire } from "react-bootstrap-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import { ResizableBox } from "react-resizable";
import "./Milestones.scss";
import { ProgressDonut } from "./ProgressDonut";
import { BiMedal } from "react-icons/bi";


const Milestones = ({ isCollapsed, togglePreferences, width, setWidth }) => {

  return (
    <ResizableBox
      width={isCollapsed ? 80 : width}
      height={"100%"}
      axis="x"
      minConstraints={[300, 0]}
      maxConstraints={[window.innerWidth * 0.6, 0]}
      resizeHandles={["w"]}
      onResizeStop={(e, { size }) => setWidth(size.width)}
    >
      {/* <div className={`user-sidebar ${isCollapsed ? "collapsed" : "expanded"}`}>
        <button className="collapse-btn" onClick={togglePreferences}>
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </button> */}
      <div
        className={`d-flex flex-column bg-light border-start h-100 p-3 ${
          isCollapsed ? "collapsed" : ""
        }`}
        style={{ width: "100%" }}
      >
        <div className="nav-heading" style={{width: "100% !important"}}>
        <button 
            className="collapse-btn"
            variant="light"
            onClick={togglePreferences}
            style={{ width: "50px" }}
          >
            {isCollapsed ? <ChevronLeft /> : <ChevronRight />}
          </button>
        </div>

        {!isCollapsed && (
            <div className="milestone">
                <div className="milestone-header d-flex align-items-center">
                  {/* <Trophy size={30} className="text-light ms-4" color="#76098c"/> */}
                    <h4 style={{marginLeft:"10px"}}>My Milestones</h4>
                    
                </div>
                <p className="m-2">Accomplish tasks to earn Milestones!</p>

                <div className="mile-stats">
                        <div>
                            <h4>04</h4>
                            <p>Total Earned</p>
                        </div>
                        <div>
                            <h4>03</h4>
                            <p>In Progress</p>
                        </div>
                        </div>
    
                        <div className="milestone-card">
                          <div className="milestone-content">
                            {/* Left Side - Icon */}
                            <div className="icon-container">
                              <Trophy size={60} />
                            </div>

                            {/* Right Side - Text & Progress */}
                            <div className="text-container">
                              <p className="subtitle">
                                🏆 Complete a course to earn a milestone
                              </p>
                              {/* <h3 className="title">Course Champion</h3>Added a title */}

                              {/* Progress Bar */}
                              <div className="progress-section">
                                <ProgressBar 
                                  now={20} 
                                  max={100} 
                                  className="progress-bar" 
                                />
                                <span className="progress-text">20%</span>
                              </div>
                            </div>
                          </div>
                        </div>


                        <div className="milestone-card">
                          <div className="milestone-content">
                            {/* Left Side - Icon */}
                            <div className="icon-container">
                              <BiMedal size={60} />
                              {/* The color will be controlled by CSS to match theme */}
                            </div>

                            {/* Right Side - Text & Progress */}
                            <div className="text-container">
                              <p className="subtitle">
                                🏅 Ace 5 Quizes to earn a milestone
                              </p>
                              {/* <h3 className="title">Quiz Champion</h3> Added a title */}

                              {/* Progress Bar */}
                              <div className="progress-section">
                                <ProgressBar 
                                  now={2} 
                                  max={5} 
                                  className="progress-bar" 
                                />
                                <span className="progress-text">2/5</span>
                              </div>
                            </div>
                          </div>
                        </div>  

                        <div className="milestone-card">
                          <div className="milestone-content">
                            {/* Left Side - Icon */}
                            <div className="icon-container">
                              <Fire size={60} />
                              {/* The color will be controlled by CSS to match theme */}
                            </div>

                            {/* Right Side - Text & Progress */}
                            <div className="text-container">
                              <p className="subtitle">
                              🔥 Maintain your daily streak for 30 days
                              </p>
                              {/* <h3 className="title">Quiz Champion</h3> Added a title */}

                              {/* Progress Bar */}
                              <div className="progress-section">
                                <ProgressBar 
                                  now={7} 
                                  max={30} 
                                  className="progress-bar" 
                                />
                                <span className="progress-text">7/30</span>
                              </div>
                            </div>
                          </div>
                        </div>
                    
                                  
            </div>
        )}
      </div>
    </ResizableBox>
  );
};

export default Milestones;