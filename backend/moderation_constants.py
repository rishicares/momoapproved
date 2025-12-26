"""
Moderation reason codes and human-friendly messages
"""

# Reason codes (used in S3 tags)
REASON_MOMO = "MOMO"
REASON_OTHER_FOOD = "OTHER_FOOD"
REASON_NOT_FOOD = "NOT_FOOD"
REASON_HUMAN_DETECTED = "HUMAN_DETECTED"
REASON_UNSAFE_CONTENT = "UNSAFE_CONTENT"

# Human-friendly messages for frontend display
REASON_MESSAGES = {
    REASON_MOMO: "Delicious momo detected! ✓",
    REASON_OTHER_FOOD: "This appears to be food, but not momo",
    REASON_NOT_FOOD: "This doesn't appear to be food",
    REASON_HUMAN_DETECTED: "Human face detected in image",
    REASON_UNSAFE_CONTENT: "Inappropriate or unsafe content detected"
}

# Status mapping
STATUS_APPROVED = "APPROVED"
STATUS_BLURRED = "BLURRED"
STATUS_BLOCKED = "BLOCKED"

def get_status_and_reason(rekognition_labels):
    """
    Determine moderation status and reason based on Rekognition labels
    
    Decision tree:
    - If unsafe/adult → BLOCKED (UNSAFE_CONTENT)
    - Else if human detected → BLOCKED (HUMAN_DETECTED)
    - Else if NOT food → BLOCKED (NOT_FOOD)
    - Else if food but NOT momo → BLURRED (OTHER_FOOD)
    - Else if momo → APPROVED (MOMO)
    """
    # Check for unsafe content (highest priority)
    if has_unsafe_content(rekognition_labels):
        return STATUS_BLOCKED, REASON_UNSAFE_CONTENT
    
    # Check for human faces
    if has_human_faces(rekognition_labels):
        return STATUS_BLOCKED, REASON_HUMAN_DETECTED
    
    # Check if it's food
    if not is_food(rekognition_labels):
        return STATUS_BLOCKED, REASON_NOT_FOOD
    
    # It's food - check if it's momo
    if is_momo(rekognition_labels):
        return STATUS_APPROVED, REASON_MOMO
    else:
        return STATUS_BLURRED, REASON_OTHER_FOOD


def has_unsafe_content(labels):
    """Check for unsafe/adult content"""
    unsafe_keywords = ['suggestive', 'explicit', 'violence', 'gore', 'weapon']
    return any(keyword in str(labels).lower() for keyword in unsafe_keywords)


def has_human_faces(labels):
    """Check for human faces in the image"""
    face_keywords = ['person', 'human', 'face', 'people']
    return any(keyword in str(labels).lower() for keyword in face_keywords)


def is_food(labels):
    """Check if the image contains food"""
    food_keywords = ['food', 'dish', 'meal', 'cuisine']
    return any(keyword in str(labels).lower() for keyword in food_keywords)


def is_momo(labels):
    """Check if the food is momo/dumpling"""
    momo_keywords = ['dumpling', 'momo', 'dim sum', 'wonton']
    return any(keyword in str(labels).lower() for keyword in momo_keywords)
