# Security Policy

## Environment Variables

### 🔐 Required Environment Variables

This project uses environment variables to store sensitive configuration. Never commit these values to version control.

#### Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values in `.env`:**
   - `YOUTUBE_API_KEY`: Get from [Google Cloud Console](https://console.developers.google.com/)
   - Other keys as needed

3. **Keep `.env` file secure:**
   - Never commit `.env` to git
   - Don't share in public channels
   - Use different keys for production/development

### 🛡️ API Key Security

- **YouTube API Key**: Used for searching and fetching video metadata
  - Restrict key to YouTube Data API v3 only
  - Set HTTP referrer restrictions for production
  - Monitor usage in Google Cloud Console

### 🚨 Reporting Security Issues

If you discover a security vulnerability, please send an e-mail to security@yourproject.com. All security vulnerabilities will be promptly addressed.

**Please do not report security vulnerabilities through public GitHub issues.**

### 📋 Security Checklist

- [ ] Environment variables are properly configured
- [ ] API keys have appropriate restrictions
- [ ] Production keys are different from development
- [ ] Regular key rotation is scheduled
- [ ] Access logs are monitored

### 🔄 Regular Security Maintenance

1. **Monthly**: Review API usage and restrictions
2. **Quarterly**: Rotate API keys
3. **When needed**: Update dependencies for security patches

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Best Practices

### For Developers
- Use `.env.example` as template
- Never log sensitive environment variables
- Use secrets managers in production
- Implement proper error handling that doesn't expose secrets

### For Deployment
- Use secrets management in production (AWS Secrets Manager, Azure Key Vault, etc.)
- Enable HTTPS only
- Implement rate limiting
- Monitor for suspicious activities
