LeafLens - Domates Yaprağı Hastalık Tespit Uygulaması
LeafLens, domates yapraklarındaki hastalıkları tespit edebilen mobil bir uygulamadır. Yapay zekâ destekli bu uygulama, **Flask** tabanlı bir backend ve **React Native (Expo)** ile geliştirilen bir mobil arayüzden oluşuyor.

## Genel Özellikler
* Kullanıcı, telefon kamerasıyla bir domates yaprağının fotoğrafını çeker
* Bu görsel, Flask API aracılığıyla sunucuya gönderilir
* Sunucudaki model (YOLOv12) görseli analiz eder
* Tespit edilen hastalık ve ilgili bölge uygulama arayüzünde gösterilir

##  Özellikler
* YOLOv12 ile hastalık sınıflandırması ve konum tespiti
* React Native ile geliştirilen mobil arayüz
* Flask REST API üzerinden gerçek zamanlı tahmin
* Yaprak üzerindeki hastalıklı alanlar kutucuklarla gösterilir

##  Kullanılan Teknolojiler

### Mobil Uygulama (Frontend)
* React Native
* Expo
* TypeScript

### Sunucu (Backend)
* Python (Flask)
* YOLOv12 (Ultralytics)
* OpenCV (görsel ön işleme için)

## 🧺aset ve Model Eğitimi

* 10 farklı domates yaprağı hastalığını içeren bir veri seti kullanıldı
* Görseller ön işlemlerden geçirildi ve çeşitli yöntemlerle artırıldı
* YOLOv12 modeli Ultralytics framework’üyle eğitildi
* Model, yüksek doğruluk oranı ile tahmin yapabiliyor ve hastalık bölgelerini kutularla belirtiyor

## 📁 Proje Dosya Yapısı
```
LeafLensProject/
├── app/               # Mobil uygulama (React Native)
│   ├── components/
│   ├── assets/
│   └── ...
├── backend/           # Flask sunucu
│   ├── yolov12/       # Model ve yardımcı dosyalar
│   ├── app.py         # Flask API
│   └── requirements.txt
```

## 🚀 Nasıl Çalıştırılır?
### Backend (Sunucu)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend (Mobil Uygulama)

```bash
cd app
npm install
npx expo start
```

## Benim Katkım
Projede, domates yaprağı hastalıklarını sınıflandırmak için **InceptionV3 tabanlı bir model** geliştirdim ve bu modeli Flask sunucusuna entegre ettim. Ayrıca, yapay zekâ tarafındaki süreçlerde aktif rol aldım ve mobil geliştirici ekiple birlikte çalışarak sistemi uçtan uca test ettim.


##  Lisans
Bu proje, akademik amaçlarla geliştirilmiştir ve mobil uygulamalar ile yapay zekânın nasıl entegre edilebileceğini göstermeyi hedeflemektedir.
