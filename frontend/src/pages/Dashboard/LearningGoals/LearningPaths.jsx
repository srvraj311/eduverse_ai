import React, { useState, useEffect, useRef } from "react";
import "./LearningPaths.scss";
import { ResizableBox } from "react-resizable";
import { useSelector, useDispatch } from "react-redux";
import {
  setLearningGoals,
  setSelectedLearningGoal,
} from "../../../globalSlice.js";
import { askQuestion, getAllLearningGoals } from "../../../api.js";
import {
  Card,
  ListGroup,
  Button,
  Form,
  ProgressBar,
  Badge,
} from "react-bootstrap";
import {
  ArrowLeft,
  ArrowDown,
  List,
  X,
  CheckCircle,
  Clock,
  Link45deg,
  ArrowRight,
  Question,
  QuestionCircle,
  ChevronRight,
  ChevronLeft,
  Trash2Fill,
  Trash,
  TrashFill,
  Trash3Fill,
  Pencil,
  Person,
  TextCenter,
} from "react-bootstrap-icons";

import {
  setIsGenerating,
  setChatHistory,
  setStreamChat,
  markTopicCompleted,
} from "../../../globalSlice.js";
import { FcDeleteColumn } from "react-icons/fc";
import { FaTrash } from "react-icons/fa";
import CircularProgressBar from "./CircularProgressBar.jsx";
import { ProgressDonut } from "../MIlestones/ProgressDonut.jsx";

const LearningPaths = ({ isCollapsed, togglePreferences, width, setWidth }) => {
  const learningGoals = useSelector((state) => state.global.learningGoals);
  const selectedLearningGoal = useSelector(
    (state) => state.global.selectedLearningGoal
  );
  const [selectedGoalDetails, setSelectedGoalDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const contentRef = useRef(null);
  const dispatch = useDispatch();
  const chatHistory = useSelector((state) => state.global.chatHistory);
  const [refresh, setRefresh] = useState(false);
  const randomProgress = (selectedLearningGoal?.progress || 0).toFixed(0);

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

  useEffect(() => {
    if (typeof selectedLearningGoal === "string") {
      setSelectedLearningGoal(null);
      setSelectedGoalDetails(null);
      setSearchTerm(selectedLearningGoal);
    } else {
      setSearchTerm("");
    }
  }, [selectedLearningGoal, learningGoals, dispatch]);

  const handleMarkCompleted = (goal, topic, index) => {
    dispatch(markTopicCompleted({ goal, topic, index }));
    selectedGoalDetails(selectedGoalDetails);
    setRefresh((prev) => !prev); // Force re-render
  };

  const handleViewDetails = (goal) => {
    setSelectedGoalDetails(goal);
    setWidth(1200);
  };
  const handleBackToList = () => setSelectedGoalDetails(null);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleClearSearch = () => setSearchTerm("");

  const filteredGoals = learningGoals.filter((goal) =>
    typeof searchTerm === "string"
      ? goal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        searchTerm == "All"
      : true
  );

  const handleCheckMyProgress = async (goal, index) => {
    const selectedStudyPlan = selectedGoalDetails.study_plans[0].topics[index];
    const userPrompt = `I want to assess my Progress on ${selectedStudyPlan.name} ${selectedStudyPlan.description}, Generate me 10 quiz on these topics. Also dont't show answers at start.  Give options in a b c d. Format it in proper markdown format.`;

    // Add User Message and Placeholder for AI Response
    const updatedHistory = [
      ...chatHistory,
      { role: "assistant", content: "", type: "streaming" },
    ];

    dispatch(setChatHistory(updatedHistory));
    dispatch(setIsGenerating(true));

    try {
      await askQuestion(
        userPrompt,
        (partialResponse) => {
          dispatch(setStreamChat(partialResponse));
        },
        () => {
          dispatch(setIsGenerating(false));
        },
        true,
        false
      );
    } catch (error) {
      console.error("Error sending message:", error);
      dispatch(setIsGenerating(false));
    }
  };

  return (
    <ResizableBox
      width={isCollapsed ? 80 : width}
      height={"100%"}
      axis="x"
      minConstraints={[300, 0]}
      maxConstraints={[window.innerWidth * 1, 0]}
      resizeHandles={["w"]}
      onResizeStop={(e, { size }) => setWidth(size.width)}
    >
      {/* <div className={`learning-sidebar ${isCollapsed ? "collapsed" : "expanded"}`}> */}
      {/* <div className="nav-heading">
        <button className="collapse-btn" onClick={togglePreferences}>
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />} */}
      {/* </button> */}
      <div
        className={`d-flex flex-column bg-light border-start h-100 p-3 ${
          isCollapsed ? "collapsed" : ""
        }`}
        style={{ width: "100%" }}
      >
        {!selectedGoalDetails && (
          <div className="nav-heading">
            <button 
            className="collapse-btn"
            variant="light"
            onClick={togglePreferences}
            style={{ width: "50px" }}
          >
            {isCollapsed ? <ChevronLeft /> : <ChevronRight />}
          </button>
          </div>
        )}

        {!isCollapsed && (
          <div
            ref={contentRef}
            style={{ overflowY: "auto", height: "calc(100vh - 100px)" }}
          >
            {selectedGoalDetails ? (
              <div>
                <Button
                  variant="light"
                  onClick={handleBackToList}
                  className=" mb-3"
                >
                  <ArrowLeft size={20} />
                </Button>

                <Card className="bg-white">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div style={{marginRight: "30px", marginLeft: "20px", height: "140px", position: "relative", top: "-35px"}}>
                        <CircularProgressBar
                          percentage={
                            selectedGoalDetails?.progress || randomProgress
                          }
                        />
                      </div>
                      <h2 className="mb-3">{selectedGoalDetails.name}</h2>
                    </div>

                    <Card.Subtitle className="mb-3 d-flex justify-content-between align-items-center">
                      <div>
                        <Clock /> Duration: {selectedGoalDetails.duration}
                      </div>
                      <div className="d-flex flex-column align-items-center">
                        {/* <ProgressDonut percentage={randomProgress} size={70} strokeWidth={9} textColor="#76098c" primaryColor="#76098c" />
                        <p className="m-0" style={{fontSize:"12px"}}>Complete to earn a Badge!</p> */}
                      </div>
                    </Card.Subtitle>

                    {selectedGoalDetails.study_plans.map((plan, planIndex) => (
                      <div key={planIndex} className="mb-4 mt-4 my-3">
                        <Card.Subtitle className="mb-3">
                          {plan.name} ({plan.course_duration})
                        </Card.Subtitle>
                        {/* Links Section with Icons */}
                        {plan.links.length > 0 && (
                          <ListGroup className="mb-3">
                            {plan.links.map((link, linkIndex) => (
                              <ListGroup.Item
                                key={linkIndex}
                                className="d-flex border-0 bg-white align-items-center"
                              >
                                <Link45deg
                                  size={18}
                                  className="me-2 text-primary"
                                />
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-decoration-none"
                                >
                                  {link}
                                </a>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        )}

                        {/* Topics Section */}
                        {plan.topics.map((topic, topicIndex) => (
                          <div key={topic.name}>
                            <h3 className="mx-2">{topic.name}</h3>
                            <Card
                              key={topicIndex}
                              className="bg-white border-2 my-3"
                            >
                              <Card.Body className="">
                                <Card.Text className="">
                                  {topic.description ||
                                    "No description available."}
                                </Card.Text>
                                <Card.Text>
                                  <Clock /> Time Required: {topic.time_required}{" "}
                                  hours
                                </Card.Text>

                                {/* Links Section */}
                                {topic.links && topic.links.length > 0 && (
                                  <>
                                    <hr></hr>
                                    <h5>📚 External Study Resources</h5>
                                    <ListGroup className="mb-3">
                                      {topic.links.map((link, linkIndex) => (
                                        <ListGroup.Item
                                          key={linkIndex}
                                          className="d-flex border-0 bg-white  align-items-center"
                                        >
                                          <Link45deg
                                            size={18}
                                            className="me-2 text-primary"
                                          />
                                          <a
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-decoration-none"
                                          >
                                            {link}
                                          </a>
                                        </ListGroup.Item>
                                      ))}
                                    </ListGroup>
                                  </>
                                )}

                                {/* Subtopics Section */}
                                {topic.subtopics &&
                                  topic.subtopics.length > 0 && (
                                    <>
                                      <hr></hr>
                                      <h5>📝 Subtopics</h5>
                                      <ListGroup className="bg-white">
                                        {topic.subtopics.map(
                                          (subtopic, subtopicIndex) => (
                                            <ListGroup.Item
                                              key={subtopicIndex}
                                              className="d-flex bg-white border-0 align-items-center"
                                            >
                                              <ArrowRight
                                                size={16}
                                                className="me-2"
                                              />
                                              <div>
                                                <strong>{subtopic.name}</strong>
                                                <p className="mb-0 text-muted">
                                                  {subtopic.description || ""}
                                                </p>
                                              </div>
                                            </ListGroup.Item>
                                          )
                                        )}
                                      </ListGroup>
                                    </>
                                  )}

                                {/* Videos Section */}
                                {topic.videos && topic.videos.length > 0 && (
                                  <>
                                    <hr></hr>
                                    <h5>🎥 Video Resources</h5>
                                    <div className="video-container">
                                      {topic.videos.map((video, videoIndex) => {
                                        let videoId = null;

                                        // Extract video ID for different formats
                                        if (video.includes("youtu.be/")) {
                                          videoId = video
                                            .split("youtu.be/")[1]
                                            .split("?")[0];
                                        } else if (video.includes("watch?v=")) {
                                          videoId = video
                                            .split("watch?v=")[1]
                                            .split("&")[0];
                                        } else if (video.includes("/embed/")) {
                                          videoId = video
                                            .split("/embed/")[1]
                                            .split("?")[0];
                                        }

                                        return videoId ? (
                                          <div
                                            key={videoIndex}
                                            className="video-card"
                                          >
                                            {/* Embedded YouTube Video */}
                                            <iframe
                                              src={`https://www.youtube.com/embed/${videoId}`}
                                              title={`Video ${videoIndex + 1}`}
                                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                              allowFullScreen
                                            ></iframe>

                                            {/* Video Link Below */}
                                            <p className="video-link">
                                              <Link45deg
                                                size={18}
                                                className="me-1 text-primary"
                                              />
                                              <a
                                                href={video}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-decoration-none"
                                              >
                                                Watch on YouTube
                                              </a>
                                            </p>
                                          </div>
                                        ) : (
                                          <p
                                            key={videoIndex}
                                            className="text-danger"
                                          >
                                            Invalid YouTube URL: {video}
                                          </p>
                                        );
                                      })}
                                    </div>
                                  </>
                                )}

                                <hr></hr>
                                <Button
                                  variant="outline-primary rounded-pill"
                                  size="sm"
                                  disabled={topic.completed ? true : false}
                                  onClick={() =>
                                    handleMarkCompleted(
                                      selectedGoalDetails,
                                      topic,
                                      planIndex
                                    )
                                  }
                                  className="mb-2 border-1 "
                                >
                                  <CheckCircle className="me-2" />{" "}
                                  {topic.completed
                                    ? "Completed"
                                    : "Mark as Complete"}
                                </Button>
                                <Button
                                  variant="outline-primary rounded-pill"
                                  size="sm"
                                  onClick={() =>
                                    handleCheckMyProgress(
                                      selectedGoalDetails,
                                      planIndex
                                    )
                                  }
                                  className="mb-2 mx-2 border-1"
                                >
                                  <QuestionCircle className="me-2" /> Create a
                                  quiz
                                </Button>
                              </Card.Body>
                            </Card>
                          </div>
                        ))}
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </div>
            ) : (
              <div>
                {/* Search Bar with Clear Button */}
                <div className="d-flex align-items-center">
                  <Form.Control
                    type="text"
                    placeholder="Search Learning Goals..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="mb-3 flex-grow-1"
                  />
                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="mb-3 ms-2"
                      onClick={handleClearSearch}
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>

                {/* Display Learning Goals */}
                {filteredGoals.map((goal, index) => (
                  <Card
                    key={index}
                    style={{ borderRadius: "20px" }}
                    className="mb-3 bg-white hover-shadow"
                    onClick={() => handleViewDetails(goal)}
                  >
                    <div className="d-flex">
                      <div
                        className="mx-4"
                        style={{
                          position: "relative",
                          top: "-35px",
                          width: "100px",
                          height: "125px",
                        }}
                      >
                        <CircularProgressBar
                          className=""
                          percentage={goal?.progress || randomProgress}
                        />
                      </div>
                      <Card.Body>
                        <div className="card-top">
                          <Card.Title style={{ fontSize: "24px" ,width: '100%' , maxWidth: "400px", textOverflow: "wrap", whiteSpace: "wrap"}}>{goal.name}</Card.Title>
                          {/* <button className="btn btn-primary" style={{width: '40px'}}> */}
                          <div className="d-flex">
                            <Pencil fill="" width={22} height={22} />
                            <Trash
                              className="mx-3"
                              fill=""
                              width={25}
                              height={25}
                            />
                          </div>
                          {/* </button> */}
                        </div>
                        <Card.Text>
                          <Clock /> Duration: {goal.duration}
                        </Card.Text>
                        <div className="d-flex flex-shrink column">
                        <div className="d-flex justify-content-between align-items-center">
                          <Badge className="mt-2" bg="primary">
                            {selectedGoalDetails?.progress  || randomProgress > 0 ? "" : "Not Started"}
                          </Badge>
                        <div className="mt-3 mx-3">
                          {goal.name.includes("Python") && (
                            <Button
                              title="Friend 1"
                              variant="outline-primary rounded-pill"
                              className=""
                            >
                              {" "}
                              <Person size={22} className="" />
                            </Button>
                          )}
                          {goal.name.includes("Python") && (
                            <Button
                              title="Friend 2"
                              variant="outline-primary rounded-pill"
                              className="ms-2"
                            >
                              {" "}
                              <Person size={22} className="" />
                            </Button>
                          )}
                        </div>
                        </div>
                        </div>
                      </Card.Body>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ResizableBox>
  );
};

export default LearningPaths;
