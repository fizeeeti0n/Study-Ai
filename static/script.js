// Global state
let uploadedDocuments = []; // Stores objects: { id, name, type, content }
let selectedDepartment = null;
let chatHistory = []; // Stores objects: { sender, message, timestamp }
let questionCount = 0; // Tracks number of questions asked
let builtInResources = {}; // Stores content of built-in resources once loaded

// --- IMPORTANT: CONFIGURE THIS URL FOR DEPLOYMENT ---
// For local development with Flask backend on port 5000:
const BACKEND_URL = 'http://127.0.0.1:5000';
// For Vercel deployment, replace the above line with your PythonAnywhere URL, e.g.:
// const BACKEND_URL = 'https://yourusername.pythonanywhere.com';
// ---------------------------------------------------

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
        'Analytics': ['Business Intelligence', 'Data Analytics', 'Econometrics', 'Financial Modeling']
    },
    'arts-humanities': {
        'Literature': ['Literary Theory', 'Poetry Analysis', 'World Literature', 'Creative Writing'],
        'History': ['Ancient Civilizations', 'Modern History', 'Art History', 'Archaeology'],
        'Philosophy': ['Ethics', 'Epistemology', 'Metaphysics', 'Political Philosophy']
    },
    'science': {
        'Biology': ['Genetics', 'Ecology', 'Cell Biology', 'Neuroscience'],
        'Chemistry': ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Biochemistry'],
        'Physics': ['Quantum Mechanics', 'Relativity', 'Astrophysics', 'Condensed Matter Physics']
    },
    'law': {
        'Core Law': ['Constitutional Law', 'Criminal Law', 'Contract Law', 'Tort Law'],
        'Specialized Law': ['International Law', 'Environmental Law', 'Intellectual Property', 'Family Law']
    },
    'education': {
        'Pedagogy': ['Teaching Methods', 'Curriculum Development', 'Classroom Management', 'Educational Technology'],
        'Psychology': ['Developmental Psychology', 'Cognitive Psychology', 'Educational Psychology', 'Child Development']
    },
};


// Helper to display messages in chat history
function displayMessage(sender, message, isError = false) {
    const chatHistoryDiv = document.getElementById('chatHistory');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    if (isError) {
        messageDiv.classList.add('error-message');
    }

    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';
    messageHeader.innerHTML = `<span>${sender === 'user' ? '👤' : '🤖'}</span><span>${sender === 'user' ? 'You' : 'AI Assistant'}</span>`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = `<p>${message}</p>`;

    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageContent);
    chatHistoryDiv.appendChild(messageDiv);
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight; // Auto-scroll to the latest message
}

// Update document count display
function updateDocumentCount() {
    const documentCountElement = document.getElementById('documentCount');
    if (documentCountElement) {
        documentCountElement.textContent = uploadedDocuments.length;
    }
    const emptyMessage = document.getElementById('emptyFileMessage');
    if (emptyMessage) {
        emptyMessage.style.display = uploadedDocuments.length === 0 ? 'block' : 'none';
    }
}

// Update library stats (currently just document count)
function updateLibraryStats() {
    updateDocumentCount();
    // Potentially add logic for questions answered, saved items here later
}

// Display loading indicator
function showLoading(message = "Processing...") {
    const chatHistoryDiv = document.getElementById('chatHistory');
    let loadingDiv = document.getElementById('loadingMessage');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingMessage';
        loadingDiv.className = 'ai-message loading-message';
        loadingDiv.innerHTML = `
            <div class="message-header"><span>🤖</span><span>AI Assistant</span></div>
            <div class="message-content">
                <p>${message} <span class="loading-dots"><span>.</span><span>.</span><span>.</span></span></p>
            </div>
        `;
        chatHistoryDiv.appendChild(loadingDiv);
    } else {
        loadingDiv.querySelector('p').textContent = message + ' ...';
        loadingDiv.style.display = 'block'; // Ensure it's visible if hidden
    }
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
}

// Hide loading indicator
function hideLoading() {
    const loadingDiv = document.getElementById('loadingMessage');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}


// Function to handle file upload
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const fileListDiv = document.getElementById('fileList');

    if (fileInput.files.length === 0) {
        displayMessage('ai', 'Please select at least one file to upload.', true);
        return;
    }

    // Show initial loading message
    showLoading("Uploading and processing documents...");

    for (const file of fileInput.files) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${BACKEND_URL}/upload`, { // <-- Updated URL
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                uploadedDocuments.push({
                    id: Date.now() + Math.random(), // Simple unique ID
                    name: file.name,
                    type: file.type,
                    content: data.extractedText
                });
                displayMessage('ai', `Document "${file.name}" processed successfully!`);
            } else {
                displayMessage('ai', `Failed to process "${file.name}": ${data.message || 'Unknown error'}`, true);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            displayMessage('ai', `Network error during upload of "${file.name}". Please check server connection and try again.`, true);
        }
    }
    hideLoading();
    renderUploadedFiles();
    updateLibraryStats();
}

// Render uploaded files in the list
function renderUploadedFiles() {
    const fileListDiv = document.getElementById('fileList');
    fileListDiv.innerHTML = ''; // Clear existing list

    const emptyMessage = document.getElementById('emptyFileMessage');
    if (uploadedDocuments.length === 0) {
        if (emptyMessage) {
            emptyMessage.style.display = 'block';
        }
        return;
    } else {
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
    }

    uploadedDocuments.forEach(doc => {
        const docItem = document.createElement('div');
        docItem.className = 'file-item';
        docItem.dataset.id = doc.id;
        docItem.innerHTML = `
            <span>${doc.name}</span>
            <button class="remove-file-btn" data-id="${doc.id}">Remove</button>
        `;
        fileListDiv.appendChild(docItem);
    });

    // Attach event listeners for remove buttons
    document.querySelectorAll('.remove-file-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const docIdToRemove = parseFloat(event.target.dataset.id);
            uploadedDocuments = uploadedDocuments.filter(doc => doc.id !== docIdToRemove);
            renderUploadedFiles();
            updateLibraryStats();
            displayMessage('ai', `Document removed.`);
        });
    });
}

// Function to clear all uploaded documents
function clearAllDocuments() {
    if (uploadedDocuments.length === 0) {
        displayMessage('ai', 'No documents to clear.', false);
        return;
    }
    uploadedDocuments = [];
    renderUploadedFiles();
    updateLibraryStats();
    displayMessage('ai', 'All documents cleared.');
}

// Function to ask a question to the AI
async function askQuestion(question) {
    if (!question.trim()) {
        displayMessage('ai', 'Please type a question.', true);
        return;
    }

    displayMessage('user', question);
    showLoading("UniStudy AI is thinking...");

    const documentsContent = uploadedDocuments.map(doc => doc.content);
    const departmentToUse = selectedDepartment || 'general';

    try {
        const response = await fetch(`${BACKEND_URL}/ask`, { // <-- Updated URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: question,
                documents: documentsContent,
                department: departmentToUse,
                chatHistory: chatHistory // Pass current chat history for context if needed by backend
            })
        });

        const data = await response.json();
        hideLoading();

        if (response.ok) {
            displayMessage('ai', data.answer);
            chatHistory.push({ sender: 'user', message: question, timestamp: Date.now() });
            chatHistory.push({ sender: 'ai', message: data.answer, timestamp: Date.now() });
            questionCount++;
            updateQuestionCountDisplay();
        } else {
            displayMessage('ai', `Error asking question: ${data.answer || 'Unknown error'}`, true);
            console.error('Error asking question:', data.answer);
        }
    } catch (error) {
        hideLoading();
        console.error('Error asking question:', error);
        displayMessage('ai', 'Network error or server unreachable. Please check your connection.', true);
    }
}

// Function to update the question count display
function updateQuestionCountDisplay() {
    const questionAnsweredCountElement = document.getElementById('questionAnsweredCount');
    if (questionAnsweredCountElement) {
        questionAnsweredCountElement.textContent = questionCount;
    }
}

// Function to clear chat history
function clearChatHistory() {
    const chatHistoryDiv = document.getElementById('chatHistory');
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
    `;
    chatHistory = []; // Clear the internal chat history array
    displayMessage('ai', 'Chat history cleared.', false);
}


// Function to generate summary of all documents
async function generateSummary() {
    if (uploadedDocuments.length === 0) {
        displayMessage('ai', 'Please upload documents first to summarize.', true);
        return;
    }

    displayMessage('user', 'Please summarize the uploaded documents.');
    showLoading("Generating summary...");

    const documentsContent = uploadedDocuments.map(doc => doc.content);
    const departmentToUse = selectedDepartment || 'general';

    try {
        const response = await fetch(`${BACKEND_URL}/summarize`, { // <-- Updated URL
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                documents: documentsContent,
                department: departmentToUse
            })
        });

        const data = await response.json();
        hideLoading();

        if (response.ok) {
            displayMessage('ai', data.summary);
            chatHistory.push({ sender: 'user', message: 'Summarize documents', timestamp: Date.now() });
            chatHistory.push({ sender: 'ai', message: data.summary, timestamp: Date.now() });
        } else {
            displayMessage('ai', `Error generating summary: ${data.summary || 'Unknown error'}`, true);
            console.error('Error generating summary:', data.summary);
        }
    } catch (error) {
        hideLoading();
        console.error('Error generating summary:', error);
        displayMessage('ai', 'Network error or server unreachable during summarization. Please check your connection.', true);
    }
}

// Function to load built-in resource content (simulated)
async function loadResource(department, resourceName) {
    showLoading(`Loading ${resourceName} resource for ${department} department...`);
    // In a real app, this would fetch content from a database or a file.
    // For now, we'll simulate.
    const simulatedContent = `This is simulated content for ${resourceName} in the ${department} department. It would typically contain relevant study notes or explanations.`;
    
    // Store it globally
    if (!builtInResources[department]) {
        builtInResources[department] = {};
    }
    builtInResources[department][resourceName] = simulatedContent;

    hideLoading();
    displayMessage('ai', `Resource "${resourceName}" loaded for ${department} department.`);
    // Optionally display content in a special chat bubble or a dedicated area
    displayMessage('ai', `Content from ${resourceName}: "${simulatedContent.substring(0, 100)}..."`); // Show snippet
}

function clearResourceContent() {
    builtInResources = {};
    displayMessage('ai', 'All built-in resource content cleared.');
    const resourcesContainer = document.getElementById('resourcesContainer');
    if (resourcesContainer) {
        resourcesContainer.innerHTML = '<p class="empty-message">Select a department to view resources.</p>';
    }
}


// Handle department selection
function selectDepartment(department) {
    selectedDepartment = department;
    const displayElement = document.getElementById('selectedDepartmentDisplay');
    if (displayElement) {
        displayElement.textContent = department.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // Update department card active state
    document.querySelectorAll('.department-card').forEach(card => {
        if (card.dataset.dept === department) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    renderDepartmentResources(department);
    displayMessage('ai', `Department set to ${department.replace(/-/g, ' ').toUpperCase()}.`, false);
}

// Render department-specific resources
function renderDepartmentResources(department) {
    const resourcesContainer = document.getElementById('resourcesContainer');
    resourcesContainer.innerHTML = ''; // Clear existing resources

    if (departmentResources[department]) {
        for (const category in departmentResources[department]) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'resource-category';
            categoryDiv.innerHTML = `<h4>${category}</h4>`;

            const resourceList = document.createElement('ul');
            departmentResources[department][category].forEach(resource => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <span>${resource}</span>
                    <button class="load-resource-btn" data-dept="${department}" data-resource="${resource}">Load</button>
                `;
                resourceList.appendChild(listItem);
            });
            categoryDiv.appendChild(resourceList);
            resourcesContainer.appendChild(categoryDiv);
        }
    } else {
        resourcesContainer.innerHTML = '<p class="empty-message">No specific resources for this department yet.</p>';
    }

    // Attach event listeners to load resource buttons
    document.querySelectorAll('.load-resource-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const dept = event.target.dataset.dept;
            const resource = event.target.dataset.resource;
            loadResource(dept, resource);
        });
    });
}

// Saved Items functionality
let savedItems = []; // { id, question, answer, timestamp }

function saveCurrentChat() {
    const lastUserMessage = chatHistory.slice().reverse().find(msg => msg.sender === 'user');
    const lastAiMessage = chatHistory.slice().reverse().find(msg => msg.sender === 'ai');

    if (lastUserMessage && lastAiMessage) {
        const newItem = {
            id: Date.now(),
            question: lastUserMessage.message,
            answer: lastAiMessage.message,
            timestamp: new Date().toISOString()
        };
        savedItems.push(newItem);
        localStorage.setItem('uniStudySavedItems', JSON.stringify(savedItems));
        displayMessage('ai', 'Current Q&A saved successfully!', false);
        loadSavedItems(); // Reload the displayed list
        updateSavedItemsCount();
    } else {
        displayMessage('ai', 'No recent Q&A to save.', true);
    }
}

function loadSavedItems() {
    const storedItems = localStorage.getItem('uniStudySavedItems');
    if (storedItems) {
        savedItems = JSON.parse(storedItems);
    } else {
        savedItems = [];
    }
    renderSavedItems();
    updateSavedItemsCount();
}

function deleteSavedItem(idToDelete) {
    savedItems = savedItems.filter(item => item.id != idToDelete); // Use != for loose comparison if ID might be string/number
    localStorage.setItem('uniStudySavedItems', JSON.stringify(savedItems));
    displayMessage('ai', 'Saved item deleted.', false);
    renderSavedItems();
    updateSavedItemsCount();
}

function updateSavedItemsCount() {
    const savedItemsCountElement = document.getElementById('savedItemsCount');
    if (savedItemsCountElement) {
        savedItemsCountElement.textContent = savedItems.length;
    }
    const emptySavedMessage = document.getElementById('emptySavedMessage');
    if (emptySavedMessage) {
        emptySavedMessage.style.display = savedItems.length === 0 ? 'block' : 'none';
    }
}

function renderSavedItems() {
    // Check if the element already exists
    const savedList = document.getElementById('savedQuestionsList');
    if (savedList) savedList.innerHTML = ''; 

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


// Setup all event listeners
function setupEventListeners() {
    const uploadButton = document.getElementById('uploadButton');
    if (uploadButton) {
        uploadButton.addEventListener('click', uploadFile);
    }

    const askButton = document.getElementById('askButton');
    const questionInput = document.getElementById('questionInput');
    if (askButton && questionInput) {
        askButton.addEventListener('click', () => askQuestion(questionInput.value));
        questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                askQuestion(questionInput.value);
            }
        });
    }

    const summarizeAllButton = document.getElementById('summarizeAllButton');
    if (summarizeAllButton) {
        summarizeAllButton.addEventListener('click', generateSummary);
    }

    const clearAllDocumentsButton = document.getElementById('clearAllDocuments');
    if (clearAllDocumentsButton) {
        clearAllDocumentsButton.addEventListener('click', clearAllDocuments);
    }

    const clearChatButton = document.getElementById('clearChatButton');
    if (clearChatButton) {
        clearChatButton.addEventListener('click', clearChatHistory);
    }

    const saveChatButton = document.getElementById('saveChatButton');
    if (saveChatButton) {
        saveChatButton.addEventListener('click', saveCurrentChat);
    }

    const clearResourceContentButton = document.getElementById('clearResourceContent');
    if (clearResourceContentButton) {
        clearResourceContentButton.addEventListener('click', clearResourceContent);
    }

    // Event listeners for department selection
    document.querySelectorAll('.department-card').forEach(card => {
        card.addEventListener('click', () => {
            selectDepartment(card.dataset.dept);
        });
    });
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