# FocusMap Frontend

The static HTML/CSS/JavaScript frontend for the AI Study Planner assignment. It collects study preferences, calls the Flask backend, and renders the returned schedule.

## Run locally

From this directory, start a static server:

```bash
python3 -m http.server 5500
```

Open `http://127.0.0.1:5500`. The backend must also be running at `http://127.0.0.1:5000`.

## Connect the deployed backend

Before publishing, edit `config.js`:

```js
window.APP_CONFIG = {
  API_BASE_URL: "https://YOUR-SERVICE.onrender.com"
};
```

Do not put the OpenAI API key in this repository.

## Deploy with GitHub Pages

1. Push this directory to its own public GitHub repository.
2. In repository Settings → Pages, choose **Deploy from a branch**.
3. Select the `main` branch and `/ (root)` folder.
4. Save and wait for the published URL.
