# 🚀 User Submissions & Solved Problems API

## Overview
Complete API for fetching user-solved problems across all platforms (LeetCode, CodeForces, HackerRank, GeeksforGeeks, etc.).

---

## 📊 Database Seeded Data

### Users Created:
✅ **John Doe** (john@example.com)
- LeetCode: 22 solved problems (easy/medium/hard mix)
- CodeForces: 5 solved problems
- Total: 27 solved problems

✅ **Jane Smith** (jane@example.com)
- LeetCode: 7 solved problems
- HackerRank: 3 solved problems
- Total: 10 solved problems

---

## 🔑 API Endpoints

### 1. Get All Solved Problems
**Endpoint:** `GET /api/submissions/user/solved`

**Query Parameters:**
- `platform` - Filter by platform (leetcode, codeforces, hackerrank, geeksforgeeks)
- `difficulty` - Filter by difficulty (easy, medium, hard)
- `topic` - Filter by topic/tag
- `limit` - Items per page (default: 50)
- `page` - Page number (default: 1)

**Example Request:**
```bash
GET /api/submissions/user/solved?platform=leetcode&difficulty=easy&limit=20&page=1
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "submissionId": "64f1234567890abcdef12345",
      "problemId": "64f1234567890abcdef12346",
      "title": "Two Sum",
      "difficulty": "easy",
      "platform": "leetcode",
      "topics": ["array", "hash-table"],
      "url": "https://leetcode.com/problems/two-sum/",
      "acceptanceRate": 47.3,
      "solved": true,
      "solvedAt": "2026-01-15T10:30:00Z",
      "attempts": 1,
      "solveTime": 1245,
      "language": "python",
      "runtime": 45,
      "memory": 12.4,
      "hintsUsed": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 22,
    "totalCount": 22,
    "pages": 2
  },
  "summary": {
    "totalSolved": 22,
    "solvedByDifficulty": {
      "easy": 12,
      "medium": 8,
      "hard": 2
    },
    "solvedByPlatform": {
      "leetcode": 22,
      "codeforces": 0,
      "hackerrank": 0,
      "geeksforgeeks": 0
    }
  }
}
```

---

### 2. Get All Submission Attempts
**Endpoint:** `GET /api/submissions/user/attempts`

**Query Parameters:**
- `platform` - Filter by platform
- `verdict` - Filter by verdict (accepted, wrong_answer, time_limit, memory_limit, runtime_error, compilation_error)
- `limit` - Items per page (default: 50)
- `page` - Page number (default: 1)

**Example Request:**
```bash
GET /api/submissions/user/attempts?platform=leetcode&verdict=accepted&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "submissionId": "64f1234567890abcdef12345",
      "problemId": "64f1234567890abcdef12346",
      "title": "Two Sum",
      "difficulty": "easy",
      "platform": "leetcode",
      "solved": true,
      "verdict": "accepted",
      "attempts": 1,
      "language": "python",
      "runtime": 45,
      "memory": 12.4,
      "solveTime": 1245,
      "firstAttemptTime": "2026-01-15T09:00:00Z",
      "lastAttemptTime": "2026-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 27,
    "pages": 3
  }
}
```

---

### 3. Get Submission Statistics
**Endpoint:** `GET /api/submissions/user/stats`

**Example Request:**
```bash
GET /api/submissions/user/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSubmissions": 45,
    "totalSolved": 27,
    "totalAttempts": 58,
    "averageAttemptsPerProblem": "1.29",
    "averageSolveTime": 2145,
    "hintsUsedTotal": 8,
    "verdicts": {
      "accepted": 27,
      "wrong_answer": 12,
      "time_limit": 4,
      "memory_limit": 1,
      "runtime_error": 1,
      "compilation_error": 0
    },
    "byDifficulty": {
      "easy": { "total": 15, "solved": 12 },
      "medium": { "total": 20, "solved": 12 },
      "hard": { "total": 10, "solved": 3 }
    },
    "byPlatform": {
      "leetcode": { "total": 40, "solved": 22 },
      "codeforces": { "total": 5, "solved": 5 }
    },
    "successRate": "60.00"
  }
}
```

---

### 4. Get Solved Problems by Topic
**Endpoint:** `GET /api/submissions/user/by-topic`

**Example Request:**
```bash
GET /api/submissions/user/by-topic
```

**Response:**
```json
{
  "success": true,
  "data": {
    "array": [
      {
        "problemId": "64f1234567890abcdef12346",
        "title": "Two Sum",
        "difficulty": "easy",
        "platform": "leetcode",
        "solvedAt": "2026-01-15T10:30:00Z"
      }
    ],
    "hash-table": [
      {
        "problemId": "64f1234567890abcdef12347",
        "title": "Valid Anagram",
        "difficulty": "easy",
        "platform": "leetcode",
        "solvedAt": "2026-01-18T14:20:00Z"
      }
    ],
    "linked-list": [
      {
        "problemId": "64f1234567890abcdef12348",
        "title": "Reverse Linked List",
        "difficulty": "easy",
        "platform": "leetcode",
        "solvedAt": "2026-02-10T11:45:00Z"
      }
    ]
  },
  "summary": {
    "totalTopics": 12,
    "topicDistribution": {
      "array": 8,
      "hash-table": 6,
      "linked-list": 4,
      "string": 3,
      "tree": 2,
      "dynamic-programming": 2,
      "two-pointers": 1,
      "binary-search": 1
    }
  }
}
```

---

### 5. Get Platform-Specific Submissions
**Endpoint:** `GET /api/submissions/platform/:platform`

**Path Parameters:**
- `platform` - Platform name (leetcode, codeforces, hackerrank, geeksforgeeks)

**Query Parameters:**
- `limit` - Items per page (default: 50)
- `page` - Page number (default: 1)

**Example Request:**
```bash
GET /api/submissions/platform/leetcode?limit=20&page=1
```

**Response:**
```json
{
  "success": true,
  "platform": "leetcode",
  "data": [
    {
      "submissionId": "64f1234567890abcdef12345",
      "problemId": "64f1234567890abcdef12346",
      "title": "Two Sum",
      "difficulty": "easy",
      "solved": true,
      "verdict": "accepted",
      "attempts": 1,
      "solvedAt": "2026-01-15T10:30:00Z"
    }
  ],
  "stats": {
    "total": 22,
    "solved": 22,
    "successRate": "100.00"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 22,
    "pages": 2
  }
}
```

---

## 📋 Available Filters

### By Difficulty:
- `easy` - Easy difficulty problems
- `medium` - Medium difficulty problems
- `hard` - Hard difficulty problems

### By Platform:
- `leetcode` - LeetCode
- `codeforces` - CodeForces
- `hackerrank` - HackerRank
- `geeksforgeeks` - GeeksforGeeks
- `interviewbit` - InterviewBit
- `codechef` - CodeChef

### By Topic (Examples):
- `array`
- `hash-table`
- `linked-list`
- `string`
- `tree`
- `graph`
- `dynamic-programming`
- `binary-search`
- `two-pointers`
- `sliding-window`
- And many more...

### By Verdict:
- `accepted` - Problem solved
- `wrong_answer` - Wrong answer
- `time_limit` - Time limit exceeded
- `memory_limit` - Memory limit exceeded
- `runtime_error` - Runtime error
- `compilation_error` - Compilation error

---

## 🔐 Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📊 Seeded Test Data

### John Doe's Progress:
| Platform | Easy | Medium | Hard | Total |
|----------|------|--------|------|-------|
| LeetCode | 10   | 10     | 2    | 22    |
| CodeForces | 2   | 3      | 0    | 5     |
| **Total** | **12** | **13** | **2** | **27** |

### Jane Smith's Progress:
| Platform | Easy | Medium | Hard | Total |
|----------|------|--------|------|-------|
| LeetCode | 5    | 2      | 0    | 7     |
| HackerRank | 2  | 1      | 0    | 3     |
| **Total** | **7** | **3** | **0** | **10** |

---

## 💡 Usage Examples

### Get all LeetCode medium problems solved:
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/submissions/user/solved?platform=leetcode&difficulty=medium"
```

### Get all solved array problems:
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/submissions/user/solved?topic=array"
```

### Get statistics:
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/submissions/user/stats"
```

### Get CodeForces stats:
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/submissions/platform/codeforces"
```

---

## 🎯 Next Steps

1. ✅ Database seeded with 34 user submissions
2. ✅ API endpoints created and registered
3. Next: Frontend integration to display solved problems dashboard
4. Next: Add filtering & sorting UI components
5. Next: Add progress visualization charts
