// Global state
let uploadedDocuments = []; // Stores objects: { id, name, type, content }
let selectedDepartment = null;
let chatHistory = []; // Stores objects: { sender, message, timestamp }
let questionCount = 0; // Tracks number of questions asked
let builtInResources = {}; // Stores content of built-in resources once loaded

// Department-specific resources (just names/topics, actual content simulated by loadResource)
const departmentResources = {
    'engineering': {
        'Mathematics': ['Calculus', 'Differential Equations', 'Linear Algebra', 'Statistics'],
        'Physics': ['Mechanics', 'Thermodynamics', 'Electromagnetics', 'Quantum Physics'],
        'Design': ['CAD Tutorials', 'Design Principles', 'Materials Science', 'Manufacturing']
    },
    'computer-science': {
        'Programming': ['Data Structures', 'Algorithms', 'OOP Concepts', 'Design Patterns'],
        'Systems': ['Operating Systems', 'Networks', 'Databases', 'Distributed Systems'],
        'AI/ML': ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision']
    },
    'medicine': {
        'Basic Sciences': ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology'],
        'Clinical': ['Internal Medicine', 'Surgery', 'Pediatrics', 'Pharmacology'],
        'Research': ['Clinical Trials', 'Medical Statistics', 'Research Methods', 'Ethics']
    },
    'business': {
        'Core Subjects': ['Accounting', 'Finance', 'Marketing', 'Management'],
        'Analytics': ['Business Intelligence', 'Financial Modeling', 'Market Research', 'Operations Management'],
        'Strategy': ['Strategic Planning', 'Entrepreneurship', 'Global Business', 'Ethics in Business']
    },
    'law': {
        'Foundational': ['Constitutional Law', 'Criminal Law', 'Contract Law', 'Tort Law'],
        'Specialized': ['Corporate Law', 'Environmental Law', 'International Law', 'Family Law'],
        'Practice': ['Legal Research', 'Moot Court', 'Client Counseling', 'Legal Ethics']
    },
    'arts': {
        'Literature': ['Literary Theory', 'Poetry Analysis', 'World Literature', 'Creative Writing'],
        'History': ['Ancient Civilizations', 'Modern History', 'Art History', 'Historiography'],
        'Philosophy': ['Ethics', 'Metaphysics', 'Epistemology', 'Logic']
    },
    'science': {
        'Chemistry': ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry'],
        'Biology': ['Cell Biology', 'Genetics', 'Ecology', 'Microbiology'],
        'Physics': ['Quantum Mechanics', 'Relativity', 'Astrophysics', 'Condensed Matter Physics']
    },
    'general': {
        'Study Skills': ['Time Management', 'Note-Taking', 'Exam Preparation', 'Critical Thinking'],
        'Research': ['Academic Writing', 'Research Methods', 'Citation Styles', 'Data Analysis'],
        'Well-being': ['Stress Management', 'Mindfulness', 'Healthy Habits', 'Goal Setting']
    }
};

// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadedFilesList = document.getElementById('uploadedFiles');
const libraryFilesList = document.getElementById('libraryFiles');
const docCountSpan = document.getElementById('docCount');
const questionCountSpan = document.getElementById('questionCount');
const uploadStatusDiv = document.getElementById('uploadStatus');
const libraryStatsDiv = document.getElementById('libraryStats');
const chatHistoryDiv = document.getElementById('chatHistory');
const questionInput = document.getElementById('questionInput');
const resourceCategoriesDiv = document.getElementById('resourceCategories');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');

// Function to initialize event listeners
function setupEventListeners() {
    const chooseFilesButton = document.getElementById('chooseFilesBtn');
    const clearAllButton = document.getElementById('clearAllBtn'); // Updated to use new ID
    const askAIButton = document.getElementById('askAIButton'); // New ID
    const summarizeButton = document.getElementById('summarizeButton'); // New ID
    const clearChatButton = document.getElementById('clearChatButton'); // New ID
    const departmentCards = document.querySelectorAll('.department-card'); // Select all department cards

    // File selection listeners
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleFileDrop);

    // Ensure chooseFilesButton exists before adding listener
    if (chooseFilesButton) {
        chooseFilesButton.addEventListener('click', () => fileInput.click());
    } else {
        console.warn("Element with ID 'chooseFilesBtn' not found. Please ensure it exists in unistudy.html.");
    }

    // Ensure clearAllButton exists before adding listener
    if (clearAllButton) {
        clearAllButton.addEventListener('click', clearAllFiles);
    } else {
        console.warn("Element with ID 'clearAllBtn' not found. Please ensure it exists in unistudy.html.");
    }
    
    // Ensure askAIButton exists before adding listener
    if (askAIButton) {
        askAIButton.addEventListener('click', askQuestion);
    } else {
        console.warn("Element with ID 'askAIButton' not found. Please ensure it exists in unistudy.html.");
    }

    // Ensure summarizeButton exists before adding listener
    if (summarizeButton) {
        summarizeButton.addEventListener('click', generateSummary);
    } else {
        console.warn("Element with ID 'summarizeButton' not found. Please ensure it exists in unistudy.html.");
    }

    // Ensure clearChatButton exists before adding listener
    if (clearChatButton) {
        clearChatButton.addEventListener('click', clearChat);
    } else {
        console.warn("Element with ID 'clearChatButton' not found. Please ensure it exists in unistudy.html.");
    }

    // Department card click handlers
    departmentCards.forEach(card => {
        card.addEventListener('click', function() {
            const department = this.dataset.dept;
            selectDepartment(department);
        });
    });

    fileInput.addEventListener('change', handleFiles);
    questionInput.addEventListener('keypress', handleKeyPress);
}


function handleDragOver(event) {
    event.preventDefault();
    uploadZone.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadZone.classList.remove('drag-over');
}

function handleFileDrop(event) {
    event.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = event.dataTransfer.files;
    processFiles(files);
}

function handleFiles(event) {
    const files = event.target.files;
    processFiles(files);
}

async function processFiles(files) {
    if (files.length === 0) return;

    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    uploadStatusDiv.textContent = 'Uploading and processing files...';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        const fileType = file.type;

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Simulate upload progress
            let simulatedProgress = 0;
            const interval = setInterval(() => {
                simulatedProgress += 5;
                if (simulatedProgress <= 100) {
                    progressFill.style.width = `${simulatedProgress}%`;
                } else {
                    clearInterval(interval);
                }
            }, 50); // Increment every 50ms

            const response = await fetch('http://127.0.0.1:5000/upload', {
                method: 'POST',
                body: formData
            });

            clearInterval(interval); // Stop simulation once actual response comes
            progressFill.style.width = '100%'; // Ensure it reaches 100%

            const data = await response.json();

            if (data.success) {
                const newDocument = {
                    id: Date.now() + Math.random(), // Unique ID
                    name: fileName,
                    type: fileType,
                    content: data.extractedText || '' // Store extracted text or empty string
                };
                uploadedDocuments.push(newDocument);
                displayUploadedFile(newDocument);
                updateDocumentCount();
                addChatMessage(`Successfully processed "${fileName}".`, 'ai');
            } else {
                addChatMessage(`Error processing "${fileName}": ${data.message}`, 'ai');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            addChatMessage(`Failed to upload "${fileName}". Please check server connection.`, 'ai');
        } finally {
            // Delay hiding progress bar to show 100% briefly
            setTimeout(() => {
                progressBar.style.display = 'none';
                uploadStatusDiv.textContent = '';
            }, 500);
        }
    }
}

function displayUploadedFile(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <span>${file.name}</span>
        <button class="remove-file-btn" data-id="${file.id}">Remove</button>
    `;
    uploadedFilesList.appendChild(fileItem);
    libraryFilesList.appendChild(fileItem.cloneNode(true)); // Add to library too

    // Add event listener for the new remove button
    fileItem.querySelector('.remove-file-btn').addEventListener('click', (event) => {
        const idToRemove = parseFloat(event.target.dataset.id);
        removeFile(idToRemove);
    });
    // Add event listener for the cloned remove button in library
    libraryFilesList.lastChild.querySelector('.remove-file-btn').addEventListener('click', (event) => {
        const idToRemove = parseFloat(event.target.dataset.id);
        removeFile(idToRemove);
    });

    updateLibraryStats();
}

function removeFile(id) {
    uploadedDocuments = uploadedDocuments.filter(doc => doc.id !== id);
    
    // Remove from uploaded files list
    const uploadedFileItem = uploadedFilesList.querySelector(`.file-item button[data-id="${id}"]`).closest('.file-item');
    if (uploadedFileItem) uploadedFilesList.removeChild(uploadedFileItem);

    // Remove from library files list
    const libraryFileItem = libraryFilesList.querySelector(`.file-item button[data-id="${id}"]`).closest('.file-item');
    if (libraryFileItem) libraryFilesList.removeChild(libraryFileItem);

    updateDocumentCount();
    updateLibraryStats();
    addChatMessage(`Document removed.`, 'ai');
}

function clearAllFiles() {
    uploadedDocuments = [];
    uploadedFilesList.innerHTML = '';
    libraryFilesList.innerHTML = '';
    updateDocumentCount();
    updateLibraryStats();
    addChatMessage('All uploaded files have been cleared.', 'ai');
}

function updateDocumentCount() {
    docCountSpan.textContent = uploadedDocuments.length;
}

function updateLibraryStats() {
    if (uploadedDocuments.length === 0) {
        libraryStatsDiv.style.display = 'block';
    } else {
        libraryStatsDiv.style.display = 'none';
    }
}

function selectDepartment(department) {
    selectedDepartment = department;
    // Visually indicate selected department
    document.querySelectorAll('.department-card').forEach(card => {
        if (card.dataset.dept === department) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    addChatMessage(`You have selected the ${department.replace('-', ' ').toUpperCase()} department.`, 'ai');
    displayBuiltInResources(department);
}

async function displayBuiltInResources(department) {
    resourceCategoriesDiv.innerHTML = 'Loading resources...';
    const categories = departmentResources[department];
    if (!categories) {
        resourceCategoriesDiv.innerHTML = '<p>No specific resources for this department yet.</p>';
        return;
    }

    let resourcesHtml = '';
    for (const category in categories) {
        resourcesHtml += `<h4>${category}</h4><ul class="resource-list">`;
        for (const topic of categories[category]) {
            resourcesHtml += `<li><span class="resource-item" data-topic="${topic}" data-category="${category}" data-dept="${department}">${topic}</span></li>`;
            // Simulate loading the resource content for demonstration
            if (!builtInResources[`${department}-${category}-${topic}`]) {
                const simulatedContent = await simulateResourceLoad(department, category, topic);
                builtInResources[`${department}-${category}-${topic}`] = simulatedContent;
            }
        }
        resourcesHtml += '</ul>';
    }
    resourceCategoriesDiv.innerHTML = resourcesHtml;

    // Add event listeners for newly created resource items
    document.querySelectorAll('.resource-item').forEach(item => {
        item.addEventListener('click', (event) => {
            const topic = event.target.dataset.topic;
            const category = event.target.dataset.category;
            const dept = event.target.dataset.dept;
            const content = builtInResources[`${dept}-${category}-${topic}`];
            if (content) {
                addChatMessage(`<strong>Resource: ${topic} (${category})</strong><br>${content.substring(0, 200)}...`, 'ai'); // Show snippet
            } else {
                addChatMessage(`Could not load content for ${topic}.`, 'ai');
            }
        });
    });
}

function simulateResourceLoad(department, category, topic) {
    return new Promise(resolve => {
        setTimeout(() => {
            const content = `This is a simulated academic resource on ${topic} within the ${category} category for ${department} students. It contains detailed explanations, examples, and practice problems related to ${topic}. In real application, this would be fetched from a database or API.`;
            resolve(content);
        }, 300); // Simulate network delay
    });
}

function addChatMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.className = `${sender}-message`;

    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';
    messageHeader.innerHTML = `<span>${sender === 'ai' ? '🤖' : '👤'}</span><span>${sender === 'ai' ? 'AI Assistant' : 'You'}</span>`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = `<p>${message}</p>`;

    messageElement.appendChild(messageHeader);
    messageElement.appendChild(messageContent);
    chatHistoryDiv.appendChild(messageElement);
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight; // Scroll to bottom

    chatHistory.push({ sender, message, timestamp: new Date().toISOString() });
}

async function askQuestion() {
    const question = questionInput.value.trim();
    if (!question) {
        addChatMessage("Please enter a question.", 'ai');
        return;
    }

    addChatMessage(question, 'user');
    questionInput.value = ''; // Clear input

    questionCount++;
    questionCountSpan.textContent = questionCount;

    addChatMessage("Thinking...", 'ai'); // Placeholder for AI response

    // Simulate API call to backend
    try {
        const response = await fetch('https://app-api-eta.vercel.app/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: question,
                documents: uploadedDocuments.map(doc => doc.content), // Send content of uploaded docs
                department: selectedDepartment,
                chatHistory: chatHistory // Provide chat history for context
            }),
        });

        const data = await response.json();
        const lastAIMessage = chatHistoryDiv.lastChild;
        if (lastAIMessage && lastAIMessage.classList.contains('ai-message') && lastAIMessage.querySelector('.message-content').textContent === 'Thinking...') {
            chatHistoryDiv.removeChild(lastAIMessage); // Remove "Thinking..." message
        }
        addChatMessage(data.answer, 'ai');

        // After receiving a successful response, add the 'Save' button.
        // This assumes the last AI message is the one that was just added.
        const currentAIMessage = chatHistoryDiv.lastChild;
        if (currentAIMessage) {
            const saveButton = document.createElement('button');
            saveButton.className = 'save-chat-btn';
            saveButton.textContent = '⭐️ Save';
            saveButton.onclick = () => handleSaveChat(question, data.answer);
            // Append the button to the message content or header for better styling
            currentAIMessage.querySelector('.message-header').appendChild(saveButton);
        }

    } catch (error) {
        console.error('Error asking question:', error);
        const lastAIMessage = chatHistoryDiv.lastChild;
        if (lastAIMessage && lastAIMessage.classList.contains('ai-message') && lastAIMessage.querySelector('.message-content').textContent === 'Thinking...') {
            chatHistoryDiv.removeChild(lastAIMessage);
        }
        addChatMessage('Error getting response from AI. Please try again.', 'ai');
    }
}

async function generateSummary() {
    if (uploadedDocuments.length === 0) {
        addChatMessage("Please upload documents before asking for a summary.", 'ai');
        return;
    }
    
    addChatMessage("Generating summary...", 'ai');

    try {
        const response = await fetch('http://127.0.0.1:5000/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                documents: uploadedDocuments.map(doc => doc.content),
                department: selectedDepartment
            }),
        });

        const data = await response.json();
        const lastAIMessage = chatHistoryDiv.lastChild;
        if (lastAIMessage && lastAIMessage.classList.contains('ai-message') && lastAIMessage.querySelector('.message-content').textContent === 'Generating summary...') {
            chatHistoryDiv.removeChild(lastAIMessage);
        }
        addChatMessage(`<strong>Summary of Uploaded Documents:</strong><br>${data.summary}`, 'ai');
    } catch (error) {
        console.error('Error generating summary:', error);
        const lastAIMessage = chatHistoryDiv.lastChild;
        if (lastAIMessage && lastAIMessage.classList.contains('ai-message') && lastAIMessage.querySelector('.message-content').textContent === 'Generating summary...') {
            chatHistoryDiv.removeChild(lastAIMessage);
        }
        addChatMessage('Error generating summary. Please try again.', 'ai');
    }
}


function clearChat() {
    chatHistory = []; // Clear the chat history array
    chatHistoryDiv.innerHTML = `
        <div class="ai-message">
            <div class="message-header">
                <span>🤖</span>
                <span>AI Assistant</span>
            </div>
            <div class="message-content">
                <p>👋 Welcome to UniStudy AI! I'm your department-agnostic study assistant.</p>
                <p><strong>Here's how I can help you:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>📖 Answer questions from your uploaded materials</li>
                    <li>📝 Create summaries and study guides</li>
                    <li>🔍 Find specific information across multiple documents</li>
                    <li>💡 Explain complex concepts in simple terms</li>
                    <li>📊 Analyze patterns in your study materials</li>
                </ul>
                <p>Select your department above and upload your study materials to get started!</p>
            </div>
        </div>
    `; // Reset chat history display
    questionCount = 0;
    questionCountSpan.textContent = questionCount;
    addChatMessage('Chat history cleared.', 'ai');
    loadSavedItems(); // Reload saved items if they exist after clearing chat
}


function handleKeyPress(event) {
    if (event.key === 'Enter') {
        askQuestion();
    }
}

// Function to handle saving a chat message
function handleSaveChat(question, answer) {
    const savedItems = JSON.parse(localStorage.getItem('savedUniStudyItems') || '[]');
    const newItem = {
        id: Date.now(), // Unique ID for the saved item
        question: question,
        answer: answer
    };
    savedItems.push(newItem);
    localStorage.setItem('savedUniStudyItems', JSON.stringify(savedItems));
    addChatMessage("Your chat has been saved! You can find it in the 'Saved Questions & Notes' section.", 'ai');
    loadSavedItems(); // Refresh the display of saved items
}

// Function to delete a saved item
function deleteSavedItem(id) {
    let savedItems = JSON.parse(localStorage.getItem('savedUniStudyItems') || '[]');
    savedItems = savedItems.filter(item => item.id !== parseFloat(id)); // Ensure ID matches type
    localStorage.setItem('savedUniStudyItems', JSON.stringify(savedItems));
    addChatMessage("Saved item deleted.", 'ai');
    loadSavedItems(); // Refresh the display of saved items
}

// Function to load and display saved items from local storage
function loadSavedItems() {
    const savedItems = JSON.parse(localStorage.getItem('savedUniStudyItems') || '[]');
    const qaSection = document.querySelector('.qa-section');
    let savedSection = document.querySelector('.saved-items-section');
    
    // If no saved items, hide or remove the section
    if (savedItems.length === 0) {
        if (savedSection) {
            savedSection.remove(); // Remove the entire section if no items
        }
        return; // Exit if nothing to display
    }

    // If there are saved items, ensure the section exists
    if (!savedSection) { 
        savedSection = document.createElement('div');
        savedSection.className = 'card saved-items-section';
        savedSection.innerHTML = `
            <h4><span class="star-icon">⭐️</span> Saved Questions & Notes</h4>
            <ul class="saved-list" id="savedQuestionsList"></ul>
        `;
        qaSection.appendChild(savedSection);
    } else {
        // Clear existing list if section already exists
        const savedList = document.getElementById('savedQuestionsList');
        if (savedList) savedList.innerHTML = ''; 
    }

    const savedList = document.getElementById('savedQuestionsList');
    if (savedList) { // Ensure savedList exists after creation or clearing
        savedItems.forEach(item => {
            const listItem = document.createElement('li');
            listItem.className = 'saved-item';
            listItem.dataset.id = item.id;
            listItem.innerHTML = `
                <div class="saved-question">Q: ${item.question}</div>
                <div class="saved-answer">A: ${item.answer}</div>
                <div class="saved-actions">
                    <button class="delete-saved-btn" data-id="${item.id}">Delete</button>
                </div>
            `;
            savedList.appendChild(listItem);
        });
        // Attach event listeners to the new delete buttons
        savedList.querySelectorAll('.delete-saved-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                deleteSavedItem(event.target.dataset.id);
            });
        });
    }
}


// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateDocumentCount();
    updateLibraryStats();
    // Default department selection (e.g., 'general')
    selectDepartment('general');
    loadSavedItems(); // Load saved items on startup
});
