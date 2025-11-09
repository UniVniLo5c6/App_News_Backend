# API Request/Response Body Templates

## Auth Endpoints

### POST /api/auth/register
Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```
Response (201):
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "verifyToken": "abc123..." // Dev only
}
```

### POST /api/auth/login
Request:
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```
Response (200):
```json
{
  "token": "eyJhbGci...",
  "refreshToken": "def456...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### POST /api/auth/oauth/google
Request:
```json
{
  "idToken": "google_id_token..."
}
```
Response (200):
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@gmail.com",
    "provider": "google"
  }
}
```

## Articles API

### GET /api/articles
Response (200):
```json
[
  {
    "id": 1,
    "title": "Article Title",
    "content": "Article content...",
    "authorId": 1,
    "author": {
      "id": 1,
      "name": "John Doe"
    },
    "createdAt": "2025-11-03T..."
  }
]
```

### POST /api/articles
Request:
```json
{
  "title": "New Article",
  "content": "Article content..."
}
```
Response (201):
```json
{
  "id": 2,
  "title": "New Article",
  "content": "Article content...",
  "authorId": 1,
  "createdAt": "2025-11-03T..."
}
```

## RSS API

### POST /api/rss/sources
Request:
```json
{
  "name": "Tech Blog",
  "url": "https://blog.example.com/feed.xml",
  "tag": "tech",
  "active": true
}
```
Response (201):
```json
{
  "id": 1,
  "name": "Tech Blog",
  "url": "https://blog.example.com/feed.xml",
  "tag": "tech",
  "active": true
}
```

### GET /api/rss/items
Response (200):
```json
[
  {
    "id": 1,
    "sourceId": 1,
    "title": "RSS Item Title",
    "content": "Content...",
    "url": "https://...",
    "publishedAt": "2025-11-03T...",
    "author": "Author Name",
    "topic": "tech",
    "source": {
      "id": 1,
      "name": "Tech Blog",
      "tag": "tech"
    }
  }
]
```

## Blog API

### POST /api/blogs
Request:
```json
{
  "title": "Blog Post Title",
  "content": "Blog content...",
  "excerpt": "Short excerpt...",
  "categoryId": 1,
  "tags": ["tech", "news"]
}
```
Response (201):
```json
{
  "id": 1,
  "title": "Blog Post Title",
  "content": "Blog content...",
  "excerpt": "Short excerpt...",
  "authorId": 1,
  "categoryId": 1,
  "published": true,
  "createdAt": "2025-11-03T..."
}
```

### POST /api/blogs/:id/comments
Request:
```json
{
  "content": "Great post!"
}
```
Response (201):
```json
{
  "id": 1,
  "blogId": 1,
  "userId": 2,
  "content": "Great post!",
  "createdAt": "2025-11-03T..."
}
```

## Recommendations API

### GET /api/recommendations
Response (200):
```json
{
  "rss": [
    {
      "id": 1,
      "title": "Recommended RSS Item",
      "url": "https://...",
      "source": {
        "id": 1,
        "name": "Tech Blog"
      }
    }
  ],
  "articles": [
    {
      "id": 1,
      "title": "Recommended Article",
      "author": {
        "id": 1,
        "name": "John Doe"
      }
    }
  ]
}
```

### PUT /api/recommendations/preferences
Request:
```json
{
  "preferences": ["tech", "science"]
}
```
Response (200):
```json
{
  "preferences": ["tech", "science"]
}
```

### POST /api/recommendations/feedback
Request:
```json
{
  "itemType": "rss",
  "itemId": "1",
  "rating": 5,
  "comment": "Great article!"
}
```
Response (201):
```json
{
  "id": 1,
  "userId": 1,
  "itemType": "rss",
  "itemId": "1",
  "rating": 5,
  "comment": "Great article!",
  "createdAt": "2025-11-03T..."
}
```

## Settings API

### PUT /api/settings/theme
Request:
```json
{
  "theme": "dark"
}
```
Response (200):
```json
{
  "theme": "dark"
}
```

### PUT /api/settings/notifications
Request:
```json
{
  "notifications": {
    "email": true,
    "push": false
  }
}
```
Response (200):
```json
{
  "notifications": {
    "email": true,
    "push": false
  }
}
```

## Admin API

### GET /api/admin/stats
Response (200):
```json
{
  "users": 100,
  "activities": 500,
  "rssItems": 1000,
  "blogs": 50,
  "articles": 200
}
```

### PUT /api/admin/users/:id
Request:
```json
{
  "role": "admin",
  "emailVerified": true
}
```
Response (200):
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin",
  "emailVerified": true
}
```

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Must be valid email"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden"
}
```

### 404 Not Found
```json
{
  "message": "Not found"
}
```

### 500 Server Error
```json
{
  "message": "Server error"
}
```