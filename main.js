// Import Firebase modules from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Debug logging function
function debugLog(message, ...args) {
  console.log(`[Comments Debug] ${message}`, ...args);
}

// Function to dynamically load firebase-config.js with retries
async function loadFirebaseConfigWithRetry(maxRetries = 5, delay = 3000) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const module = await import('./firebase-config.js');
      return module.firebaseConfig;
    } catch (error) {
      debugLog(`Failed to load firebase-config.js. Retry ${retries + 1} of ${maxRetries}`, error);
      retries++;
      // Wait for the specified delay before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Could not load firebase-config.js after multiple retries.");
}

document.addEventListener('DOMContentLoaded', async () => {
  let firebaseConfig;
  try {
    firebaseConfig = await loadFirebaseConfigWithRetry();
    debugLog('Firebase Config loaded:', firebaseConfig);
  } catch (error) {
    debugLog('Error loading firebase-config.js:', error);
    document.getElementById('comments-container').innerHTML = `
      <div style="color: red;">
        Error loading Firebase config: ${error.message}
      </div>
    `;
    return;
  }

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

  // Load comments and their replies from Firebase
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

        let commentsHtml = '';
        Object.keys(commentsData).forEach(commentId => {
          const comment = commentsData[commentId];

          // Build replies HTML if available
          let repliesHtml = '';
          if (comment.replies) {
            Object.keys(comment.replies).forEach(replyId => {
              const reply = comment.replies[replyId];
              repliesHtml += `
                <div class="reply">
                  <strong>${escapeHtml(reply.name)}</strong>
                  <p>${escapeHtml(reply.text)}</p>
                  <small>${new Date(reply.timestamp).toLocaleString()}</small>
                </div>
              `;
            });
          }

          commentsHtml += `
            <div class="comment" data-id="${commentId}">
              <strong>${escapeHtml(comment.name)}</strong>
              <p>${escapeHtml(comment.text)}</p>
              <small>${new Date(comment.timestamp).toLocaleString()}</small>
              <button class="reply-btn">Reply</button>
              <div class="reply-form-container" style="display: none;">
                <input type="text" class="reply-name" placeholder="Your Name" maxlength="50" required />
                <textarea class="reply-text" placeholder="Your Reply" maxlength="500" required></textarea>
                <button class="submit-reply-btn">Submit Reply</button>
              </div>
              <div class="replies-container">${repliesHtml}</div>
            </div>
          `;
        });
        commentsContainer.innerHTML = commentsHtml;

        // Toggle reply form visibility on reply button click
        const replyButtons = document.querySelectorAll('.reply-btn');
        replyButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            const commentDiv = btn.parentElement;
            const replyFormContainer = commentDiv.querySelector('.reply-form-container');
            replyFormContainer.style.display = (replyFormContainer.style.display === 'none' || replyFormContainer.style.display === '') ? 'block' : 'none';
          });
        });

        // Attach event listeners for submitting replies
        const submitReplyButtons = document.querySelectorAll('.submit-reply-btn');
        submitReplyButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            const commentDiv = btn.closest('.comment');
            const commentId = commentDiv.getAttribute('data-id');
            const replyNameInput = commentDiv.querySelector('.reply-name');
            const replyTextInput = commentDiv.querySelector('.reply-text');
            const replyName = replyNameInput.value.trim();
            const replyText = replyTextInput.value.trim();
            if (!replyName || !replyText) {
              alert('Please fill in both fields.');
              return;
            }
            const replyData = {
              name: replyName,
              text: replyText,
              timestamp: Date.now()
            };
            const repliesRef = ref(database, `comments/${commentId}/replies`);
            push(repliesRef, replyData)
              .then(() => {
                // Clear reply form fields after submission
                replyNameInput.value = '';
                replyTextInput.value = '';
              })
              .catch((error) => {
                alert(`Failed to submit reply: ${error.message}`);
              });
          });
        });
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

  // Submit top-level comment event handler
  commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    debugLog('Comment form submitted');

    const nameInput = document.getElementById('name');
    const commentInput = document.getElementById('comment');

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

// Fade-in functionality (adjusted for mobile)
document.addEventListener('DOMContentLoaded', () => {
  const faders = document.querySelectorAll('.fade-in');
  const appearOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -20px 0px"
  };

  const appearOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, appearOptions);

  faders.forEach(fader => {
    appearOnScroll.observe(fader);
  });
});
