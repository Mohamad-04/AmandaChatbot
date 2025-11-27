# Amanda AI Backend

Professional AI backend with multi-provider LLM support and agent orchestration framework.

> **Note**: The simple echo version has been saved as `server_simple.py` for reference.

## Features

- ✅ **Multi-Provider Support**: OpenAI (GPT-4), Anthropic (Claude), Google (Gemini)
- ✅ **Provider Abstraction**: Clean interface for easy provider switching
- ✅ **Agent System**: Extensible agent framework for multi-agent orchestration
- ✅ **Conversation Management**: Per-user conversation history tracking
- ✅ **Streaming Responses**: Real-time streaming for better UX
- ✅ **CLI Testing Tool**: Interactive CLI for testing without the full stack
- ✅ **gRPC Server**: Production-ready server for Flask backend integration
- ✅ **Configuration Management**: YAML-based configuration
- ✅ **Relationship Support**: Specialized prompts for relationship counseling

## Project Structure

```
ai_backend/
├── server.py                    # gRPC production server
├── server_simple.py             # Echo server (for reference)
├── main.py                      # CLI testing interface
├── config.yaml                  # Configuration file
├── config.example.yaml          # Example configuration
├── requirements.txt             # Python dependencies
├── descriptors.py               # gRPC protobuf descriptors
├── src/
│   ├── config.py                # Configuration loader
│   ├── prompts.py               # Prompt management
│   ├── providers/               # LLM provider implementations
│   │   ├── base.py              # Abstract base provider
│   │   ├── openai_provider.py   # OpenAI/GPT implementation
│   │   ├── anthropic_provider.py # Anthropic/Claude implementation
│   │   ├── google_provider.py   # Google/Gemini implementation
│   │   └── factory.py           # Provider factory
│   ├── agents/                  # Agent implementations
│   │   ├── base_agent.py        # Abstract base agent
│   │   └── chat_agent.py        # Main chat agent (Amanda)
│   └── orchestrator/            # Multi-agent orchestration (future)
│       └── orchestrator.py      # Agent coordinator
└── README.md                    # This file
```

## Quick Start

### 1. Install Dependencies

```bash
# Install core dependencies
pip install grpcio protobuf pyyaml

# Install your chosen LLM provider (pick one or more):

# For Anthropic Claude (recommended)
pip install anthropic

# For OpenAI GPT
pip install openai

# For Google Gemini
pip install google-generativeai

# Or install all at once:
pip install -r requirements.txt
```

### 2. Configure

```bash
# Copy example config
cp config.example.yaml config.yaml

# Edit config.yaml and set:
# 1. Your preferred provider (openai, anthropic, or google)
# 2. Your API key for that provider
```

Example `config.yaml`:

```yaml
llm:
  provider: "anthropic"  # or "openai" or "google"

  api_keys:
    anthropic: "sk-ant-your-key-here"
    openai: ""
    google: ""

  # Other settings use defaults from config.example.yaml
```

### 3. Test with CLI

Before running the full server, test with the CLI:

```bash
python main.py
```

This starts an interactive chat where you can test Amanda's responses.

CLI Options:
```bash
# Use a different provider
python main.py --provider openai

# Use a different model
python main.py --model gpt-3.5-turbo

# Disable streaming
python main.py --no-stream

# Use custom config file
python main.py --config /path/to/config.yaml
```

### 4. Run the gRPC Server

```bash
python server.py
```

The server will start on port 50051 (configurable in `config.yaml`) and integrate with the Flask backend.

## Usage Examples

### CLI Testing

```bash
$ python main.py
============================================================
Amanda AI Backend - CLI Testing Interface
============================================================
Provider: anthropic
Model: claude-3-5-sonnet-20241022
Temperature: 0.7
============================================================

Hello! I'm Amanda, and I'm here to support you with your relationships.

Whether you're navigating a challenge, want to improve communication, or just need someone to talk to about your relationships, I'm here to listen and help.

What's on your mind today?

Type 'quit', 'exit', or 'bye' to end the conversation.
Type 'clear' to start a new conversation.
Type 'history' to see conversation history.
------------------------------------------------------------

You: I'm having trouble communicating with my partner
Amanda: [Streaming response from Claude...]
```

### Programmatic Usage

```python
from src.config import config
from src.providers import ProviderFactory
from src.agents import ChatAgent

# Create provider
provider = ProviderFactory.create_from_config(config)

# Create agent
agent = ChatAgent(provider=provider)

# Stream responses
for chunk in agent.stream_process("How can I improve my relationship?"):
    print(chunk, end='', flush=True)
```

### Switching Providers

Just update `config.yaml`:

```yaml
llm:
  provider: "openai"  # Changed from anthropic to openai

  api_keys:
    openai: "sk-your-openai-key"
```

No code changes needed!

## Architecture

### Provider System

The provider system uses an abstract base class (`BaseLLMProvider`) that all providers must implement:

- `generate()`: Non-streaming text generation
- `stream()`: Streaming text generation
- `count_tokens()`: Token counting

This allows easy switching between providers without changing agent code.

### Agent System

Agents are responsible for conversation management and response generation:

- **BaseAgent**: Abstract base class for all agents
- **ChatAgent**: Main conversational agent with system prompts
- **Future agents**: Analyzer, Advisor, etc. for multi-agent orchestration

### Multi-Agent Orchestration (Future)

The orchestrator will coordinate multiple specialized agents:

1. **Situation Analyzer**: Analyzes relationship dynamics
2. **Relationship Advisor**: Provides specific advice
3. **Empathy Agent**: Provides emotional support
4. **Coordinator**: Routes to appropriate agents

Current implementation uses a single `ChatAgent` with comprehensive system prompts.

## Configuration

### LLM Settings

```yaml
llm:
  provider: "anthropic"  # openai, anthropic, google
  temperature: 0.7       # 0.0 = deterministic, 1.0 = creative
  max_tokens: 2048       # Maximum response length
  top_p: 1.0             # Nucleus sampling
```

### Server Settings

```yaml
server:
  host: "localhost"
  port: 50051
  max_workers: 10
```

### Logging

```yaml
logging:
  level: "INFO"  # DEBUG, INFO, WARNING, ERROR
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  file: "ai_backend.log"
```

## Prompt Engineering

System prompts are defined in `src/prompts.py`:

- `AMANDA_SYSTEM_PROMPT`: Main relationship support prompt
- `ANALYZER_SYSTEM_PROMPT`: Situation analysis (future)
- `ADVISOR_SYSTEM_PROMPT`: Advice generation (future)

You can customize these or add new ones for different use cases.

## Development

### Adding a New Provider

1. Create `src/providers/newprovider_provider.py`
2. Implement `BaseLLMProvider` interface
3. Register in `src/providers/factory.py`
4. Add configuration to `config.example.yaml`

Example:

```python
from .base import BaseLLMProvider

class NewProvider(BaseLLMProvider):
    def generate(self, messages, temperature, max_tokens, **kwargs):
        # Implementation
        pass

    def stream(self, messages, temperature, max_tokens, **kwargs):
        # Implementation
        pass

    def count_tokens(self, text):
        # Implementation
        pass
```

### Adding a New Agent

1. Create `src/agents/new_agent.py`
2. Implement `BaseAgent` interface
3. Add system prompt to `src/prompts.py`
4. Register in orchestrator (when multi-agent is enabled)

## Troubleshooting

### "Configuration file not found"

```bash
cp config.example.yaml config.yaml
# Then edit config.yaml with your settings
```

### "API key not found"

Make sure you've set the API key for your chosen provider in `config.yaml`:

```yaml
llm:
  provider: "anthropic"
  api_keys:
    anthropic: "sk-ant-your-actual-key-here"
```

### "Module not found" errors

```bash
# Install the provider SDK
pip install anthropic  # or openai, or google-generativeai
```

### Import errors with protobuf

```bash
# Ensure protobuf version is compatible
pip install "protobuf>=3.20.3,<5.0.0"
```

## API Keys

### Anthropic Claude

1. Sign up at https://console.anthropic.com/
2. Create an API key
3. Add to `config.yaml` under `llm.api_keys.anthropic`

### OpenAI GPT

1. Sign up at https://platform.openai.com/
2. Create an API key
3. Add to `config.yaml` under `llm.api_keys.openai`

### Google Gemini

1. Get API key from https://makersuite.google.com/app/apikey
2. Add to `config.yaml` under `llm.api_keys.google`

## Production Considerations

1. **API Key Security**: Never commit `config.yaml` to git. Use environment variables or secret management.
2. **Rate Limiting**: Implement rate limiting for API calls
3. **Error Handling**: Add retry logic for transient API failures
4. **Monitoring**: Add logging and metrics for production monitoring
5. **Token Counting**: Use provider-specific token counters for accurate billing
6. **Conversation Cleanup**: Implement cleanup for old conversation histories

## Future Enhancements

- [ ] Multi-agent orchestration implementation
- [ ] Agent selection based on user intent
- [ ] Long-term memory and context management
- [ ] RAG (Retrieval-Augmented Generation) integration
- [ ] Fine-tuned models for relationship support
- [ ] Conversation analytics and insights
- [ ] Multi-language support

## License

Part of the Amanda project - Relationship Support Chatbot Platform

## Support

For issues or questions, please refer to the main Amanda project documentation.
