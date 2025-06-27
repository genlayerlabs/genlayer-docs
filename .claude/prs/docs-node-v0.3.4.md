# Add v0.3.4 validator release documentation

## Description

This PR adds comprehensive documentation for the v0.3.4 validator release, introducing genesis block configuration support for faster node startup and GenVM diagnostics integration in the doctor command. The PR also includes development workflow improvements with command definitions for automated commit message generation, PR creation, and knowledge management.

## Changes

### Validator Documentation Updates
- **Added v0.3.4 changelog entry** with genesis block configuration and GenVM diagnostics features
- **Added missing v0.3.3 entry** for io.net provider support
- **Updated setup guide** with new version references (v0.3.4), consensus contract addresses, and enhanced doctor command documentation
- **Updated configuration examples** with genesis block number (817855) for faster node startup

### Development Workflow Enhancements
- **Added CLAUDE.md** with comprehensive development guidelines and validator documentation update patterns
- **Added command definitions** for commit message generation, PR creation, and context tracking
- **Added tracking configuration** for plan analysis and development workflow management

## Testing

- Documentation changes are non-functional and do not require code testing
- All markdown files have been validated for proper formatting
- Version references and configuration examples have been verified for accuracy

## Types of Changes

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [x] Documentation update (changes to documentation, guides, or help content)
- [x] Chore (maintenance tasks, refactoring, or non-functional changes like updating dependencies or improving documentation)

## Checklist

- [x] My changes follow the code style of this project
- [x] I have added the necessary documentation (if appropriate)
- [ ] I have added tests (if appropriate)
- [x] All files have been properly formatted and validated