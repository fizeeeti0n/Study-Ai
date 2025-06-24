from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import io
import os # Import os to access environment variables

# Import the Google Generative AI library
import google.generativeai as genai

app = Flask(__name__)

# Configure CORS: Explicitly allow the frontend origin
CORS(app, resources={r"/*": {"origins": "https://study-ai-enxg.onrender.com"}})

# --- Configure Google Gemini API ---
# Get your API key from the environment variable (loaded from .env by Flask's debug mode or python-dotenv)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found in environment variables. AI functionalities may not work.")
    # Consider raising an error or exiting if the key is essential for startup
    # exit("GEMINI_API_KEY is not set. Please set it in your .env file or environment.")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize the Gemini model
# 'gemini-pro' is a good general-purpose model. You might also explore 'gemini-1.5-flash' or 'gemini-1.5-pro'
model = genai.GenerativeModel('models/gemini-1.5-flash')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'}), 400

    if file:
        try:
            # Read PDF content from memory
            pdf_file = io.BytesIO(file.read())
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text_content = ""
            for page in pdf_reader.pages:
                text_content += page.extract_text() or "" # Handle empty pages

            if not text_content.strip():
                return jsonify({'success': False, 'message': 'Could not extract text from PDF. It might be scanned or empty.'}), 400

            return jsonify({
                'success': True,
                'message': 'File processed successfully!',
                'extractedText': text_content
            }), 200

        except Exception as e:
            return jsonify({'success': False, 'message': f'Error processing file: {str(e)}'}), 500
    
    return jsonify({'success': False, 'message': 'No file provided or invalid file'}), 400

@app.route('/ask', methods=['POST'])
def ask_question():
    data = request.json
    question = data.get('question', '')
    documents_content = data.get('documents', []) # List of extracted texts from PDFs
    department = data.get('department', 'general')
    chat_history = data.get('chatHistory', []) # List of {sender, message} for conversational context

    if not question:
        return jsonify({'answer': "Please provide a question."}), 400

    # Combine all uploaded document content into a single string for the AI.
    # IMPORTANT: Large documents can exceed the AI model's token limit.
    # For production-grade applications with very large PDFs, you would typically
    # implement a "Retrieval-Augmented Generation" (RAG) system. This involves:
    # 1. Chunking documents into smaller pieces.
    # 2. Creating numerical "embeddings" for each chunk.
    # 3. Storing these embeddings in a vector database.
    # 4. When a question is asked, find the most relevant chunks using similarity search.
    # 5. Send only the relevant chunks (along with the question) to the AI model.
    combined_document_text = "\n\n".join(documents_content)

    # Formulate the prompt for the AI
    # We include instructions, the document content, and the user's question.
    prompt_parts = []
    
    # Instruction for the AI
    prompt_parts.append("You are a university study assistant named UniStudy AI. Your primary goal is to help students by answering questions, summarizing information, and explaining concepts. Prioritize answers based on the provided study materials. If the answer is not in the provided materials, clearly state that you cannot find it there, but you can still provide a general answer if it's within your general knowledge and relevant. Be concise and helpful.\n\n")
    
    # Add context from uploaded documents if available
    if combined_document_text:
        prompt_parts.append(f"Study Materials:\n---\n{combined_document_text}\n---\n\n")
    else:
        prompt_parts.append(f"No specific study materials have been provided. I will answer based on my general knowledge for the {department} department. If your question is specific to a document, please upload it.\n\n")

    # Add the user's current question
    prompt_parts.append(f"User Question: {question}")

    # You can also add chat history for multi-turn conversations if needed.
    # This requires mapping your chatHistory format to Gemini's expected format (roles and parts).
    # For a simple Q&A, directly adding the relevant text to the prompt as above is a good start.

    try:
        # Call the Gemini API to generate content
        # For simple Q&A like this, generate_content is suitable.
        # For multi-turn conversational agents, model.start_chat() and chat.send_message() would be used.
        response = model.generate_content(prompt_parts)
        
        ai_answer = response.text
        
        if not ai_answer.strip():
            ai_answer = "I apologize, but I could not generate a response for your question at this time. Please try rephrasing it or ensure the documents contain relevant information."

        return jsonify({'answer': ai_answer})

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        # Common error: Token limit exceeded for very large inputs
        if "out of tokens" in str(e).lower() or "too large" in str(e).lower() or "400" in str(e).lower():
            return jsonify({'answer': "I'm sorry, the combined length of your documents and question is too large for me to process in a single request. Please try with fewer or shorter documents, or a more specific question. For very large documents, an advanced 'Retrieval-Augmented Generation' (RAG) system would be needed."}), 500
        
        # General error
        return jsonify({'answer': f'An unexpected error occurred while trying to get an answer from the AI: {str(e)}. Please check the server console for details.'}), 500


@app.route('/summarize', methods=['POST'])
def summarize_documents():
    data = request.json
    documents_content = data.get('documents', [])
    department = data.get('department', 'general')

    if not documents_content:
        return jsonify({'summary': 'No documents provided for summarization.'}), 400

    # Combine all document content for summarization
    combined_document_text = "\n\n".join(documents_content)

    # Formulate the prompt for summarization
    prompt = f"Summarize the following study materials for a university student in the {department} department. Focus on key concepts, main arguments, and important facts. Provide a concise yet comprehensive summary.\n\nStudy Materials:\n---\n{combined_document_text}\n---"

    try:
        # Call the Gemini API for summarization
        response = model.generate_content(prompt)
        ai_summary = response.text

        if not ai_summary.strip():
            ai_summary = "I apologize, but I could not generate a summary at this time. The documents might be too short or complex, or there was an issue with the AI service."

        return jsonify({'summary': ai_summary})

    except Exception as e:
        print(f"Error calling Gemini API for summarization: {e}")
        if "out of tokens" in str(e).lower() or "too large" in str(e).lower() or "400" in str(e).lower():
            return jsonify({'summary': "I'm sorry, the combined length of your documents is too large for me to summarize in a single request. Please try with fewer or shorter documents."}), 500
        return jsonify({'summary': f'An unexpected error occurred while generating summary: {str(e)}. Please check the server console for details.'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000) # Run on port 5000
