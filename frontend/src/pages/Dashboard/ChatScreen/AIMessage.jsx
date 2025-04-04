import React from "react";
import { Card } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // Enables GitHub-flavored Markdown (tables, lists, etc.)
import { formatDistanceToNow } from "date-fns";
import LearningPath from "./LearningPath";

const AIMessage = ({ content, type, timestamp }) => {
  // Convert timestamp to "time ago" format
  const timeAgo = timestamp
    ? formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    : null;

  if (content == null) {
    return <></>;
  } else if (type == "learning_path") {
    return <LearningPath content={content} />;
  } else {
    if (content) {
      return (
        <Card
          className="p-2 bg-white text-dark "
          style={{
            borderRadius: "20px",
            marginLeft: "15px",
            maxWidth: "75%",
            border: "1px solid grey",
          }}
        >
          <Card.Body>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>

            {/* Display timestamp if available */}
            {timeAgo && (
              <small className="text-muted d-block mt-2 text-end">
                {timeAgo} {type === "learning_path" && "(Learning Path)"}
              </small>
            )}
          </Card.Body>
        </Card>
      );
    } else {
      <></>
    }
  }
};

export default AIMessage;
