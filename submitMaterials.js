import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
    getDatabase,
    ref,
    set
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBr5S5yoBXdroviWV-T9pLaQl-dFFZ3eF8",
    authDomain: "classmateex.firebaseapp.com",
    projectId: "classmateex",
    storageBucket: "classmateex.firebasestorage.app",
    messagingSenderId: "325155552857",
    appId: "1:325155552857:web:b654aec07a4a6e2e233b48"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

document.getElementById('submit-question-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const courseCode = document.getElementById('course-code').value;
    const courseTitle = document.getElementById('course-title').value;
    const department = document.getElementById('department').value;
    const fileInput = document.getElementById('file-upload');

    // Handle file upload
    const file = fileInput.files[0];
    const fileRef = storageRef(storage, `questions/${file.name}`);

    uploadBytes(fileRef, file).then(() => {
        return getDownloadURL(fileRef);
    }).then((downloadURL) => {
        // Save question data to Firebase Realtime Database
        return set(ref(database, 'questions/' + Date.now()), {
            courseCode: courseCode,
            courseTitle: courseTitle,
            department: department,
            fileURL: downloadURL
        });
    }).then(() => {
        alert('Your question has been submitted successfully!');
        document.getElementById('submit-question-form').reset();
    }).catch((error) => {
        console.error('Error uploading file or saving data:', error);
        alert('There was an error submitting your question. Please try again.');
    });
});