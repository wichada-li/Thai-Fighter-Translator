FROM node:20-slim

# Install Python
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Install pythainlp
RUN pip3 install pythainlp --break-system-packages

WORKDIR /app

# Copy everything
COPY . .

# Install node packages (if any)
RUN npm install --omit=dev 2>/dev/null || true

EXPOSE 3000

CMD ["node", "server.js"]
# v2
