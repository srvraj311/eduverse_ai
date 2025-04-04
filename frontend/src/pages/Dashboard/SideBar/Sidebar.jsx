import React, { useState, useEffect } from "react";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import "./Sidebar.scss";
import { ListGroup } from "react-bootstrap";
import { Badge3d, ChevronRight, Dash, Dot, Grid, List, MenuApp, Person, QuestionCircle, Trophy } from "react-bootstrap-icons";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedLearningGoal } from "../../../globalSlice.js";
import { setLearningGoals } from "../../../globalSlice.js";
import { getAllLearningGoals } from "../../../api.js";
import { FaLevelUpAlt } from "react-icons/fa";

const Sidebar = ({
  isCollapsed,
  toggleSidebar,
  width,
  setWidth,
  setActiveScreen,
  setPreferencesCollapsed,
}) => {
  const [showLearningGoals, setShowLearningGoals] = useState(false);
  const dispatch = useDispatch();
  const learningGoals = useSelector((state) => state.global.learningGoals); // Get learning goals from Redux

  const handleLogout = () => {
    // Clear localStorage
    localStorage.clear();

    // Reload the page
    window.location.reload();
  };

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const goals = await getAllLearningGoals();
        dispatch(setLearningGoals(goals));
      } catch (error) {
        console.error("Failed to fetch learning goals:", error);
      }
    };
    fetchGoals();
  }, [dispatch]);
  const getLearningGoalsNames = () => {
    const arr = ["All"];
    learningGoals.map((goal) => arr.push(goal.name));
    return arr;
  };

  const menuItems = [
    {
      text: "My Profile",
      icon: <Person size={20} className="text-light ms-4" />,
      screen: "preference",
    },
    {
      text: "My Learning Goals",
      icon: <Grid size={20} className="text-light ms-4" />,
      screen: "learning-goal",
      subItems: getLearningGoalsNames(), // Extract names from Redux goals
    },
    {
      text: "My Milestones", 
      icon: <Trophy size={20} className="text-light ms-4" />,
      screen: "milestones",
    },
    {
      text: "My Assessments", 
      icon: <QuestionCircle size={20} className="text-light ms-4 mt-1" />,
      screen: "assessments",
    }
  ];

  const handleLearningGoalsClick = () => {
    setShowLearningGoals(!showLearningGoals);
    if (!showLearningGoals) {
      setActiveScreen("learning-goal");
    }
    dispatch(setSelectedLearningGoal('All'));
    setActiveScreen("learning-goal");
    setPreferencesCollapsed(false);
  };

  const handleSubItemClick = (subItem) => {
    if (typeof subItem === "string") {
      setActiveScreen("learning-goal");
      setPreferencesCollapsed(false);
      dispatch(setSelectedLearningGoal(subItem));
      console.log("Clicked sub item:", subItem);
    } else {
      console.error("handleSubItemClick: subItem is not a string:", subItem);
    }
  };

  return (
    <ResizableBox
    width={isCollapsed ? 70 : width}
    height={Infinity}
    axis="x"
    className="resizable-box"
    minConstraints={[120]}
    maxConstraints={[520]}
    resizeHandles={["e"]}
    onResizeStop={(e, { size }) => setWidth(size.width)}
    style={{ height: "100vh" }}
  >
    <div
      className={isCollapsed ? "side-nav-container side-nav-container-NX" : "side-nav-container"}
      style={{ width: "100%", height: "calc(100vh - 60px)", overflow: "hidden" }}
    >
        <div className="nav-upper">
          <div className="nav-heading">
            <button
              className={
                isCollapsed
                  ? "hamburger hamburger-out"
                  : "hamburger hamburger-in"
              }
              onClick={toggleSidebar}
            >
              <List size={24} color="#fff" />
            </button>
          </div>
          <div className="nav-menu">
            {menuItems.map(({ text, icon, screen, subItems }) => (
              <div key={text || icon}>
                <a
                  className={
                    isCollapsed ? "menu-item menu-item-NX" : "menu-item"
                  }
                  href="#"
                  onClick={
                    screen === "learning-goal"
                      ? handleLearningGoalsClick
                      : () => {
                          console.log("Clicked:", screen);
                          setActiveScreen(screen);
                        }
                  }
                >
                  {/* <img className="menu-item-icon text-light" src={icon} alt="" srcSet="" /> */}
                  {icon}
                  {!isCollapsed && <p className="ms-2">{text}</p>}
                </a>
                {subItems &&
                  !isCollapsed &&
                  screen === "learning-goal" &&
                  showLearningGoals && (
                    <ListGroup className="sub-menu">
                      {subItems.map((subItem, index) => (
                        <ListGroup.Item
                          key={index}
                          action
                          className="sub-menu-item"
                          onClick={() => handleSubItemClick(subItem)}
                        >
                          <Dot className="sub-menu-arrow" /> {subItem}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
              </div>
            ))}
          </div>
        </div>
        <div className="nav-footer">
          <a
            className={isCollapsed ? "menu-item menu-item-NX" : "menu-item"}
            href="#"
            onClick={handleLogout}
          >
            <img
              className="menu-item-icon"
              src="/icons/logout.svg"
              alt="logout"
            />
            {!isCollapsed && <p>Logout</p>}
          </a>
        </div>
      </div>
    </ResizableBox>
  );
};

export default Sidebar;
