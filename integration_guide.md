# Content Agent Integration Guide

## 1. Backend Integration (Current Status)

The backend now supports external access to blogs via a dedicated Public API secured by API Keys.

### Public API Endpoints

Base URL: `https://content.bhuexpert.com/api/v1/public`

- **`GET /blogs`**
  - **Headers**: `X-Content-Agent-Key: <YOUR_API_KEY>`
  - **Query Params**: `limit` (default 10), `offset` (default 0)
  - **Returns**: List of published blogs for the brand associated with the key.
- **`GET /blogs/{slug}`**
  - **Headers**: `X-Content-Agent-Key: <YOUR_API_KEY>`
  - **Returns**: Full blog content including markdown and metadata.

### Internal Management Endpoints (Protected)

These endpoints are for the Frontend App to manage keys. protected by Supabase Auth (`Bearer <token>`).

- **`POST /api/v1/data/brands/{brand_id}/keys`**
  - **Body**: `{ "name": "Website Key" }`
  - **Returns**: `{ "data": { "key": "ca_live_...", ... } }`
  - **Usage**: Call this when the user clicks "Generate API Key".

---

## 2. Frontend UI Implementation Guide

To fully enable this feature, the Frontend needs a new **"Integrations"** or **"Developers"** tab within the Brand Dashboard.

### UI Requirements

#### A. API Key Management Section

1.  **View Key**:
    - Check if a key exists for the current brand (You might need to fetch `api_keys` table via Supabase client directly or add a GET endpoint).
    - Display the key (masked by default, e.g., `ca_live_...xxxx`) with a "Copy" button.
2.  **Generate/Roll Key**:
    - Button: **"Generate New API Key"**.
    - Action: Calls `POST /api/v1/data/brands/{brand_id}/keys`.
    - **Warning**: If re-generating, warn the user that the old key will stop working.

#### B. Integration Instructions Section

Display ready-to-use snippets for the user.

**1. WordPress Plugin**

> "Download our plugin and enter your API Key in the settings."

- Link to download the `content-agent-plugin.zip`.

**2. Copy/Paste Embed (HTML/JS)**
Providing a code block they can paste into any website `<body>`.

```html
<div id="content-agent-feed" data-api-key="YOUR_GENERATED_KEY_HERE"></div>
<script src="https://content.bhuexpert.com/integrations/embed.js"></script>
```

_(Note: You will need to host the `embed.js` file publicly or bundle it with your frontend)_

**3. React / Next.js**

```typescript
import { useContentAgent } from "your-sdk"; // or provide the hook code

const { blogs, loading } = useContentAgent("YOUR_GENERATED_KEY_HERE");
```

---

## 3. Database Changes

Ensure you have run the migration: `database/migration_006_api_keys.sql`.

- This creates the `api_keys` table.
- RLS policies allow users to manage keys only for brands they own.
