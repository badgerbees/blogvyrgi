// Import Firebase modules from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { firebaseConfig } from './firebase-config.js';

// Debug logging function
function debugLog(message, ...args) {
  console.log(`[Comments Debug] ${message}`, ...args);
}

document.addEventListener('DOMContentLoaded', () => {
  debugLog('Firebase Config:', firebaseConfig);

  // Check for missing keys in the config
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    debugLog('Missing Firebase Config Keys:', missingKeys);
    document.getElementById('comments-container').innerHTML = `
      <div style="color: red;">
        Error: Firebase configuration is incomplete. Missing keys: ${missingKeys.join(', ')}
      </div>
    `;
    return;
  }

  // Initialize Firebase
  let app, database;
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    debugLog('Firebase initialized successfully');
  } catch (error) {
    debugLog('Firebase Initialization Error:', error);
    document.getElementById('comments-container').innerHTML = `
      <div style="color: red;">
        Error initializing Firebase: ${error.message}
      </div>
    `;
    return;
  }

  const commentForm = document.getElementById('comment-form');
  const commentsContainer = document.getElementById('comments-container');

  // Sanitize input to prevent XSS
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Load comments from Firebase
  function loadComments() {
    try {
      const commentsRef = ref(database, 'comments');
      onValue(commentsRef, (snapshot) => {
        const commentsData = snapshot.val();
        debugLog('Fetched Comments:', commentsData);

        if (!commentsData) {
          commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
          return;
        }

        const commentsList = Object.values(commentsData).map(comment => `
          <div class="comment">
            <strong>${escapeHtml(comment.name)}</strong>
            <p>${escapeHtml(comment.text)}</p>
            <small>${new Date(comment.timestamp).toLocaleString()}</small>
          </div>
        `).join('');

        commentsContainer.innerHTML = commentsList;
      }, (error) => {
        debugLog('Error loading comments:', error);
        commentsContainer.innerHTML = `
          <div style="color: red;">
            Error loading comments: ${error.message}
          </div>
        `;
      });
    } catch (error) {
      debugLog('Unexpected error in loadComments:', error);
    }
  }

  // Submit comment event handler
  commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    debugLog('Comment form submitted');

    const nameInput = document.getElementById('name');
    const commentInput = document.getElementById('comment');

    // Validate inputs
    if (!nameInput.value.trim() || !commentInput.value.trim()) {
      alert('Please fill in both name and comment fields.');
      return;
    }

    try {
      const commentsRef = ref(database, 'comments');
      push(commentsRef, {
        name: nameInput.value.trim(),
        text: commentInput.value.trim(),
        timestamp: Date.now()
      })
      .then(() => {
        debugLog('Comment submitted successfully');
        // Clear form fields after successful submission
        nameInput.value = '';
        commentInput.value = '';
      })
      .catch((error) => {
        debugLog('Error submitting comment:', error);
        alert(`Failed to submit comment: ${error.message}`);
      });
    } catch (error) {
      debugLog('Unexpected error in comment submission:', error);
      alert(`An unexpected error occurred: ${error.message}`);
    }
  });

  // Initial load of comments
  loadComments();
});
