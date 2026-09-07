# System Design

## Overview

This project recreates Fireflies.ai's post-meeting workflow. It does not perform real-time recording or speech-to-text transcription. Instead, it stores seeded, uploaded, or pasted transcript content and presents it as a searchable meeting workspace.

```text
Next.js frontend
        |
        | REST API requests
        v
FastAPI backend
        |
        | SQLAlchemy ORM
        v
SQLite database