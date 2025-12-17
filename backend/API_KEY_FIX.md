# API Key Authentication Error Fix

## Error Message
```
Error code: 401 - {'error': {'message': 'Authentication Fails, Your api key: ****f4MA is invalid', 'type': 'authentication_error', 'param': None, 'code': 'invalid_request_error'}}
```

## Problem
Your API key is invalid, expired, or not set correctly. Based on your current configuration, you're using **DeepSeek** as your LLM provider, which requires a valid `DEEPSEEK_API_KEY`.

## Solution

### Step 1: Create/Update `.env` File

1. Navigate to the `backend` directory
2. Create a file named `.env` (if it doesn't exist) or open the existing one
3. Add or update the following line:

```bash
DEEPSEEK_API_KEY=your_actual_deepseek_api_key_here
```

### Step 2: Get Your DeepSeek API Key

1. Go to https://platform.deepseek.com/api_keys
2. Sign up or log in to your DeepSeek account
3. Create a new API key
4. Copy the API key

### Step 3: Update Your `.env` File

Replace `your_actual_deepseek_api_key_here` with your actual API key:

```bash
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:** 
- Do NOT include quotes around the API key
- Do NOT commit the `.env` file to git (it should be in `.gitignore`)
- Make sure there are no extra spaces before or after the `=`

### Step 4: Restart Your Backend Server

After updating the `.env` file, restart your backend server:

```bash
python start_api.py
```

or

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

## Additional Required API Keys

Your configuration also uses **Typhoon API** for summarizers. Make sure you also have:

```bash
TYPHOON_API_KEY=your_typhoon_api_key_here
```

Get your Typhoon API key from: https://opentyphoon.ai/

## Verify Your Configuration

Check your current LLM provider in `backend/tradingagents/default_config.py`:

- **DeepSeek** (current): Requires `DEEPSEEK_API_KEY`
- **OpenAI**: Requires `OPENAI_API_KEY`
- **Typhoon**: Requires `TYPHOON_API_KEY`
- **Google**: Requires `GEMINI_API_KEY`
- **Anthropic**: Requires `ANTHROPIC_API_KEY`

## Troubleshooting

### If the error persists:

1. **Verify the API key is correct:**
   - Check for typos
   - Ensure the key starts with `sk-` for DeepSeek
   - Make sure there are no extra spaces

2. **Check if the API key has expired:**
   - Log into your DeepSeek account
   - Verify the API key is still active
   - Create a new key if needed

3. **Verify the `.env` file location:**
   - The `.env` file should be in the `backend` directory (same level as `api/` folder)
   - The `load_dotenv()` function in `api/main.py` loads from the project root

4. **Check environment variable loading:**
   - Make sure `python-dotenv` is installed: `pip install python-dotenv`
   - Verify the `.env` file is being loaded by checking the logs

5. **Try a different LLM provider:**
   - If DeepSeek continues to have issues, you can switch to another provider
   - Edit `backend/tradingagents/default_config.py` and uncomment a different provider
   - Make sure you have the corresponding API key set

## Example `.env` File

See `backend/.env.example` for a complete template with all possible API keys.

