import React, { useState } from "react";
import { Image, Card, Row, Col, Form , Button, ProgressBar} from "react-bootstrap";
import { ChevronRight, ChevronLeft, List, Trophy, Fire } from "react-bootstrap-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import { ResizableBox } from "react-resizable";
import "./Assessments.scss";
import { BiMedal } from "react-icons/bi";


const Assessments = ({ isCollapsed, togglePreferences, width, setWidth }) => {
  const [activeTab, setActiveTab] = useState('completed');

  const contests = [
    {
      id: 3,
      type: 'Java Interim',
      date: 'Mar 22, 2025 8:00 AM GMT+5:30',
      score: "0/10",
      imageColor: 'blue'
    },
    {
      id: 1,
      type: 'Java Final',
      date: 'Mar 22, 2025 8:00 PM GMT+5:30',
      score: "0/10",
      imageColor: 'green'
    },
    {
      id: 2,
      type: 'Indian Geography Interim',
      date: 'Mar 23, 2025 8:00 AM GMT+5:30',
      score: "0/10",
      imageColor: 'blue'
    },
    {
      id: 1,
      type: 'Indian Geography Final',
      date: 'Mar 23, 2025 8:10 AM GMT+5:30',
      score: "6/10",
      imageColor: 'green'
    }
  ];

  
  // Function to render contest image based on type/color
  const renderContestImage = (type, color) => {
    return (
      <div className={`contest-image ${color}`}>
        <div className="cube-decoration">
          <div className="cube"></div>
          <div className="cube-small"></div>
        </div>
      </div>
    );
  };

  return (
    <ResizableBox
      width={isCollapsed ? 80 : width}
      height={"100%"}
      axis="x"
      minConstraints={[400, 0]}
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
            <div className="assessment">
              <h4>Assessments</h4>
                <div className="contests-container">
              {/* Tabs */}
              <div className="tabs-navigation">
                <div 
                  className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('completed')}
                >
                  Attempted
                </div>
                <div 
                  className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pending')}
                >
                  Pending
                </div>
              </div>
              
              {/* Contest rows */}
              <div className="contest-rows">
                {/* First row */}
                <div className="contest-row">
                  {contests.slice(0, 2).map(contest => (
                    <div key={`${contest.type}-${contest.id}`} className="contest-item">
                      {renderContestImage(contest.type, contest.imageColor)}
                      <div className="contest-info">
                        <div className="contest-title">{contest.type} Assessment {contest.id}</div>
                        <div className="contest-date">{contest.date}</div>
                      </div>
                        <div className="contest-badge">
                          {contest.score}
                        </div>
                    </div>
                  ))}
                </div>
                
                {/* Second row */}
                <div className="contest-row">
                  {contests.slice(2, 4).map(contest => (
                    <div key={`${contest.type}-${contest.id}`} className="contest-item">
                      {renderContestImage(contest.type, contest.imageColor)}
                      <div className="contest-info">
                        <div className="contest-title">{contest.type} Assessment {contest.id}</div>
                        <div className="contest-date">{contest.date}</div>
                      </div>
                        <div className="contest-badge">
                          {contest.score}
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>             
            </div>
        )}
      </div>
    </ResizableBox>
  );
};

export default Assessments;