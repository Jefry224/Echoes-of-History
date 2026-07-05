FROM python:3.11-slim-bookworm

# Install system dependencies for Blender headless
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    xz-utils \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libxi6 \
    libxrender1 \
    libxxf86vm1 \
    libxkbcommon0 \
    libsm6 \
    libice6 \
    && rm -rf /var/lib/apt/lists/*

# Download and install Blender 4.2.0 LTS
RUN curl -L https://download.blender.org/release/Blender4.2/blender-4.2.0-linux-x64.tar.xz -o blender.tar.xz && \
    tar -xf blender.tar.xz -C /opt && \
    mv /opt/blender-4.2.0-linux-x64 /opt/blender && \
    ln -s /opt/blender/blender /usr/local/bin/blender && \
    rm blender.tar.xz

# Install python mcp SDK
RUN pip install --no-cache-dir mcp

# Set working directory
WORKDIR /workspace

# Copy server code
COPY server.py /app/server.py

# Expose port (if running over SSE)
EXPOSE 8000

# Set entrypoint
ENTRYPOINT ["python", "/app/server.py"]
