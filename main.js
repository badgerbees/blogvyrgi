// Updated main.js with Firebase integration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Firebase configuration (replace with your own)
const firebaseConfig = {
  apiKey: "AIzaSyCCJX3FRMDH2AHb81GIRrd5UJPSR8k2nqw",
  authDomain: "blogschool-f36f1.firebaseapp.com",
  projectId: "blogschool-f36f1",
  storageBucket: "blogschool-f36f1.firebasestorage.app",
  messagingSenderId: "188191368080",
  appId: "1:188191368080:web:bcb6b057d8e601687cc915",
  measurementId: "G-1WF3LLBX4R"
};
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
                <strong>${comment.name}</strong>
                <p>${comment.text}</p>
                <small>${new Date(comment.timestamp).toLocaleString()}</small>
            </div>
        `).join('');

        commentsContainer.innerHTML = commentsList;
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
