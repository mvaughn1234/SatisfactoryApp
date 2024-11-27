# Use an official Python runtime as a parent image
FROM python:3.12

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies (PostgreSQL dev headers and build essentials)
RUN apt-get update && apt-get install -y \
    libpq-dev gcc python3-dev build-essential

# Copy the requirements file to the container
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the container
COPY . .

# Set environment variables from .env (Optional if using docker-compose env_file)
# ENV FLASK_APP=run.py
# ENV FLASK_ENV=development

# Expose the port Flask will run on
EXPOSE 5000

# Run the application
CMD ["bash", "-c", "flask db upgrade && flask run --host=0.0.0.0 --debug"]
