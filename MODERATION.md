# Moderation System Documentation

## Reason Codes

The moderation system uses the following decision tree:

1. **UNSAFE_CONTENT** → BLOCKED
   - Contains suggestive, explicit, violence, gore, or weapons
   - Message: "Inappropriate or unsafe content detected"

2. **HUMAN_DETECTED** → BLOCKED
   - Human faces or people detected in image
   - Message: "Human face detected in image"

3. **NOT_FOOD** → BLOCKED
   - Image doesn't contain food
   - Message: "This doesn't appear to be food"

4. **OTHER_FOOD** → BLURRED
   - Image contains food but not momo
   - Message: "This appears to be food, but not momo"

5. **MOMO** → APPROVED
   - Image contains momo/dumplings
   - Message: "Delicious momo detected! ✓"

## Backend Implementation

Use the `moderation_constants.py` module:

```python
from moderation_constants import get_status_and_reason, REASON_MESSAGES

# After getting Rekognition labels
status, reason = get_status_and_reason(rekognition_labels)

# Set S3 tags
s3.put_object_tagging(
    Bucket=bucket,
    Key=key,
    Tagging={'TagSet': [
        {'Key': 'status', 'Value': status},
        {'Key': 'reason', 'Value': reason}
    ]}
)
```

## Frontend Implementation

Use the `moderation.js` constants:

```javascript
import { getReasonMessage, REASON_CODES } from '../constants/moderation';

// Display human-friendly message
const message = getReasonMessage(image.reason);
// Returns: "Human face detected in image" instead of "HUMAN_DETECTED"
```

## Testing

Example S3 tags to test with:
- `status=BLOCKED, reason=UNSAFE_CONTENT`
- `status=BLOCKED, reason=HUMAN_DETECTED`
- `status=BLOCKED, reason=NOT_FOOD`
- `status=BLURRED, reason=OTHER_FOOD`
- `status=APPROVED, reason=MOMO`
