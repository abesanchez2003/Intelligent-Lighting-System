import cv2
import numpy as np 
from ultralytics import YOLO
import os
import sys

print("Human Detector Loading...")

def list_cameras(max_devices = 5):
    av = []
    for i in range(max_devices):
        cap = cv2.VideoCapture(i)
        if cap is not None and cap.isOpened():
            print(f"Camera {i} is available")
            av.append(i)
            cap.release()
    return av


if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS  # Temp folder used by PyInstaller
else:
    base_path = os.path.dirname(__file__)

model_path = os.path.join(base_path, 'best.pt')


cams = list_cameras()

if not cams:
    print("No cameras found.")
    exit()

print("Select a Camera: ")

for cam in cams:
    print(f"[{cam}] Camera {cam}")
cam_index = int(input("Enter the number: "))



print("Loading Video")
cap = cv2.VideoCapture(cam_index)
if not cap.isOpened():
    print("Failed to open selected camera.")
    exit()

print("Loading YOLO... ")
model = YOLO(model_path)


while(True):
    ret,frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break
    
    results = model.predict(frame, stream= True)
    
    for r in results:
        boxes = r.boxes
        for box in boxes:
            x1,y1,x2,y2 = map(int, box.xyxy[0])
            conf = box.conf[0]
            cls = int(box.cls[0])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f'{model.names[cls]} {conf:.2f}', (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            
    
    cv2.imshow("Live Video", frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows() 