import React, { useState } from "react";
import { Image, Form, Button } from "react-bootstrap";
import { ChevronLeft, ChevronRight, List } from "react-bootstrap-icons";
import { ResizableBox } from "react-resizable";
import "bootstrap/dist/css/bootstrap.min.css";
import { useDispatch } from "react-redux";
import { setPreferences } from "../../../globalSlice";
import { savePreferencesAPI } from "../../../api";
import "./Preferences.scss";

const Preferences = ({ isCollapsed, togglePreferences, width, setWidth }) => {
  const dispatch = useDispatch();
  const [preferences, setPreferencesState] = useState({
    timeValue: 15,
    ageGroup: "Under 10",
    language: "English",
    userRole: "Student",
  });

  const handlePreferenceChange = (key, value) => {
    setPreferencesState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      dispatch(setPreferences(preferences));
      console.log("Saving Preferences:", preferences);

      const username = localStorage.getItem('username');
      if (!username) throw new Error('Username not found');

      const response = await savePreferencesAPI(preferences);
      console.log(response.message);
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };

  return (
    <ResizableBox
      width={isCollapsed ? 80 : width}
      height={"100%"}
      axis="x"
      minConstraints={[300, 0]}
      maxConstraints={[window.innerWidth * 0.6, 0]}
      onResizeStop={(e, { size }) => setWidth(size.width)}
    >
      <div className={`d-flex flex-column bg-light border-start h-100 p-3 ${isCollapsed ? "collapsed" : ""}`} style={{ width: "100%" }}>
        <div className="nav-heading" style={{ width: "100% !important" }}>
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
          <div className="user-profile">
            <div className="profile-header">
              <Image src="icons/admin-avatar2.svg" roundedCircle className="user-photo" alt="User Profile" />
              <h5>John Doe</h5>
              <p className="email">john.doe@example.com</p>
            </div>

            <div className="preferences bg-white">
              <h5>Preferences</h5>
              <Form.Group className="time-slider">
                <Form.Label>Daily Time Commitment: <strong>{preferences.timeValue} hrs</strong></Form.Label>
                <Form.Range
                  min={1}
                  max={24}
                  value={preferences.timeValue}
                  onChange={(e) => handlePreferenceChange("timeValue", parseInt(e.target.value))}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>My Age Group</Form.Label>
                <Form.Select value={preferences.ageGroup} onChange={(e) => handlePreferenceChange("ageGroup", e.target.value)}>
                  <option>Under 10</option>
                  <option>10-16</option>
                  <option>16-18</option>
                  <option>Above 18</option>
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>Preferred Language</Form.Label>
                <Form.Select value={preferences.language} onChange={(e) => handlePreferenceChange("language", e.target.value)}>
                  <option>English</option>
                  <option>Hindi</option>
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label>User Role</Form.Label>
                <Form.Select value={preferences.userRole} onChange={(e) => handlePreferenceChange("userRole", e.target.value)}>
                  <option>Student</option>
                  <option>Parent</option>
                  <option>Teacher</option>
                </Form.Select>
              </Form.Group>

              <Button className="mt-3" variant="outline-primary rounded-pill" onClick={handleSubmit}>Save Preferences</Button>
            </div>
          </div>
        )}
      </div>
    </ResizableBox>
  );
};

export default Preferences;