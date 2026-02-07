# 🦙 Ollama API Space Guide

This guide explains how to interact with your Ollama instance hosted on Hugging Face Spaces.

## 🚀 API Endpoint
Your base URL is:
`https://esmailx50-ollama.hf.space/api/generate`

## 🛠 Usage Methods

### 1. Python Client (Recommended)
Use the `client.py` script provided in this repository. It is configured to use **streaming**, which prevents timeouts during long responses on CPU-only hardware.

**Prerequisites:**
```bash
pip install requests
```

**Running the client:**
```bash
python client.py
```

### 2. cURL (Quick Test)
You can test the API directly from your terminal.

**Windows (PowerShell):**
```powershell
$body = @{ 
    model = "gemma3:4b"
    prompt = "Why is the sky blue?"
    stream = $false 
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://esmailx50-ollama.hf.space/api/generate" -Method Post -Body $body -ContentType "application/json"
```

**Linux/Mac (Bash):**
```bash
curl https://esmailx50-ollama.hf.space/api/generate -d '{
  "model": "gemma3:4b",
  "prompt": "Why is the sky blue?",
  "stream": false
}'
```

## ⚠️ Important Considerations for Free Spaces

### 1. Speed (Latency)
Since this is running on a **CPU Basic** tier, generation is significantly slower than on a GPU.
- **Loading:** The first request after the Space starts might take 30-60 seconds to load the model into memory.
- **Generation:** Expect roughly 2-5 tokens per second.

### 2. Timeouts
Web browsers and proxies (like Hugging Face's) often time out after 60 seconds of inactivity. 
- **Always use `stream: true`** for long prompts.
- If you use `stream: false`, keep your prompts simple or ask the model to be brief (e.g., "Answer in 20 words").

### 3. Model Name
Ensure your requests always specify the correct model name as defined in your `entrypoint.sh`:
- **Current Model:** `gemma3:4b`

## 📊 Monitoring
You can check if the model is loaded and ready by visiting the tags endpoint:
`https://esmailx50-ollama.hf.space/api/tags`
