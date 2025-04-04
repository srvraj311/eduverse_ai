# learning_path.py
import json
import datetime

def process_learning_path_query(user_prompt, username, generate_response, extract_json, store_chat_history, REGENRATE_OR_FILTER_JSON, LEARNING_PATH_PROMPT, retry_count=0, max_retries=3):
    """Processes a learning path query, generating and validating JSON responses."""
    print("📚 Learning Path Query Detected")
    print(" Trying to generate Learning Path , Retry Count = " + str(retry_count))
    if retry_count < max_retries:
        print(f"🔄 Retrying JSON generation (attempt {retry_count + 1})...")

    if retry_count > 0:
        modified_prompt = f"{user_prompt} {REGENRATE_OR_FILTER_JSON}"
    else:
        print(LEARNING_PATH_PROMPT)
        modified_prompt = f"{user_prompt} {LEARNING_PATH_PROMPT}"

    response_content = generate_response(modified_prompt)
    response_timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    try:
        learning_path_json = json.loads(response_content)
        response_message = {
            "role": "assistant",
            "content": learning_path_json,
            "type": "learning_path",
            "timestamp": response_timestamp
        }
        response_data = {
            "response": "JSON",
            "type": "learning_path",
            "timestamp": response_timestamp,
            "content": learning_path_json
        }
        store_chat_history(username, response_message)
        return response_data

    except json.JSONDecodeError:
        parsedData = extract_json(response_content)
        if parsedData:
            response_message = {
                "role": "assistant",
                "content": parsedData,
                "type": "learning_path",
                "timestamp": response_timestamp
            }
            response_data = {
                "response": "JSON",
                "type": "learning_path",
                "timestamp": response_timestamp,
                "content": parsedData
            }
            store_chat_history(username, response_message)
            return response_data
        else:
            print("❌ Failed to parse learning path JSON")
            response_message = {
                "role": "assistant",
                "content": extract_json(response_content),
                "type": "failed_learning_path",
                "timestamp": response_timestamp
            }
            response_data = {
                "response": "FAIL",
                "type": "failed_learning_path",
                "timestamp": response_timestamp,
                "content": response_content
            }

            return process_learning_path_query(response_content, username, generate_response, extract_json, store_chat_history, REGENRATE_OR_FILTER_JSON, LEARNING_PATH_PROMPT, retry_count=retry_count + 1, max_retries=max_retries)