import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
    const commentForm = document.getElementById('comment-form');
    const commentsContainer = document.getElementById('comments-container');

    // Load comments from Firebase
    function loadComments() {
        const commentsRef = ref(database, 'comments');
        onValue(commentsRef, (snapshot) => {
            const commentsData = snapshot.val();
            renderComments(commentsData);
        });
    }

    // Render comments
    function renderComments(comments) {
        if (!comments) {
            commentsContainer.innerHTML = 'No comments yet.';
            return;
        }

        const commentsList = Object.values(comments).map(comment => `
            <div class="comment">
                <strong>${escapeHtml(comment.name)}</strong>
                <p>${escapeHtml(comment.text)}</p>
                <small>${new Date(comment.timestamp).toLocaleString()}</small>
            </div>
        `).join('');

        commentsContainer.innerHTML = commentsList;
    }

    // Sanitize input to prevent XSS
    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    // Submit comment
    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('name');
        const commentInput = document.getElementById('comment');

        // Create a new comment reference
        const commentsRef = ref(database, 'comments');
        push(commentsRef, {
            name: nameInput.value,
            text: commentInput.value,
            timestamp: Date.now()
        });

        // Clear form
        nameInput.value = '';
        commentInput.value = '';
    });

    // Initial load of comments
    loadComments();
});
