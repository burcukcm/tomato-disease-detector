# tomatoDiseaseDetector

# 🍅 LeafLens - Tomato Leaf Disease Detector

LeafLens is a mobile application that detects tomato leaf diseases using deep learning. The app integrates a **Flask-based backend** running a **YOLOv12 model** and a **React Native frontend** built with **Expo**.

## 🔍 Overview

- 📱 Users can capture a photo of a tomato leaf via mobile  
- ☁️ The image is sent to the Flask backend API  
- 🧠 The backend model analyzes the image using **YOLOv12**  
- 📊 Detected disease and affected region are sent back and displayed on the app  

## 🎯 Features

- Disease classification and localization using **YOLOv12**  
- Mobile interface developed with **React Native + Expo**  
- Real-time prediction powered by a **Flask REST API**  
- Visual feedback with bounding boxes on diseased leaf areas  

## 🛠️ Technologies

### Frontend (Mobile)
- React Native  
- Expo Go  
- TypeScript  

### Backend
- Python (Flask)  
- YOLOv12 (Ultralytics)  
- OpenCV for preprocessing  

## 🧪 Dataset & Training

- 10-class tomato leaf disease dataset  
- Images preprocessed and augmented  
- Model trained using YOLOv12 with Ultralytics framework  
- High accuracy with detailed bounding box predictions  

## 📁 Project Structure

```
LeafLensProject/
├── app/               # React Native frontend
│   ├── components/
│   ├── assets/
│   └── ...
├── backend/           # Flask backend
│   ├── yolov12/       # YOLOv12 model & utils
│   ├── app.py         # Flask API
│   └── requirements.txt
```

## 🚀 Getting Started

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd app
npm install
npx expo start
```

## 👩‍💻 My Role

I developed and trained the **InceptionV3-based deep learning model** used to classify tomato leaf diseases. I also helped integrate this model into the Flask backend, contributing to the AI pipeline of the application while collaborating with the mobile development team.

## 📸 Screenshots

_Coming soon..._

## 📄 License

This project was created for academic purposes and showcases the integration of mobile interfaces with AI-powered disease detection.
